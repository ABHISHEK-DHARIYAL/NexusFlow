package com.nexusflow.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexusflow.config.ThreadPoolConfig;
import com.nexusflow.pool.NexusThreadPool;
import com.nexusflow.security.InternalAuthFilter;
import com.nexusflow.service.TaskExecutionService;
import com.nexusflow.service.WorkerService;
import com.sun.net.httpserver.HttpServer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

public class WorkerHttpServer {
    private static final Logger logger = LoggerFactory.getLogger(WorkerHttpServer.class);

    private final String host;
    private final int port;
    private final String secret;
    private final NexusThreadPool threadPool;
    private final TaskExecutionService taskExecutionService;
    private final WorkerService workerService;
    private final ObjectMapper objectMapper;
    private HttpServer server;

    public WorkerHttpServer(String host, int port, String secret, ThreadPoolConfig config) {
        this.host = host != null ? host : "0.0.0.0";
        this.port = port > 0 ? port : 8081;
        this.secret = secret;
        this.threadPool = new NexusThreadPool(config != null ? config : ThreadPoolConfig.defaultConfig());
        this.taskExecutionService = new TaskExecutionService(this.threadPool);
        this.workerService = new WorkerService(this.threadPool);
        this.objectMapper = new ObjectMapper();
    }

    public WorkerHttpServer(String host, int port, String secret, NexusThreadPool threadPool) {
        this.host = host != null ? host : "0.0.0.0";
        this.port = port > 0 ? port : 8081;
        this.secret = secret;
        this.threadPool = threadPool;
        this.taskExecutionService = new TaskExecutionService(this.threadPool);
        this.workerService = new WorkerService(this.threadPool);
        this.objectMapper = new ObjectMapper();
    }

    public synchronized void start() throws IOException {
        if (server != null) return;

        InternalAuthFilter authFilter = new InternalAuthFilter(secret);
        server = HttpServer.create(new InetSocketAddress(host, port), 0);
        server.setExecutor(Executors.newVirtualThreadPerTaskExecutor());

        TaskController taskController = new TaskController(taskExecutionService, authFilter, objectMapper);
        HealthController healthController = new HealthController(workerService, authFilter, objectMapper);
        MetricsController metricsController = new MetricsController(workerService, authFilter, objectMapper);

        server.createContext("/internal/tasks", taskController);
        server.createContext("/internal/health", healthController);
        server.createContext("/internal/metrics", metricsController);

        server.start();
        logger.info("WorkerHttpServer started on http://{}:{}", host, port);
    }

    public synchronized void stop() {
        if (server != null) {
            logger.info("Stopping WorkerHttpServer...");
            server.stop(1);
            server = null;
        }

        if (threadPool != null && !threadPool.isShutdown()) {
            logger.info("Shutting down NexusThreadPool...");
            threadPool.shutdown();
            try {
                threadPool.awaitTermination(3, TimeUnit.SECONDS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
        logger.info("WorkerHttpServer shutdown complete.");
    }

    public TaskExecutionService getTaskExecutionService() { return taskExecutionService; }
    public WorkerService getWorkerService() { return workerService; }
    public NexusThreadPool getThreadPool() { return threadPool; }
    public int getPort() { return port; }
}
