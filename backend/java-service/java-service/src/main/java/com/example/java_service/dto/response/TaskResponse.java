package com.example.java_service.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TaskResponse {
    private Long id;
    private String name;
    private String topic;
    private String taskType;
    private String options;
}
