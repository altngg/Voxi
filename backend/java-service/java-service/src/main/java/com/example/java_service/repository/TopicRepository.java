package com.example.java_service.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.java_service.entity.Topic;

@Repository
public interface TopicRepository extends JpaRepository<Topic, Long> {
    List<Topic> findByLanguageId(Long languageId);
}