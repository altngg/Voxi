package com.example.java_service.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.java_service.dto.external.PythonRetryRequest;
import com.example.java_service.dto.external.PythonRetryResponse;
import com.example.java_service.dto.request.LessonResultRequest;
import com.example.java_service.dto.response.LessonResultResponse;
import com.example.java_service.entity.Language;
import com.example.java_service.entity.Task;
import com.example.java_service.entity.TaskType;
import com.example.java_service.entity.Topic;
import com.example.java_service.repository.LanguageRepository;
import com.example.java_service.repository.TaskRepository;
import com.example.java_service.repository.TaskTypeRepository;
import com.example.java_service.repository.TopicRepository;
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
    private final LanguageRepository languageRepository;
    private final PythonRetryService pythonRetryService;

    @Transactional
    public LessonResultResponse processLessonResults(Long userId, LessonResultRequest request) {
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
            if (task == null) continue;

            Topic topic = topicRepository.findById(task.getTopicId())
                    .orElse(null);
            if (topic == null) continue;

            String topicName = topic.getName();
            boolean isCorrect = answer.getUserAnswer().equalsIgnoreCase(task.getAnswer());

            if (isCorrect) {
                correctCount++;
                topicScoreChanges.merge(topicName, 1, Integer::sum);
            } else {
                incorrectTaskIds.add(task.getId());
                topicScoreChanges.merge(topicName, -1, Integer::sum);
                
                incorrectTasks.add(PythonRetryRequest.IncorrectTask.builder()
                        .name(task.getName())
                        .topic(topicName)
                        .taskType(resolveTaskTypeName(task.getTaskTypeId(), taskTypeNames))
                        .build());
            }
        }

        List<LessonResultResponse.RetryTaskDto> newTasks = Collections.emptyList();
        
        if (!incorrectTasks.isEmpty()) {
            PythonRetryRequest retryRequest = buildRetryRequest(userId, incorrectTasks, request.getLanguageId());
            PythonRetryResponse retryResponse = pythonRetryService.generateRetryTasks(retryRequest);
            
            if (retryResponse.getTasks() != null) {  
                newTasks = retryResponse.getTasks().stream()
                        .map(t -> LessonResultResponse.RetryTaskDto.builder()
                                .name(t.getName())
                                .options(t.getOptions() != null ? String.join(",", t.getOptions()) : null)  
                                .topic(t.getTopic())
                                .taskType(t.getTaskType())
                                .build())
                        .collect(Collectors.toList());
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
        log.debug("Updating user {} progress: scores={}, done={}", userId, scoreChanges, 
            answers.stream().map(LessonResultRequest.TaskAnswer::getTaskId).collect(Collectors.toList()));
    }
}