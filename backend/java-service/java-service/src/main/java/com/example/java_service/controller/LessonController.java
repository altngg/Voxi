package com.example.java_service.controller;

import com.example.java_service.dto.request.LessonResultRequest;
import com.example.java_service.dto.response.LessonResponse;
import com.example.java_service.dto.response.LessonResultResponse;
import com.example.java_service.entity.User;
import com.example.java_service.repository.UserRepository;
import com.example.java_service.service.LessonResultService;
import com.example.java_service.service.LessonService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/lesson")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"}, allowCredentials = "true")
public class LessonController {

    private final LessonService lessonService;
    private final LessonResultService lessonResultService;
    private final UserRepository userRepository; 

    @GetMapping("/tasks")
    public ResponseEntity<LessonResponse> getLessonTasks(
            @RequestParam Long languageId,
            @RequestParam(defaultValue = "10") Integer maxTasks,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Long userId = getCurrentUserId(userDetails);
        log.info("Lesson tasks request: user={} language={} max={}", userId, languageId, maxTasks);
        
        LessonResponse response = lessonService.generateLesson(userId, languageId, maxTasks);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/results")
    public ResponseEntity<LessonResultResponse> submitLessonResults(
            @RequestBody LessonResultRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Long userId = getCurrentUserId(userDetails);
        log.info("Lesson results submission: user={} tasks={}", userId, request.getTaskResults().size());
        
        LessonResultResponse response = lessonResultService.processLessonResults(userId, request);
        return ResponseEntity.ok(response);
    }

    private Long getCurrentUserId(UserDetails userDetails) {
        if (userDetails == null) {
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