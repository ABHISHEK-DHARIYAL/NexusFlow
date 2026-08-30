package com.nexusflow.dto;

public class HealthResponse {
    private String status;
    private String service;
    private int workerCount;
    private int activeWorkers;

    public HealthResponse() {}

    public HealthResponse(String status, String service, int workerCount, int activeWorkers) {
        this.status = status;
        this.service = service;
        this.workerCount = workerCount;
        this.activeWorkers = activeWorkers;
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getService() { return service; }
    public void setService(String service) { this.service = service; }

    public int getWorkerCount() { return workerCount; }
    public void setWorkerCount(int workerCount) { this.workerCount = workerCount; }

    public int getActiveWorkers() { return activeWorkers; }
    public void setActiveWorkers(int activeWorkers) { this.activeWorkers = activeWorkers; }
}
