package com.nexusflow.dto;

public class TaskCancelResponse {
    private String taskId;
    private String status;
    private String message;

    public TaskCancelResponse() {}

    public TaskCancelResponse(String taskId, String status, String message) {
        this.taskId = taskId;
        this.status = status;
        this.message = message;
    }

    public String getTaskId() { return taskId; }
    public void setTaskId(String taskId) { this.taskId = taskId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
