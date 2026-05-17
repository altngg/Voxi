package com.example.java_service.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.java_service.entity.Task;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    @Query(value = "SELECT * FROM tasks WHERE language_id = :languageId ORDER BY RANDOM() LIMIT :limit", 
           nativeQuery = true)
    List<Task> findRandomByLanguageId(@Param("languageId") Long languageId, @Param("limit") Integer limit);

    @Query(value = "SELECT * FROM tasks WHERE language_id = :languageId AND topic_id = :topicId AND id NOT IN :excludeIds ORDER BY RANDOM()", 
           nativeQuery = true)
    List<Task> findByLanguageIdAndTopicIdAndIdNotIn(
            @Param("languageId") Long languageId,
            @Param("topicId") Long topicId,
            @Param("excludeIds") List<Long> excludeIds);
}