package com.example.java_service.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.java_service.entity.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);
    Optional<User> findByLogin(String login);
    boolean existsByEmail(String email);
    boolean existsByLogin(String login);

    @Query(value = """
        SELECT t.name as topic, tsm.score
        FROM user_topics_scores uts
        JOIN topic_scores ts ON uts.topic_score_id = ts.id
        JOIN topic_score_map tsm ON tsm.topic_score_id = ts.id
        JOIN topics t ON t.id = tsm.topic_id
        WHERE uts.user_id = :userId
        """, nativeQuery = true)
    List<Object[]> findTopicScoresByUserId(@Param("userId") Long userId);

    @Query(value = "SELECT task_id FROM user_done_tasks WHERE user_id = :userId", nativeQuery = true)
    List<Long> findDoneTaskIdsByUserId(@Param("userId") Long userId);
}