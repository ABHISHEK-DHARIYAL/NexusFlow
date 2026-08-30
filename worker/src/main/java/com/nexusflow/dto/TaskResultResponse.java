package com.nexusflow.dto;

import java.util.Map;

public class TaskResultResponse {
    private String taskId;
    private String status;
    private Object result;
    private Map<String, String> error;
    private Long executionTimeMs;

    public TaskResultResponse() {}

    public TaskResultResponse(String taskId, String status, Object result, Map<String, String> error, Long executionTimeMs) {
        this.taskId = taskId;
        this.status = status;
        this.result = result;
        this.error = error;
        this.executionTimeMs = executionTimeMs;
    }

    public String getTaskId() { return taskId; }
    public void setTaskId(String taskId) { this.taskId = taskId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Object getResult() { return result; }
    public void setResult(Object result) { this.result = result; }

    public Map<String, String> getError() { return error; }
    public void setError(Map<String, String> error) { this.error = error; }

    public Long getExecutionTimeMs() { return executionTimeMs; }
    public void setExecutionTimeMs(Long executionTimeMs) { this.executionTimeMs = executionTimeMs; }
}
