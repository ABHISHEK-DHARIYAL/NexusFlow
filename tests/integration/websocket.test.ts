import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer, Server } from 'http';
import WebSocket from 'ws';
import { NexusWebSocketServer } from '../../backend/websocket/WebSocketServer';
import { applicationEventEmitter } from '../../backend/services/ApplicationEventEmitter';
import { leetCodeEventEmitter } from '../../backend/services/LeetCodeEventEmitter';
import { codeforcesEventEmitter } from '../../backend/services/CodeforcesService';
import { jobEventEmitter } from '../../backend/services/JobEventEmitter';
import { taskEventEmitter } from '../../backend/services/TaskEventEmitter';

describe('WebSocket Real-Time Transport Integration Tests', () => {
  let server: Server;
  let wsServer: NexusWebSocketServer;
  let serverPort: number;

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = createServer((req, res) => {
        res.writeHead(200);
        res.end('HTTP Server Active');
      });

      wsServer = new NexusWebSocketServer();

      server.listen(0, '127.0.0.1', () => {
        const addr = server.address() as any;
        serverPort = addr.port;
        wsServer.init(server, '/ws');
        resolve();
      });
    });
  });

  afterAll(async () => {
    wsServer.close();
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('should allow connection with valid mock access token', async () => {
    const ws = new WebSocket(`ws://127.0.0.1:${serverPort}/ws?token=mock_user-123`);

    const receivedMessage = await new Promise<any>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout waiting for connection message')), 3000);
      ws.on('message', (data) => {
        clearTimeout(timeout);
        resolve(JSON.parse(data.toString()));
      });
      ws.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    expect(receivedMessage.type).toBe('connection:established');
    expect(receivedMessage.data.userId).toBe('user-123');
    expect(receivedMessage.data.status).toBe('CONNECTED');

    ws.close();
  });

  it('should reject connection with invalid token', async () => {
    const ws = new WebSocket(`ws://127.0.0.1:${serverPort}/ws?token=invalid_garbage_token`);

    const closeCode = await new Promise<number>((resolve) => {
      ws.on('close', (code) => {
        resolve(code);
      });
    });

    expect(closeCode).toBe(4001);
  });

  it('should enforce user isolation (User A receives User A events, User B does not)', async () => {
    const wsUserA = new WebSocket(`ws://127.0.0.1:${serverPort}/ws?token=mock_user-123`);
    const wsUserB = new WebSocket(`ws://127.0.0.1:${serverPort}/ws?token=mock_user-456`);

    // Wait for both connections to establish
    await new Promise((r) => setTimeout(r, 200));

    let userAMessages: any[] = [];
    let userBMessages: any[] = [];

    wsUserA.on('message', (data) => {
      const parsed = JSON.parse(data.toString());
      if (parsed.type !== 'connection:established') {
        userAMessages.push(parsed);
      }
    });

    wsUserB.on('message', (data) => {
      const parsed = JSON.parse(data.toString());
      if (parsed.type !== 'connection:established') {
        userBMessages.push(parsed);
      }
    });

    // Dispatch event specifically to user-123 (User A)
    applicationEventEmitter.emit('application:created', {
      userId: 'user-123',
      applicationId: 'app-999',
      companyName: 'Google',
      jobTitle: 'Senior Software Engineer',
    });

    await new Promise((r) => setTimeout(r, 300));

    expect(userAMessages.length).toBe(1);
    expect(userAMessages[0].type).toBe('application:created');
    expect(userAMessages[0].data.applicationId).toBe('app-999');

    // User B should receive 0 messages intended for User A
    expect(userBMessages.length).toBe(0);

    wsUserA.close();
    wsUserB.close();
  });

  it('should forward LeetCode, Codeforces, Job, and Task events via EventEmitter', async () => {
    const ws = new WebSocket(`ws://127.0.0.1:${serverPort}/ws?token=mock_user-123`);

    // Wait for connection
    await new Promise((r) => setTimeout(r, 200));

    const receivedEvents: string[] = [];

    ws.on('message', (data) => {
      const parsed = JSON.parse(data.toString());
      if (parsed.type !== 'connection:established') {
        receivedEvents.push(parsed.type);
      }
    });

    // Trigger LeetCode event
    leetCodeEventEmitter.emit('leetcode:sync_started', {
      userId: 'user-123',
      username: 'testdev',
      taskId: 'task-lc-1',
    });

    // Trigger Codeforces event
    codeforcesEventEmitter.emit('codeforces:sync_completed', {
      userId: 'user-123',
      handle: 'tourist',
      rating: 3800,
    });

    // Trigger Job readiness event
    jobEventEmitter.emit('job_readiness:completed', {
      userId: 'user-123',
      jobId: 'job-55',
      matchScore: 92,
    });

    // Trigger Task event
    taskEventEmitter.emit('task:progress', {
      userId: 'user-123',
      taskId: 'task-101',
      progress: 75,
    });

    await new Promise((r) => setTimeout(r, 400));

    expect(receivedEvents).toContain('leetcode:sync_started');
    expect(receivedEvents).toContain('codeforces:sync_completed');
    expect(receivedEvents).toContain('job_readiness:completed');
    expect(receivedEvents).toContain('task:progress');

    ws.close();
  });

  it('should handle ping and pong messages', async () => {
    const ws = new WebSocket(`ws://127.0.0.1:${serverPort}/ws?token=mock_user-123`);

    await new Promise((r) => setTimeout(r, 200));

    const pongReceived = new Promise<boolean>((resolve) => {
      ws.on('message', (data) => {
        const parsed = JSON.parse(data.toString());
        if (parsed.type === 'pong') {
          resolve(true);
        }
      });
    });

    ws.send(JSON.stringify({ type: 'ping' }));

    const res = await pongReceived;
    expect(res).toBe(true);

    ws.close();
  });
});
