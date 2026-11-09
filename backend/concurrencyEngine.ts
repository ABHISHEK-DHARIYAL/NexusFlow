// Java Concurrency Worker Coordinator & Task Execution Simulation Engine
import { db } from './mockDb.js';
import { analyzeRepositoryWithGemini } from './geminiService.js';
import { Task, LogLevel, TaskPriority } from '../types.js';

class ConcurrencyEngine {
  private isProcessing = false;
  private timer: NodeJS.Timeout | null = null;

  public start() {
    if (this.timer) return;
    console.log('[NexusFlow Concurrency Engine] Java 21 ThreadPool Coordinator initialized.');
    this.timer = setInterval(() => this.processNextTask(), 3000);
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private addLog(taskId: string, workerId: string, level: LogLevel, message: string) {
    const log = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      taskId,
      workerId,
      level,
      message,
      timestamp: new Date().toISOString(),
    };
    db.taskLogs.push(log);
    if (db.taskLogs.length > 500) {
      db.taskLogs.shift();
    }
  }

  private calculatePriorityWeight(priority: TaskPriority, createdAt: string): number {
    let weight = 100;
    if (priority === 'CRITICAL') weight = 400;
    else if (priority === 'HIGH') weight = 300;
    else if (priority === 'MEDIUM') weight = 200;
    else if (priority === 'LOW') weight = 100;

    // Age boost: Add 1 point per 10 seconds queued
    const ageSeconds = (Date.now() - new Date(createdAt).getTime()) / 1000;
    weight += Math.min(100, Math.floor(ageSeconds / 10));
    return weight;
  }

