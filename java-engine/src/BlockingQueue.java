import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Custom Blocking Queue implementation using ReentrantLock and Condition variables.
 * Designed from scratch to demonstrate low-level concurrency and synchronization principles.
 */
public class BlockingQueue<T> {
    private final List<T> queue = new ArrayList<>();
    private final int capacity;
    private final ReentrantLock lock = new ReentrantLock();
    private final Condition notEmpty = lock.newCondition();
    private final Condition notFull = lock.newCondition();
    private final Comparator<T> comparator;

    public BlockingQueue(int capacity, Comparator<T> comparator) {
        this.capacity = capacity;
        this.comparator = comparator;
    }

    public void put(T item) throws InterruptedException {
        lock.lockInterruptibly();
        try {
            while (queue.size() >= capacity) {
                notFull.await();
            }
            queue.add(item);
            if (comparator != null) {
                Collections.sort(queue, comparator);
            }
            notEmpty.signal();
        } finally {
            lock.unlock();
        }
    }

    public T take() throws InterruptedException {
        lock.lockInterruptibly();
        try {
            while (queue.isEmpty()) {
                notEmpty.await();
            }
            T item = queue.remove(0);
            notFull.signal();
            return item;
        } finally {
            lock.unlock();
        }
    }

    public T poll(long timeoutMs) throws InterruptedException {
        lock.lockInterruptibly();
        try {
            long nanos = java.util.concurrent.TimeUnit.MILLISECONDS.toNanos(timeoutMs);
            while (queue.isEmpty()) {
                if (nanos <= 0) {
                    return null;
                }
                nanos = notEmpty.awaitNanos(nanos);
            }
            T item = queue.remove(0);
            notFull.signal();
            return item;
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

    public boolean remove(T item) {
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

    public List<T> getSnapshot() {
        lock.lock();
        try {
            return new ArrayList<>(queue);
        } finally {
            lock.unlock();
        }
    }
}
