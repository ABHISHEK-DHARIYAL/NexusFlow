package com.nexusflow.service;

import com.nexusflow.dto.*;
import com.nexusflow.pool.NexusThreadPool;
import com.nexusflow.task.NexusTask;
import com.nexusflow.task.TaskPriority;
import com.nexusflow.task.TaskStatus;
import com.nexusflow.task.TaskType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class TaskExecutionService {
    private static final Logger logger = LoggerFactory.getLogger(TaskExecutionService.class);

    private final NexusThreadPool pool;
    private final ConcurrentHashMap<String, TaskExecutionRecord> taskStore = new ConcurrentHashMap<>();

    public TaskExecutionService(NexusThreadPool pool) {
        this.pool = pool;
    }

    public TaskSubmitResponse submitTask(TaskSubmitRequest request) {
        if (request.getTaskId() == null || request.getTaskId().isBlank()) {
            throw new IllegalArgumentException("Task ID is required.");
        }

        // Idempotency check: prevent duplicate submission/execution
        TaskExecutionRecord existing = taskStore.get(request.getTaskId());
        if (existing != null) {
            logger.info("Idempotent check: Task {} already exists with status {}", request.getTaskId(), existing.status);
            return new TaskSubmitResponse(existing.taskId, existing.status.name());
        }

        TaskType taskType = request.getTaskType() != null ? request.getTaskType() : TaskType.CUSTOM;
        TaskPriority priority = request.getPriority() != null ? request.getPriority() : TaskPriority.MEDIUM;
        int maxRetries = request.getMaxRetries() != null ? request.getMaxRetries() : 3;

        boolean isScheduled = false;
        long delayMs = 0;
        if (request.getScheduledAt() != null && !request.getScheduledAt().isBlank()) {
            try {
                Instant targetTime = Instant.parse(request.getScheduledAt());
                long nowMs = System.currentTimeMillis();
                long targetMs = targetTime.toEpochMilli();
                if (targetMs > nowMs) {
                    isScheduled = true;
                    delayMs = targetMs - nowMs;
                }
            } catch (DateTimeParseException e) {
                logger.warn("Invalid scheduledAt format for task {}: {}", request.getTaskId(), request.getScheduledAt());
            }
        }

        TaskStatus initialStatus = isScheduled ? TaskStatus.SCHEDULED : TaskStatus.QUEUED;

        TaskExecutionRecord record = new TaskExecutionRecord(
            request.getTaskId(),
            request.getRepositoryId(),
            request.getUserId(),
            taskType,
            priority,
            initialStatus
        );
        taskStore.put(request.getTaskId(), record);

        NexusTask<Object> nexusTask = new NexusTask<>(
            request.getTaskId(),
            request.getRepositoryId() != null ? request.getRepositoryId() : "repo-default",
            request.getUserId() != null ? request.getUserId() : "user-default",
            taskType,
            priority,
            maxRetries,
            t -> executeTaskPayload(request, record)
        );

        if (isScheduled) {
            logger.info("Scheduling task {} in {} ms", request.getTaskId(), delayMs);
            pool.schedule(nexusTask, delayMs);
        } else {
            logger.info("Submitting task {} to thread pool", request.getTaskId());
            pool.submit(nexusTask);
        }

        return new TaskSubmitResponse(record.taskId, record.status.name());
    }

    private Object executeTaskPayload(TaskSubmitRequest request, TaskExecutionRecord record) throws Exception {
        record.status = TaskStatus.RUNNING;
        record.startedAt = Instant.now().toString();
        long startTime = System.currentTimeMillis();

        try {
            logger.info("Executing task {} ({})", record.taskId, record.taskType);
            
            // Execute simulated processing based on payload and taskType
            Map<String, Object> resultData = new HashMap<>();
            resultData.put("processedBy", "JavaWorkerEngine");
            resultData.put("taskId", record.taskId);
            resultData.put("taskType", record.taskType.name());
            resultData.put("timestamp", Instant.now().toString());

            if (request.getPayload() != null) {
                resultData.putAll(request.getPayload());
            }

            // Simulate realistic work execution
            Thread.sleep(50);

            long executionTime = System.currentTimeMillis() - startTime;
            record.status = TaskStatus.COMPLETED;
            record.completedAt = Instant.now().toString();
            record.executionTimeMs = executionTime;
            record.result = resultData;

            return resultData;
        } catch (Exception e) {
            long executionTime = System.currentTimeMillis() - startTime;
            record.retryCount++;
            
            if (record.retryCount >= (request.getMaxRetries() != null ? request.getMaxRetries() : 3)) {
                record.status = TaskStatus.FAILED;
                record.completedAt = Instant.now().toString();
                record.executionTimeMs = executionTime;
                
                Map<String, String> errMap = new HashMap<>();
                errMap.put("code", "TASK_EXECUTION_FAILED");
                errMap.put("message", e.getMessage() != null ? e.getMessage() : "Unknown execution error");
                record.error = errMap;
            } else {
                record.status = TaskStatus.RETRYING;
            }
            throw e;
        }
    }

    public TaskStatusResponse getTaskStatus(String taskId) {
        TaskExecutionRecord record = taskStore.get(taskId);
        if (record == null) {
            return null;
        }

        return new TaskStatusResponse(
            record.taskId,
            record.status.name(),
            record.retryCount,
            record.startedAt,
            record.completedAt,
            record.executionTimeMs,
            record.result,
            record.error
        );
    }

    public TaskCancelResponse cancelTask(String taskId) {
        TaskExecutionRecord record = taskStore.get(taskId);
        if (record == null) {
            return null;
        }

        if (record.status == TaskStatus.COMPLETED || record.status == TaskStatus.FAILED) {
            return new TaskCancelResponse(record.taskId, record.status.name(), "Task is already in terminal state.");
        }

        boolean cancelled = pool.cancel(taskId);
        if (cancelled || record.status == TaskStatus.QUEUED || record.status == TaskStatus.SCHEDULED) {
            record.status = TaskStatus.CANCELLED;
            record.completedAt = Instant.now().toString();
            return new TaskCancelResponse(record.taskId, "CANCELLED", "Task successfully cancelled.");
        } else {
            return new TaskCancelResponse(record.taskId, record.status.name(), "Task cancellation request sent.");
        }
    }

    public ConcurrentHashMap<String, TaskExecutionRecord> getTaskStore() {
        return taskStore;
    }

    public static class TaskExecutionRecord {
        public final String taskId;
        public final String repositoryId;
        public final String userId;
        public final TaskType taskType;
        public final TaskPriority priority;
        public volatile TaskStatus status;
        public volatile int retryCount = 0;
        public volatile String startedAt;
        public volatile String completedAt;
        public volatile Long executionTimeMs;
        public volatile Object result;
        public volatile Map<String, String> error;

        public TaskExecutionRecord(String taskId, String repositoryId, String userId,
                                   TaskType taskType, TaskPriority priority, TaskStatus status) {
            this.taskId = taskId;
            this.repositoryId = repositoryId;
            this.userId = userId;
            this.taskType = taskType;
            this.priority = priority;
            this.status = status;
        }
    }
}
