package com.nexusflow.dto;

public class MetricsResponse {
    private long totalTasks;
    private int queuedTasks;
    private int runningTasks;
    private long completedTasks;
    private long failedTasks;
    private long cancelledTasks;
    private long retriedTasks;
    private int queueDepth;
    private int workerCount;
    private int activeWorkers;
    private int idleWorkers;
    private double throughput;

    public MetricsResponse() {}

    public MetricsResponse(long totalTasks, int queuedTasks, int runningTasks, long completedTasks,
                           long failedTasks, long cancelledTasks, long retriedTasks, int queueDepth,
                           int workerCount, int activeWorkers, int idleWorkers, double throughput) {
        this.totalTasks = totalTasks;
        this.queuedTasks = queuedTasks;
        this.runningTasks = runningTasks;
        this.completedTasks = completedTasks;
        this.failedTasks = failedTasks;
        this.cancelledTasks = cancelledTasks;
        this.retriedTasks = retriedTasks;
        this.queueDepth = queueDepth;
        this.workerCount = workerCount;
        this.activeWorkers = activeWorkers;
        this.idleWorkers = idleWorkers;
        this.throughput = throughput;
    }

    public long getTotalTasks() { return totalTasks; }
    public void setTotalTasks(long totalTasks) { this.totalTasks = totalTasks; }

    public int getQueuedTasks() { return queuedTasks; }
    public void setQueuedTasks(int queuedTasks) { this.queuedTasks = queuedTasks; }

    public int getRunningTasks() { return runningTasks; }
    public void setRunningTasks(int runningTasks) { this.runningTasks = runningTasks; }

    public long getCompletedTasks() { return completedTasks; }
    public void setCompletedTasks(long completedTasks) { this.completedTasks = completedTasks; }

    public long getFailedTasks() { return failedTasks; }
    public void setFailedTasks(long failedTasks) { this.failedTasks = failedTasks; }

    public long getCancelledTasks() { return cancelledTasks; }
    public void setCancelledTasks(long cancelledTasks) { this.cancelledTasks = cancelledTasks; }

    public long getRetriedTasks() { return retriedTasks; }
    public void setRetriedTasks(long retriedTasks) { this.retriedTasks = retriedTasks; }

    public int getQueueDepth() { return queueDepth; }
    public void setQueueDepth(int queueDepth) { this.queueDepth = queueDepth; }

    public int getWorkerCount() { return workerCount; }
    public void setWorkerCount(int workerCount) { this.workerCount = workerCount; }

    public int getActiveWorkers() { return activeWorkers; }
    public void setActiveWorkers(int activeWorkers) { this.activeWorkers = activeWorkers; }

    public int getIdleWorkers() { return idleWorkers; }
    public void setIdleWorkers(int idleWorkers) { this.idleWorkers = idleWorkers; }

    public double getThroughput() { return throughput; }
    public void setThroughput(double throughput) { this.throughput = throughput; }
}
