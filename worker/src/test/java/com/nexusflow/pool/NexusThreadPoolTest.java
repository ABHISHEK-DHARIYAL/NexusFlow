package com.nexusflow.pool;

import com.nexusflow.config.ThreadPoolConfig;
import com.nexusflow.task.NexusTask;
import com.nexusflow.task.TaskPriority;
import com.nexusflow.task.TaskType;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

public class NexusThreadPoolTest {
    private NexusThreadPool threadPool;

    @BeforeEach
    void setUp() {
        ThreadPoolConfig config = new ThreadPoolConfig(
            2, 4, 100, 1000, 500, 2000, 3, 50, 500, 2.0
        );
        threadPool = new NexusThreadPool(config);
    }

    @AfterEach
    void tearDown() throws InterruptedException {
        if (threadPool != null && !threadPool.isShutdown()) {
            threadPool.shutdown();
            threadPool.awaitTermination(2, TimeUnit.SECONDS);
        }
    }

    @Test
    @DisplayName("Test submitting tasks and executing them successfully")
    void testTaskExecution() throws InterruptedException {
        CountDownLatch latch = new CountDownLatch(3);

        for (int i = 0; i < 3; i++) {
            NexusTask<String> task = NexusTask.create("repo-test", TaskType.CODE_ANALYSIS, TaskPriority.HIGH, t -> {
                latch.countDown();
                return "done";
            });
            threadPool.submit(task);
        }

        assertTrue(latch.await(3, TimeUnit.SECONDS));
        assertEquals(3, threadPool.getMetrics().getCompletedTasks());
    }

    @Test
    @DisplayName("Test graceful shutdown completes remaining tasks")
    void testGracefulShutdown() throws InterruptedException {
        CountDownLatch latch = new CountDownLatch(5);

        for (int i = 0; i < 5; i++) {
            NexusTask<String> task = NexusTask.create("repo-shutdown", TaskType.CUSTOM, TaskPriority.MEDIUM, t -> {
                Thread.sleep(50);
                latch.countDown();
                return "ok";
            });
            threadPool.submit(task);
        }

        threadPool.shutdown();
        assertTrue(threadPool.isShutdown());

        boolean terminated = threadPool.awaitTermination(5, TimeUnit.SECONDS);
        assertTrue(terminated);
        assertEquals(5, threadPool.getMetrics().getCompletedTasks());
    }
}
