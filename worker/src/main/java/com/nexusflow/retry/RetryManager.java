package com.nexusflow.retry;

import com.nexusflow.metrics.NexusMetrics;
import com.nexusflow.queue.NexusBlockingQueue;
import com.nexusflow.task.NexusTask;
import com.nexusflow.task.TaskStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class RetryManager {
    private static final Logger logger = LoggerFactory.getLogger(RetryManager.class);

    private final RetryPolicy defaultPolicy;
    private final NexusMetrics metrics;

    public RetryManager(RetryPolicy defaultPolicy, NexusMetrics metrics) {
        this.defaultPolicy = defaultPolicy != null ? defaultPolicy : RetryPolicy.defaultPolicy();
        this.metrics = metrics;
    }

    public boolean handleTaskFailure(NexusTask<?> task, Throwable error, NexusBlockingQueue<NexusTask<?>> queue) {
        if (task.isCancelRequested() || task.getStatus() == TaskStatus.CANCELLED) {
            logger.info("Task {} cancelled, skipping retry.", task.getTaskId());
            task.setStatus(TaskStatus.CANCELLED);
            if (metrics != null) metrics.recordTaskCancelled();
            return false;
        }

        task.setLastError(error);
        int retriesAttempted = task.incrementRetryCount();

        if (defaultPolicy.canRetry(retriesAttempted, error) && retriesAttempted <= task.getMaxRetries()) {
            long delayMs = defaultPolicy.calculateBackoffDelayMs(retriesAttempted);
            logger.warn("Task {} failed (attempt {}/{}): {}. Retrying in {} ms.",
                    task.getTaskId(), retriesAttempted, task.getMaxRetries(), error.getMessage(), delayMs);

            task.setStatus(TaskStatus.RETRYING);
            if (metrics != null) metrics.recordTaskRetried();

            // Asynchronous backoff thread to re-enqueue task without holding worker
            Thread.startVirtualThread(() -> {
                try {
                    if (delayMs > 0) {
                        Thread.sleep(delayMs);
                    }
                    if (!task.isCancelRequested() && task.transitionStatus(TaskStatus.RETRYING, TaskStatus.QUEUED)) {
                        queue.put(task);
                        if (metrics != null) metrics.recordTaskQueued();
                    } else {
                        logger.info("Task {} was cancelled during backoff sleep.", task.getTaskId());
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    task.setStatus(TaskStatus.CANCELLED);
                }
            });
            return true;
        } else {
            logger.error("Task {} failed permanently after {} attempts: {}",
                    task.getTaskId(), retriesAttempted, error.getMessage());
            task.setStatus(TaskStatus.FAILED);
            if (metrics != null) metrics.recordTaskFailed();
            return false;
        }
    }
}
