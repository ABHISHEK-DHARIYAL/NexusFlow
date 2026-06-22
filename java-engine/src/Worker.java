/**
 * Standalone Worker class executing tasks loop on a separate Thread.
 */
public class Worker implements Runnable {
    final int id;
    final Thread thread;
    final boolean isCore;
    final ThreadPool pool;
    
    volatile ThreadPool.ThreadState state = ThreadPool.ThreadState.IDLE;
    volatile String currentTaskId = "";
    volatile long taskStartedAt = 0;

    public Worker(int id, boolean isCore, ThreadPool pool) {
        this.id = id;
        this.isCore = isCore;
        this.pool = pool;
        this.thread = new Thread(this, "ThreadForge-Worker-" + id);
    }

    public long runningTimeMs() {
        if (taskStartedAt == 0) return 0;
        return System.currentTimeMillis() - taskStartedAt;
    }

    @Override
    public void run() {
        try {
            while (!pool.isShutdown && !Thread.currentThread().isInterrupted()) {
                state = ThreadPool.ThreadState.IDLE;
                currentTaskId = "";
                taskStartedAt = 0;

                // Fetch task from Blocking Queue (with or without keep-alive pull)
                Task task;
                if (isCore) {
                    task = pool.taskQueue.take();
                } else {
                    task = pool.taskQueue.poll(pool.keepAliveTimeMs);
                    if (task == null) {
                        // Idle timeout for non-core thread -> Terminate
                        break;
                    }
                }

                // Process task
                state = ThreadPool.ThreadState.RUNNING;
                currentTaskId = task.getId();
                taskStartedAt = System.currentTimeMillis();
                pool.activeThreadsCount.incrementAndGet();

                task.setStatus(Task.Status.RUNNING);
                task.setStartedAt(taskStartedAt);
                task.setThreadId(String.valueOf(id));

                // Broadcast task started via stdout (stdout channel for Node.js)
                System.out.println("STATUS_UPDATE: " + task.toJSON());

                try {
                    task.run();
                    task.setStatus(Task.Status.COMPLETED);
                    pool.completedCount.incrementAndGet();
                } catch (Exception e) {
                    task.setErrorMessage(e.getMessage() != null ? e.getMessage() : "Exception");
                    
                    // Handle Retry
                    if (task.getCurrentRetryAttempt() < task.getMaxRetries()) {
                        task.incrementRetryAttempt();
                        task.setStatus(Task.Status.QUEUED);
                        pool.taskQueue.put(task); // Re-queue
                        System.out.println("RETRY_TRIGGERED: " + task.toJSON());
                    } else {
                        task.setStatus(Task.Status.FAILED);
                        pool.failedCount.incrementAndGet();
                    }
                } finally {
                    task.setCompletedAt(System.currentTimeMillis());
                    pool.activeThreadsCount.decrementAndGet();
                    System.out.println("TASK_FINISHED: " + task.toJSON());
                }
            }
        } catch (InterruptedException e) {
            // Thread interrupted on shutdown
        } finally {
            state = ThreadPool.ThreadState.TERMINATED;
            pool.poolLock.lock();
            try {
                pool.workers.remove(this);
            } finally {
                pool.poolLock.unlock();
            }
            // Notify exit
            System.out.println(String.format("THREAD_EXIT: {\"threadId\":%d,\"type\":\"%s\"}", id, isCore ? "CORE" : "TEMPORARY"));
        }
    }
}
