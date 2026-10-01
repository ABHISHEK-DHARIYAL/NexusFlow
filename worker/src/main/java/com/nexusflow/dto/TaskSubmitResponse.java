package com.nexusflow.dto;

public class TaskSubmitResponse {
    private String taskId;
    private String status;

    public TaskSubmitResponse() {}

    public TaskSubmitResponse(String taskId, String status) {
        this.taskId = taskId;
        this.status = status;
    }

    public String getTaskId() { return taskId; }
    public void setTaskId(String taskId) { this.taskId = taskId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
