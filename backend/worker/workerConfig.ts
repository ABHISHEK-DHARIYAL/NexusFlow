export const workerConfig = {
  javaWorkerUrl: process.env.JAVA_WORKER_URL || 'http://localhost:8081',
  javaWorkerSecret: process.env.JAVA_WORKER_SECRET || 'default_nexusflow_worker_secret_2026',
  connectTimeoutMs: parseInt(process.env.WORKER_CONNECT_TIMEOUT_MS || '2000', 10),
  requestTimeoutMs: parseInt(process.env.WORKER_REQUEST_TIMEOUT_MS || '5000', 10),
  pollIntervalMs: parseInt(process.env.TASK_POLL_INTERVAL_MS || '1000', 10),
  pollTimeoutMs: parseInt(process.env.TASK_POLL_TIMEOUT_MS || '30000', 10),
};
