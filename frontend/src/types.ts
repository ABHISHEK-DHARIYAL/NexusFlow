export enum TaskType {
  SIMPLE = "SIMPLE",
  PRIORITY = "PRIORITY",
  SCHEDULED = "SCHEDULED",
  RETRY = "RETRY",
  CANCELLABLE = "CANCELLABLE",
  
  // AI Generation task types
  AI_GENERATE_SCRIPT = "AI_GENERATE_SCRIPT",
  AI_GENERATE_TITLE = "AI_GENERATE_TITLE",
  AI_GENERATE_DESCRIPTION = "AI_GENERATE_DESCRIPTION",
  AI_GENERATE_TAGS = "AI_GENERATE_TAGS",
  AI_GENERATE_THUMBNAIL_PROMPT = "AI_GENERATE_THUMBNAIL_PROMPT",
  AI_GENERATE_HOOK = "AI_GENERATE_HOOK",
  AI_GENERATE_CAPTION = "AI_GENERATE_CAPTION",
  
  // Custom fetch and report operations
  FETCH_ANALYTICS = "FETCH_ANALYTICS",
  GENERATE_REPORT = "GENERATE_REPORT",
  FETCH_GITHUB_STATS = "FETCH_GITHUB_STATS",
  FETCH_LEETCODE_STATS = "FETCH_LEETCODE_STATS"
}

export enum TaskStatus {
  QUEUED = "QUEUED",
  RUNNING = "RUNNING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
  RETRYING = "RETRYING"
}

export interface Task {
  id: string;
  type: TaskType;
  priority: number;
  delayMs: number;
  status: TaskStatus;
  submittedAt: number;
  startedAt: number;
  completedAt: number;
  waitTimeMs: number;
  execTimeMs: number;
  threadId: string;
  retryCount: number;
  maxRetries: number;
  errorMessage: string;
  workflowId?: string;
  channelId?: string;
  topic?: string;
  niche?: string;
  channelName?: string;
  resultText?: string;
  workDurationMs: number;
  failureProbability: number;
}
