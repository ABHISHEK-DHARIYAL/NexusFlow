package com.nexusflow.task;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.locks.ReentrantLock;

public class NexusTask<T> {
    private final String taskId;
    private final String repositoryId;
    private final String userId;
    private final TaskType type;
    private final TaskPriority priority;
    private final int maxRetries;
    private final TaskAction<T> action;
    private final Map<String, Object> metadata = new ConcurrentHashMap<>();

    private final ReentrantLock stateLock = new ReentrantLock();
    private volatile TaskStatus status;

    private final Instant createdTime;
    private volatile Instant scheduledTime;
    private volatile Instant startedTime;
    private volatile Instant completedTime;

    private final AtomicInteger retryCount = new AtomicInteger(0);
    private volatile Throwable lastError;
    private volatile boolean cancelRequested = false;
    private volatile T executionResult;

    private volatile long enqueueTime;
    private volatile long enqueueSequence;

    public NexusTask(
        String taskId,
        String repositoryId,
        String userId,
        TaskType type,
        TaskPriority priority,
        int maxRetries,
        TaskAction<T> action
    ) {
        this.taskId = taskId != null ? taskId : UUID.randomUUID().toString();
        this.repositoryId = repositoryId != null ? repositoryId : "default-repo";
        this.userId = userId != null ? userId : "system";
        this.type = type != null ? type : TaskType.CUSTOM;
        this.priority = priority != null ? priority : TaskPriority.MEDIUM;
        this.maxRetries = Math.max(0, maxRetries);
        this.action = action;
        this.createdTime = Instant.now();
        this.status = TaskStatus.QUEUED;
    }

    public static <T> NexusTask<T> create(String repositoryId, TaskType type, TaskPriority priority, TaskAction<T> action) {
        return new NexusTask<>(UUID.randomUUID().toString(), repositoryId, "user-1", type, priority, 3, action);
    }

    public boolean transitionStatus(TaskStatus expected, TaskStatus next) {
        stateLock.lock();
        try {
            if (this.status == expected) {
                validateTransition(this.status, next);
                this.status = next;
                updateTimestampsOnTransition(next);
                return true;
            }
            return false;
        } finally {
            stateLock.unlock();
        }
    }

    public void setStatus(TaskStatus next) {
        stateLock.lock();
        try {
            validateTransition(this.status, next);
            this.status = next;
            updateTimestampsOnTransition(next);
        } finally {
            stateLock.unlock();
        }
    }

    private void validateTransition(TaskStatus current, TaskStatus next) {
        if (current == next) return;

        boolean valid = switch (current) {
            case SCHEDULED -> next == TaskStatus.QUEUED || next == TaskStatus.CANCELLED;
            case QUEUED -> next == TaskStatus.RUNNING || next == TaskStatus.CANCELLED || next == TaskStatus.SCHEDULED;
            case RUNNING -> next == TaskStatus.COMPLETED || next == TaskStatus.FAILED || next == TaskStatus.RETRYING || next == TaskStatus.CANCELLED;
            case FAILED -> next == TaskStatus.RETRYING || next == TaskStatus.CANCELLED;
            case RETRYING -> next == TaskStatus.QUEUED || next == TaskStatus.FAILED || next == TaskStatus.CANCELLED;
            case COMPLETED, CANCELLED -> false;
        };

        if (!valid) {
            throw new IllegalStateException("Invalid task status transition from " + current + " to " + next + " for task " + taskId);
        }
    }

    private void updateTimestampsOnTransition(TaskStatus next) {
        Instant now = Instant.now();
        if (next == TaskStatus.RUNNING) {
            this.startedTime = now;
        } else if (next == TaskStatus.COMPLETED || next == TaskStatus.FAILED || next == TaskStatus.CANCELLED) {
            this.completedTime = now;
        }
    }

    public void requestCancellation() {
        this.cancelRequested = true;
        stateLock.lock();
        try {
            if (this.status == TaskStatus.QUEUED || this.status == TaskStatus.SCHEDULED || this.status == TaskStatus.RETRYING) {
                this.status = TaskStatus.CANCELLED;
                this.completedTime = Instant.now();
            }
        } finally {
            stateLock.unlock();
        }
    }

    // Getters and Setters
    public String getTaskId() { return taskId; }
    public String getRepositoryId() { return repositoryId; }
    public String getUserId() { return userId; }
    public TaskType getType() { return type; }
    public TaskPriority getPriority() { return priority; }
    public int getMaxRetries() { return maxRetries; }
    public TaskAction<T> getAction() { return action; }
    public Map<String, Object> getMetadata() { return metadata; }
    public TaskStatus getStatus() { return status; }
    public Instant getCreatedTime() { return createdTime; }
    public Instant getScheduledTime() { return scheduledTime; }
    public void setScheduledTime(Instant scheduledTime) { this.scheduledTime = scheduledTime; }
    public Instant getStartedTime() { return startedTime; }
    public Instant getCompletedTime() { return completedTime; }
    public int getRetryCount() { return retryCount.get(); }
    public int incrementRetryCount() { return retryCount.incrementAndGet(); }
    public Throwable getLastError() { return lastError; }
    public void setLastError(Throwable lastError) { this.lastError = lastError; }
    public boolean isCancelRequested() { return cancelRequested; }
    public T getExecutionResult() { return executionResult; }
    public void setExecutionResult(T executionResult) { this.executionResult = executionResult; }
    public long getEnqueueTime() { return enqueueTime; }
    public void setEnqueueTime(long enqueueTime) { this.enqueueTime = enqueueTime; }
    public long getEnqueueSequence() { return enqueueSequence; }
    public void setEnqueueSequence(long enqueueSequence) { this.enqueueSequence = enqueueSequence; }

    @Override
    public String toString() {
        return "NexusTask{" +
                "id='" + taskId + '\'' +
                ", priority=" + priority +
                ", status=" + status +
                ", retries=" + retryCount + "/" + maxRetries +
                '}';
    }
}
