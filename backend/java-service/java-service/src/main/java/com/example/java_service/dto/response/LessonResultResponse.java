package com.example.java_service.dto.response;

import java.util.List;
import java.util.Map;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LessonResultResponse {
    private Integer correctTasks;
    private List<Long> incorrectTaskIds;
    private Integer totalTasks;
    private Double progressPercent;
    private Map<String, Integer> updatedTopicScores;
    private List<RetryTaskDto> newTasks;

    @Data
    @Builder
    public static class RetryTaskDto {
        private String name;
        private String options;
        private String topic;
        private String taskType;
    }
}