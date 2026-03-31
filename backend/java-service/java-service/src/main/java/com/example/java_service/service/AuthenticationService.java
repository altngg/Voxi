package com.example.java_service.service;

import com.example.java_service.dto.request.LoginRequest;
import com.example.java_service.dto.request.RegisterRequest;
import com.example.java_service.dto.response.AuthResponse;
import com.example.java_service.dto.response.UserResponse;
import com.example.java_service.entity.User;
import com.example.java_service.entity.Language;
import com.example.java_service.entity.User.Role;
import com.example.java_service.repository.UserRepository;
import com.example.java_service.repository.LanguageRepository;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UserRepository userRepository;
    private final LanguageRepository languageRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final TokenManager tokenManager;
    private final JwtService jwtService; 

    public AuthResponse register(RegisterRequest request, HttpServletResponse response) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("User with this email already exists");
        }

        if (userRepository.existsByLogin(request.getLogin())) {
            throw new RuntimeException("User with this login already exists");
        }

        User.UserBuilder userBuilder = User.builder()
                .email(request.getEmail())
                .login(request.getLogin())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.USER)
                .enabled(true);

        if (request.getLearningLanguageId() != null) {
            Language learningLanguage = languageRepository.findById(request.getLearningLanguageId())
                    .orElseThrow(() -> new RuntimeException("Language not found"));
            userBuilder.learningLanguage(learningLanguage);
        }

        User savedUser = userRepository.save(userBuilder.build());

        tokenManager.generateAndSetTokens(savedUser, response);

        return AuthResponse.builder()
                .user(UserResponse.fromEntity(savedUser))
                .message("Registration successful")
                .build();
    }

    public AuthResponse login(LoginRequest request, HttpServletResponse response) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        tokenManager.generateAndSetTokens(user, response);

        return AuthResponse.builder()
                .user(UserResponse.fromEntity(user))
                .message("Login successful")
                .build();
    }

    public AuthResponse logout(HttpServletResponse response) {
        tokenManager.revokeTokens(response);

        return AuthResponse.builder()
                .message("Logout successful")
                .build();
    }

    public AuthResponse refresh(HttpServletResponse response, String refreshToken) {
        if (!jwtService.isTokenValid(refreshToken, null)) {
            throw new RuntimeException("Invalid refresh token");
        }

        String email = jwtService.extractUsername(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        tokenManager.generateAndSetTokens(user, response);

        return AuthResponse.builder()
                .user(UserResponse.fromEntity(user))
                .message("Token refreshed")
                .build();
    }
}