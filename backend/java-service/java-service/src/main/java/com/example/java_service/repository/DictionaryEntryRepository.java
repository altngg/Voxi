
package com.example.java_service.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.java_service.entity.DictionaryEntry;

@Repository
public interface DictionaryEntryRepository extends JpaRepository<DictionaryEntry, Long> {

    List<DictionaryEntry> findAllByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<DictionaryEntry> findByIdAndUserId(Long id, Long userId);
}
