package com.nexusflow.scaling;

import com.nexusflow.config.ThreadPoolConfig;
import com.nexusflow.pool.NexusThreadPool;
import com.nexusflow.task.NexusTask;
import com.nexusflow.task.TaskPriority;
import com.nexusflow.task.TaskType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

public class DynamicWorkerScalingTest {

    @Test
    @DisplayName("Test dynamic worker scale-up on task load and scale-down when idle")
    void testDynamicWorkerScaling() throws InterruptedException {
        ThreadPoolConfig config = new ThreadPoolConfig(
            2,          // minWorkers
            5,          // maxWorkers
            100,
            800,        // idleTimeoutMs
            500, 2000, 3, 50, 500, 2.0
        );
        NexusThreadPool pool = new NexusThreadPool(config);

        assertEquals(2, pool.getTotalWorkerCount(), "Initial worker count should equal minWorkers (2)");

        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch finishLatch = new CountDownLatch(10);

        // Submit 10 slow tasks to saturate pool and force scale-up
        for (int i = 0; i < 10; i++) {
            NexusTask<String> task = NexusTask.create("repo-scale", TaskType.CUSTOM, TaskPriority.HIGH, t -> {
                startLatch.await();
                finishLatch.countDown();
                return "ok";
            });
            pool.submit(task);
        }

        // Check that worker count scaled up beyond minWorkers towards maxWorkers
        assertTrue(pool.getTotalWorkerCount() > 2, "Worker count should scale up beyond minWorkers");

        // Release tasks
        startLatch.countDown();
        assertTrue(finishLatch.await(4, TimeUnit.SECONDS));

        // Sleep past idle timeout (800ms) to verify scale down
        Thread.sleep(1200);

        assertEquals(2, pool.getTotalWorkerCount(), "Worker count should scale down back to minWorkers (2) when idle");

        pool.shutdown();
        pool.awaitTermination(2, TimeUnit.SECONDS);
    }
}
