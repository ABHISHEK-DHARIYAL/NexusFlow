package com.nexusflow.pool;

import com.nexusflow.cancellation.CancellationManager;
import com.nexusflow.config.ThreadPoolConfig;
import com.nexusflow.metrics.NexusMetrics;
import com.nexusflow.queue.NexusBlockingQueue;
import com.nexusflow.retry.RetryManager;
import com.nexusflow.retry.RetryPolicy;
import com.nexusflow.scheduler.TaskScheduler;
import com.nexusflow.task.NexusTask;
import com.nexusflow.task.TaskPriority;
import com.nexusflow.task.TaskStatus;
import com.nexusflow.worker.WorkerThread;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.ReentrantLock;

public class NexusThreadPool {
    private static final Logger logger = LoggerFactory.getLogger(NexusThreadPool.class);

    private final ThreadPoolConfig config;
    private final NexusBlockingQueue<NexusTask<?>> taskQueue;
    private final NexusMetrics metrics = new NexusMetrics();
    private final RetryManager retryManager;
    private final CancellationManager cancellationManager;
    private final TaskScheduler scheduler;

    private final Map<String, WorkerThread> workers = new ConcurrentHashMap<>();
    private final AtomicInteger workerIdSequence = new AtomicInteger(1);
    private final ReentrantLock poolLock = new ReentrantLock();
    private final Condition terminationCondition = poolLock.newCondition();

    private volatile boolean isShutdown = false;
    private volatile boolean isTerminated = false;

    public NexusThreadPool() {
        this(ThreadPoolConfig.defaultConfig());
    }

    public NexusThreadPool(ThreadPoolConfig config) {
        this.config = config != null ? config : ThreadPoolConfig.defaultConfig();
        this.taskQueue = new NexusBlockingQueue<>(
            this.config.queueCapacity(),
            this.config.agingFactorMs(),
            this.config.starvationThresholdMs()
        );

        RetryPolicy retryPolicy = new RetryPolicy(
            this.config.defaultMaxRetries(),
            this.config.initialBackoffMs(),
            this.config.maxBackoffMs(),
            this.config.backoffMultiplier(),
            true
        );
        this.retryManager = new RetryManager(retryPolicy, metrics);
        this.cancellationManager = new CancellationManager(metrics);

        this.scheduler = new TaskScheduler(taskQueue);
        this.scheduler.start();

        // Instantiate initial minWorkers
        poolLock.lock();
        try {
            for (int i = 0; i < this.config.minWorkers(); i++) {
                spawnWorker();
            }
        } finally {
            poolLock.unlock();
        }

        logger.info("NexusThreadPool initialized with minWorkers={}, maxWorkers={}, queueCapacity={}",
                this.config.minWorkers(), this.config.maxWorkers(), this.config.queueCapacity());
    }

    public <T> String submit(NexusTask<T> task) {
        return submit(task, task.getPriority());
    }

    public <T> String submit(NexusTask<T> task, TaskPriority priority) {
        if (isShutdown) {
            throw new IllegalStateException("ThreadPool is shut down, rejecting new task submission.");
        }
        if (task == null) {
            throw new NullPointerException("Task cannot be null.");
        }

        cancellationManager.registerTask(task);
        metrics.recordTaskSubmitted();
        metrics.recordTaskQueued();

        try {
            taskQueue.put(task);
            logger.info("Submitted task {} with priority {}", task.getTaskId(), priority);
            evaluateScaling();
            return task.getTaskId();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Task submission interrupted for " + task.getTaskId(), e);
        }
    }

    public <T> void schedule(NexusTask<T> task, long delayMs) {
        if (isShutdown) {
            throw new IllegalStateException("ThreadPool is shut down, rejecting scheduled task.");
        }
        cancellationManager.registerTask(task);
        metrics.recordTaskSubmitted();
        scheduler.schedule(task, delayMs);
    }

    public <T> void schedule(NexusTask<T> task, Instant executeAt) {
        if (isShutdown) {
            throw new IllegalStateException("ThreadPool is shut down, rejecting scheduled task.");
        }
        cancellationManager.registerTask(task);
        metrics.recordTaskSubmitted();
        scheduler.schedule(task, executeAt);
    }

    public boolean cancel(String taskId) {
        return cancellationManager.cancelTask(taskId, taskQueue);
    }

    private void evaluateScaling() {
        poolLock.lock();
        try {
            if (isShutdown) return;

            int currentWorkerCount = workers.size();
            int queuedCount = taskQueue.size();

            // Scale up if queue is non-empty and active workers are saturated
            if (queuedCount > 0 && currentWorkerCount < config.maxWorkers()) {
                long activeCount = metrics.getActiveWorkers();
                if (activeCount >= currentWorkerCount || queuedCount > currentWorkerCount) {
                    WorkerThread newWorker = spawnWorker();
                    logger.info("Scaling up thread pool: created worker {}. Total workers: {}",
                            newWorker.getWorkerId(), workers.size());
                }
            }
        } finally {
            poolLock.unlock();
        }
    }

