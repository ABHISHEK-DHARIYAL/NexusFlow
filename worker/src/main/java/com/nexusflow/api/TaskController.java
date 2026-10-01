package com.nexusflow.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexusflow.dto.*;
import com.nexusflow.security.InternalAuthFilter;
import com.nexusflow.service.TaskExecutionService;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

public class TaskController implements HttpHandler {
    private static final Logger logger = LoggerFactory.getLogger(TaskController.class);

    private final TaskExecutionService taskExecutionService;
    private final InternalAuthFilter authFilter;
    private final ObjectMapper objectMapper;

    public TaskController(TaskExecutionService taskExecutionService, InternalAuthFilter authFilter, ObjectMapper objectMapper) {
        this.taskExecutionService = taskExecutionService;
        this.authFilter = authFilter;
        this.objectMapper = objectMapper;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String correlationId = getOrCreateCorrelationId(exchange);
        exchange.getResponseHeaders().set("X-Correlation-Id", correlationId);
        exchange.getResponseHeaders().set("Content-Type", "application/json");

        if (!authFilter.authenticate(exchange)) {
            sendError(exchange, 401, "WORKER_UNAUTHORIZED", "Unauthorized access to internal worker endpoint.", correlationId);
            return;
        }

        String path = exchange.getRequestURI().getPath();
        String method = exchange.getRequestMethod();

        try {
            if ("POST".equalsIgnoreCase(method) && path.equalsIgnoreCase("/internal/tasks")) {
                handleTaskSubmission(exchange, correlationId);
            } else if ("GET".equalsIgnoreCase(method) && path.startsWith("/internal/tasks/")) {
                handleGetTaskStatus(exchange, path, correlationId);
            } else if ("POST".equalsIgnoreCase(method) && path.matches("^/internal/tasks/[^/]+/cancel$")) {
                handleCancelTask(exchange, path, correlationId);
            } else {
                sendError(exchange, 404, "TASK_NOT_FOUND", "Endpoint not found: " + path, correlationId);
            }
        } catch (Exception e) {
            logger.error("Error processing task request [{}] {}: {}", correlationId, path, e.getMessage(), e);
            sendError(exchange, 500, "INTERNAL_ERROR", "Internal worker execution error: " + e.getMessage(), correlationId);
        }
    }

    private void handleTaskSubmission(HttpExchange exchange, String correlationId) throws IOException {
        InputStream is = exchange.getRequestBody();
        TaskSubmitRequest request;
        try {
            request = objectMapper.readValue(is, TaskSubmitRequest.class);
        } catch (Exception e) {
            sendError(exchange, 400, "WORKER_BAD_REQUEST", "Invalid JSON payload: " + e.getMessage(), correlationId);
            return;
        }

        if (request == null || request.getTaskId() == null || request.getTaskId().isBlank()) {
            sendError(exchange, 400, "INVALID_TASK", "taskId is required in submission request.", correlationId);
            return;
        }

        logger.info("Received task submission request [{}] taskId={}", correlationId, request.getTaskId());
        TaskSubmitResponse response = taskExecutionService.submitTask(request);

        byte[] json = objectMapper.writeValueAsBytes(response);
        exchange.sendResponseHeaders(202, json.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(json);
        }
    }

    private void handleGetTaskStatus(HttpExchange exchange, String path, String correlationId) throws IOException {
        String taskId = path.substring("/internal/tasks/".length());
        if (taskId.contains("/")) {
            taskId = taskId.substring(0, taskId.indexOf("/"));
        }

        TaskStatusResponse statusResponse = taskExecutionService.getTaskStatus(taskId);
        if (statusResponse == null) {
            sendError(exchange, 404, "TASK_NOT_FOUND", "No task found with ID: " + taskId, correlationId);
            return;
        }

        byte[] json = objectMapper.writeValueAsBytes(statusResponse);
        exchange.sendResponseHeaders(200, json.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(json);
        }
    }

    private void handleCancelTask(HttpExchange exchange, String path, String correlationId) throws IOException {
        String taskId = path.substring("/internal/tasks/".length(), path.length() - "/cancel".length());
        TaskCancelResponse response = taskExecutionService.cancelTask(taskId);
        if (response == null) {
            sendError(exchange, 404, "TASK_NOT_FOUND", "No task found with ID: " + taskId, correlationId);
            return;
        }

        byte[] json = objectMapper.writeValueAsBytes(response);
        exchange.sendResponseHeaders(200, json.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(json);
        }
    }

    private String getOrCreateCorrelationId(HttpExchange exchange) {
        String cid = exchange.getRequestHeaders().getFirst("X-Correlation-Id");
        if (cid == null || cid.isBlank()) {
            return UUID.randomUUID().toString();
        }
        return cid;
    }

    private void sendError(HttpExchange exchange, int statusCode, String code, String message, String correlationId) throws IOException {
        ErrorResponse err = new ErrorResponse(code, message, correlationId);
        byte[] json = objectMapper.writeValueAsBytes(err);
        exchange.sendResponseHeaders(statusCode, json.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(json);
        }
    }
}
