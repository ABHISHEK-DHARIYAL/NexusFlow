package com.nexusflow.queue;

import com.nexusflow.task.NexusTask;
import com.nexusflow.task.TaskPriority;
import com.nexusflow.task.TaskType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

public class NexusBlockingQueueTest {

    @Test
    @DisplayName("Test basic offer and poll functionality")
    void testOfferAndPoll() {
        NexusBlockingQueue<NexusTask<String>> queue = new NexusBlockingQueue<>(5);

        NexusTask<String> task1 = NexusTask.create("repo-1", TaskType.CODE_ANALYSIS, TaskPriority.MEDIUM, t -> "ok");
        assertTrue(queue.offer(task1));
        assertEquals(1, queue.size());

        NexusTask<String> popped = queue.poll();
        assertNotNull(popped);
        assertEquals(task1.getTaskId(), popped.getTaskId());
        assertEquals(0, queue.size());
    }

    @Test
    @DisplayName("Test bounded queue capacity and blocking offer timeout")
    void testCapacityAndOfferTimeout() throws InterruptedException {
        NexusBlockingQueue<NexusTask<String>> queue = new NexusBlockingQueue<>(2);

        NexusTask<String> t1 = NexusTask.create("r1", TaskType.CUSTOM, TaskPriority.MEDIUM, t -> "1");
        NexusTask<String> t2 = NexusTask.create("r2", TaskType.CUSTOM, TaskPriority.MEDIUM, t -> "2");
        NexusTask<String> t3 = NexusTask.create("r3", TaskType.CUSTOM, TaskPriority.MEDIUM, t -> "3");

        assertTrue(queue.offer(t1));
        assertTrue(queue.offer(t2));
        assertFalse(queue.offer(t3)); // Queue full

        boolean offeredWithTimeout = queue.offer(t3, 100, TimeUnit.MILLISECONDS);
        assertFalse(offeredWithTimeout);
    }

    @Test
    @DisplayName("Test queue shutdown behavior")
    void testShutdown() throws InterruptedException {
        NexusBlockingQueue<NexusTask<String>> queue = new NexusBlockingQueue<>(10);
        NexusTask<String> task = NexusTask.create("r1", TaskType.CUSTOM, TaskPriority.HIGH, t -> "val");
        queue.put(task);

        queue.shutdown();
        assertTrue(queue.isShutdown());

        // Submitting to shutdown queue throws IllegalStateException
        assertThrows(IllegalStateException.class, () -> queue.put(task));
    }
}
