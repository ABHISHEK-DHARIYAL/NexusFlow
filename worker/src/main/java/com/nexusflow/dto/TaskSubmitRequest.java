package com.nexusflow.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.nexusflow.task.TaskPriority;
import com.nexusflow.task.TaskType;

import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public class TaskSubmitRequest {
    private String taskId;
    private String repositoryId;
    private String userId;
    private TaskType taskType;
    private TaskPriority priority;
    private Integer maxRetries;
    private String scheduledAt; // ISO-8601 timestamp string or null
    private Map<String, Object> payload;

    public TaskSubmitRequest() {}

    public TaskSubmitRequest(String taskId, String repositoryId, String userId, TaskType taskType,
                             TaskPriority priority, Integer maxRetries, String scheduledAt, Map<String, Object> payload) {
        this.taskId = taskId;
        this.repositoryId = repositoryId;
        this.userId = userId;
        this.taskType = taskType;
        this.priority = priority;
        this.maxRetries = maxRetries;
        this.scheduledAt = scheduledAt;
        this.payload = payload;
    }

    public String getTaskId() { return taskId; }
    public void setTaskId(String taskId) { this.taskId = taskId; }

    public String getRepositoryId() { return repositoryId; }
    public void setRepositoryId(String repositoryId) { this.repositoryId = repositoryId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public TaskType getTaskType() { return taskType; }
    public void setTaskType(TaskType taskType) { this.taskType = taskType; }

    public TaskPriority getPriority() { return priority; }
    public void setPriority(TaskPriority priority) { this.priority = priority; }

    public Integer getMaxRetries() { return maxRetries; }
    public void setMaxRetries(Integer maxRetries) { this.maxRetries = maxRetries; }

    public String getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(String scheduledAt) { this.scheduledAt = scheduledAt; }

    public Map<String, Object> getPayload() { return payload; }
    public void setPayload(Map<String, Object> payload) { this.payload = payload; }
}
