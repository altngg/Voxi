package com.example.java_service.service;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.example.java_service.dto.external.PythonRetryRequest;
import com.example.java_service.dto.external.PythonRetryResponse;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class PythonRetryService {

    private final WebClient webClient;

    @Value("${python.service.url:http://voxi-python:8000}")
    private String pythonServiceUrl;

    public PythonRetryResponse generateRetryTasks(PythonRetryRequest request) {
        log.info("Sending retry request to Python ML service");
        
        try {
            return webClient.post()
                    .uri(pythonServiceUrl + "/generate_retry_tasks")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(PythonRetryResponse.class)
                    .timeout(Duration.ofSeconds(600))
                    .block();
        } catch (Exception e) {
            log.error("Failed to get retry tasks from Python service", e);
            PythonRetryResponse fallback = new PythonRetryResponse();
            return fallback;
        }
    }
}