package com.example.java_service.service;

import com.example.java_service.dto.response.LessonResponse;
import com.example.java_service.entity.Language;
import com.example.java_service.entity.Task;
import com.example.java_service.entity.Topic;
import com.example.java_service.entity.User;
import com.example.java_service.repository.LanguageRepository;
import com.example.java_service.repository.TaskRepository;
import com.example.java_service.repository.TopicRepository;
import com.example.java_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LessonService {

    private final TaskRepository taskRepository;
    private final LanguageRepository languageRepository;
    private final TopicRepository topicRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public LessonResponse generateLesson(Long userId, Long languageId, Integer maxTasks) {
        log.info("Generating lesson for user {} language {} maxTasks {}", userId, languageId, maxTasks);

        Language language = languageRepository.findById(languageId)
                .orElseThrow(() -> new RuntimeException("Language not found: " + languageId));

        int limit = Math.min(maxTasks != null ? maxTasks : 10, 10);

        Map<String, Integer> userTopicScores = getUserTopicScores(userId);
        List<Long> doneTaskIds = getDoneTaskIds(userId);

        List<Topic> topics = topicRepository.findByLanguageId(languageId);
        
        topics.sort(Comparator.comparingInt(t -> 
            userTopicScores.getOrDefault(t.getName(), 0)));

        List<Task> selectedTasks = new ArrayList<>();

        for (Topic topic : topics) {
            if (selectedTasks.size() >= limit) break;
            
            int countForTopic = Math.min(2, limit - selectedTasks.size());
            
            List<Task> availableTasks = taskRepository
                    .findByLanguageIdAndTopicIdAndIdNotIn(languageId, topic.getId(), doneTaskIds);
            
            Collections.shuffle(availableTasks);
            
            for (int i = 0; i < countForTopic && i < availableTasks.size(); i++) {
                selectedTasks.add(availableTasks.get(i));
            }
        }

        if (selectedTasks.isEmpty()) {
            List<Task> fallbackTasks = taskRepository
                    .findRandomByLanguageId(languageId, limit);
            selectedTasks.addAll(fallbackTasks);
        }

        List<LessonResponse.TaskDto> taskDtos = selectedTasks.stream()
                .map(this::toTaskDto)
                .collect(Collectors.toList());

        return LessonResponse.builder()
                .tasks(taskDtos)
                .language(language.getName())
                .build();
    }

    private LessonResponse.TaskDto toTaskDto(Task task) {
        String topicName = topicRepository.findById(task.getTopicId())
                .map(Topic::getName)
                .orElse("Unknown");
        
        return LessonResponse.TaskDto.builder()
                .id(task.getId())
                .name(task.getName())
                .topic(topicName)
                .taskType(task.getTaskTypeId().toString())
                .options(convertOptionsToString(task.getOptions()))
                .build();
    }

    private String convertOptionsToString(List<String> options) {
        if (options == null || options.isEmpty()) {
            return null;
        }
        return String.join(",", options);
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

    private List<Long> getDoneTaskIds(Long userId) {
        return userRepository.findDoneTaskIdsByUserId(userId);
    }
}