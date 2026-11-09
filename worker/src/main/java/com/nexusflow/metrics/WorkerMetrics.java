package com.nexusflow.metrics;

import com.nexusflow.worker.WorkerStatus;

import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;

public class WorkerMetrics {
    private final String workerId;
    private final AtomicReference<WorkerStatus> status = new AtomicReference<>(WorkerStatus.IDLE);
    private final AtomicReference<String> currentTaskId = new AtomicReference<>(null);

    private final AtomicLong tasksCompleted = new AtomicLong(0);
    private final AtomicLong tasksFailed = new AtomicLong(0);
    private final AtomicLong tasksCancelled = new AtomicLong(0);

    private final AtomicLong activeTimeMs = new AtomicLong(0);
    private final AtomicLong idleTimeMs = new AtomicLong(0);
    private final AtomicLong lastActivityTimestamp = new AtomicLong(System.currentTimeMillis());
    private final AtomicLong totalExecutionTimeMs = new AtomicLong(0);

    public WorkerMetrics(String workerId) {
        this.workerId = workerId;
    }

    public String getWorkerId() { return workerId; }
    public WorkerStatus getStatus() { return status.get(); }
    public void setStatus(WorkerStatus newStatus) {
        this.status.set(newStatus);
        this.lastActivityTimestamp.set(System.currentTimeMillis());
    }

    public String getCurrentTaskId() { return currentTaskId.get(); }
    public void setCurrentTaskId(String taskId) { this.currentTaskId.set(taskId); }

    public long getTasksCompleted() { return tasksCompleted.get(); }
    public void incrementTasksCompleted() { tasksCompleted.incrementAndGet(); }

    public long getTasksFailed() { return tasksFailed.get(); }
    public void incrementTasksFailed() { tasksFailed.incrementAndGet(); }

    public long getTasksCancelled() { return tasksCancelled.get(); }
    public void incrementTasksCancelled() { tasksCancelled.incrementAndGet(); }

    public long getActiveTimeMs() { return activeTimeMs.get(); }
    public void addActiveTime(long durationMs) {
        activeTimeMs.addAndGet(durationMs);
        totalExecutionTimeMs.addAndGet(durationMs);
    }

    public long getIdleTimeMs() { return idleTimeMs.get(); }
    public void addIdleTime(long durationMs) { idleTimeMs.addAndGet(durationMs); }

    public long getLastActivityTimestamp() { return lastActivityTimestamp.get(); }
    public void touchLastActivity() { lastActivityTimestamp.set(System.currentTimeMillis()); }

    public long getTotalExecutionTimeMs() { return totalExecutionTimeMs.get(); }

    @Override
    public String toString() {
        return "WorkerMetrics{" +
                "id='" + workerId + '\'' +
                ", status=" + status.get() +
                ", currentTask=" + currentTaskId.get() +
                ", completed=" + tasksCompleted.get() +
                ", failed=" + tasksFailed.get() +
                ", cancelled=" + tasksCancelled.get() +
                ", activeMs=" + activeTimeMs.get() +
                '}';
    }
}
