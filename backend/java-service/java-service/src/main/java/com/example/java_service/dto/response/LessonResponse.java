package com.example.java_service.dto.response;

import java.util.List;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LessonResponse {
    private List<TaskDto> tasks;
    private String language;

    @Data
    @Builder
    public static class TaskDto {
        private Long id;
        private String name;
        private String topic;
        private String taskType;
        private String options;
    }
}