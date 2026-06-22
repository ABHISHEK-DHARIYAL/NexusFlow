import java.util.UUID;

public abstract class Task implements Runnable {
    public enum Type {
        SIMPLE, PRIORITY, SCHEDULED, RETRY, CANCELLABLE
    }

    public enum Status {
        QUEUED, RUNNING, COMPLETED, FAILED, CANCELLED
    }

    private final String id;
    private final Type type;
    private final int priority; // 1 (lowest) to 10 (highest)
    private final long delayMs;
    private int maxRetries;
    private int currentRetryAttempt = 0;
    
    private Status status = Status.QUEUED;
    private final long submittedAt;
    private long startedAt = 0;
    private long completedAt = 0;
    private String threadId = "";
    private String errorMessage = "";

    public Task(Type type, int priority, long delayMs, int maxRetries) {
        this.id = UUID.randomUUID().toString();
        this.type = type;
        this.priority = priority;
        this.delayMs = delayMs;
        this.maxRetries = maxRetries;
        this.submittedAt = System.currentTimeMillis();
    }

    // Getters and Setters
    public String getId() { return id; }
    public Type getType() { return type; }
    public int getPriority() { return priority; }
    public long getDelayMs() { return delayMs; }
    public int getMaxRetries() { return maxRetries; }
    public int getCurrentRetryAttempt() { return currentRetryAttempt; }
    public void incrementRetryAttempt() { this.currentRetryAttempt++; }
    
    public Status getStatus() { return status; }
    public synchronized void setStatus(Status status) { this.status = status; }

    public long getSubmittedAt() { return submittedAt; }
    public long getStartedAt() { return startedAt; }
    public void setStartedAt(long startedAt) { this.startedAt = startedAt; }

    public long getCompletedAt() { return completedAt; }
    public void setCompletedAt(long completedAt) { this.completedAt = completedAt; }

    public String getThreadId() { return threadId; }
    public void setThreadId(String threadId) { this.threadId = threadId; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public long getWaitTimeMs() {
        if (startedAt == 0) return System.currentTimeMillis() - submittedAt;
        return startedAt - submittedAt;
    }

    public long getExecTimeMs() {
        if (startedAt == 0) return 0;
        if (completedAt == 0) return System.currentTimeMillis() - startedAt;
        return completedAt - startedAt;
    }

    /**
     * Executes the task logic. Subclasses implement the specific heavy lifting.
     */
    @Override
    public abstract void run();

    public String toJSON() {
        return String.format(
            "{\"id\":\"%s\",\"type\":\"%s\",\"priority\":%d,\"delayMs\":%d,\"status\":\"%s\"," +
            "\"submittedAt\":%d,\"startedAt\":%d,\"completedAt\":%d,\"waitTimeMs\":%d,\"execTimeMs\":%d," +
            "\"threadId\":\"%s\",\"retryCount\":%d,\"errorMessage\":\"%s\"}",
            id, type.name(), priority, delayMs, status.name(),
            submittedAt, startedAt, completedAt, getWaitTimeMs(), getExecTimeMs(),
            threadId, currentRetryAttempt, errorMessage == null ? "" : errorMessage.replace("\"", "\\\"")
        );
    }
}
