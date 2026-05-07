package com.example.java_service.controller;

import com.example.java_service.dto.request.TestResultRequest;
import com.example.java_service.dto.response.TestResultResponse;
import com.example.java_service.entity.User;
import com.example.java_service.repository.UserRepository;
import com.example.java_service.service.TestResultService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/test-result")
@RequiredArgsConstructor
@Slf4j
public class TestResultController {

    private final TestResultService testResultService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<TestResultResponse> submitTestResult(
            @Valid @RequestBody TestResultRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Long userId = getCurrentUserId(userDetails);
        log.info("Test result submission request from user {}", userId);
        
        TestResultResponse response = testResultService.submitTestResult(request, userId);
        return ResponseEntity.ok(response);
    }

    private Long getCurrentUserId(UserDetails userDetails) {
        if (userDetails == null) {
            log.warn("No authenticated user found");
            throw new IllegalStateException("User not authenticated");
        }
        
        String email = userDetails.getUsername();
        log.debug("Looking up user by email: {}", email);
        
        return userRepository.findByEmail(email)
                .map(User::getId)
                .orElseThrow(() -> {
                    log.error("User not found with email: {}", email);
                    return new IllegalStateException("User not found: " + email);
                });
    }
}