package com.example.java_service.config;

import java.io.IOException;

import com.example.java_service.service.CookieService;
import com.example.java_service.service.JwtService;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.security.SignatureException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;


@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final CookieService cookieService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String path = request.getServletPath();
        if (path.startsWith("/api/auth")|| path.equals("/api/health")) {
            filterChain.doFilter(request, response);
            return;
        }

        String jwt = cookieService.getAccessTokenFromCookie(request);

        if (jwt == null) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String userEmail = jwtService.extractUsername(jwt);
            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);

                if (jwtService.isTokenValid(jwt, userDetails)) {

                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null, 
                            userDetails.getAuthorities()  
                    );
                    
                    authToken.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request)
                    );
                    
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    log.debug("User {} authenticated successfully", userEmail);
                } else {
                    log.warn("JWT token is invalid for user: {}", userEmail);
                    clearInvalidCookies(response);
                }
            }

        } catch (ExpiredJwtException e) {
            log.warn("JWT token expired: {}", e.getMessage());
            clearInvalidCookies(response);
            
        } catch (SignatureException e) {
            log.error("JWT signature validation failed: {}", e.getMessage());
            clearInvalidCookies(response);
            
        } catch (MalformedJwtException e) {
            log.error("JWT token is malformed: {}", e.getMessage());
            clearInvalidCookies(response);
            
        } catch (IllegalArgumentException e) {
            log.warn("JWT token is empty or null: {}", e.getMessage());
            clearInvalidCookies(response);
            
        } catch (Exception e) {
            log.error("Unexpected error during JWT authentication: {}", e.getMessage(), e);
            clearInvalidCookies(response);
        }

        filterChain.doFilter(request, response);
    }

   
    private void clearInvalidCookies(HttpServletResponse response) {
        log.debug("Clearing invalid JWT cookies");
        cookieService.deleteAccessTokenCookie(response);
        cookieService.deleteRefreshTokenCookie(response);
    }

}