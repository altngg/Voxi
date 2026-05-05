package com.example.java_service.service;

import com.example.java_service.dto.external.AiTestResultRequest;
import com.example.java_service.dto.external.AiTestResultResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
@Slf4j
public class PythonMlService {

    private final WebClient webClient;

    @Value("${python.service.url:http://voxi-python:8000}")
    private String pythonServiceUrl;

    public AiTestResultResponse generateTestResult(AiTestResultRequest request) {
        log.info("Sending test data to Python ML service for analysis");
        log.info("Request payload: {}", request); 
        
        try {
            return webClient.post()
                    .uri(pythonServiceUrl + "/generate_test_result")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(AiTestResultResponse.class)
                    .block();
        } catch (Exception e) {
            log.error("Failed to get ML analysis from Python service", e);
            throw new RuntimeException("ML service unavailable", e);
        }
    }
}