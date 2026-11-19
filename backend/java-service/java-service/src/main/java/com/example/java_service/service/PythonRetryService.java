
package com.example.java_service.service;

import java.time.Duration;
import java.util.concurrent.TimeoutException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;

import com.example.java_service.dto.external.PythonRetryRequest;
import com.example.java_service.dto.external.PythonRetryResponse;

import io.github.resilience4j.circuitbreaker.CallNotPermittedException;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
@Slf4j
public class PythonRetryService {

    private final WebClient webClient;
    private final CircuitBreaker pythonRetryCircuitBreaker;

    @Value("${python.service.url:http://voxi-python:8000}")
    private String pythonServiceUrl;

    @Value("${python.service.timeout:120s}")
    private Duration timeout;

    public PythonRetryResponse generateRetryTasks(PythonRetryRequest request) {
        log.info("Sending retry request to Python ML service");

        try {
            Mono<PythonRetryResponse> responseMono = webClient.post()
                    .uri(pythonServiceUrl + "/generate_retry_tasks")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(PythonRetryResponse.class)
                    .timeout(timeout)
                    .onErrorMap(TimeoutException.class,
                            error -> new PythonServiceTimeoutException(error));

            PythonRetryResponse response =
                    pythonRetryCircuitBreaker.executeSupplier(responseMono::block);

            if (response == null || response.getTasks() == null
                    || response.getTasks().isEmpty()) {
                throw new IllegalStateException(
                        "Python service returned empty retry tasks");
            }

            log.info("Successfully received retry tasks from Python");
            return response;

        } catch (CallNotPermittedException e) {
            log.warn("Python retry circuit breaker is OPEN");

            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Сервис генерации временно недоступен. Попробуйте позже."
            );

        } catch (PythonServiceTimeoutException e) {
            log.error("Python retry request timed out");

            throw new ResponseStatusException(
                    HttpStatus.GATEWAY_TIMEOUT,
                    "Сервис генерации не ответил вовремя. Попробуйте позже."
            );

        } catch (Exception e) {
            log.error("Failed to get retry tasks from Python service", e);

            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Не удалось сгенерировать повторные задания. Попробуйте ещё раз."
            );
        }
    }

    private static class PythonServiceTimeoutException extends RuntimeException {
        private PythonServiceTimeoutException(Throwable cause) {
            super(cause);
        }
    }
}
