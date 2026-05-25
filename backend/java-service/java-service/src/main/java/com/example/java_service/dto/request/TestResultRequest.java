package com.example.java_service.dto.request;

import java.util.List;

import lombok.Data;

@Data
public class TestResultRequest {
    private Long testId;
    private List<TaskResult> taskResults;
    
    @Data
    public static class TaskResult {
        private Long taskId;
        private String userAnswer;
    }
    
}
