import { workerConfig } from './workerConfig';
import {
  JavaWorkerError,
  WorkerAuthenticationError,
  WorkerConnectionError,
  WorkerResponseError,
  WorkerTimeoutError,
} from './workerErrors';
import {
  TaskCancelResponseDTO,
  TaskStatusResponseDTO,
  TaskSubmitPayload,
  TaskSubmitResponseDTO,
  WorkerHealthDTO,
  WorkerMetricsDTO,
} from './workerTypes';
import { randomUUID } from 'crypto';

export class JavaWorkerClient {
  private readonly baseUrl: string;
  private readonly secret: string;
  private readonly requestTimeoutMs: number;

  constructor(baseUrl?: string, secret?: string, requestTimeoutMs?: number) {
    this.baseUrl = baseUrl || workerConfig.javaWorkerUrl;
    this.secret = secret || workerConfig.javaWorkerSecret;
    this.requestTimeoutMs = requestTimeoutMs || workerConfig.requestTimeoutMs;
  }

  private async request<T>(
    path: string,
    method: 'GET' | 'POST',
    body?: any,
    correlationId?: string
  ): Promise<T> {
    const cid = correlationId || randomUUID();
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.requestTimeoutMs);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Worker-Secret': this.secret,
          'X-Correlation-Id': cid,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (response.status === 401) {
        throw new WorkerAuthenticationError('Invalid worker secret supplied to Java worker.');
      }

      const resBody = await response.json().catch(() => ({}));

      if (!response.ok) {
        const code = resBody?.error?.code || 'WORKER_ERROR';
        const msg = resBody?.error?.message || `Worker returned HTTP status ${response.status}`;
        throw new WorkerResponseError(msg, response.status, code);
      }

      return resBody as T;
    } catch (err: any) {
      clearTimeout(timer);

      if (err instanceof JavaWorkerError) {
        throw err;
      }

      if (err.name === 'AbortError') {
        throw new WorkerTimeoutError(`Java worker request to ${path} timed out after ${this.requestTimeoutMs}ms`);
      }

      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.message?.includes('fetch failed')) {
        throw new WorkerConnectionError(`Failed to connect to Java worker at ${this.baseUrl}: ${err.message}`);
      }

      throw new JavaWorkerError(err.message || 'Unknown error communicating with Java worker', 'INTERNAL_WORKER_ERROR', 500);
    }
  }

  async submitTask(payload: TaskSubmitPayload, correlationId?: string): Promise<TaskSubmitResponseDTO> {
    return this.request<TaskSubmitResponseDTO>('/internal/tasks', 'POST', payload, correlationId);
  }

  async getTaskStatus(taskId: string, correlationId?: string): Promise<TaskStatusResponseDTO> {
    return this.request<TaskStatusResponseDTO>(`/internal/tasks/${taskId}`, 'GET', undefined, correlationId);
  }

  async cancelTask(taskId: string, correlationId?: string): Promise<TaskCancelResponseDTO> {
    return this.request<TaskCancelResponseDTO>(`/internal/tasks/${taskId}/cancel`, 'POST', undefined, correlationId);
  }

  async getHealth(correlationId?: string): Promise<WorkerHealthDTO> {
    return this.request<WorkerHealthDTO>('/internal/health', 'GET', undefined, correlationId);
  }

  async getMetrics(correlationId?: string): Promise<WorkerMetricsDTO> {
    return this.request<WorkerMetricsDTO>('/internal/metrics', 'GET', undefined, correlationId);
  }
}

export const javaWorkerClient = new JavaWorkerClient();
