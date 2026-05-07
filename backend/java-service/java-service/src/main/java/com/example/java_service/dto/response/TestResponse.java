package com.example.java_service.dto.response;

import java.util.List;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TestResponse {
    private Long testId;
    private String language;
    private List<TaskResponse> tasks;
    private Integer totalTimeMinutes;
}
