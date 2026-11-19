package com.example.java_service.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import java.util.regex.Pattern;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import com.example.java_service.dto.external.PythonRetryRequest;
import com.example.java_service.dto.external.PythonRetryResponse;
import com.example.java_service.dto.request.LessonResultRequest;
import com.example.java_service.dto.response.LessonResultResponse;
import com.example.java_service.entity.Language;
import com.example.java_service.entity.Task;
import com.example.java_service.entity.TaskType;
import com.example.java_service.entity.Topic;
import com.example.java_service.entity.TopicScores;
import com.example.java_service.entity.User;
import com.example.java_service.repository.LanguageRepository;
import com.example.java_service.repository.TaskRepository;
import com.example.java_service.repository.TaskTypeRepository;
import com.example.java_service.repository.TopicRepository;
import com.example.java_service.repository.TopicScoresRepository;
import com.example.java_service.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class LessonResultService {

    private final TaskRepository taskRepository;
    private final TaskTypeRepository taskTypeRepository;
    private final TopicRepository topicRepository;
    private final UserRepository userRepository;
    private final TopicScoresRepository topicScoresRepository;
    private final LanguageRepository languageRepository;
    private final PythonRetryService pythonRetryService;
    private final TransactionTemplate transactionTemplate;
    private static final int MAX_USER_ANSWER_LENGTH = 500;

    private static final Pattern CONTROL_CHARACTERS =
            Pattern.compile("[\\p{Cc}\\p{Cf}]");

    private static final Pattern PROMPT_INJECTION =
            Pattern.compile(
                    "(?iu)ignore\\s+(all\\s+)?(previous|prior|above)\\s+instructions"
                    + "|disregard\\s+(all\\s+)?(previous|prior)\\s+instructions"
                    + "|forget\\s+(all\\s+)?(previous\\s+)?instructions"
                    + "|you\\s+are\\s+now\\s+"
                    + "|system\\s+prompt"
                    + "|developer\\s+mode"
                    + "|jailbreak"
                    + "|игнорируй\\s+(все\\s+)?(предыдущие|прошлые)\\s+(инструкции|правила)"
                    + "|забудь\\s+(все\\s+)?(инструкции|правила)"
                    + "|ты\\s+теперь\\s+"
            );

    private String normalizeUserAnswer(String userAnswer) {
        if (userAnswer == null) {
            return "";
        }

        String normalized = CONTROL_CHARACTERS.matcher(userAnswer).replaceAll(" ");
        normalized = normalized.replaceAll("\\s+", " ").trim();

        if (normalized.length() > MAX_USER_ANSWER_LENGTH) {
            normalized = normalized.substring(0, MAX_USER_ANSWER_LENGTH).trim();
        }

        if (PROMPT_INJECTION.matcher(normalized).find()) {
            log.warn("Potential prompt injection detected in user answer");
            return "[REDACTED]";
        }

        return normalized;
    }

    public LessonResultResponse processLessonResults(Long userId, LessonResultRequest request) {
        if (request == null || request.getTaskResults() == null || request.getTaskResults().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Не переданы ответы на задания."
            );
        }

        log.info("Processing lesson results for user {} with {} answers",
                userId, request.getTaskResults().size());

        Map<Long, Task> taskMap = taskRepository.findAllById(
                request.getTaskResults().stream()
                        .map(LessonResultRequest.TaskAnswer::getTaskId)
                        .collect(Collectors.toList())
        ).stream().collect(Collectors.toMap(Task::getId, t -> t));

        Map<Long, String> taskTypeNames = taskTypeRepository.findAll().stream()
                .collect(Collectors.toMap(TaskType::getId, TaskType::getName));

        int correctCount = 0;
        List<Long> incorrectTaskIds = new ArrayList<>();
        List<PythonRetryRequest.IncorrectTask> incorrectTasks = new ArrayList<>();
        Map<String, Integer> topicScoreChanges = new HashMap<>();

        for (LessonResultRequest.TaskAnswer answer : request.getTaskResults()) {
            Task task = taskMap.get(answer.getTaskId());

            if (task == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Одно из отправленных заданий не найдено."
                );
            }

            Topic topic = topicRepository.findById(task.getTopicId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Для одного из заданий не найдена тема."
                    ));

            String topicName = topic.getName();

            String userAnswer = normalizeUserAnswer(answer.getUserAnswer());

            boolean isCorrect = task.getAnswer() != null
                    && userAnswer.equalsIgnoreCase(task.getAnswer().trim());

            if (isCorrect) {
                correctCount++;
                topicScoreChanges.merge(topicName, 1, Integer::sum);
            } else {
                incorrectTaskIds.add(task.getId());
                topicScoreChanges.merge(topicName, -1, Integer::sum);

                incorrectTasks.add(PythonRetryRequest.IncorrectTask.builder()
                        .id(task.getId())
                        .name(task.getName())
                        .topic(topicName)
                        .taskType(resolveTaskTypeName(task.getTaskTypeId(), taskTypeNames))
                        .build());
            }
        }

        PythonRetryResponse retryResponse = null;

        List<LessonResultResponse.IncorrectTaskExplanationDto> incorrectTasksWithExplanations =
                Collections.emptyList();

        if (!incorrectTasks.isEmpty()) {
            PythonRetryRequest retryRequest = buildRetryRequest(
                    userId,
                    incorrectTasks,
                    request.getLanguageId()
            );

            retryResponse = pythonRetryService.generateRetryTasks(retryRequest);

            if (retryResponse == null || retryResponse.getTasks() == null
                    || retryResponse.getTasks().isEmpty()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "Не удалось получить повторные задания. Попробуйте ещё раз."
                );
            }

            if (retryResponse.getTasks().size() != incorrectTasks.size()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "Сервис генерации вернул не все повторные задания. Попробуйте ещё раз."
                );
            }

            incorrectTasksWithExplanations = mapIncorrectTaskExplanations(
                    retryResponse,
                    incorrectTasks
            );
        }

        final PythonRetryResponse finalRetryResponse = retryResponse;
        final List<LessonResultResponse.IncorrectTaskExplanationDto> finalExplanations =
                incorrectTasksWithExplanations;

        final int finalCorrectCount = correctCount;

        return transactionTemplate.execute(status -> {
            List<LessonResultResponse.RetryTaskDto> newTasks = new ArrayList<>();

            if (finalRetryResponse != null) {
                for (PythonRetryResponse.NewTask generated : finalRetryResponse.getTasks()) {
                    if (generated.getName() == null || generated.getName().isBlank()
                            || generated.getAnswer() == null || generated.getAnswer().isBlank()
                            || generated.getTopic() == null || generated.getTaskType() == null) {
                        throw new ResponseStatusException(
                                HttpStatus.BAD_GATEWAY,
                                "Сервис генерации вернул некорректное задание. Попробуйте ещё раз."
                        );
                    }

                    Topic topic = topicRepository.findByName(generated.getTopic())
                            .orElse(null);

                    if (topic == null || topic.getLanguage() == null
                            || !Objects.equals(request.getLanguageId(), topic.getLanguage().getId())) {
                        throw new ResponseStatusException(
                                HttpStatus.BAD_GATEWAY,
                                "Сервис генерации вернул задание с неизвестной темой."
                        );
                    }

                    Long taskTypeId = getTaskTypeId(generated.getTaskType());

                    if (taskTypeId == null) {
                        throw new ResponseStatusException(
                                HttpStatus.BAD_GATEWAY,
                                "Сервис генерации вернул задание с неизвестным типом."
                        );
                    }

                    Task task = Task.builder()
                            .name(generated.getName())
                            .answer(generated.getAnswer())
                            .topicId(topic.getId())
                            .languageId(request.getLanguageId())
                            .taskTypeId(taskTypeId)
                            .options(generated.getOptions())
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();

                    Task savedTask = taskRepository.save(task);

                    newTasks.add(LessonResultResponse.RetryTaskDto.builder()
                            .id(savedTask.getId())
                            .name(savedTask.getName())
                            .answer(savedTask.getAnswer())
                            .options(savedTask.getOptions() == null || savedTask.getOptions().isEmpty()
                                    ? null : String.join(",", savedTask.getOptions()))
                            .topic(topic.getName())
                            .taskType(savedTask.getTaskTypeId().toString())
                            .build());
                }
            }

            updateUserProgress(userId, topicScoreChanges, request.getTaskResults());

            int totalTasks = request.getTaskResults().size();
            double progress = totalTasks > 0
                    ? (finalCorrectCount * 100.0 / totalTasks)
                    : 0;

            return LessonResultResponse.builder()
                    .correctTasks(finalCorrectCount)
                    .incorrectTaskIds(incorrectTaskIds)
                    .totalTasks(totalTasks)
                    .progressPercent(Math.round(progress * 10.0) / 10.0)
                    .updatedTopicScores(topicScoreChanges)
                    .newTasks(newTasks)
                    .incorrectTasksWithExplanations(finalExplanations)
                    .build();
        });
    }

    private List<LessonResultResponse.IncorrectTaskExplanationDto> mapIncorrectTaskExplanations(
            PythonRetryResponse retryResponse,
            List<PythonRetryRequest.IncorrectTask> incorrectTasks) {

        List<PythonRetryResponse.IncorrectTaskExplanation> generatedExplanations =
                retryResponse.getIncorrectTasksExplanations();

        if (generatedExplanations == null || generatedExplanations.size() != incorrectTasks.size()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Сервис генерации вернул не все объяснения неправильных заданий. Попробуйте ещё раз."
            );
        }

        Map<Long, String> explanationsByTaskId = new HashMap<>();

        for (PythonRetryResponse.IncorrectTaskExplanation generated : generatedExplanations) {
            if (generated == null || generated.getIncorrectTaskId() == null
                    || generated.getExplanation() == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "Сервис генерации вернул некорректное объяснение. Попробуйте ещё раз."
                );
            }

            Long taskId = generated.getIncorrectTaskId();
            String explanation = generated.getExplanation().trim();

            boolean taskExists = incorrectTasks.stream()
                    .anyMatch(task -> Objects.equals(task.getId(), taskId));

            if (!taskExists || explanation.length() < 20 || explanation.length() > 600
                    || explanationsByTaskId.putIfAbsent(taskId, explanation) != null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "Сервис генерации вернул некорректные объяснения неправильных заданий. Попробуйте ещё раз."
                );
            }
        }

        List<LessonResultResponse.IncorrectTaskExplanationDto> result = new ArrayList<>();

        for (PythonRetryRequest.IncorrectTask incorrectTask : incorrectTasks) {
            String explanation = explanationsByTaskId.get(incorrectTask.getId());

            if (explanation == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "Для одного из неправильных заданий не найдено объяснение. Попробуйте ещё раз."
                );
            }

            result.add(LessonResultResponse.IncorrectTaskExplanationDto.builder()
                    .id(incorrectTask.getId())
                    .explanation(explanation)
                    .build());
        }

        return result;
    }

    private Long getTaskTypeId(String taskType) {
        switch (taskType) {
            case "MULTIPLE_CHOICE":
            case "1":
                return 1L;
            case "GAP_FILLING":
            case "2":
                return 2L;
            case "TRUE_FALSE":
            case "3":
                return 3L;
            default:
                return null;
        }
    }

    private String resolveTaskTypeName(Long taskTypeId, Map<Long, String> taskTypeNames) {
        String name = taskTypeNames.get(taskTypeId);

        if (name == null) {
            throw new IllegalStateException("Unknown task type id: " + taskTypeId);
        }

        return name;
    }

    private PythonRetryRequest buildRetryRequest(
            Long userId,
            List<PythonRetryRequest.IncorrectTask> incorrectTasks,
            Long languageId) {

        String language = languageRepository.findById(languageId)
                .map(Language::getName)
                .orElse("English");

        Map<String, Integer> topicScoresMap = getUserTopicScores(userId);

        List<PythonRetryRequest.TopicScore> topicScoresList = topicScoresMap.entrySet().stream()
                .map(entry -> PythonRetryRequest.TopicScore.builder()
                        .topic(entry.getKey())
                        .score(entry.getValue())
                        .build())
                .collect(Collectors.toList());

        return PythonRetryRequest.builder()
                .language(language)
                .incorrectTasks(incorrectTasks)
                .topicsScores(topicScoresList)
                .build();
    }

    private Map<String, Integer> getUserTopicScores(Long userId) {
        List<Object[]> results = userRepository.findTopicScoresByUserId(userId);
        Map<String, Integer> scores = new HashMap<>();

        for (Object[] row : results) {
            if (row[0] != null && row[1] != null) {
                scores.put(row[0].toString(), ((Number) row[1]).intValue());
            }
        }

        return scores;
    }

    private void updateUserProgress(
            Long userId,
            Map<String, Integer> scoreChanges,
            List<LessonResultRequest.TaskAnswer> answers) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        List<Long> doneTasks = user.getDoneTasks();

        if (doneTasks == null) {
            doneTasks = new ArrayList<>();
            user.setDoneTasks(doneTasks);
        }

        for (LessonResultRequest.TaskAnswer answer : answers) {
            Long taskId = answer.getTaskId();

            if (taskId != null && taskRepository.existsById(taskId) && !doneTasks.contains(taskId)) {
                doneTasks.add(taskId);
            }
        }

        if (!scoreChanges.isEmpty()) {
            List<Long> scoreIds = user.getTopicsScores();

            if (scoreIds == null) {
                scoreIds = new ArrayList<>();
                user.setTopicsScores(scoreIds);
            }

            TopicScores topicScores;

            if (scoreIds.isEmpty()) {
                topicScores = new TopicScores();
                topicScores.setScores(new HashMap<>());
                topicScores = topicScoresRepository.save(topicScores);
                scoreIds.add(topicScores.getId());
            } else {
                Long scoreId = scoreIds.get(scoreIds.size() - 1);

                topicScores = topicScoresRepository.findById(scoreId)
                        .orElseThrow(() -> new IllegalStateException("Topic scores not found: " + scoreId));
            }

            Map<Long, Integer> scores = topicScores.getScores();

            if (scores == null) {
                scores = new HashMap<>();
                topicScores.setScores(scores);
            }

            for (Map.Entry<String, Integer> change : scoreChanges.entrySet()) {
                Topic topic = topicRepository.findByName(change.getKey())
                        .orElseThrow(() -> new IllegalArgumentException("Topic not found: " + change.getKey()));

                scores.merge(topic.getId(), change.getValue(), Integer::sum);
            }

            topicScoresRepository.save(topicScores);
        }

        userRepository.save(user);

        log.debug("Updated user {} progress: scores={}, done={}", userId, scoreChanges, doneTasks);
    }
}
