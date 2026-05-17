package com.example.java_service.dto.request;

import lombok.Data;

@Data
public class LessonRequest {
    private Long languageId;
    private Integer maxTasks;
}
