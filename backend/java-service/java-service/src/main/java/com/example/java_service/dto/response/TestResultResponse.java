package com.example.java_service.dto.response;

import java.util.Map;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TestResultResponse {
    private Long testResultId;
    private String overallLevel;
    private Integer grammarScore;
    private Integer vocabularyScore;
    private Map<String, Integer> topicScores;
}
