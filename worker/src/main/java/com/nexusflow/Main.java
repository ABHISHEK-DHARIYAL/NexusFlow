package com.nexusflow;

import com.nexusflow.api.WorkerHttpServer;
import com.nexusflow.config.ThreadPoolConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Main {
    private static final Logger logger = LoggerFactory.getLogger(Main.class);

    public static void main(String[] args) throws Exception {
        logger.info("==================================================");
        logger.info("  NexusFlow Java Concurrency Engine & Worker Service");
        logger.info("==================================================");

        String host = System.getenv().getOrDefault("WORKER_HOST", "0.0.0.0");
        int port = Integer.parseInt(System.getenv().getOrDefault("WORKER_PORT", "8081"));
        String secret = System.getenv().getOrDefault("JAVA_WORKER_SECRET", "default_nexusflow_worker_secret_2026");

        int minWorkers = Integer.parseInt(System.getenv().getOrDefault("MIN_WORKERS", "2"));
        int maxWorkers = Integer.parseInt(System.getenv().getOrDefault("MAX_WORKERS", "8"));
        int queueCapacity = Integer.parseInt(System.getenv().getOrDefault("QUEUE_CAPACITY", "200"));

        ThreadPoolConfig config = new ThreadPoolConfig(
            minWorkers,
            maxWorkers,
            queueCapacity,
            2000,
            500,
            1500,
            3,
            100,
            1000,
            2.0
        );

        WorkerHttpServer server = new WorkerHttpServer(host, port, secret, config);
        server.start();

        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            logger.info("JVM shutdown hook triggered. Shutting down worker server...");
            server.stop();
        }));

        logger.info("Worker service active and listening for Node.js requests on port {}", port);
    }
}
