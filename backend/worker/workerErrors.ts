export class JavaWorkerError extends Error {
  constructor(message: string, public readonly code: string, public readonly statusCode?: number) {
    super(message);
    this.name = 'JavaWorkerError';
  }
}

export class WorkerConnectionError extends JavaWorkerError {
  constructor(message: string) {
    super(message, 'WORKER_CONNECTION_ERROR', 503);
    this.name = 'WorkerConnectionError';
  }
}

export class WorkerTimeoutError extends JavaWorkerError {
  constructor(message: string) {
    super(message, 'WORKER_TIMEOUT_ERROR', 504);
    this.name = 'WorkerTimeoutError';
  }
}

export class WorkerAuthenticationError extends JavaWorkerError {
  constructor(message: string) {
    super(message, 'WORKER_UNAUTHORIZED', 401);
    this.name = 'WorkerAuthenticationError';
  }
}

export class WorkerResponseError extends JavaWorkerError {
  constructor(message: string, statusCode: number, code: string = 'WORKER_RESPONSE_ERROR') {
    super(message, code, statusCode);
    this.name = 'WorkerResponseError';
  }
}
