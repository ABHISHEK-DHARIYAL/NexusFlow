export type TaskTypeDTO = 'ANALYSIS' | 'SYNC' | 'AI_SUMMARY' | 'METRICS_COLLECTION' | 'PR_REVIEW' | 'CUSTOM';
export type TaskPriorityDTO = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface TaskSubmitPayload {
  taskId: string;
  repositoryId?: string;
  userId?: string;
  taskType: TaskTypeDTO;
  priority?: TaskPriorityDTO;
  maxRetries?: number;
  scheduledAt?: string | null;
  payload?: Record<string, any>;
}

export interface TaskSubmitResponseDTO {
  taskId: string;
  status: string;
}

export interface TaskStatusResponseDTO {
  taskId: string;
  status: string;
  retryCount: number;
  startedAt?: string | null;
  completedAt?: string | null;
  executionTimeMs?: number | null;
  result?: any;
  error?: {
    code: string;
    message: string;
  } | null;
}

export interface TaskCancelResponseDTO {
  taskId: string;
  status: string;
  message: string;
}

export interface WorkerHealthDTO {
  status: 'UP' | 'DOWN';
  service: string;
  workerCount: number;
  activeWorkers: number;
}

export interface WorkerMetricsDTO {
  totalTasks: number;
  queuedTasks: number;
  runningTasks: number;
  completedTasks: number;
  failedTasks: number;
  cancelledTasks: number;
  retriedTasks: number;
  queueDepth: number;
  workerCount: number;
  activeWorkers: number;
  idleWorkers: number;
  throughput: number;
}
