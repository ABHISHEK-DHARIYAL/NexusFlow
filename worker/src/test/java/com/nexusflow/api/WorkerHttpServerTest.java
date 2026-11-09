package com.nexusflow.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexusflow.config.ThreadPoolConfig;
import com.nexusflow.dto.*;
import com.nexusflow.task.TaskPriority;
import com.nexusflow.task.TaskType;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

public class WorkerHttpServerTest {
    private static final String SECRET = "test_worker_secret_12345";
    private WorkerHttpServer server;
    private HttpClient client;
    private ObjectMapper objectMapper;
    private String baseUrl;

    @BeforeEach
    void setUp() throws Exception {
        ThreadPoolConfig config = new ThreadPoolConfig(2, 4, 50, 1000, 500, 1500, 3, 50, 500, 2.0);
        server = new WorkerHttpServer("127.0.0.1", 0, SECRET, config);
        server.start();

        client = HttpClient.newHttpClient();
        objectMapper = new ObjectMapper();
        baseUrl = "http://127.0.0.1:" + server.getPort();
    }

    @AfterEach
    void tearDown() {
        if (server != null) {
            server.stop();
        }
    }

    @Test
    @DisplayName("Health Endpoint — Valid Secret")
    void testHealthEndpointValidSecret() throws Exception {
        HttpRequest req = HttpRequest.newBuilder()
            .uri(URI.create(baseUrl + "/internal/health"))
            .header("X-Worker-Secret", SECRET)
            .GET()
            .build();

        HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, res.statusCode());

        HealthResponse health = objectMapper.readValue(res.body(), HealthResponse.class);
        assertEquals("UP", health.getStatus());
        assertEquals("nexusflow-worker", health.getService());
    }

    @Test
    @DisplayName("Health Endpoint — Unauthorized Secret")
    void testHealthEndpointInvalidSecret() throws Exception {
        HttpRequest req = HttpRequest.newBuilder()
            .uri(URI.create(baseUrl + "/internal/health"))
            .header("X-Worker-Secret", "wrong_secret")
            .GET()
            .build();

        HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());
        assertEquals(401, res.statusCode());

        ErrorResponse err = objectMapper.readValue(res.body(), ErrorResponse.class);
        assertEquals("WORKER_UNAUTHORIZED", err.getError().getCode());
    }

    @Test
    @DisplayName("Task Submission, Status Retrieval, and Completion")
    void testTaskSubmissionAndStatus() throws Exception {
        String taskId = UUID.randomUUID().toString();
        Map<String, Object> payload = new HashMap<>();
        payload.put("testKey", "testVal");

        TaskSubmitRequest submitReq = new TaskSubmitRequest(
            taskId, "repo-123", "user-456", TaskType.CUSTOM,
            TaskPriority.HIGH, 3, null, payload
        );

        HttpRequest req = HttpRequest.newBuilder()
            .uri(URI.create(baseUrl + "/internal/tasks"))
            .header("X-Worker-Secret", SECRET)
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(submitReq)))
            .build();

        HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());
        assertEquals(202, res.statusCode());

        TaskSubmitResponse submitRes = objectMapper.readValue(res.body(), TaskSubmitResponse.class);
        assertEquals(taskId, submitRes.getTaskId());

        // Wait brief period for worker execution
        Thread.sleep(150);

        // Fetch task status
        HttpRequest statusReq = HttpRequest.newBuilder()
            .uri(URI.create(baseUrl + "/internal/tasks/" + taskId))
            .header("X-Worker-Secret", SECRET)
            .GET()
            .build();

        HttpResponse<String> statusRes = client.send(statusReq, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, statusRes.statusCode());

        TaskStatusResponse statusObj = objectMapper.readValue(statusRes.body(), TaskStatusResponse.class);
        assertEquals(taskId, statusObj.getTaskId());
        assertEquals("COMPLETED", statusObj.getStatus());
        assertNotNull(statusObj.getResult());
    }

    @Test
    @DisplayName("Idempotency — Duplicate Submission returns existing status")
    void testIdempotentTaskSubmission() throws Exception {
        String taskId = "idempotency-task-001";
        TaskSubmitRequest submitReq = new TaskSubmitRequest(
            taskId, "repo-1", "user-1", TaskType.CUSTOM,
            TaskPriority.MEDIUM, 3, null, Map.of("key", "val")
        );

        String jsonPayload = objectMapper.writeValueAsString(submitReq);

        HttpRequest req1 = HttpRequest.newBuilder()
            .uri(URI.create(baseUrl + "/internal/tasks"))
            .header("X-Worker-Secret", SECRET)
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
            .build();

        HttpResponse<String> res1 = client.send(req1, HttpResponse.BodyHandlers.ofString());
        assertEquals(202, res1.statusCode());

        // Send second time
        HttpRequest req2 = HttpRequest.newBuilder()
            .uri(URI.create(baseUrl + "/internal/tasks"))
            .header("X-Worker-Secret", SECRET)
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
            .build();

        HttpResponse<String> res2 = client.send(req2, HttpResponse.BodyHandlers.ofString());
        assertEquals(202, res2.statusCode());

        TaskSubmitResponse resObj1 = objectMapper.readValue(res1.body(), TaskSubmitResponse.class);
        TaskSubmitResponse resObj2 = objectMapper.readValue(res2.body(), TaskSubmitResponse.class);

        assertEquals(taskId, resObj1.getTaskId());
        assertEquals(taskId, resObj2.getTaskId());
    }

    @Test
    @DisplayName("Task Cancellation Endpoint")
    void testTaskCancellation() throws Exception {
        String taskId = UUID.randomUUID().toString();
        // Submit scheduled task in far future so we can cancel it
        String futureTime = java.time.Instant.now().plusSeconds(300).toString();

        TaskSubmitRequest submitReq = new TaskSubmitRequest(
            taskId, "repo-cancel", "user-cancel", TaskType.CUSTOM,
            TaskPriority.LOW, 3, futureTime, Map.of()
        );

        HttpRequest req = HttpRequest.newBuilder()
            .uri(URI.create(baseUrl + "/internal/tasks"))
            .header("X-Worker-Secret", SECRET)
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(submitReq)))
            .build();

        client.send(req, HttpResponse.BodyHandlers.ofString());

        // Cancel task
        HttpRequest cancelReq = HttpRequest.newBuilder()
            .uri(URI.create(baseUrl + "/internal/tasks/" + taskId + "/cancel"))
            .header("X-Worker-Secret", SECRET)
            .POST(HttpRequest.BodyPublishers.noBody())
            .build();

        HttpResponse<String> cancelRes = client.send(cancelReq, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, cancelRes.statusCode());

        TaskCancelResponse cancelObj = objectMapper.readValue(cancelRes.body(), TaskCancelResponse.class);
        assertEquals(taskId, cancelObj.getTaskId());
        assertEquals("CANCELLED", cancelObj.getStatus());
    }

    @Test
    @DisplayName("Metrics Endpoint")
    void testMetricsEndpoint() throws Exception {
        HttpRequest req = HttpRequest.newBuilder()
            .uri(URI.create(baseUrl + "/internal/metrics"))
            .header("X-Worker-Secret", SECRET)
            .GET()
            .build();

        HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, res.statusCode());

        MetricsResponse metrics = objectMapper.readValue(res.body(), MetricsResponse.class);
        assertNotNull(metrics);
        assertTrue(metrics.getWorkerCount() >= 2);
    }
}
