package com.nexusflow.retry;

import com.nexusflow.config.ThreadPoolConfig;
import com.nexusflow.pool.NexusThreadPool;
import com.nexusflow.task.NexusTask;
import com.nexusflow.task.TaskPriority;
import com.nexusflow.task.TaskStatus;
import com.nexusflow.task.TaskType;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

public class RetryMechanismTest {

    private NexusThreadPool pool;

    @BeforeEach
    void setUp() {
        ThreadPoolConfig config = new ThreadPoolConfig(
            2, 4, 100, 1000, 500, 2000, 3, 50, 300, 2.0
        );
        pool = new NexusThreadPool(config);
    }

    @AfterEach
    void tearDown() throws InterruptedException {
        if (pool != null) {
            pool.shutdown();
            pool.awaitTermination(2, TimeUnit.SECONDS);
        }
    }

    /**
     * Waits for a task to reach a terminal status (COMPLETED/FAILED/
     * CANCELLED), up to timeoutMs.
     *
     * Fix for a confirmed test-synchronization bug (not a production bug):
     * this test's CountDownLatch fires from inside the task's own lambda,
     * BEFORE WorkerThread.processTask() runs task.setExecutionResult(...)
     * and task.setStatus(TaskStatus.COMPLETED) afterward. Asserting the
     * status immediately after latch.await() returns raced against that
     * still-in-flight status update, causing an intermittent, false
     * "expected COMPLETED but was RUNNING" failure that had nothing to do
     * with retry correctness. This waits for the status transition
     * production code guarantees will happen, instead of assuming it has
     * already happened the instant the lambda body finishes.
     */
    private static TaskStatus awaitTerminalStatus(NexusTask<?> task, long timeoutMs) throws InterruptedException {
        long deadline = System.currentTimeMillis() + timeoutMs;
        while (System.currentTimeMillis() < deadline) {
            TaskStatus status = task.getStatus();
            if (status == TaskStatus.COMPLETED || status == TaskStatus.FAILED || status == TaskStatus.CANCELLED) {
                return status;
            }
            Thread.sleep(5);
        }
        return task.getStatus();
    }

    @Test
    @DisplayName("Test task retries on failure up to max retries and succeeds")
    void testRetryAndSuccess() throws InterruptedException {
        AtomicInteger attempts = new AtomicInteger(0);
        CountDownLatch latch = new CountDownLatch(1);

        NexusTask<String> task = new NexusTask<>(
            "retry-success-1", "repo", "user", TaskType.CUSTOM, TaskPriority.HIGH, 3,
            t -> {
                int count = attempts.incrementAndGet();
                if (count < 3) {
                    throw new RuntimeException("Transient failure #" + count);
                }
                latch.countDown();
                return "success";
            }
        );

        pool.submit(task);
        assertTrue(latch.await(3, TimeUnit.SECONDS));

        TaskStatus finalStatus = awaitTerminalStatus(task, 500);

        assertEquals(3, attempts.get());
        assertEquals(TaskStatus.COMPLETED, finalStatus);
        assertTrue(pool.getMetrics().getRetriedTasks() >= 2);
    }

    @Test
    @DisplayName("Test task fails permanently when max retries exceeded")
    void testPermanentFailure() throws InterruptedException {
        NexusTask<String> task = new NexusTask<>(
            "retry-fail-1", "repo", "user", TaskType.CUSTOM, TaskPriority.HIGH, 2,
            t -> {
                throw new RuntimeException("Always fails!");
            }
        );

        pool.submit(task);
        Thread.sleep(1000);

        assertEquals(TaskStatus.FAILED, task.getStatus());
        assertEquals(1, pool.getMetrics().getFailedTasks());
    }

    @Test
    @DisplayName("Test non-retryable exception fails immediately without retrying")
    void testNonRetryableException() throws InterruptedException {
        AtomicInteger attempts = new AtomicInteger(0);

        NexusTask<String> task = new NexusTask<>(
            "non-retryable-1", "repo", "user", TaskType.CUSTOM, TaskPriority.HIGH, 3,
            t -> {
                attempts.incrementAndGet();
                throw new IllegalArgumentException("Fatal argument exception!");
            }
        );

        pool.submit(task);
        Thread.sleep(500);

        assertEquals(1, attempts.get(), "Non-retryable exception should not be retried");
        assertEquals(TaskStatus.FAILED, task.getStatus());
    }
}
