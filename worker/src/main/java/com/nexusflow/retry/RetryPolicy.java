package com.nexusflow.retry;

import java.util.Random;

public class RetryPolicy {
    private final int maxRetries;
    private final long initialBackoffMs;
    private final long maxBackoffMs;
    private final double backoffMultiplier;
    private final boolean jitter;
    private final Random random = new Random();

    public RetryPolicy(int maxRetries, long initialBackoffMs, long maxBackoffMs, double backoffMultiplier, boolean jitter) {
        this.maxRetries = Math.max(0, maxRetries);
        this.initialBackoffMs = Math.max(1, initialBackoffMs);
        this.maxBackoffMs = Math.max(initialBackoffMs, maxBackoffMs);
        this.backoffMultiplier = Math.max(1.0, backoffMultiplier);
        this.jitter = jitter;
    }

    public static RetryPolicy defaultPolicy() {
        return new RetryPolicy(3, 200L, 5000L, 2.0, true);
    }

    public boolean canRetry(int currentRetryCount, Throwable throwable) {
        if (currentRetryCount >= maxRetries) {
            return false;
        }
        return isRetryableException(throwable);
    }

    public boolean isRetryableException(Throwable throwable) {
        if (throwable == null) return false;
        if (throwable instanceof InterruptedException) return false;
        if (throwable instanceof IllegalArgumentException) return false;
        if (throwable instanceof IllegalStateException) return false;
        return true;
    }

    public long calculateBackoffDelayMs(int currentRetryAttempt) {
        if (currentRetryAttempt <= 0) return 0L;

        double delay = initialBackoffMs * Math.pow(backoffMultiplier, currentRetryAttempt - 1);
        long cappedDelay = (long) Math.min(maxBackoffMs, delay);

        if (!jitter) {
            return cappedDelay;
        }

        // Add 20% randomized jitter
        double jitterFactor = 0.8 + (random.nextDouble() * 0.4); // 0.8 to 1.2
        return (long) (cappedDelay * jitterFactor);
    }

    public int getMaxRetries() { return maxRetries; }
    public long getInitialBackoffMs() { return initialBackoffMs; }
    public long getMaxBackoffMs() { return maxBackoffMs; }
    public double getBackoffMultiplier() { return backoffMultiplier; }
}