  private async processNextTask() {
    if (this.isProcessing) return;

    // Emit worker heartbeats & metrics
    this.updateWorkerHeartbeatsAndMetrics();

    // Find queued tasks sorted by calculated Priority Queue Weight
    const queuedTasks = db.tasks.filter(t => t.status === 'QUEUED' || t.status === 'RETRYING');
    if (queuedTasks.length === 0) {
      // Advance progress on running tasks
      this.advanceRunningTasksProgress();
      return;
    }

    // Sort queued tasks by Priority Weight descending
    queuedTasks.sort((a, b) => {
      const weightA = this.calculatePriorityWeight(a.priority, a.createdAt);
      const weightB = this.calculatePriorityWeight(b.priority, b.createdAt);
      return weightB - weightA;
    });

    const taskToRun = queuedTasks[0];
    const idleWorker = db.workers.find(w => w.status === 'IDLE') || db.workers[0];

    this.isProcessing = true;

    try {
      // Transition task to RUNNING
      taskToRun.status = 'RUNNING';
      taskToRun.progress = 10;
      taskToRun.workerId = idleWorker.id;
      taskToRun.startedAt = new Date().toISOString();
      taskToRun.updatedAt = new Date().toISOString();

      idleWorker.status = 'BUSY';
      idleWorker.currentTaskId = taskToRun.id;
      idleWorker.currentTaskName = `${taskToRun.repositoryName} (${taskToRun.taskType})`;
      idleWorker.activeThreads = Math.min(idleWorker.maxThreads, idleWorker.activeThreads + 4);

      const weight = this.calculatePriorityWeight(taskToRun.priority, taskToRun.createdAt);
      this.addLog(
        taskToRun.id,
        idleWorker.workerId,
        'INFO',
        `[Java CustomBlockingQueue] Enqueued task ${taskToRun.id} claimed with priority weight ${weight}`
      );
      this.addLog(
        taskToRun.id,
        idleWorker.workerId,
        'DEBUG',
        `[ReentrantLock] Acquired lock on ThreadPool worker thread context. Active threads: ${idleWorker.activeThreads}/${idleWorker.maxThreads}`
      );

      // Simulate step 1: GitHub Repository Fetching
      await new Promise(r => setTimeout(r, 1200));
      taskToRun.progress = 35;
      taskToRun.updatedAt = new Date().toISOString();
      this.addLog(
        taskToRun.id,
        idleWorker.workerId,
        'INFO',
        `[GitHub API Integration] Downloaded AST source files for ${taskToRun.repositoryName}`
      );

      // Simulate step 2: Static Analysis & Gemini AI Processing
      await new Promise(r => setTimeout(r, 1500));
      taskToRun.progress = 75;
      taskToRun.updatedAt = new Date().toISOString();
      this.addLog(
        taskToRun.id,
        idleWorker.workerId,
        'INFO',
        `[Gemini AI Orchestrator] Executing Gemini 3.6 Flash reasoning model for ${taskToRun.taskType}`
      );

      // Find repo
      const repo = db.repositories.find(r => r.id === taskToRun.repositoryId) || db.repositories[0];

      // Perform AI Analysis
      const report = await analyzeRepositoryWithGemini(
        repo.fullName,
        repo.description,
        repo.language,
        taskToRun.id,
        repo.id
      );

      // Save report
      db.reports.unshift(report as any);
      repo.healthScore = report.overallScore;
      repo.lastAnalyzedAt = new Date().toISOString();
      repo.latestReportId = report.id;

      // Complete Task
      taskToRun.status = 'COMPLETED';
      taskToRun.progress = 100;
      taskToRun.completedAt = new Date().toISOString();
      taskToRun.updatedAt = new Date().toISOString();

      idleWorker.status = 'IDLE';
      idleWorker.currentTaskId = undefined;
      idleWorker.currentTaskName = undefined;
      idleWorker.activeThreads = Math.max(0, idleWorker.activeThreads - 4);
      idleWorker.tasksCompleted += 1;

      this.addLog(
        taskToRun.id,
        idleWorker.workerId,
        'INFO',
        `[Task Complete] Gemini analysis report generated (${report.id}). Overall Score: ${report.overallScore}/100`
      );

      // Create notification
      db.notifications.unshift({
        id: `notif_${Date.now()}`,
        userId: taskToRun.userId,
        type: 'ANALYSIS_READY',
        title: `Analysis Completed for ${repo.name}`,
        message: `${taskToRun.taskType} finished in ${Math.round((Date.now() - new Date(taskToRun.startedAt!).getTime()) / 1000)}s. Overall Score: ${report.overallScore}/100`,
        isRead: false,
        relatedTaskId: taskToRun.id,
        relatedRepositoryId: repo.id,
        createdAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('[Concurrency Engine] Task execution failed:', error);
      taskToRun.retryCount += 1;
      if (taskToRun.retryCount < taskToRun.maxRetries) {
        taskToRun.status = 'RETRYING';
        this.addLog(
          taskToRun.id,
          idleWorker.workerId,
          'WARN',
          `[Retry Mechanism] Task failed (${error.message}). Retrying attempt ${taskToRun.retryCount}/${taskToRun.maxRetries}`
        );
      } else {
        taskToRun.status = 'FAILED';
        taskToRun.failureReason = error.message || 'Worker thread timeout';
        idleWorker.tasksFailed += 1;
        this.addLog(
          taskToRun.id,
          idleWorker.workerId,
          'ERROR',
          `[Task Failed] Max retries exceeded: ${taskToRun.failureReason}`
        );
      }
      idleWorker.status = 'IDLE';
      idleWorker.currentTaskId = undefined;
      idleWorker.currentTaskName = undefined;
      idleWorker.activeThreads = Math.max(0, idleWorker.activeThreads - 2);
    } finally {
      this.isProcessing = false;
    }
  }

  private advanceRunningTasksProgress() {
    db.tasks.forEach(task => {
      if (task.status === 'RUNNING' && task.progress < 95) {
        task.progress = Math.min(95, task.progress + Math.floor(Math.random() * 8 + 3));
        task.updatedAt = new Date().toISOString();
      }
    });
  }

  private updateWorkerHeartbeatsAndMetrics() {
    const now = new Date().toISOString();
    db.workers.forEach(worker => {
      worker.lastHeartbeat = now;
    });

    // Add metric point every 15 seconds
    const lastMetric = db.workerMetricsHistory[db.workerMetricsHistory.length - 1];
    const secondsSinceLast = lastMetric ? (Date.now() - new Date(lastMetric.timestamp).getTime()) / 1000 : 30;

    if (secondsSinceLast >= 15) {
      const activeWorker = db.workers[0];
      db.workerMetricsHistory.push({
        id: `met_${Date.now()}`,
        workerId: activeWorker.workerId,
        cpuUsagePercent: Math.min(98, Math.max(15, Math.floor(20 + Math.random() * 50))),
        memoryUsageMB: Math.floor(380 + Math.random() * 100),
        memoryUsagePercent: Math.floor(45 + Math.random() * 15),
        activeThreads: activeWorker.activeThreads || 4,
        queueDepth: db.tasks.filter(t => t.status === 'QUEUED').length,
        tasksCompleted: db.workers.reduce((acc, w) => acc + w.tasksCompleted, 0),
        tasksFailed: db.workers.reduce((acc, w) => acc + w.tasksFailed, 0),
        avgExecutionTimeMs: Math.floor(1100 + Math.random() * 300),
        throughputPerMin: Math.floor(20 + Math.random() * 10),
        timestamp: now,
      });

      if (db.workerMetricsHistory.length > 50) {
        db.workerMetricsHistory.shift();
      }
    }
  }
}

export const concurrencyEngine = new ConcurrencyEngine();
