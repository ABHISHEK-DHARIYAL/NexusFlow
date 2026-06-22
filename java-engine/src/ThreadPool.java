import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.locks.ReentrantLock;

/**
 * ThreadPool implemented from scratch to demonstrate concurrency mechanisms.
 * Replaces java.util.concurrent wrappers with custom implementations.
 */
public class ThreadPool {
    public enum ThreadState {
        IDLE, RUNNING, TERMINATED
    }

    int coreThreads;
    int maxThreads;
    final long keepAliveTimeMs;
    final BlockingQueue<Task> taskQueue;
    final Set<Worker> workers = new HashSet<>();
    final ReentrantLock poolLock = new ReentrantLock();
    
    volatile boolean isShutdown = false;
    final AtomicInteger activeThreadsCount = new AtomicInteger(0);
    final AtomicInteger completedCount = new AtomicInteger(0);
    final AtomicInteger failedCount = new AtomicInteger(0);
    private final AtomicInteger threadIdGenerator = new AtomicInteger(1);

    public ThreadPool(int coreThreads, int maxThreads, int queueCapacity, long keepAliveTimeMs) {
        this.coreThreads = coreThreads;
        this.maxThreads = maxThreads;
        this.keepAliveTimeMs = keepAliveTimeMs;
        // Priority comparator: higher priority (10) comes first
        this.taskQueue = new BlockingQueue<>(queueCapacity, (t1, t2) -> Integer.compare(t2.getPriority(), t1.getPriority()));

        // Pre-start core threads
        poolLock.lock();
        try {
            for (int i = 0; i < coreThreads; i++) {
                addWorker(true);
            }
        } finally {
            poolLock.unlock();
        }
    }

    public boolean execute(Task task) {
        if (isShutdown) {
            return false;
        }

        poolLock.lock();
        try {
            // If we have fewer workers than core threads, spawn a new core worker
            if (workers.size() < coreThreads) {
                if (addWorker(true)) {
                    taskQueue.put(task);
                    return true;
                }
            }

            // Attempt to queue the task
            if (taskQueue.size() < 100) { // arbitrary bound or capacity
                taskQueue.put(task);
                return true;
            }

            // Queue is full! Try to scale up to maxThreads
            if (workers.size() < maxThreads) {
                if (addWorker(false)) {
                    taskQueue.put(task);
                    return true;
                }
            }

            // Queue is full and thread limit reached -> Reject or enqueue anyway (wait)
            taskQueue.put(task);
            return true;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return false;
        } finally {
            poolLock.unlock();
        }
    }

    private boolean addWorker(boolean isCore) {
        int id = threadIdGenerator.getAndIncrement();
        Worker worker = new Worker(id, isCore, this);
        workers.add(worker);
        worker.thread.start();
        return true;
    }

    public void setPoolSizes(int core, int max) {
        poolLock.lock();
        try {
            this.coreThreads = core;
            this.maxThreads = max;
            // Adjust workers if needed
            int currentSize = workers.size();
            if (currentSize < core) {
                for (int i = 0; i < core - currentSize; i++) {
                    addWorker(true);
                }
            }
        } finally {
            poolLock.unlock();
        }
    }

    public void shutdown() {
        poolLock.lock();
        try {
            isShutdown = true;
            for (Worker w : workers) {
                w.thread.interrupt();
            }
        } finally {
            poolLock.unlock();
        }
    }

    public void shutdownNow() {
        poolLock.lock();
        try {
            isShutdown = true;
            for (Worker w : workers) {
                w.thread.interrupt();
            }
            // Clear queue
            while (taskQueue.size() > 0) {
                try {
                    Task t = taskQueue.take();
                    t.setStatus(Task.Status.CANCELLED);
                } catch (InterruptedException e) {
                    break;
                }
            }
        } finally {
            poolLock.unlock();
        }
    }

    // Get statistics
    public int getActiveThreads() { return activeThreadsCount.get(); }
    public int getQueueSize() { return taskQueue.size(); }
    public int getCompletedCount() { return completedCount.get(); }
    public int getFailedCount() { return failedCount.get(); }
    public int getPoolSize() {
        poolLock.lock();
        try {
            return workers.size();
        } finally {
            poolLock.unlock();
        }
    }

    public List<Task> getQueueSnapshot() {
        return taskQueue.getSnapshot();
    }

    public List<WorkerStatus> getWorkerSnapshot() {
        poolLock.lock();
        try {
            List<WorkerStatus> list = new ArrayList<>();
            for (Worker w : workers) {
                list.add(new WorkerStatus(w.id, w.state, w.currentTaskId, w.isCore, w.runningTimeMs()));
            }
            return list;
        } finally {
            poolLock.unlock();
        }
    }

    public static class WorkerStatus {
        public final int threadId;
        public final ThreadState state;
        public final String currentTaskId;
        public final boolean isCore;
        public final long runningTimeMs;

        public WorkerStatus(int threadId, ThreadState state, String currentTaskId, boolean isCore, long runningTimeMs) {
            this.threadId = threadId;
            this.state = state;
            this.currentTaskId = currentTaskId;
            this.isCore = isCore;
            this.runningTimeMs = runningTimeMs;
        }
    }
}
