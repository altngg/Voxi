
package com.example.java_service.service;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;

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
            PythonRetryResponse response = webClient.post()
                    .uri(pythonServiceUrl + "/generate_retry_tasks")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(PythonRetryResponse.class)
                    .timeout(Duration.ofSeconds(600))
                    .block();

            if (response == null || response.getTasks() == null
                    || response.getTasks().isEmpty()) {
                throw new IllegalStateException("Python service returned empty retry tasks");
            }

            return response;

        } catch (Exception e) {
            log.error("Failed to get retry tasks from Python service", e);

            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Не удалось сгенерировать повторные задания. Попробуйте ещё раз."
            );
        }
    }

}
