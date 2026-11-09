package com.nexusflow.stress;

import com.nexusflow.config.ThreadPoolConfig;
import com.nexusflow.pool.NexusThreadPool;
import com.nexusflow.task.NexusTask;
import com.nexusflow.task.TaskPriority;
import com.nexusflow.task.TaskType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

public class EngineBenchmarkTest {

    @Test
    @DisplayName("Engine Throughput and Latency Benchmark")
    void testEngineBenchmark() throws InterruptedException {
        ThreadPoolConfig config = new ThreadPoolConfig(
            4, 8, 1000, 3000, 500, 2000, 3, 50, 300, 2.0
        );
        NexusThreadPool pool = new NexusThreadPool(config);

        int totalTasks = 200;
        long startTimeMs = System.currentTimeMillis();

        for (int i = 0; i < totalTasks; i++) {
            NexusTask<String> task = NexusTask.create("bench-repo", TaskType.METRICS_COLLECTION, TaskPriority.HIGH, t -> {
                // Short CPU/IO simulation
                Math.sin(Math.random());
                return "bench-result";
            });
            pool.submit(task);
        }

        pool.shutdown();
        boolean terminated = pool.awaitTermination(10, TimeUnit.SECONDS);
        long durationMs = System.currentTimeMillis() - startTimeMs;

        assertTrue(terminated, "Benchmark execution should terminate within 10s");

        double throughputTasksPerSec = (double) totalTasks / (durationMs / 1000.0);
        System.out.println("=== BENCHMARK METRICS ===");
        System.out.println("Total Tasks Processed: " + totalTasks);
        System.out.println("Total Duration: " + durationMs + " ms");
        System.out.println("Throughput: " + String.format("%.2f", throughputTasksPerSec) + " tasks/sec");
        System.out.println("Avg Task Latency: " + String.format("%.2f", pool.getMetrics().getAverageExecutionTimeMs()) + " ms");
        System.out.println("=========================");

        assertTrue(throughputTasksPerSec > 50.0, "Engine throughput should exceed 50 tasks/sec");
    }
}
