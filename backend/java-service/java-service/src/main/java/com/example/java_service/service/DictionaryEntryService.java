
package com.example.java_service.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.java_service.dto.request.DictionaryEntryRequest;
import com.example.java_service.dto.response.DictionaryEntryResponse;
import com.example.java_service.entity.DictionaryEntry;
import com.example.java_service.entity.Language;
import com.example.java_service.entity.User;
import com.example.java_service.repository.DictionaryEntryRepository;
import com.example.java_service.repository.LanguageRepository;
import com.example.java_service.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class DictionaryEntryService {

    private final DictionaryEntryRepository dictionaryEntryRepository;
    private final UserRepository userRepository;
    private final LanguageRepository languageRepository;

    @Transactional
    public DictionaryEntryResponse createEntry(Long userId, DictionaryEntryRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Language language = getLanguage(request.getLanguageId());

        DictionaryEntry entry = DictionaryEntry.builder()
                .user(user)
                .word(request.getWord().trim())
                .translation(request.getTranslation().trim())
                .definition(request.getDefinition().trim())
                .language(language)
                .build();

        DictionaryEntry savedEntry = dictionaryEntryRepository.save(entry);
        log.info("Dictionary entry {} created for user {}", savedEntry.getId(), userId);

        return DictionaryEntryResponse.fromEntity(savedEntry);
    }

    @Transactional(readOnly = true)
    public List<DictionaryEntryResponse> getUserEntries(Long userId) {
        return dictionaryEntryRepository.findAllByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(DictionaryEntryResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DictionaryEntryResponse getEntry(Long userId, Long entryId) {
        return DictionaryEntryResponse.fromEntity(findUserEntry(userId, entryId));
    }

    @Transactional
    public DictionaryEntryResponse updateEntry(Long userId, Long entryId, DictionaryEntryRequest request) {
        DictionaryEntry entry = findUserEntry(userId, entryId);
        Language language = getLanguage(request.getLanguageId());

        entry.setWord(request.getWord().trim());
        entry.setTranslation(request.getTranslation().trim());
        entry.setDefinition(request.getDefinition().trim());
        entry.setLanguage(language);

        DictionaryEntry updatedEntry = dictionaryEntryRepository.save(entry);
        log.info("Dictionary entry {} updated for user {}", entryId, userId);

        return DictionaryEntryResponse.fromEntity(updatedEntry);
    }

    @Transactional
    public void deleteEntry(Long userId, Long entryId) {
        DictionaryEntry entry = findUserEntry(userId, entryId);
        dictionaryEntryRepository.delete(entry);
        log.info("Dictionary entry {} deleted for user {}", entryId, userId);
    }

    private DictionaryEntry findUserEntry(Long userId, Long entryId) {
        return dictionaryEntryRepository.findByIdAndUserId(entryId, userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Dictionary entry not found"));
    }

    private Language getLanguage(Long languageId) {
        return languageRepository.findById(languageId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Language not found"));
    }
}
