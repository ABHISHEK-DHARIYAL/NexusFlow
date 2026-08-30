package com.nexusflow.metrics;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.LongAccumulator;

public class NexusMetrics {
    private final AtomicLong totalTasksSubmitted = new AtomicLong(0);
    private final AtomicInteger queuedTasks = new AtomicInteger(0);
    private final AtomicInteger runningTasks = new AtomicInteger(0);

    private final AtomicLong completedTasks = new AtomicLong(0);
    private final AtomicLong failedTasks = new AtomicLong(0);
    private final AtomicLong cancelledTasks = new AtomicLong(0);
    private final AtomicLong retriedTasks = new AtomicLong(0);

    private final AtomicLong totalExecutionTimeMs = new AtomicLong(0);
    private final LongAccumulator maxExecutionTimeMs = new LongAccumulator(Long::max, 0L);
    private final LongAccumulator minExecutionTimeMs = new LongAccumulator(Long::min, Long.MAX_VALUE);

    private final AtomicInteger workerCount = new AtomicInteger(0);
    private final AtomicInteger activeWorkers = new AtomicInteger(0);
    private final AtomicInteger idleWorkers = new AtomicInteger(0);

    private final Map<String, WorkerMetrics> perWorkerMetrics = new ConcurrentHashMap<>();
    private final long engineStartTimeMs = System.currentTimeMillis();

    // Task metric counters
    public void recordTaskSubmitted() { totalTasksSubmitted.incrementAndGet(); }

    public void recordTaskQueued() { queuedTasks.incrementAndGet(); }
    public void recordTaskDequeued() { queuedTasks.decrementAndGet(); }

    public void recordTaskStarted() { runningTasks.incrementAndGet(); }

    public void recordTaskCompleted(long executionTimeMs) {
        runningTasks.decrementAndGet();
        completedTasks.incrementAndGet();
        totalExecutionTimeMs.addAndGet(executionTimeMs);
        maxExecutionTimeMs.accumulate(executionTimeMs);
        minExecutionTimeMs.accumulate(executionTimeMs);
    }

    public void recordTaskFailed() {
        runningTasks.decrementAndGet();
        failedTasks.incrementAndGet();
    }

    public void recordTaskCancelled() {
        cancelledTasks.incrementAndGet();
    }

    public void recordTaskRetried() {
        retriedTasks.incrementAndGet();
    }

    // Worker metric counters
    public void registerWorker(String workerId, WorkerMetrics metrics) {
        perWorkerMetrics.put(workerId, metrics);
        workerCount.incrementAndGet();
        idleWorkers.incrementAndGet();
    }

    public void unregisterWorker(String workerId) {
        if (perWorkerMetrics.remove(workerId) != null) {
            workerCount.decrementAndGet();
        }
    }

    public void updateWorkerState(String workerId, boolean isActive) {
        if (isActive) {
            activeWorkers.incrementAndGet();
            idleWorkers.decrementAndGet();
        } else {
            activeWorkers.decrementAndGet();
            idleWorkers.incrementAndGet();
        }
    }

    public WorkerMetrics getWorkerMetrics(String workerId) {
        return perWorkerMetrics.get(workerId);
    }

    public Map<String, WorkerMetrics> getAllWorkerMetrics() {
        return Map.copyOf(perWorkerMetrics);
    }

    // Getters & Calculations
    public long getTotalTasksSubmitted() { return totalTasksSubmitted.get(); }
    public int getQueuedTasks() { return Math.max(0, queuedTasks.get()); }
    public int getRunningTasks() { return Math.max(0, runningTasks.get()); }
    public long getCompletedTasks() { return completedTasks.get(); }
    public long getFailedTasks() { return failedTasks.get(); }
    public long getCancelledTasks() { return cancelledTasks.get(); }
    public long getRetriedTasks() { return retriedTasks.get(); }

    public double getAverageExecutionTimeMs() {
        long completed = completedTasks.get();
        return completed == 0 ? 0.0 : (double) totalExecutionTimeMs.get() / completed;
    }

    public long getMaxExecutionTimeMs() { return maxExecutionTimeMs.get(); }
    public long getMinExecutionTimeMs() {
        long val = minExecutionTimeMs.get();
        return val == Long.MAX_VALUE ? 0L : val;
    }

    public double getThroughputPerSecond() {
        double uptimeSec = (double) (System.currentTimeMillis() - engineStartTimeMs) / 1000.0;
        return uptimeSec <= 0.0 ? 0.0 : completedTasks.get() / uptimeSec;
    }

    // Worker scale-down lifecycle decisions intentionally do NOT live here.
    // NexusThreadPool owns the real worker registry and is the only
    // component that can make that check-and-remove atomic; see
    // NexusThreadPool.tryScaleDownWorker for the authoritative
    // implementation and the race condition this replaced.

    public int getWorkerCount() { return workerCount.get(); }
    public int getActiveWorkers() { return Math.max(0, activeWorkers.get()); }
    public int getIdleWorkers() { return Math.max(0, idleWorkers.get()); }

    public double getWorkerUtilizationPercentage() {
        int total = workerCount.get();
        return total == 0 ? 0.0 : ((double) activeWorkers.get() / total) * 100.0;
    }

    public String generateReport() {
        return String.format(
            "--- NexusFlow Concurrency Engine Metrics ---\n" +
            "Total Submitted: %d | Queued: %d | Running: %d\n" +
            "Completed: %d | Failed: %d | Cancelled: %d | Retried: %d\n" +
            "Avg Latency: %.2f ms | Max Latency: %d ms | Min Latency: %d ms\n" +
            "Throughput: %.2f tasks/sec | Worker Count: %d (Active: %d, Idle: %d)\n" +
            "Worker Utilization: %.2f%%",
            getTotalTasksSubmitted(), getQueuedTasks(), getRunningTasks(),
            getCompletedTasks(), getFailedTasks(), getCancelledTasks(), getRetriedTasks(),
            getAverageExecutionTimeMs(), getMaxExecutionTimeMs(), getMinExecutionTimeMs(),
            getThroughputPerSecond(), getWorkerCount(), getActiveWorkers(), getIdleWorkers(),
            getWorkerUtilizationPercentage()
        );
    }
}
