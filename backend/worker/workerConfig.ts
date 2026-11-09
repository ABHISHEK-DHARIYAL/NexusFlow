import { env } from '../config/env';

export const workerConfig = {
  javaWorkerUrl: env.JAVA_WORKER_URL,
  javaWorkerSecret: env.JAVA_WORKER_SECRET,
  connectTimeoutMs: parseInt(process.env.WORKER_CONNECT_TIMEOUT_MS || '2000', 10),
  requestTimeoutMs: parseInt(process.env.WORKER_REQUEST_TIMEOUT_MS || '5000', 10),
  pollIntervalMs: parseInt(process.env.TASK_POLL_INTERVAL_MS || '1000', 10),
  pollTimeoutMs: parseInt(process.env.TASK_POLL_TIMEOUT_MS || '30000', 10),
};
