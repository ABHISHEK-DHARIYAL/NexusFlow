package com.nexusflow.service;

import com.nexusflow.dto.HealthResponse;
import com.nexusflow.dto.MetricsResponse;
import com.nexusflow.metrics.NexusMetrics;
import com.nexusflow.pool.NexusThreadPool;

public class WorkerService {
    private final NexusThreadPool pool;

    public WorkerService(NexusThreadPool pool) {
        this.pool = pool;
    }

    public HealthResponse getHealth() {
        boolean isAlive = !pool.isShutdown() && !pool.isTerminated();
        String status = isAlive ? "UP" : "DOWN";
        return new HealthResponse(
            status,
            "nexusflow-worker",
            pool.getTotalWorkerCount(),
            pool.getActiveWorkerCount()
        );
    }

    public MetricsResponse getMetrics() {
        NexusMetrics m = pool.getMetrics();
        return new MetricsResponse(
            m.getTotalTasksSubmitted(),
            m.getQueuedTasks(),
            m.getRunningTasks(),
            m.getCompletedTasks(),
            m.getFailedTasks(),
            m.getCancelledTasks(),
            m.getRetriedTasks(),
            pool.getQueueDepth(),
            m.getWorkerCount(),
            m.getActiveWorkers(),
            m.getIdleWorkers(),
            m.getThroughputPerSecond()
        );
    }
}
