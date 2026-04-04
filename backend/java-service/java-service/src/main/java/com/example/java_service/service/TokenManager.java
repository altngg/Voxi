package com.example.java_service.service;

import com.example.java_service.entity.User;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class TokenManager {
    private final JwtService jwtService;
    private final CookieService cookieService;

    public void generateAndSetTokens(User user, HttpServletResponse response) {
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        cookieService.addAccessTokenCookie(response, accessToken);
        cookieService.addRefreshTokenCookie(response, refreshToken);
    }

    public void revokeTokens(HttpServletResponse response) {
        cookieService.deleteAccessTokenCookie(response);
        cookieService.deleteRefreshTokenCookie(response);
    }

    public String generateAccessToken(User user) {
        return jwtService.generateAccessToken(user);
    }

    public String generateRefreshToken(User user) {
        return jwtService.generateRefreshToken(user);
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        return jwtService.isTokenValid(token, userDetails);
    }

     public String extractUsername(String token) {
        return jwtService.extractUsername(token);
    }
}
