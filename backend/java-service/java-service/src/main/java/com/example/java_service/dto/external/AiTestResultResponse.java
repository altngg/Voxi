package com.example.java_service.dto.external;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.List;

@Data
public class AiTestResultResponse {

    @JsonProperty("overall_level")
    private String overallLevel;
    
    @JsonProperty("grammar_score")
    private Integer grammarScore;
    
    @JsonProperty("vocabulary_score")
    private Integer vocabularyScore;
    
    @JsonProperty("topic_scores")
    private List<TopicScore> topicScores;

    @Data
    public static class TopicScore {
        private String topic;
        private Integer score;
    }
}