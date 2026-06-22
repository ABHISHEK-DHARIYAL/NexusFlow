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

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  passwordHash: string; // BCrypt simulator
  profilePictureUrl: string;
  role: "USER" | "ADMIN";
  isActive: boolean;
  createdAt: number;
  lastLogin: number;
  refreshToken: string | null;
  refreshTokenExpiry: number | null;
}

export interface UserProfile {
  userId: string; // FK -> users.id, PRIMARY KEY
  githubUsername: string | null;
  leetcodeUsername: string | null;
  codeforcesUsername: string | null;
  youtubeChannelId: string | null;
  instagramUsername: string | null;
  twitterUsername: string | null;
  linkedinUsername: string | null;
  updatedAt: number;
  notificationMorningReport: boolean;
  notificationWeeklyGithub: boolean;
  notificationWeeklyLeetcode: boolean;
  notificationAnalyticsSync: boolean;
}

export interface Channel {
  id: string;
  userId: string;
  name: string;
  platform: "YOUTUBE" | "INSTAGRAM" | "TIKTOK" | "TWITTER";
  niche: string;
  postingFrequency: string;
  description: string;
  createdAt: number;
  isPrimary: boolean;
  colorTag: string;
}

export interface Workflow {
  id: string;
  userId: string;
  channelId: string;
  name: string;
  description: string;
  templateType: string; // "YOUTUBE_LONG", "YOUTUBE_SHORTS", "DEV_REPORT", "ANALYTICS_SYNC", "CUSTOM"
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
  createdAt: number;
  completedAt?: number;
}

export interface WorkflowTask {
  id: string;
  workflowId: string;
  stepOrder: number;
  taskType: TaskType;
  dependsOnStep: number | null; // index (1-indexed)
  priority: number;
  delayMs: number;
  retryCount: number;
  status: TaskStatus;
  schedulerTaskId?: string;
  aiPromptOverride?: string;
}

export interface AnalyticsSnapshot {
  id: string;
  channelId: string;
  recordedAt: number;
  views: number;
  likes: number;
  comments: number;
  subscribers: number;
  revenueUsd: number;
  watchTimeHours: number;
  period: "DAILY" | "WEEKLY" | "MONTHLY";
}

export interface AutomationJob {
  id: string;
  userId: string;
  name: string;
  jobType: "GITHUB_DAILY_REPORT" | "LEETCODE_DAILY_REPORT" | "WEEKLY_GITHUB_SUMMARY" | "WEEKLY_LEETCODE_SUMMARY" | "ANALYTICS_SYNC" | "CUSTOM_WORKFLOW";
  scheduleCron: string;
  configJson: string; // JSON with configurations
  isActive: boolean;
  lastRunAt?: number;
  nextRunAt?: number;
  createdAt: number;
}

export interface AutomationHistory {
  id: string;
  jobId: string;
  executedAt: number;
  status: "SUCCESS" | "FAILED";
  resultSummary: string;
  executionTimeMs: number;
  errorMessage?: string;
}

export interface PoolSnapshot {
  id: string;
  timestamp: number;
  activeThreads: number;
  queueSize: number;
  completedTotal: number;
  failedTotal: number;
  throughputPerMin: number;
  threadUtilization: number;
}

export interface TaskEntity {
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
  niche?: string;
  channelName?: string;
  topic?: string;
  resultText?: string;
  workDurationMs: number;
  failureProbability: number;
}

export interface DatabaseSchema {
  users: User[];
  userProfiles: UserProfile[];
  channels: Channel[];
  workflows: Workflow[];
  workflowTasks: WorkflowTask[];
  tasks: TaskEntity[]; // scheduler_tasks table
  analyticsSnapshots: AnalyticsSnapshot[];
  automationJobs: AutomationJob[];
  automationHistory: AutomationHistory[];
  poolSnapshots: PoolSnapshot[];
}
