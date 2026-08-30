package com.nexusflow.cancellation;

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

import static org.junit.jupiter.api.Assertions.*;

public class TaskCancellationTest {

    private NexusThreadPool pool;

    @BeforeEach
    void setUp() {
        // maxWorkers is intentionally 1, not 2: this test class exercises
        // cancellation semantics, not dynamic scaling. With maxWorkers=2,
        // NexusThreadPool.evaluateScaling() could spawn a second worker
        // that dequeues and completes the trivial targetTask before
        // pool.cancel() on the main thread ever runs - a task that has
        // already finished honestly cannot be "cancelled", so that raced
        // outcome isn't a production bug, just an unintended interaction
        // between this test's setup and an unrelated feature (scale-up).
        // Pinning min=max=1 keeps the single worker occupied by the
        // blocker task, so targetTask deterministically stays QUEUED
        // until cancel() reaches it - which is what this test intends to
        // exercise.
        ThreadPoolConfig config = new ThreadPoolConfig(
            1, 1, 100, 1000, 500, 2000, 3, 50, 500, 2.0
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

    @Test
    @DisplayName("Test cancelling a queued task before execution starts")
    void testCancelQueuedTask() throws InterruptedException {
        CountDownLatch blockerLatch = new CountDownLatch(1);

        // Submit slow task to occupy worker
        NexusTask<String> slowTask = NexusTask.create("r1", TaskType.CUSTOM, TaskPriority.CRITICAL, t -> {
            blockerLatch.await();
            return "slow-done";
        });
        pool.submit(slowTask);

        // Submit task to be queued
        NexusTask<String> targetTask = NexusTask.create("r1", TaskType.CUSTOM, TaskPriority.LOW, t -> "target");
        String taskId = pool.submit(targetTask);

        // Cancel the queued task
        boolean cancelled = pool.cancel(taskId);
        assertTrue(cancelled);
        assertEquals(TaskStatus.CANCELLED, targetTask.getStatus());

        // Unblock worker
        blockerLatch.countDown();
    }

    @Test
    @DisplayName("Test cancelling a running task interrupts worker execution")
    void testCancelRunningTask() throws InterruptedException {
        CountDownLatch startedLatch = new CountDownLatch(1);
        CountDownLatch interruptedLatch = new CountDownLatch(1);

        NexusTask<String> runningTask = NexusTask.create("r1", TaskType.CUSTOM, TaskPriority.CRITICAL, t -> {
            startedLatch.countDown();
            try {
                Thread.sleep(3000);
            } catch (InterruptedException e) {
                interruptedLatch.countDown();
                throw e;
            }
            return "done";
        });

        String taskId = pool.submit(runningTask);
        assertTrue(startedLatch.await(2, TimeUnit.SECONDS));

        boolean cancelled = pool.cancel(taskId);
        assertTrue(cancelled);
        assertTrue(interruptedLatch.await(2, TimeUnit.SECONDS));
    }
}
