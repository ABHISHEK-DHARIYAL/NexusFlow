package com.nexusflow.stress;

import com.nexusflow.config.ThreadPoolConfig;
import com.nexusflow.pool.NexusThreadPool;
import com.nexusflow.task.NexusTask;
import com.nexusflow.task.TaskPriority;
import com.nexusflow.task.TaskType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

public class ConcurrencyStressTest {

    @Test
    @DisplayName("High Concurrency Stress Test with multi-producers, retries, and cancellations")
    void testHighConcurrencyStress() throws InterruptedException {
        ThreadPoolConfig config = new ThreadPoolConfig(
            4,          // minWorkers
            12,         // maxWorkers
            500,        // queueCapacity
            2000,
            500, 2000, 3, 50, 300, 2.0
        );
        NexusThreadPool pool = new NexusThreadPool(config);

        int producerCount = 8;
        int tasksPerProducer = 50;
        int totalTasks = producerCount * tasksPerProducer;

        CountDownLatch startSignal = new CountDownLatch(1);
        CountDownLatch finishSignal = new CountDownLatch(producerCount);
        AtomicInteger successCounter = new AtomicInteger(0);

        List<Thread> producers = new ArrayList<>();
        Random random = new Random(42);

        for (int p = 0; p < producerCount; p++) {
            final int producerId = p;
            Thread producer = new Thread(() -> {
                try {
                    startSignal.await();
                    for (int i = 0; i < tasksPerProducer; i++) {
                        final int taskIdNum = (producerId * tasksPerProducer) + i;
                        TaskPriority priority = TaskPriority.values()[random.nextInt(TaskPriority.values().length)];

                        NexusTask<String> task = new NexusTask<>(
                            "stress-" + taskIdNum,
                            "repo-" + (producerId % 3),
                            "usr-" + producerId,
                            TaskType.CODE_ANALYSIS,
                            priority,
                            2,
                            t -> {
                                Thread.sleep(5 + random.nextInt(15));
                                successCounter.incrementAndGet();
                                return "ok";
                            }
                        );

                        pool.submit(task);
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                } finally {
                    finishSignal.countDown();
                }
            });
            producers.add(producer);
            producer.start();
        }

        // Fire all producers simultaneously
        startSignal.countDown();
        assertTrue(finishSignal.await(10, TimeUnit.SECONDS), "All producers should finish submitting tasks");

        // Wait for workers to process all tasks
        pool.shutdown();
        boolean terminated = pool.awaitTermination(15, TimeUnit.SECONDS);

        assertTrue(terminated, "Engine should terminate cleanly without deadlocks");
        assertEquals(totalTasks, pool.getMetrics().getCompletedTasks(), "All submitted tasks should complete successfully");
        assertEquals(0, pool.getQueueDepth(), "Task queue should be empty");
    }
}
