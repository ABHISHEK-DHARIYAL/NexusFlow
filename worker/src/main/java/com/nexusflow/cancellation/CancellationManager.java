package com.nexusflow.cancellation;

import com.nexusflow.metrics.NexusMetrics;
import com.nexusflow.queue.NexusBlockingQueue;
import com.nexusflow.task.NexusTask;
import com.nexusflow.task.TaskStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class CancellationManager {
    private static final Logger logger = LoggerFactory.getLogger(CancellationManager.class);

    private final Map<String, NexusTask<?>> activeTasks = new ConcurrentHashMap<>();
    private final Map<String, Thread> taskWorkerThreads = new ConcurrentHashMap<>();
    private final NexusMetrics metrics;

    public CancellationManager(NexusMetrics metrics) {
        this.metrics = metrics;
    }

    public void registerTask(NexusTask<?> task) {
        activeTasks.put(task.getTaskId(), task);
    }

    public void bindRunningWorker(String taskId, Thread workerThread) {
        if (taskId != null && workerThread != null) {
            taskWorkerThreads.put(taskId, workerThread);
        }
    }

    public void unregisterRunningWorker(String taskId) {
        if (taskId != null) {
            taskWorkerThreads.remove(taskId);
            activeTasks.remove(taskId);
        }
    }

    public boolean cancelTask(String taskId, NexusBlockingQueue<NexusTask<?>> queue) {
        NexusTask<?> task = activeTasks.get(taskId);
        if (task == null) {
            logger.warn("Cancellation requested for unknown or completed task: {}", taskId);
            return false;
        }

        // Fix for a confirmed TOCTOU race: this previously captured
        // task.getStatus() BEFORE calling task.requestCancellation(), then
        // branched on that stale snapshot. If a worker dequeued the task
        // and transitioned it QUEUED -> RUNNING in the gap between the
        // snapshot and requestCancellation(), the snapshot said QUEUED
        // (now wrong), queue.remove() correctly failed (the task was no
        // longer in the queue), and the caller was told cancellation
        // failed - even though task.requestCancellation() itself is
        // already correctly synchronized under NexusTask's own stateLock
        // and is the same authority WorkerThread.processTask() checks
        // before ever starting a task. Calling requestCancellation()
        // FIRST and reading its actual outcome afterward uses that
        // existing lock as the single source of truth, instead of a
        // second, separately-timed read that can go stale.
        task.requestCancellation();
        TaskStatus resultingStatus = task.getStatus();
        boolean result = false;

        if (resultingStatus == TaskStatus.CANCELLED) {
            // requestCancellation() already atomically transitioned the
            // task to CANCELLED (it was QUEUED/SCHEDULED/RETRYING at that
            // exact moment) - WorkerThread.processTask()'s pre-execution
            // check guarantees it will never actually run. Best-effort
            // removal from the queue is just hygiene, not what
            // correctness depends on here.
            boolean removed = queue != null && queue.remove(task);
            if (metrics != null) metrics.recordTaskCancelled();
            logger.info("Cancelled task {} (was still queued/scheduled; queue cleanup {}).",
                    taskId, removed ? "succeeded" : "was a no-op, task already dequeued");
            result = true;
        } else if (resultingStatus == TaskStatus.RUNNING) {
            Thread workerThread = taskWorkerThreads.get(taskId);
            if (workerThread != null && workerThread.isAlive()) {
                logger.info("Interrupting running worker thread for task: {}", taskId);
                workerThread.interrupt();
                result = true;
            } else {
                logger.info(
                    "Cancellation flag set for running task {} but its worker thread was not yet " +
                    "bound (likely mid-dispatch); it may complete before the cancellation is observed.",
                    taskId
                );
            }
        }

        return result;
    }

    public boolean isCancelled(String taskId) {
        NexusTask<?> task = activeTasks.get(taskId);
        return task != null && task.isCancelRequested();
    }
}
