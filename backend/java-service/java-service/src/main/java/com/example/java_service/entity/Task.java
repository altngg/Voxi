package com.example.java_service.entity;

import java.util.List;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "tasks")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String answer;

    @Column(name = "topic_id", nullable = false)
    private Long topicId;

    @Column(name = "language_id", nullable = false)
    private Long languageId;

    @Column(name = "task_type_id", nullable = false)
    private Long taskTypeId;

    @ElementCollection
    @CollectionTable(name = "task_options", joinColumns = @JoinColumn(name = "task_id"))
    @Column(name = "option_value")
    private List<String> options;
}