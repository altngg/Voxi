package com.example.java_service.dto.external;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PythonRetryRequest {
    private String language;

    @JsonProperty("incorrect_tasks")
    private List<IncorrectTask> incorrectTasks;

    @JsonProperty("topics_scores")
    private List<TopicScore> topicsScores;  

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class IncorrectTask {
        private String name;
        private String topic;
        
        @JsonProperty("task_type")
        private String taskType;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TopicScore {
        private String topic;
        private Integer score;
    }
}