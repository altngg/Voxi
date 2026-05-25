package com.example.java_service.dto.external;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiTestResultRequest {

    private String language;
    private List<String> levels;
    
    @JsonProperty("tasks_results")
    private List<TaskResult> tasksResults;
    
    private List<String> topics;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TaskResult {
        private String name;
        private String answer;
        private String topic;
        
        @JsonProperty("user_answer")
        private String userAnswer;
    }
}