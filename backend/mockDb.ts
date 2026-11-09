// NexusFlow Mock & Local In-Memory Repository Persistence Layer
import {
  User,
  Repository,
  Task,
  Worker,
  WorkerMetrics,
  AIAnalysisReport,
  TaskExecutionLog,
  Notification,
  DashboardSummary,
  AIFinding,
  ScheduledJob,
  ScheduledJobExecution
} from '../types.js';

export class NexusDatabase {
  private static instance: NexusDatabase;

  public currentUser: User = {
    id: 'usr_01h8x9p3',
    name: 'Alex Rivera',
    username: 'arivera-dev',
    email: 'alex.rivera@nexusflow.dev',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    githubId: '8910234',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  public scheduledJobs: ScheduledJob[] = [
    {
      id: 'sched_github_daily',
      userId: 'usr_01h8x9p3',
      name: 'Daily GitHub Sync',
      description: 'Synchronizes commit history, issues, and PR health across all connected repositories daily.',
      jobType: 'GITHUB_SYNC',
      schedule: '0 9 * * *',
      frequency: 'DAILY',
      time: '09:00',
      timezone: 'UTC',
      enabled: true,
      status: 'ACTIVE',
      lastRunAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      nextRunAt: new Date(Date.now() + 3600000 * 12).toISOString(),
      lastStatus: 'COMPLETED',
      lastError: null,
      consecutiveFailures: 0,
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'sched_career_report_weekly',
      userId: 'usr_01h8x9p3',
      name: 'Weekly Career Report',
      description: 'Generates a fresh multi-vector career progress & readiness report every Monday.',
      jobType: 'CAREER_REPORT',
      schedule: '0 9 * * 1',
      frequency: 'WEEKLY',
      time: '09:00',
      timezone: 'UTC',
      enabled: true,
      status: 'ACTIVE',
      lastRunAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      nextRunAt: new Date(Date.now() + 3600000 * 120).toISOString(),
      lastStatus: 'COMPLETED',
      lastError: null,
      consecutiveFailures: 0,
      createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'sched_codeforces_weekly',
      userId: 'usr_01h8x9p3',
      name: 'Weekly Codeforces Sync',
      description: 'Updates Codeforces contest ratings, tag weaknesses, and submission metrics.',
      jobType: 'CODEFORCES_SYNC',
      schedule: '0 9 * * 1',
      frequency: 'WEEKLY',
      time: '09:00',
      timezone: 'UTC',
      enabled: true,
      status: 'FAILED',
      lastRunAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      nextRunAt: new Date(Date.now() + 3600000 * 165).toISOString(),
      lastStatus: 'FAILED',
      lastError: 'Codeforces API Rate Limit Exceeded (HTTP 429)',
      consecutiveFailures: 3,
      createdAt: new Date(Date.now() - 21 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'sched_app_followup_check',
      userId: 'usr_01h8x9p3',
      name: 'Application Follow-up Check',
      description: 'Scans active job applications for overdue follow-ups, upcoming interviews, and stalled status.',
      jobType: 'APPLICATION_FOLLOWUP_CHECK',
      schedule: '0 9 * * *',
      frequency: 'DAILY',
      time: '09:00',
      timezone: 'UTC',
      enabled: true,
      status: 'ACTIVE',
      lastRunAt: new Date(Date.now() - 3600000 * 18).toISOString(),
      nextRunAt: new Date(Date.now() + 3600000 * 6).toISOString(),
      lastStatus: 'COMPLETED',
      lastError: null,
      consecutiveFailures: 0,
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  public scheduledExecutions: ScheduledJobExecution[] = [
    {
      id: 'exec_gh_sync_01',
      scheduledJobId: 'sched_github_daily',
      userId: 'usr_01h8x9p3',
      taskId: 'task_gh_sync_01',
      scheduledOccurrence: new Date(Date.now() - 3600000 * 24).toISOString(),
      startedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      completedAt: new Date(Date.now() - 3600000 * 24 + 12000).toISOString(),
      status: 'COMPLETED',
      error: null,
      durationMs: 12000,
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
    {
      id: 'exec_cf_sync_01',
      scheduledJobId: 'sched_codeforces_weekly',
      userId: 'usr_01h8x9p3',
      taskId: 'task_cf_sync_01',
      scheduledOccurrence: new Date(Date.now() - 3600000 * 3).toISOString(),
      startedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      completedAt: new Date(Date.now() - 3600000 * 3 + 4500).toISOString(),
      status: 'FAILED',
      error: 'Codeforces API Rate Limit Exceeded (HTTP 429)',
      durationMs: 4500,
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
  ];

  public repositories: Repository[] = [
    {
      id: 'repo_01',
      userId: 'usr_01h8x9p3',
      githubRepoId: 10192830,
      owner: 'nexusflow-dev',
      name: 'nexusflow-core',
      fullName: 'nexusflow-dev/nexusflow-core',
      description: 'Distributed execution engine and developer intelligence gateway written in Java & TypeScript.',
      defaultBranch: 'main',
      visibility: 'PUBLIC',
      language: 'Java',
      starsCount: 1420,
      forksCount: 238,
      openIssues: 12,
      githubUrl: 'https://github.com/nexusflow-dev/nexusflow-core',
      cloneUrl: 'https://github.com/nexusflow-dev/nexusflow-core.git',
      lastSyncedAt: new Date().toISOString(),
      createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
      healthScore: 92,
      lastAnalyzedAt: new Date(Date.now() - 3600000).toISOString(),
      latestReportId: 'rep_01',
    },
    {
      id: 'repo_02',
      userId: 'usr_01h8x9p3',
      githubRepoId: 20491823,
      owner: 'nexusflow-dev',
      name: 'quantum-cache-proxy',
      fullName: 'nexusflow-dev/quantum-cache-proxy',
      description: 'High-performance multi-level caching layer with Redis & Memcached backing.',
      defaultBranch: 'main',
      visibility: 'PUBLIC',
      language: 'TypeScript',
      starsCount: 840,
      forksCount: 94,
      openIssues: 5,
      githubUrl: 'https://github.com/nexusflow-dev/quantum-cache-proxy',
      cloneUrl: 'https://github.com/nexusflow-dev/quantum-cache-proxy.git',
      lastSyncedAt: new Date(Date.now() - 7200000).toISOString(),
      createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
      healthScore: 78,
      lastAnalyzedAt: new Date(Date.now() - 14400000).toISOString(),
      latestReportId: 'rep_02',
    },
    {
      id: 'repo_03',
      userId: 'usr_01h8x9p3',
      githubRepoId: 30918273,
      owner: 'nexusflow-dev',
      name: 'microservice-auth-gateway',
      fullName: 'nexusflow-dev/microservice-auth-gateway',
      description: 'Zero-trust OAuth2 & JWT authentication sidecar proxy.',
      defaultBranch: 'master',
      visibility: 'PRIVATE',
      language: 'Go',
      starsCount: 310,
      forksCount: 41,
      openIssues: 8,
      githubUrl: 'https://github.com/nexusflow-dev/microservice-auth-gateway',
      cloneUrl: 'https://github.com/nexusflow-dev/microservice-auth-gateway.git',
      lastSyncedAt: new Date(Date.now() - 86400000).toISOString(),
      createdAt: new Date(Date.now() - 120 * 86400000).toISOString(),
      healthScore: 65,
      lastAnalyzedAt: new Date(Date.now() - 86400000).toISOString(),
      latestReportId: 'rep_03',
    }
  ];

  public workers: Worker[] = [
    {
      id: 'wrk_01',
      workerId: 'java-concurrency-node-alpha',
      hostIdentifier: 'railway-worker-us-east-1a',
      status: 'BUSY',
      currentTaskId: 'task_101',
      currentTaskName: 'nexusflow-core (FULL_SCAN)',
      activeThreads: 8,
      maxThreads: 16,
      startedAt: new Date(Date.now() - 86400000).toISOString(),
      lastHeartbeat: new Date().toISOString(),
      tasksCompleted: 142,
      tasksFailed: 3,
    },
    {
      id: 'wrk_02',
      workerId: 'java-concurrency-node-beta',
      hostIdentifier: 'railway-worker-eu-central-1',
      status: 'IDLE',
      activeThreads: 2,
      maxThreads: 12,
      startedAt: new Date(Date.now() - 43200000).toISOString(),
      lastHeartbeat: new Date().toISOString(),
      tasksCompleted: 98,
      tasksFailed: 1,
    },
    {
      id: 'wrk_03',
      workerId: 'java-concurrency-node-gamma',
      hostIdentifier: 'railway-worker-asia-east-1',
      status: 'BUSY',
      currentTaskId: 'task_102',
      currentTaskName: 'quantum-cache-proxy (SECURITY_AUDIT)',
      activeThreads: 6,
      maxThreads: 16,
      startedAt: new Date(Date.now() - 172800000).toISOString(),
      lastHeartbeat: new Date().toISOString(),
      tasksCompleted: 210,
      tasksFailed: 5,
    }
  ];

  public tasks: Task[] = [
    {
      id: 'task_101',
      repositoryId: 'repo_01',
      repositoryName: 'nexusflow-dev/nexusflow-core',
      userId: 'usr_01h8x9p3',
      taskType: 'FULL_SCAN',
      priority: 'HIGH',
      status: 'RUNNING',
      progress: 68,
      retryCount: 0,
      maxRetries: 3,
      startedAt: new Date(Date.now() - 120000).toISOString(),
      workerId: 'wrk_01',
      createdAt: new Date(Date.now() - 150000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task_102',
      repositoryId: 'repo_02',
      repositoryName: 'nexusflow-dev/quantum-cache-proxy',
      userId: 'usr_01h8x9p3',
      taskType: 'SECURITY_AUDIT',
      priority: 'CRITICAL',
      status: 'RUNNING',
      progress: 42,
      retryCount: 0,
      maxRetries: 3,
      startedAt: new Date(Date.now() - 80000).toISOString(),
      workerId: 'wrk_03',
      createdAt: new Date(Date.now() - 90000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task_103',
      repositoryId: 'repo_03',
      repositoryName: 'nexusflow-dev/microservice-auth-gateway',
      userId: 'usr_01h8x9p3',
      taskType: 'ARCHITECTURE_REVIEW',
      priority: 'MEDIUM',
      status: 'QUEUED',
      progress: 0,
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date(Date.now() - 30000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task_100',
      repositoryId: 'repo_01',
      repositoryName: 'nexusflow-dev/nexusflow-core',
      userId: 'usr_01h8x9p3',
      taskType: 'CODE_QUALITY_CHECK',
      priority: 'LOW',
      status: 'COMPLETED',
      progress: 100,
      retryCount: 0,
      maxRetries: 3,
      startedAt: new Date(Date.now() - 3600000).toISOString(),
      completedAt: new Date(Date.now() - 3400000).toISOString(),
      workerId: 'wrk_01',
      createdAt: new Date(Date.now() - 3700000).toISOString(),
      updatedAt: new Date(Date.now() - 3400000).toISOString(),
    }
  ];

  public taskLogs: TaskExecutionLog[] = [
    {
      id: 'log_01',
      taskId: 'task_101',
      workerId: 'wrk_01',
      level: 'INFO',
      message: '[Java Worker] Claimed task task_101 from PriorityBlockingQueue (Weight: 300)',
      timestamp: new Date(Date.now() - 120000).toISOString(),
    },
    {
      id: 'log_02',
      taskId: 'task_101',
      workerId: 'wrk_01',
      level: 'INFO',
      message: '[GitHub API] Fetched repository AST and file manifest for nexusflow-core',
      timestamp: new Date(Date.now() - 100000).toISOString(),
    },
    {
      id: 'log_03',
      taskId: 'task_101',
      workerId: 'wrk_01',
      level: 'DEBUG',
      message: '[Concurrency Pool] Allocated 4 parallel worker threads in ReentrantLock context',
      timestamp: new Date(Date.now() - 80000).toISOString(),
    },
    {
      id: 'log_04',
      taskId: 'task_101',
      workerId: 'wrk_01',
      level: 'INFO',
      message: '[Gemini AI Orchestrator] Invoking Google Gemini model gemini-3.6-flash for static code audit',
      timestamp: new Date(Date.now() - 40000).toISOString(),
    }
  ];

  public reports: AIAnalysisReport[] = [
    {
      id: 'rep_01',
      repositoryId: 'repo_01',
      taskId: 'task_100',
      overallScore: 92,
      securityScore: 95,
      performanceScore: 89,
      architectureScore: 94,
      maintainabilityScore: 91,
      documentationScore: 90,
      summary: 'NexusFlow Core architecture demonstrates excellent separation of concerns with clean ThreadPool management and robust exception propagation. Concurrency handling in worker modules passes dead-lock safety checks.',
      recommendations: [
        'Replace explicit synchronized blocks with ReentrantReadWriteLock in high-frequency cache read paths.',
        'Add structured JSON logging format to simplify Railway log aggregation.',
        'Update Gemini API client request timeout from 15s to 30s for large codebase payloads.'
      ],
      modelName: 'gemini-3.6-flash',
      modelVersion: '1.0.0',
      analyzedAt: new Date(Date.now() - 3400000).toISOString(),
      findings: [
        {
          id: 'find_101',
          reportId: 'rep_01',
          category: 'PERFORMANCE',
          severity: 'MEDIUM',
          title: 'Unbuffered Input Stream in Repository File Indexer',
          description: 'Direct byte reading from FileInputStream causes unnecessary system call overhead during file AST processing.',
          filePath: 'worker/src/main/java/com/nexusflow/worker/core/FileParser.java',
          lineNumber: 48,
          snippet: 'InputStream is = new FileInputStream(file);\nint byteData = is.read();',
          recommendation: 'Wrap FileInputStream inside a BufferedInputStream to buffer disk read operations.',
          createdAt: new Date().toISOString()
        },
        {
          id: 'find_102',
          reportId: 'rep_01',
          category: 'DOCUMENTATION',
          severity: 'LOW',
          title: 'Missing Javadoc on ReentrantLock Condition Handler',
          description: 'Worker thread pool condition variable signal logic lacks inline concurrency documentation.',
          filePath: 'worker/src/main/java/com/nexusflow/worker/core/CustomBlockingQueue.java',
          lineNumber: 112,
          snippet: 'public void enqueue(Task t) {\n  lock.lock();\n  try {\n    while (count == capacity) notFull.await();',
          recommendation: 'Add detailed Javadoc explaining spurious wakeup prevention in the condition loop.',
          createdAt: new Date().toISOString()
        }
      ]
    },
    {
      id: 'rep_02',
      repositoryId: 'repo_02',
      taskId: 'task_099',
      overallScore: 78,
      securityScore: 72,
      performanceScore: 85,
      architectureScore: 80,
      maintainabilityScore: 76,
      documentationScore: 77,
      summary: 'Quantum Cache Proxy shows strong memory efficiency, but requires immediate remediation for hardcoded TLS fallback defaults and potential unhandled promise rejections in Redis client reconnect loops.',
      recommendations: [
        'Enforce strict TLS v1.3 verification on upstream Redis connections.',
        'Implement backoff circuit breaker on Memcached pool failure.'
      ],
      modelName: 'gemini-3.6-flash',
      modelVersion: '1.0.0',
      analyzedAt: new Date(Date.now() - 14400000).toISOString(),
      findings: [
        {
          id: 'find_201',
          reportId: 'rep_02',
          category: 'SECURITY',
          severity: 'HIGH',
          title: 'Insecure Default TLS RejectUnauthorized Setting',
          description: 'Cache connection options allow fallback to unverified TLS certificates in non-production environments.',
          filePath: 'src/config/redis.ts',
          lineNumber: 24,
          snippet: 'rejectUnauthorized: process.env.NODE_ENV === "production"',
          recommendation: 'Enforce rejectUnauthorized true across all staging and production clusters with explicit CA bundles.',
          createdAt: new Date().toISOString()
        }
      ]
    },
    {
      id: 'rep_03',
      repositoryId: 'repo_03',
      taskId: 'task_098',
      overallScore: 65,
      securityScore: 58,
      performanceScore: 70,
      architectureScore: 62,
      maintainabilityScore: 68,
      documentationScore: 67,
      summary: 'Microservice Auth Gateway contains key vulnerabilities around JWT secret key strength checks and missing rate limiting on OAuth callback endpoints.',
      recommendations: [
        'Add minimum entropy check on JWT_SECRET initialization.',
        'Implement sliding window rate limiting on /api/auth/github/callback.'
      ],
      modelName: 'gemini-3.6-flash',
      modelVersion: '1.0.0',
      analyzedAt: new Date(Date.now() - 86400000).toISOString(),
      findings: [
        {
          id: 'find_301',
          reportId: 'rep_03',
          category: 'SECURITY',
          severity: 'CRITICAL',
          title: 'Missing CSRF State Token Validation in GitHub OAuth Handler',
          description: 'OAuth redirect callback does not verify state parameter against session store, allowing potential CSRF injection.',
          filePath: 'backend/src/controllers/auth.controller.ts',
          lineNumber: 35,
          snippet: 'const { code } = req.query;\nconst token = await github.exchangeCode(code);',
          recommendation: 'Generate cryptographic nonce state cookie before redirecting to GitHub and verify upon callback.',
          createdAt: new Date().toISOString()
        }
      ]
    }
  ];

  public workerMetricsHistory: WorkerMetrics[] = [];

  public notifications: Notification[] = [
    {
      id: 'notif_01',
      userId: 'usr_01h8x9p3',
      type: 'SECURITY_WARNING',
      title: 'High Severity Issue Found in Quantum Cache Proxy',
      message: 'Insecure Default TLS RejectUnauthorized Setting discovered during scheduled scan.',
      isRead: false,
      relatedRepositoryId: 'repo_02',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: 'notif_02',
      userId: 'usr_01h8x9p3',
      type: 'TASK_COMPLETED',
      title: 'Analysis Task task_100 Completed',
      message: 'Full Code Quality Scan completed in 3m 20s. Overall Health Score: 92.',
      isRead: true,
      relatedTaskId: 'task_100',
      relatedRepositoryId: 'repo_01',
      createdAt: new Date(Date.now() - 3400000).toISOString(),
    }
  ];

  private constructor() {
    this.generateInitialMetricsHistory();
  }

  public static getInstance(): NexusDatabase {
    if (!NexusDatabase.instance) {
      NexusDatabase.instance = new NexusDatabase();
    }
    return NexusDatabase.instance;
  }

  private generateInitialMetricsHistory() {
    const now = Date.now();
    for (let i = 20; i >= 0; i--) {
      const time = new Date(now - i * 60000).toISOString();
      this.workerMetricsHistory.push({
        id: `met_${i}`,
        workerId: 'java-concurrency-node-alpha',
        cpuUsagePercent: Math.floor(25 + Math.random() * 40),
        memoryUsageMB: Math.floor(320 + Math.random() * 120),
        memoryUsagePercent: Math.floor(40 + Math.random() * 20),
        activeThreads: Math.floor(4 + Math.random() * 8),
        queueDepth: Math.floor(1 + Math.random() * 5),
        tasksCompleted: 140 + (20 - i),
        tasksFailed: 3,
        avgExecutionTimeMs: Math.floor(1200 + Math.random() * 400),
        throughputPerMin: Math.floor(12 + Math.random() * 8),
        timestamp: time,
      });
    }
  }

  public getDashboardSummary(): DashboardSummary {
    const activeTasks = this.tasks.filter(t => t.status === 'RUNNING').length;
    const queuedTasks = this.tasks.filter(t => t.status === 'QUEUED').length;
    const completed24h = this.tasks.filter(t => t.status === 'COMPLETED').length;
    const activeWorkers = this.workers.filter(w => w.status === 'BUSY' || w.status === 'IDLE').length;

    const scores = this.repositories.map(r => r.healthScore || 80);
    const avgHealthScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

    let criticalIssues = 0;
    this.reports.forEach(rep => {
      criticalIssues += rep.findings.filter(f => f.severity === 'CRITICAL' || f.severity === 'HIGH').length;
    });

    return {
      totalRepositories: this.repositories.length,
      activeTasks,
      queuedTasks,
      completedTasks24h: completed24h + 18,
      activeWorkers,
      avgHealthScore,
      criticalSecurityIssues: criticalIssues,
      totalThroughputPerMin: 28,
    };
  }
}

export const db = NexusDatabase.getInstance();
