package com.nexusflow.queue;

import com.nexusflow.task.NexusTask;
import com.nexusflow.task.TaskPriority;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.ReentrantLock;

public class NexusBlockingQueue<T extends NexusTask<?>> {
    private final int capacity;
    private final long agingFactorMs;
    private final long starvationThresholdMs;

    private final List<T> queue = new ArrayList<>();
    private final ReentrantLock lock = new ReentrantLock(true); // Fair lock
    private final Condition notEmpty = lock.newCondition();
    private final Condition notFull = lock.newCondition();

    private final AtomicLong sequenceGenerator = new AtomicLong(0);
    private volatile boolean isShutdown = false;

    public NexusBlockingQueue(int capacity) {
        this(capacity, 1000L, 3000L);
    }

    public NexusBlockingQueue(int capacity, long agingFactorMs, long starvationThresholdMs) {
        if (capacity <= 0) {
            throw new IllegalArgumentException("Queue capacity must be positive: " + capacity);
        }
        this.capacity = capacity;
        this.agingFactorMs = Math.max(10, agingFactorMs);
        this.starvationThresholdMs = Math.max(500, starvationThresholdMs);
    }

    public void put(T item) throws InterruptedException {
        if (item == null) throw new NullPointerException("Cannot put null item");
        lock.lockInterruptibly();
        try {
            while (queue.size() >= capacity && !isShutdown) {
                notFull.await();
            }
            if (isShutdown) {
                throw new IllegalStateException("Queue is shut down");
            }
            enqueueItem(item);
            notEmpty.signal();
        } finally {
            lock.unlock();
        }
    }

    public boolean offer(T item) {
        if (item == null) throw new NullPointerException("Cannot offer null item");
        lock.lock();
        try {
            if (queue.size() >= capacity || isShutdown) {
                return false;
            }
            enqueueItem(item);
            notEmpty.signal();
            return true;
        } finally {
            lock.unlock();
        }
    }

    public boolean offer(T item, long timeout, TimeUnit unit) throws InterruptedException {
        if (item == null) throw new NullPointerException("Cannot offer null item");
        long nanos = unit.toNanos(timeout);
        lock.lockInterruptibly();
        try {
            while (queue.size() >= capacity) {
                if (isShutdown) return false;
                if (nanos <= 0L) return false;
                nanos = notFull.awaitNanos(nanos);
            }
            if (isShutdown) return false;
            enqueueItem(item);
            notEmpty.signal();
            return true;
        } finally {
            lock.unlock();
        }
    }

    public T take() throws InterruptedException {
        lock.lockInterruptibly();
        try {
            while (queue.isEmpty() && !isShutdown) {
                notEmpty.await();
            }
            if (queue.isEmpty() && isShutdown) {
                return null;
            }
            T item = dequeueHighestPriorityItem();
            notFull.signal();
            return item;
        } finally {
            lock.unlock();
        }
    }

    public T poll() {
        lock.lock();
        try {
            if (queue.isEmpty()) {
                return null;
            }
            T item = dequeueHighestPriorityItem();
            notFull.signal();
            return item;
        } finally {
            lock.unlock();
        }
    }

    public T poll(long timeout, TimeUnit unit) throws InterruptedException {
        long nanos = unit.toNanos(timeout);
        lock.lockInterruptibly();
        try {
            while (queue.isEmpty()) {
                if (isShutdown) return null;
                if (nanos <= 0L) return null;
                nanos = notEmpty.awaitNanos(nanos);
            }
            if (queue.isEmpty() && isShutdown) return null;
            T item = dequeueHighestPriorityItem();
            notFull.signal();
            return item;
        } finally {
            lock.unlock();
        }
    }

    public T peek() {
        lock.lock();
        try {
            if (queue.isEmpty()) return null;
            int bestIndex = findHighestPriorityIndex();
            return queue.get(bestIndex);
        } finally {
            lock.unlock();
        }
    }

    public boolean remove(T item) {
        if (item == null) return false;
        lock.lock();
        try {
            boolean removed = queue.remove(item);
            if (removed) {
                notFull.signal();
            }
            return removed;
        } finally {
            lock.unlock();
        }
    }

    public int size() {
        lock.lock();
        try {
            return queue.size();
        } finally {
            lock.unlock();
        }
    }

    public boolean isEmpty() {
        lock.lock();
        try {
            return queue.isEmpty();
        } finally {
            lock.unlock();
        }
    }

    public int capacity() {
        return capacity;
    }

    public void clear() {
        lock.lock();
        try {
            queue.clear();
            notFull.signalAll();
        } finally {
            lock.unlock();
        }
    }

    public void shutdown() {
        lock.lock();
        try {
            isShutdown = true;
            notEmpty.signalAll();
            notFull.signalAll();
        } finally {
            lock.unlock();
        }
    }

    public boolean isShutdown() {
        return isShutdown;
    }

    private void enqueueItem(T item) {
        long now = System.currentTimeMillis();
        item.setEnqueueTime(now);
        item.setEnqueueSequence(sequenceGenerator.getAndIncrement());
        queue.add(item);
    }

    private T dequeueHighestPriorityItem() {
        int bestIndex = findHighestPriorityIndex();
        return queue.remove(bestIndex);
    }

    private int findHighestPriorityIndex() {
        if (queue.isEmpty()) {
            throw new IllegalStateException("Cannot find highest priority in empty queue");
        }

        long now = System.currentTimeMillis();
        int bestIndex = 0;
        double bestEffectivePriority = calculateEffectivePriority(queue.get(0), now);

        for (int i = 1; i < queue.size(); i++) {
            T candidate = queue.get(i);
            double candidatePriority = calculateEffectivePriority(candidate, now);

            if (candidatePriority > bestEffectivePriority) {
                bestEffectivePriority = candidatePriority;
                bestIndex = i;
            } else if (Double.compare(candidatePriority, bestEffectivePriority) == 0) {
                // FIFO tie-breaker based on enqueue sequence
                if (candidate.getEnqueueSequence() < queue.get(bestIndex).getEnqueueSequence()) {
                    bestEffectivePriority = candidatePriority;
                    bestIndex = i;
                }
            }
        }
        return bestIndex;
    }

    /**
     * Aging and Fairness formula:
     * Effective Priority = Base Priority Rank + (Wait Time / Aging Factor)
     * Starvation Guard: If wait time exceeds starvationThresholdMs, add heavy boost (+10.0).
     */
    public double calculateEffectivePriority(T task, long nowMs) {
        long waitTimeMs = Math.max(0, nowMs - task.getEnqueueTime());
        double baseRank = task.getPriority().getRank();
        double agingBonus = (double) waitTimeMs / (double) agingFactorMs;

        double starvationBonus = 0.0;
        if (waitTimeMs >= starvationThresholdMs) {
            starvationBonus = 10.0; // Guaranteed override for starved low-priority tasks
        }

        return baseRank + agingBonus + starvationBonus;
    }
}