    private WorkerThread spawnWorker() {
        String workerId = "w-" + workerIdSequence.getAndIncrement();
        WorkerThread worker = new WorkerThread(
            workerId,
            taskQueue,
            retryManager,
            cancellationManager,
            metrics,
            config.idleTimeoutMs(),
            () -> onWorkerTerminated(workerId),
            () -> tryScaleDownWorker(workerId)
        );
        workers.put(workerId, worker);
        worker.start();
        return worker;
    }

    /**
     * Atomically decides whether the given worker is allowed to terminate
     * due to idle-timeout-driven dynamic scale-down, and - if so - removes
     * it from the worker registry as part of the SAME critical section.
     *
     * Fix for a confirmed race condition: the previous design let a
     * WorkerThread ask NexusMetrics.tryScaleDownWorker(minWorkers), which
     * only read workerCount and compared it to minWorkers, without
     * reserving or decrementing anything. Because the actual registry
     * removal (workers.remove(...), via onWorkerTerminated) only happened
     * later - in the WorkerThread's finally block, after run() had
     * already exited its loop - multiple idle workers could all observe
     * the same stale workerCount, each independently pass the
     * "> minWorkers" check, and all decide to terminate concurrently.
     * With 5 workers and minWorkers=2, that could scale all the way down
     * to 1, violating the workers.size() >= minWorkers invariant.
     *
     * NexusThreadPool - not NexusMetrics - owns the real worker registry
     * (`workers`), so it is the only correct authority for this decision.
     * Because the size check and the registry removal both happen inside
     * the same poolLock-protected critical section here, at most
     * (workers.size() - minWorkers) workers can ever be granted
     * permission to scale down at any given moment, no matter how many
     * idle workers ask concurrently - each successful call immediately
     * shrinks the registry that the next caller's check is based on.
     */
    private boolean tryScaleDownWorker(String workerId) {
        poolLock.lock();
        try {
            if (isShutdown) {
                // Shutdown is handled by a separate, explicit path
                // (requestShutdown() + drainAndProcessRemainingTasks());
                // a worker reaching here mid-shutdown should not also be
                // treated as an idle scale-down candidate.
                return false;
            }
            if (!workers.containsKey(workerId)) {
                // Already removed from the registry somehow (defensive -
                // should not normally happen). Nothing further to decide.
                return false;
            }
            if (workers.size() <= config.minWorkers()) {
                return false;
            }

            removeWorkerFromRegistry(workerId);
            return true;
        } finally {
            poolLock.unlock();
        }
    }

    private void onWorkerTerminated(String workerId) {
        poolLock.lock();
        try {
            removeWorkerFromRegistry(workerId);
        } finally {
            poolLock.unlock();
        }
    }

    /**
     * Must be called while holding poolLock. Idempotent: safe to call
     * more than once for the same workerId (e.g. once from
     * tryScaleDownWorker's approval and again from the WorkerThread's
     * own finally-block termination callback) - only the first call for
     * a given worker actually does anything, matching
     * ConcurrentHashMap.remove's natural no-op-when-absent behavior.
     */
    private void removeWorkerFromRegistry(String workerId) {
        WorkerThread removed = workers.remove(workerId);
        if (removed == null) {
            return;
        }
        logger.info("Removed worker {} from active worker registry. Remaining: {}", workerId, workers.size());

        if (isShutdown && workers.isEmpty()) {
            isTerminated = true;
            terminationCondition.signalAll();
            logger.info("All worker threads terminated. NexusThreadPool shutdown complete.");
        }
    }

    public void shutdown() {
        poolLock.lock();
        try {
            if (isShutdown) return;
            logger.info("Initiating graceful shutdown of NexusThreadPool...");
            isShutdown = true;

            scheduler.stop();
            taskQueue.shutdown();

            for (WorkerThread worker : workers.values()) {
                worker.requestShutdown();
            }

            if (workers.isEmpty()) {
                isTerminated = true;
                terminationCondition.signalAll();
            }
        } finally {
            poolLock.unlock();
        }
    }

    public List<NexusTask<?>> shutdownNow() {
        shutdown();
        List<NexusTask<?>> unexecuted = new ArrayList<>();
        poolLock.lock();
        try {
            NexusTask<?> task;
            while ((task = taskQueue.poll()) != null) {
                task.setStatus(TaskStatus.CANCELLED);
                metrics.recordTaskCancelled();
                unexecuted.add(task);
            }
            for (WorkerThread worker : workers.values()) {
                worker.interrupt();
            }
        } finally {
            poolLock.unlock();
        }
        return unexecuted;
    }

    public boolean awaitTermination(long timeout, TimeUnit unit) throws InterruptedException {
        long nanos = unit.toNanos(timeout);
        poolLock.lock();
        try {
            while (!isTerminated) {
                if (nanos <= 0L) {
                    return false;
                }
                nanos = terminationCondition.awaitNanos(nanos);
            }
            return true;
        } finally {
            poolLock.unlock();
        }
    }

    public NexusMetrics getMetrics() { return metrics; }
    public ThreadPoolConfig getConfig() { return config; }
    public int getActiveWorkerCount() { return (int) metrics.getActiveWorkers(); }
    public int getTotalWorkerCount() { return workers.size(); }
    public int getQueueDepth() { return taskQueue.size(); }
    public boolean isShutdown() { return isShutdown; }
    public boolean isTerminated() { return isTerminated; }
}
