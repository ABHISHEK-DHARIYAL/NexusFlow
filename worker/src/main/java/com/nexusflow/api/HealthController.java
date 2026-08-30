package com.nexusflow.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexusflow.dto.ErrorResponse;
import com.nexusflow.dto.HealthResponse;
import com.nexusflow.security.InternalAuthFilter;
import com.nexusflow.service.WorkerService;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.io.OutputStream;
import java.util.UUID;

public class HealthController implements HttpHandler {
    private final WorkerService workerService;
    private final InternalAuthFilter authFilter;
    private final ObjectMapper objectMapper;

    public HealthController(WorkerService workerService, InternalAuthFilter authFilter, ObjectMapper objectMapper) {
        this.workerService = workerService;
        this.authFilter = authFilter;
        this.objectMapper = objectMapper;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String correlationId = exchange.getRequestHeaders().getFirst("X-Correlation-Id");
        if (correlationId == null || correlationId.isBlank()) {
            correlationId = UUID.randomUUID().toString();
        }
        exchange.getResponseHeaders().set("X-Correlation-Id", correlationId);
        exchange.getResponseHeaders().set("Content-Type", "application/json");

        if (!authFilter.authenticate(exchange)) {
            ErrorResponse err = new ErrorResponse("WORKER_UNAUTHORIZED", "Unauthorized health check access.", correlationId);
            byte[] errJson = objectMapper.writeValueAsBytes(err);
            exchange.sendResponseHeaders(401, errJson.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(errJson);
            }
            return;
        }

        HealthResponse health = workerService.getHealth();
        byte[] json = objectMapper.writeValueAsBytes(health);
        exchange.sendResponseHeaders(200, json.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(json);
        }
    }
}
