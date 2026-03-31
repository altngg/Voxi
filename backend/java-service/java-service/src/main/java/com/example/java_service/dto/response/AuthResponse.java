package com.example.java_service.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {
    private UserResponse user;
    private String message;
}
