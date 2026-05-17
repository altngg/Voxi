package com.example.java_service.dto.request;

import java.util.List;

import lombok.Data;

@Data
public class LessonResultRequest {
    private Long languageId;
    private List<TaskAnswer> taskResults;

    @Data
    public static class TaskAnswer {
        private Long taskId;
        private String userAnswer;
    }
}
