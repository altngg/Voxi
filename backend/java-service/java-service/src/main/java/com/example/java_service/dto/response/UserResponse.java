package com.example.java_service.dto.response;

import java.time.LocalDateTime;
import java.util.List;

import com.example.java_service.entity.User;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserResponse {

    private Long id;
    private String login;
    private String email;
    private String role;
    private List<Long> learningLanguages;  
    private List<Long> testResults;        
    private List<Long> doneTasks;          
    private LocalDateTime createdAt;

    public static UserResponse fromEntity(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .login(user.getLogin())
                .email(user.getEmail())
                .role(user.getRole().name())
                .learningLanguages(user.getLearningLanguages())
                .testResults(user.getTestResults())
                .doneTasks(user.getDoneTasks())
                .createdAt(user.getCreatedAt())
                .build();
    }
}