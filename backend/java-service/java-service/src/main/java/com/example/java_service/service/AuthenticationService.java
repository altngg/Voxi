package com.example.java_service.service;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.java_service.dto.request.LoginRequest;
import com.example.java_service.dto.request.RegisterRequest;
import com.example.java_service.dto.response.AuthResponse;
import com.example.java_service.dto.response.UserResponse;
import com.example.java_service.entity.User;
import com.example.java_service.repository.UserRepository;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthenticationService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final TokenManager tokenManager;

    @Transactional
    public AuthResponse register(RegisterRequest request, HttpServletResponse response) {
        log.info("Registering user with email: {}", request.getEmail());

        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("User with email {} already exists", request.getEmail());
            throw new RuntimeException("User with this email already exists");
        }

        if (userRepository.existsByLogin(request.getLogin())) {
            log.warn("User with login {} already exists", request.getLogin());
            throw new RuntimeException("User with this login already exists");
        }

        User user = User.builder()
                .email(request.getEmail())
                .login(request.getLogin())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.USER)
                .enabled(true)
                .learningLanguages(request.getLearningLanguages() != null 
                    ? request.getLearningLanguages() 
                    : java.util.Collections.emptyList())
                .testResults(java.util.Collections.emptyList())
                .doneTasks(java.util.Collections.emptyList())
                .build();

        User savedUser = userRepository.save(user);
        log.info("User saved with id: {}", savedUser.getId());

        tokenManager.generateAndSetTokens(savedUser, response);

        return AuthResponse.builder()
                .user(UserResponse.fromEntity(savedUser))
                .message("Registration successful")
                .build();
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request, HttpServletResponse response) {
        log.info("Login attempt for email: {}", request.getEmail());

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    log.error("User not found with email: {}", request.getEmail());
                    return new RuntimeException("User not found");
                });

        tokenManager.generateAndSetTokens(user, response);

        log.info("User {} logged in successfully", user.getEmail());

        return AuthResponse.builder()
                .user(UserResponse.fromEntity(user))
                .message("Login successful")
                .build();
    }

    public AuthResponse refreshTokens(String refreshToken, HttpServletResponse response) {
        log.debug("Refreshing tokens");
        tokenManager.refreshTokens(refreshToken, response);
        return AuthResponse.builder()
                .message("Tokens refreshed successfully")
                .build();
    }

    public AuthResponse logout(HttpServletResponse response) {
        tokenManager.revokeTokens(response);
        return AuthResponse.builder()
                .message("Logout successful")
                .build();
    }
}