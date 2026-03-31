package com.example.java_service.dto.response;

import com.example.java_service.entity.User;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class UserResponse {

    private Long id;
    private String login;
    private String email;
    private String role;
    private Long learningLanguageId;
    private String learningLanguageName;
    private LocalDateTime createdAt;

    public static UserResponse fromEntity(User user) {
        UserResponse.UserResponseBuilder builder = UserResponse.builder()
                .id(user.getId())
                .login(user.getLogin())
                .email(user.getEmail())
                .role(user.getRole().name())
                .createdAt(user.getCreatedAt());

        if (user.getLearningLanguage() != null) {
            builder.learningLanguageId(user.getLearningLanguage().getId());
            builder.learningLanguageName(user.getLearningLanguage().getName());
        }

        return builder.build();
    }
}