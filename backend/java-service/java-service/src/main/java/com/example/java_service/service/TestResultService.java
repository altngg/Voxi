package com.example.java_service.service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.java_service.dto.external.AiTestResultRequest;
import com.example.java_service.dto.external.AiTestResultResponse;
import com.example.java_service.dto.request.TestResultRequest;
import com.example.java_service.dto.response.TestResultResponse;
import com.example.java_service.entity.Language;
import com.example.java_service.entity.Level;
import com.example.java_service.entity.Task;
import com.example.java_service.entity.TestResult;
import com.example.java_service.entity.Topic;
import com.example.java_service.entity.TopicScores;
import com.example.java_service.entity.User;
import com.example.java_service.repository.LanguageRepository;
import com.example.java_service.repository.LevelRepository;
import com.example.java_service.repository.TaskRepository;
import com.example.java_service.repository.TestResultRepository;
import com.example.java_service.repository.TopicRepository;
import com.example.java_service.repository.TopicScoresRepository;
import com.example.java_service.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class TestResultService {

    private final TestResultRepository testResultRepository;
    private final TopicScoresRepository topicScoresRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final TopicRepository topicRepository;
    private final LanguageRepository languageRepository;
    private final LevelRepository levelRepository;
    private final PythonMlService pythonMlService;

    @Transactional
    public TestResultResponse submitTestResult(TestResultRequest request, Long userId) {
        log.info("Processing test result for user {} with {} tasks", userId, request.getTaskResults().size());

        Long languageId = getLanguageIdFromTasks(request.getTaskResults());
        
        Language language = languageRepository.findById(languageId)
                .orElseThrow(() -> new RuntimeException("Language not found: " + languageId));

        List<Task> tasks = taskRepository.findAllById(
                request.getTaskResults().stream()
                        .map(TestResultRequest.TaskResult::getTaskId)
                        .collect(Collectors.toList())
        );

        if (tasks.size() != request.getTaskResults().size()) {
                throw new RuntimeException("Some tasks not found");
        }

        AiTestResultRequest mlRequest = buildMlRequest(language, tasks, request.getTaskResults());
        
        AiTestResultResponse mlResponse = pythonMlService.generateTestResult(mlRequest);

        TestResult testResult = saveTestResult(language, userId, mlResponse);
        
        TopicScores topicScores = saveTopicScores(userId, mlResponse.getTopicScores());
        
        updateUser(userId, testResult, topicScores);

        log.info("Test result processed successfully for user {}", userId);

        return TestResultResponse.builder()
                .testResultId(testResult.getId())
                .overallLevel(mlResponse.getOverallLevel())
                .grammarScore(mlResponse.getGrammarScore())
                .vocabularyScore(mlResponse.getVocabularyScore())
                .topicScores(mlResponse.getTopicScores().stream()
                        .collect(Collectors.toMap(
                                AiTestResultResponse.TopicScore::getTopic,
                                AiTestResultResponse.TopicScore::getScore
                        )))
                .build();
        }

        private Long getLanguageIdFromTasks(List<TestResultRequest.TaskResult> taskResults) {
        if (taskResults.isEmpty()) {
                throw new RuntimeException("No tasks in request");
        }
        Task firstTask = taskRepository.findById(taskResults.get(0).getTaskId())
                .orElseThrow(() -> new RuntimeException("Task not found: " + taskResults.get(0).getTaskId()));
        return firstTask.getLanguageId();
        }

    private AiTestResultRequest buildMlRequest(Language language, List<Task> tasks, 
                                                List<TestResultRequest.TaskResult> taskResults) {
        Map<Long, Task> taskMap = tasks.stream()
                .collect(Collectors.toMap(Task::getId, task -> task));

        Map<Long, Topic> topicMap = loadTopicsForTasks(tasks);

        List<AiTestResultRequest.TaskResult> mlTasks = taskResults.stream()
                .map(tr -> {
                    Task task = taskMap.get(tr.getTaskId());
                    if (task == null) {
                        throw new RuntimeException("Task not found: " + tr.getTaskId());
                    }
                    Topic topic = topicMap.get(task.getTopicId());
                    if (topic == null) {
                        throw new RuntimeException("Topic not found for task: " + tr.getTaskId());
                    }
                    return AiTestResultRequest.TaskResult.builder()
                            .name(task.getName())
                            .answer(task.getAnswer())
                            .topic(topic.getName())
                            .userAnswer(tr.getUserAnswer())
                            .build();
                })
                .collect(Collectors.toList());

        List<String> topics = topicMap.values().stream()
                .map(Topic::getName)
                .distinct()
                .collect(Collectors.toList());

        return AiTestResultRequest.builder()
                .language(language.getName())
                .levels(Arrays.asList("A1", "A2", "B1", "B2", "C1", "C2"))
                .tasksResults(mlTasks)
                .topics(topics)
                .build();
    }

    private Map<Long, Topic> loadTopicsForTasks(List<Task> tasks) {
        Set<Long> topicIds = tasks.stream()
                .map(Task::getTopicId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        
        if (topicIds.isEmpty()) {
            return Collections.emptyMap();
        }
        
        return topicRepository.findAllById(topicIds).stream()
                .collect(Collectors.toMap(Topic::getId, topic -> topic));
    }

    private TestResult saveTestResult(Language language, Long userId, AiTestResultResponse mlResponse) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Level level = levelRepository.findByName(mlResponse.getOverallLevel())
                .orElseThrow(() -> new RuntimeException("Level not found: " + mlResponse.getOverallLevel()));

        TestResult testResult = TestResult.builder()
                .language(language)  
                .user(user)
                .overallLevel(level)
                .grammarScore(mlResponse.getGrammarScore())
                .vocabularyScore(mlResponse.getVocabularyScore())
                .build();

        TestResult saved = testResultRepository.save(testResult);
        log.debug("TestResult saved with id: {}, grammar: {}, vocabulary: {}", 
                saved.getId(), saved.getGrammarScore(), saved.getVocabularyScore());
        
        return saved;
        }

    private TopicScores saveTopicScores(Long userId, List<AiTestResultResponse.TopicScore> topicScores) {
        Map<Long, Topic> topicMap = topicRepository.findAll().stream()
                .collect(Collectors.toMap(Topic::getId, topic -> topic));

        Map<Long, Integer> scoresMap = topicScores.stream()
                .collect(Collectors.toMap(
                        ts -> {
                            Topic topic = topicMap.values().stream()
                                    .filter(t -> t.getName().equals(ts.getTopic()))
                                    .findFirst()
                                    .orElseThrow(() -> new RuntimeException("Topic not found: " + ts.getTopic()));
                            return topic.getId();
                        },
                        AiTestResultResponse.TopicScore::getScore
                ));

        TopicScores topicScoresEntity = TopicScores.builder()
                .scores(scoresMap)
                .build();

        TopicScores saved = topicScoresRepository.save(topicScoresEntity);
        log.debug("TopicScores saved with id: {}", saved.getId());
        
        return saved;
    }

    private void updateUser(Long userId, TestResult testResult, TopicScores topicScores) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Long> testResults = user.getTestResults();
        if (testResults == null) {
            testResults = new ArrayList<>();
        }
        testResults.add(testResult.getId());
        user.setTestResults(testResults);

        List<Long> topicsScores = user.getTopicsScores();
        if (topicsScores == null) {
            topicsScores = new ArrayList<>();
        }
        topicsScores.add(topicScores.getId());
        user.setTopicsScores(topicsScores);

        userRepository.save(user);
        log.debug("User {} updated with new test result and topic scores", userId);
    }
}