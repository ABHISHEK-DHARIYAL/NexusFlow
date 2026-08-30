package com.nexusflow.dto;

import java.util.Map;

public class TaskStatusResponse {
    private String taskId;
    private String status;
    private int retryCount;
    private String startedAt;
    private String completedAt;
    private Long executionTimeMs;
    private Object result;
    private Map<String, String> error;

    public TaskStatusResponse() {}

    public TaskStatusResponse(String taskId, String status, int retryCount, String startedAt,
                              String completedAt, Long executionTimeMs, Object result, Map<String, String> error) {
        this.taskId = taskId;
        this.status = status;
        this.retryCount = retryCount;
        this.startedAt = startedAt;
        this.completedAt = completedAt;
        this.executionTimeMs = executionTimeMs;
        this.result = result;
        this.error = error;
    }

    public String getTaskId() { return taskId; }
    public void setTaskId(String taskId) { this.taskId = taskId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public int getRetryCount() { return retryCount; }
    public void setRetryCount(int retryCount) { this.retryCount = retryCount; }

    public String getStartedAt() { return startedAt; }
    public void setStartedAt(String startedAt) { this.startedAt = startedAt; }

    public String getCompletedAt() { return completedAt; }
    public void setCompletedAt(String completedAt) { this.completedAt = completedAt; }

    public Long getExecutionTimeMs() { return executionTimeMs; }
    public void setExecutionTimeMs(Long executionTimeMs) { this.executionTimeMs = executionTimeMs; }

    public Object getResult() { return result; }
    public void setResult(Object result) { this.result = result; }

    public Map<String, String> getError() { return error; }
    public void setError(Map<String, String> error) { this.error = error; }
}
