package com.nexusflow.scheduler;

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

public class TaskSchedulerTest {

    private NexusThreadPool pool;

    @BeforeEach
    void setUp() {
        ThreadPoolConfig config = ThreadPoolConfig.defaultConfig();
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
     * See RetryMechanismTest.awaitTerminalStatus for the rationale: the
     * task's own latch fires from inside its lambda, before
     * WorkerThread.processTask() sets the final status afterward.
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
    @DisplayName("Test scheduled task executes after specified delay")
    void testScheduledTaskExecution() throws InterruptedException {
        CountDownLatch latch = new CountDownLatch(1);
        long startMs = System.currentTimeMillis();

        NexusTask<String> task = NexusTask.create("sched-repo", TaskType.AI_ANALYSIS, TaskPriority.HIGH, t -> {
            latch.countDown();
            return "scheduled-done";
        });

        long delayMs = 300L;
        pool.schedule(task, delayMs);
        assertEquals(TaskStatus.SCHEDULED, task.getStatus());

        assertTrue(latch.await(2, TimeUnit.SECONDS));
        long elapsedMs = System.currentTimeMillis() - startMs;

        TaskStatus finalStatus = awaitTerminalStatus(task, 500);

        assertTrue(elapsedMs >= (delayMs - 50), "Task should execute after scheduled delay");
        assertEquals(TaskStatus.COMPLETED, finalStatus);
    }
}
