package com.example.java_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.java_service.entity.TopicScores;

@Repository
public interface TopicScoresRepository extends JpaRepository<TopicScores, Long> {
}