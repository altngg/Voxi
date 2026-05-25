package com.example.java_service.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"}, allowCredentials = "true")
public class TestController {

    private final TaskRepository taskRepository;
    private final LanguageRepository languageRepository;
    private final TopicRepository topicRepository;

    @GetMapping
    public ResponseEntity<TestResponse> generateTest(
            @RequestParam Long languageId,
            @RequestParam(defaultValue = "5") Integer count) {
        
        log.info("Test generation request: languageId={}, count={}", languageId, count);

        Language language = languageRepository.findById(languageId)
                .orElseThrow(() -> new RuntimeException("Language not found: " + languageId));

        int taskCount = Math.min(count != null ? count : 5, 20);

        List<Task> tasks = taskRepository.findRandomByLanguageId(languageId, taskCount);

        if (tasks.isEmpty()) {
            throw new RuntimeException("No tasks available for language: " + language.getName());
        }

        List<TaskResponse> taskResponses = tasks.stream()
                .map(task -> {
                    String topicName = topicRepository.findById(task.getTopicId())
                            .map(Topic::getName)
                            .orElse("Unknown");
                    
                    return TaskResponse.builder()
                            .id(task.getId())
                            .name(task.getName())
                            .topic(topicName)
                            .taskType(task.getTaskTypeId().toString())
                            .options(task.getOptions() != null && !task.getOptions().isEmpty()
                                ? String.join(",", task.getOptions())
                                : null)
                            .build();
                })
                .collect(Collectors.toList());

        TestResponse response = TestResponse.builder()
                .testId(System.currentTimeMillis())
                .language(language.getName())
                .tasks(taskResponses)
                .totalTimeMinutes(taskCount * 2)
                .build();

        return ResponseEntity.ok(response);
    }
}