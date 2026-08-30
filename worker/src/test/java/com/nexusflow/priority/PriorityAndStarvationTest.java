package com.nexusflow.priority;

import com.nexusflow.queue.NexusBlockingQueue;
import com.nexusflow.task.NexusTask;
import com.nexusflow.task.TaskPriority;
import com.nexusflow.task.TaskType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class PriorityAndStarvationTest {

    @Test
    @DisplayName("Test tasks are polled according to priority (CRITICAL before LOW)")
    void testPriorityOrdering() throws InterruptedException {
        NexusBlockingQueue<NexusTask<String>> queue = new NexusBlockingQueue<>(10);

        NexusTask<String> lowTask = NexusTask.create("repo-1", TaskType.CUSTOM, TaskPriority.LOW, t -> "low");
        NexusTask<String> criticalTask = NexusTask.create("repo-1", TaskType.CUSTOM, TaskPriority.CRITICAL, t -> "critical");
        NexusTask<String> mediumTask = NexusTask.create("repo-1", TaskType.CUSTOM, TaskPriority.MEDIUM, t -> "medium");

        queue.put(lowTask);
        queue.put(criticalTask);
        queue.put(mediumTask);

        NexusTask<String> p1 = queue.take();
        assertEquals(TaskPriority.CRITICAL, p1.getPriority());

        NexusTask<String> p2 = queue.take();
        assertEquals(TaskPriority.MEDIUM, p2.getPriority());

        NexusTask<String> p3 = queue.take();
        assertEquals(TaskPriority.LOW, p3.getPriority());
    }

    @Test
    @DisplayName("Test anti-starvation / aging mechanic boosts starved LOW priority task")
    void testAntiStarvationAging() throws InterruptedException {
        // Setup queue with 50ms starvation threshold and 10ms aging factor
        NexusBlockingQueue<NexusTask<String>> queue = new NexusBlockingQueue<>(10, 10L, 50L);

        NexusTask<String> oldLowTask = NexusTask.create("r1", TaskType.CUSTOM, TaskPriority.LOW, t -> "old-low");
        queue.put(oldLowTask);

        // Sleep to simulate low task waiting past starvation threshold
        Thread.sleep(80);

        NexusTask<String> freshCriticalTask = NexusTask.create("r1", TaskType.CUSTOM, TaskPriority.CRITICAL, t -> "fresh-critical");
        queue.put(freshCriticalTask);

        // Even though fresh task is CRITICAL, oldLowTask has surpassed starvation threshold and gets picked
        NexusTask<String> popped = queue.take();
        assertEquals(oldLowTask.getTaskId(), popped.getTaskId(), "Starved LOW task should be popped before fresh CRITICAL task");
    }
}
