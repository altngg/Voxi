package com.example.java_service.repository;

import com.example.java_service.entity.TestResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TestResultRepository extends JpaRepository<TestResult, Long> {
    List<TestResult> findByUserId(Long userId);
    List<TestResult> findByLanguageId(Long languageId);
}