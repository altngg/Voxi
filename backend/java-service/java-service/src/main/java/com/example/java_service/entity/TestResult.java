package com.example.java_service.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "test_results")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id", nullable = false)
    private Test test;

    @Column(nullable = false)
    private Integer overallScore;

    @Column(nullable = false)
    private Integer totalQuestions;

    @Column(nullable = false)
    private String overallLevel;

    @ElementCollection
    @CollectionTable(name = "test_result_topics", joinColumns = @JoinColumn(name = "test_result_id"))
    @MapKeyColumn(name = "topic_name")
    @Column(name = "topic_score")
    private Map<String, Integer> topicScores;

    @Column(name = "completed_at", nullable = false)
    private LocalDateTime completedAt;

    @PrePersist
    protected void onCreate() {
        completedAt = LocalDateTime.now();
    }
}
