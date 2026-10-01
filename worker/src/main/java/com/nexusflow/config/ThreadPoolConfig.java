package com.nexusflow.config;

public record ThreadPoolConfig(
    int minWorkers,
    int maxWorkers,
    int queueCapacity,
    long idleTimeoutMs,
    long agingFactorMs,
    long starvationThresholdMs,
    int defaultMaxRetries,
    long initialBackoffMs,
    long maxBackoffMs,
    double backoffMultiplier
) {
    public static ThreadPoolConfig defaultConfig() {
        return new ThreadPoolConfig(
            2,          // minWorkers
            10,         // maxWorkers
            1000,       // queueCapacity
            5000,       // idleTimeoutMs (5s)
            1000,       // agingFactorMs (1000ms wait adds effective priority)
            3000,       // starvationThresholdMs
            3,          // defaultMaxRetries
            200,        // initialBackoffMs
            5000,       // maxBackoffMs
            2.0         // backoffMultiplier
        );
    }
}
