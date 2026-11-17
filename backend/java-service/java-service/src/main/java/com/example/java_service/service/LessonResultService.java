package com.example.java_service.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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

    @Transactional
    public LessonResultResponse processLessonResults(Long userId, LessonResultRequest request) {
        if (request == null || request.getTaskResults() == null || request.getTaskResults().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Не переданы ответы на задания."
            );
        }

        log.info("Processing lesson results for user {} with {} answers", userId, request.getTaskResults().size());

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
            boolean isCorrect = answer.getUserAnswer() != null
                    && task.getAnswer() != null
                    && answer.getUserAnswer().equalsIgnoreCase(task.getAnswer());

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

        List<LessonResultResponse.RetryTaskDto> newTasks = Collections.emptyList();

        if (!incorrectTasks.isEmpty()) {
            PythonRetryRequest retryRequest = buildRetryRequest(
                    userId,
                    incorrectTasks,
                    request.getLanguageId()
            );

            PythonRetryResponse retryResponse = pythonRetryService.generateRetryTasks(retryRequest);

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

            newTasks = new ArrayList<>();

            for (PythonRetryResponse.NewTask generated : retryResponse.getTasks()) {
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
        double progress = totalTasks > 0 ? (correctCount * 100.0 / totalTasks) : 0;

        return LessonResultResponse.builder()
                .correctTasks(correctCount)
                .incorrectTaskIds(incorrectTaskIds)
                .totalTasks(totalTasks)
                .progressPercent(Math.round(progress * 10.0) / 10.0)
                .updatedTopicScores(topicScoreChanges)
                .newTasks(newTasks)
                .build();
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

    private PythonRetryRequest buildRetryRequest(Long userId, List<PythonRetryRequest.IncorrectTask> incorrectTasks, Long languageId) {
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

    private void updateUserProgress(Long userId, Map<String, Integer> scoreChanges, List<LessonResultRequest.TaskAnswer> answers) {
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
