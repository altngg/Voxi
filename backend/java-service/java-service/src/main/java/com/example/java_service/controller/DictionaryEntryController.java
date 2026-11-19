
package com.example.java_service.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.java_service.dto.request.DictionaryEntryRequest;
import com.example.java_service.dto.response.DictionaryEntryResponse;
import com.example.java_service.entity.User;
import com.example.java_service.repository.UserRepository;
import com.example.java_service.service.DictionaryEntryService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/dictionary")
@RequiredArgsConstructor
@Slf4j
public class DictionaryEntryController {

    private final DictionaryEntryService dictionaryEntryService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<DictionaryEntryResponse> createEntry(
            @Valid @RequestBody DictionaryEntryRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        Long userId = getCurrentUserId(userDetails);
        DictionaryEntryResponse response = dictionaryEntryService.createEntry(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<DictionaryEntryResponse>> getUserEntries(
            @AuthenticationPrincipal UserDetails userDetails) {

        Long userId = getCurrentUserId(userDetails);
        return ResponseEntity.ok(dictionaryEntryService.getUserEntries(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DictionaryEntryResponse> getEntry(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        Long userId = getCurrentUserId(userDetails);
        return ResponseEntity.ok(dictionaryEntryService.getEntry(userId, id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DictionaryEntryResponse> updateEntry(
            @PathVariable Long id,
            @Valid @RequestBody DictionaryEntryRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        Long userId = getCurrentUserId(userDetails);
        return ResponseEntity.ok(dictionaryEntryService.updateEntry(userId, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEntry(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        Long userId = getCurrentUserId(userDetails);
        dictionaryEntryService.deleteEntry(userId, id);
        return ResponseEntity.noContent().build();
    }

    private Long getCurrentUserId(UserDetails userDetails) {
        if (userDetails == null) {
            throw new IllegalStateException("User not authenticated");
        }

        String email = userDetails.getUsername();
        return userRepository.findByEmail(email)
                .map(User::getId)
                .orElseThrow(() -> new IllegalStateException("User not found: " + email));
    }
}
