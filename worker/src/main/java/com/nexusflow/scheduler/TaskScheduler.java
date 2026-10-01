package com.nexusflow.scheduler;

import com.nexusflow.queue.NexusBlockingQueue;
import com.nexusflow.task.NexusTask;
import com.nexusflow.task.TaskStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.ReentrantLock;

public class TaskScheduler implements Runnable {
    private static final Logger logger = LoggerFactory.getLogger(TaskScheduler.class);

    private final NexusBlockingQueue<NexusTask<?>> targetQueue;
    private final List<ScheduledEntry> scheduledTasks = new ArrayList<>();
    private final ReentrantLock lock = new ReentrantLock();
    private final Condition taskAddedOrDue = lock.newCondition();

    private final Thread schedulerThread;
    private volatile boolean running = true;

    private static record ScheduledEntry(NexusTask<?> task, long executeAtMs) {}

    public TaskScheduler(NexusBlockingQueue<NexusTask<?>> targetQueue) {
        this.targetQueue = targetQueue;
        this.schedulerThread = new Thread(this, "NexusTaskScheduler");
        this.schedulerThread.setDaemon(true);
    }

    public void start() {
        this.schedulerThread.start();
        logger.info("TaskScheduler background loop started.");
    }

    public void schedule(NexusTask<?> task, long delayMs) {
        schedule(task, Instant.now().plusMillis(Math.max(0, delayMs)));
    }

    public void schedule(NexusTask<?> task, Instant executeAt) {
        if (task == null || executeAt == null) throw new NullPointerException("Task and executeAt must not be null");

        task.setScheduledTime(executeAt);
        task.setStatus(TaskStatus.SCHEDULED);

        long executeAtMs = executeAt.toEpochMilli();
        lock.lock();
        try {
            scheduledTasks.add(new ScheduledEntry(task, executeAtMs));
            taskAddedOrDue.signalAll();
            logger.info("Scheduled task {} for execution at {}", task.getTaskId(), executeAt);
        } finally {
            lock.unlock();
        }
    }

    @Override
    public void run() {
        while (running && !Thread.currentThread().isInterrupted()) {
            ScheduledEntry dueEntry = null;
            long waitMs = 0;

            lock.lock();
            try {
                while (scheduledTasks.isEmpty() && running) {
                    taskAddedOrDue.await();
                }
                if (!running) break;

                long now = System.currentTimeMillis();
                int earliestIndex = findEarliestIndex();
                ScheduledEntry candidate = scheduledTasks.get(earliestIndex);

                if (candidate.executeAtMs() <= now) {
                    dueEntry = scheduledTasks.remove(earliestIndex);
                } else {
                    waitMs = candidate.executeAtMs() - now;
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } finally {
                lock.unlock();
            }

            if (dueEntry != null) {
                NexusTask<?> task = dueEntry.task();
                if (!task.isCancelRequested() && task.transitionStatus(TaskStatus.SCHEDULED, TaskStatus.QUEUED)) {
                    try {
                        targetQueue.put(task);
                        logger.info("Moved scheduled task {} to ready queue.", task.getTaskId());
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                } else {
                    logger.info("Scheduled task {} was cancelled before execution.", task.getTaskId());
                }
            } else if (waitMs > 0) {
                lock.lock();
                try {
                    taskAddedOrDue.await(waitMs, TimeUnit.MILLISECONDS);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                } finally {
                    lock.unlock();
                }
            }
        }
        logger.info("TaskScheduler background thread terminating.");
    }

    private int findEarliestIndex() {
        int index = 0;
        long minTime = scheduledTasks.get(0).executeAtMs();
        for (int i = 1; i < scheduledTasks.size(); i++) {
            if (scheduledTasks.get(i).executeAtMs() < minTime) {
                minTime = scheduledTasks.get(i).executeAtMs();
                index = i;
            }
        }
        return index;
    }

    public void stop() {
        running = false;
        lock.lock();
        try {
            taskAddedOrDue.signalAll();
        } finally {
            lock.unlock();
        }
        schedulerThread.interrupt();
    }

    public int getScheduledTaskCount() {
        lock.lock();
        try {
            return scheduledTasks.size();
        } finally {
            lock.unlock();
        }
    }
}
