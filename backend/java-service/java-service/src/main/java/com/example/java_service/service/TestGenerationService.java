package com.example.java_service.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.java_service.dto.response.TaskResponse;
import com.example.java_service.dto.response.TestResponse;
import com.example.java_service.entity.Language;
import com.example.java_service.entity.Task;
import com.example.java_service.entity.Topic;
import com.example.java_service.repository.LanguageRepository;
import com.example.java_service.repository.TaskRepository;
import com.example.java_service.repository.TopicRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class TestGenerationService {

    private final TaskRepository taskRepository;
    private final LanguageRepository languageRepository;
    private final TopicRepository topicRepository;

    @Transactional(readOnly = true)
    public TestResponse generateTest(Long languageId, Integer count) {
        log.info("Generating test for language {} with {} tasks", languageId, count);

        Language language = languageRepository.findById(languageId)
                .orElseThrow(() -> new RuntimeException("Language not found: " + languageId));

        int taskCount = count != null ? Math.min(count, 20) : 5;

        List<Task> tasks = taskRepository.findRandomByLanguageId(languageId, taskCount);

        if (tasks.isEmpty()) {
            log.warn("No tasks found for language {}", languageId);
            throw new RuntimeException("No tasks available for language: " + language.getName());
        }

        List<TaskResponse> taskResponses = tasks.stream()
                .map(this::toTaskResponse)
                .collect(Collectors.toList());

        return TestResponse.builder()
                .testId(System.currentTimeMillis())
                .language(language.getName())
                .tasks(taskResponses)
                .totalTimeMinutes(taskCount * 2)
                .build();
    }

    private TaskResponse toTaskResponse(Task task) {
        String topicName = topicRepository.findById(task.getTopicId())
                .map(Topic::getName)
                .orElse("Unknown");

        return TaskResponse.builder()
                .id(task.getId())
                .name(task.getName())
                .topic(topicName)
                .taskType(task.getTaskTypeId().toString())
                .options(task.getOptions() != null ? String.join(",", task.getOptions()) : null)
                .build();
    }
}