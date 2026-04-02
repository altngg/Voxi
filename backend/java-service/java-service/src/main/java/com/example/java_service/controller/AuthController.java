package com.example.java_service.controller;

import com.example.java_service.dto.request.LoginRequest;
import com.example.java_service.dto.request.RegisterRequest;
import com.example.java_service.dto.response.AuthResponse;
import com.example.java_service.service.AuthenticationService;
import com.example.java_service.service.CookieService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class AuthController {

    private final AuthenticationService authenticationService;
    private final CookieService cookieService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletResponse response
    ) {
        AuthResponse authResponse = authenticationService.register(request, response);
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response
    ) {
        AuthResponse authResponse = authenticationService.login(request, response);
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/logout")
    public ResponseEntity<AuthResponse> logout(HttpServletResponse response) {
        AuthResponse authResponse = authenticationService.logout(response);
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        String refreshToken = cookieService.getRefreshTokenFromCookie(request);
        AuthResponse authResponse = authenticationService.refresh(response, refreshToken);
        return ResponseEntity.ok(authResponse);
    }
}