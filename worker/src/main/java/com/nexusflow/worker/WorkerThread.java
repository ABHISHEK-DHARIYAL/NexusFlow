package com.nexusflow.worker;

import com.nexusflow.cancellation.CancellationManager;
import com.nexusflow.metrics.NexusMetrics;
import com.nexusflow.metrics.WorkerMetrics;
import com.nexusflow.queue.NexusBlockingQueue;
import com.nexusflow.retry.RetryManager;
import com.nexusflow.task.NexusTask;
import com.nexusflow.task.TaskStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.BooleanSupplier;

public class WorkerThread extends Thread {
    private static final Logger logger = LoggerFactory.getLogger(WorkerThread.class);

    private final String workerId;
    private final NexusBlockingQueue<NexusTask<?>> queue;
    private final RetryManager retryManager;
    private final CancellationManager cancellationManager;
    private final NexusMetrics metrics;
    private final WorkerMetrics workerMetrics;

    private final long idleTimeoutMs;
    private final Runnable onWorkerShutdown;
    private final BooleanSupplier scaleDownAuthority;

    private final AtomicBoolean shutdownRequested = new AtomicBoolean(false);
    private volatile WorkerStatus status = WorkerStatus.IDLE;

    public WorkerThread(
        String workerId,
        NexusBlockingQueue<NexusTask<?>> queue,
        RetryManager retryManager,
        CancellationManager cancellationManager,
        NexusMetrics metrics,
        long idleTimeoutMs,
        Runnable onWorkerShutdown,
        BooleanSupplier scaleDownAuthority
    ) {
        super("NexusWorker-" + workerId);
        this.workerId = workerId;
        this.queue = queue;
        this.retryManager = retryManager;
        this.cancellationManager = cancellationManager;
        this.metrics = metrics;
        this.workerMetrics = new WorkerMetrics(workerId);
        this.idleTimeoutMs = idleTimeoutMs;
        this.onWorkerShutdown = onWorkerShutdown;
        this.scaleDownAuthority = scaleDownAuthority;

        if (this.metrics != null) {
            this.metrics.registerWorker(workerId, this.workerMetrics);
        }
    }

    @Override
    public void run() {
        logger.info("Worker thread {} started.", workerId);

        try {
            while (true) {
                if (Thread.currentThread().isInterrupted() && !shutdownRequested.get()) {
                    break;
                }

                updateWorkerStatus(WorkerStatus.IDLE);
                long waitStart = System.currentTimeMillis();
                NexusTask<?> task = null;

                try {
                    task = queue.poll(idleTimeoutMs, TimeUnit.MILLISECONDS);
                } catch (InterruptedException e) {
                    if (shutdownRequested.get()) {
                        drainAndProcessRemainingTasks();
                        break;
                    } else {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }

                long waitDuration = System.currentTimeMillis() - waitStart;
                workerMetrics.addIdleTime(waitDuration);

                if (task != null) {
                    processTask(task);
                } else {
                    if (shutdownRequested.get()) {
                        drainAndProcessRemainingTasks();
                        break;
                    }
                    if (shouldShutdownDueToIdle()) {
                        logger.info("Worker {} idle timeout exceeded, shutting down for dynamic scale-down.", workerId);
                        break;
                    }
                }
            }
        } catch (Throwable t) {
            logger.error("Worker thread {} encountered fatal error: {}", workerId, t.getMessage(), t);
            updateWorkerStatus(WorkerStatus.UNHEALTHY);
        } finally {
            updateWorkerStatus(WorkerStatus.STOPPED);
            if (metrics != null) {
                metrics.unregisterWorker(workerId);
            }
            if (onWorkerShutdown != null) {
                onWorkerShutdown.run();
            }
            logger.info("Worker thread {} terminated cleanly.", workerId);
        }
    }

    private void drainAndProcessRemainingTasks() {
        NexusTask<?> task;
        while ((task = queue.poll()) != null) {
            processTask(task);
        }
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    private void processTask(NexusTask task) {
        if (metrics != null) {
            metrics.recordTaskDequeued();
        }

        if (task.isCancelRequested() || task.getStatus() == TaskStatus.CANCELLED) {
            logger.info("Worker {} skipped cancelled task {}.", workerId, task.getTaskId());
            task.setStatus(TaskStatus.CANCELLED);
            if (metrics != null) metrics.recordTaskCancelled();
            workerMetrics.incrementTasksCancelled();
            return;
        }

        if (!task.transitionStatus(TaskStatus.QUEUED, TaskStatus.RUNNING)) {
            logger.warn("Worker {} failed to transition task {} from QUEUED to RUNNING.", workerId, task.getTaskId());
            return;
        }

        updateWorkerStatus(WorkerStatus.BUSY);
        workerMetrics.setCurrentTaskId(task.getTaskId());
        cancellationManager.bindRunningWorker(task.getTaskId(), this);

        if (metrics != null) {
            metrics.recordTaskStarted();
            metrics.updateWorkerState(workerId, true);
        }

        long startTime = System.currentTimeMillis();
        try {
            logger.info("Worker {} executing task {} [{}]", workerId, task.getTaskId(), task.getType());
            Object result = task.getAction().execute(task);
            long executionTimeMs = System.currentTimeMillis() - startTime;

            task.setExecutionResult(result);
            task.setStatus(TaskStatus.COMPLETED);

            workerMetrics.incrementTasksCompleted();
            workerMetrics.addActiveTime(executionTimeMs);
            if (metrics != null) {
                metrics.recordTaskCompleted(executionTimeMs);
            }
            logger.info("Worker {} completed task {} in {} ms.", workerId, task.getTaskId(), executionTimeMs);

        } catch (Throwable error) {
            long executionTimeMs = System.currentTimeMillis() - startTime;
            workerMetrics.addActiveTime(executionTimeMs);
            logger.warn("Worker {} execution error on task {}: {}", workerId, task.getTaskId(), error.getMessage());

            boolean retried = retryManager.handleTaskFailure(task, error, queue);
            if (!retried) {
                workerMetrics.incrementTasksFailed();
            }

        } finally {
            cancellationManager.unregisterRunningWorker(task.getTaskId());
            workerMetrics.setCurrentTaskId(null);
            updateWorkerStatus(WorkerStatus.IDLE);

            if (metrics != null) {
                metrics.updateWorkerState(workerId, false);
            }
        }
    }

    private boolean shouldShutdownDueToIdle() {
        if (shutdownRequested.get()) return true;
        if (!queue.isEmpty()) return false;
        if (scaleDownAuthority == null) return false;
        // Delegate the actual decision to NexusThreadPool, which owns the
        // real worker registry and can make the check-and-remove atomic
        // (see NexusThreadPool.tryScaleDownWorker for why this must not
        // be decided from metrics alone).
        return scaleDownAuthority.getAsBoolean();
    }

    private void updateWorkerStatus(WorkerStatus newStatus) {
        this.status = newStatus;
        this.workerMetrics.setStatus(newStatus);
    }

    public void requestShutdown() {
        this.shutdownRequested.set(true);
        updateWorkerStatus(WorkerStatus.STOPPING);
    }

    public WorkerStatus getWorkerStatus() { return status; }
    public String getWorkerId() { return workerId; }
    public WorkerMetrics getWorkerMetrics() { return workerMetrics; }
}
