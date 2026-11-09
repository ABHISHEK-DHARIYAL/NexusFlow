import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { JavaWorkerClient } from '../../backend/worker/JavaWorkerClient';
import {
  WorkerAuthenticationError,
  WorkerConnectionError,
} from '../../backend/worker/workerErrors';
import { createServer, Server } from 'http';

describe('Node.js <-> Java Worker Client Integration Tests', () => {
  let mockServer: Server;
  let mockPort: number;
  const validSecret = 'test_secret_key_2026';

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      mockServer = createServer((req, res) => {
        const secretHeader = req.headers['x-worker-secret'];
        const correlationId = req.headers['x-correlation-id'] || 'test-cid';

        res.setHeader('X-Correlation-Id', correlationId as string);
        res.setHeader('Content-Type', 'application/json');

        if (secretHeader !== validSecret) {
          res.writeHead(401);
          res.end(JSON.stringify({ error: { code: 'WORKER_UNAUTHORIZED', message: 'Unauthorized' } }));
          return;
        }

        if (req.url === '/internal/health' && req.method === 'GET') {
          res.writeHead(200);
          res.end(JSON.stringify({ status: 'UP', service: 'nexusflow-worker', workerCount: 4, activeWorkers: 1 }));
        } else if (req.url === '/internal/metrics' && req.method === 'GET') {
          res.writeHead(200);
          res.end(JSON.stringify({ totalTasks: 10, queuedTasks: 0, runningTasks: 1, completedTasks: 9 }));
        } else if (req.url === '/internal/tasks' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            const parsed = JSON.parse(body || '{}');
            res.writeHead(202);
            res.end(JSON.stringify({ taskId: parsed.taskId, status: 'QUEUED' }));
          });
        } else if (req.url?.startsWith('/internal/tasks/') && req.url.endsWith('/cancel') && req.method === 'POST') {
          const parts = req.url.split('/');
          const taskId = parts[3];
          res.writeHead(200);
          res.end(JSON.stringify({ taskId, status: 'CANCELLED', message: 'Task cancelled successfully' }));
        } else if (req.url?.startsWith('/internal/tasks/') && req.method === 'GET') {
          const taskId = req.url.replace('/internal/tasks/', '');
          res.writeHead(200);
          res.end(JSON.stringify({
            taskId,
            status: 'COMPLETED',
            retryCount: 0,
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            executionTimeMs: 45,
            result: { processedBy: 'JavaWorkerEngine' },
            error: null,
          }));
        } else {
          res.writeHead(404);
          res.end(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Not found' } }));
        }
      });

      mockServer.listen(0, '127.0.0.1', () => {
        const addr = mockServer.address() as any;
        mockPort = addr.port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      if (mockServer) {
        mockServer.close(() => resolve());
      } else {
        resolve();
      }
    });
  });

  it('should successfully query worker health endpoint', async () => {
    const client = new JavaWorkerClient(`http://127.0.0.1:${mockPort}`, validSecret, 2000);
    const health = await client.getHealth();
    expect(health.status).toBe('UP');
    expect(health.service).toBe('nexusflow-worker');
    expect(health.workerCount).toBe(4);
  });

  it('should successfully submit a task to Java worker', async () => {
    const client = new JavaWorkerClient(`http://127.0.0.1:${mockPort}`, validSecret, 2000);
    const res = await client.submitTask({
      taskId: 'task-node-001',
      taskType: 'ANALYSIS',
      priority: 'HIGH',
      maxRetries: 3,
      payload: { repo: 'nexusflow' },
    });

    expect(res.taskId).toBe('task-node-001');
    expect(res.status).toBe('QUEUED');
  });

  it('should retrieve task status from Java worker', async () => {
    const client = new JavaWorkerClient(`http://127.0.0.1:${mockPort}`, validSecret, 2000);
    const status = await client.getTaskStatus('task-node-001');

    expect(status.taskId).toBe('task-node-001');
    expect(status.status).toBe('COMPLETED');
    expect(status.executionTimeMs).toBe(45);
  });

  it('should cancel a task on Java worker', async () => {
    const client = new JavaWorkerClient(`http://127.0.0.1:${mockPort}`, validSecret, 2000);
    const cancelRes = await client.cancelTask('task-node-001');

    expect(cancelRes.taskId).toBe('task-node-001');
    expect(cancelRes.status).toBe('CANCELLED');
  });

  it('should fetch metrics from Java worker', async () => {
    const client = new JavaWorkerClient(`http://127.0.0.1:${mockPort}`, validSecret, 2000);
    const metrics = await client.getMetrics();

    expect(metrics.totalTasks).toBe(10);
    expect(metrics.completedTasks).toBe(9);
  });

  it('should throw WorkerAuthenticationError on invalid secret', async () => {
    const client = new JavaWorkerClient(`http://127.0.0.1:${mockPort}`, 'wrong_secret', 2000);
    await expect(client.getHealth()).rejects.toThrow(WorkerAuthenticationError);
  });

  it('should throw WorkerConnectionError if server port is unreachable', async () => {
    const client = new JavaWorkerClient(`http://127.0.0.1:59999`, validSecret, 1000);
    await expect(client.getHealth()).rejects.toThrow(WorkerConnectionError);
  });
});
