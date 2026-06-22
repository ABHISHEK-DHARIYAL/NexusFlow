import { TaskType, TaskStatus, TaskEntity as Task } from "../models/types.js";

export interface WorkerStatus {
  threadId: number;
  state: "IDLE" | "RUNNING" | "TERMINATED";
  currentTaskId: string;
  isCore: boolean;
  runningTimeMs: number;
}

export interface PoolStats {
  activeThreads: number;
  queueSize: number;
  completedCount: number;
  failedCount: number;
  poolSize: number;
  workers: WorkerStatus[];
}

export class TypeScriptThreadPool {
  private coreThreads: number;
  private maxThreads: number;
  private keepAliveTimeMs: number;
  public onTaskCompleted?: (task: Task) => void;
  
  private queue: Task[] = [];
  private workers: {
    id: number;
    state: "IDLE" | "RUNNING" | "TERMINATED";
    currentTask: Task | null;
    isCore: boolean;
    taskStartedAt: number;
    timer: NodeJS.Timeout | null;
  }[] = [];

  private completedCounter = 0;
  private failedCounter = 0;
  private nextThreadId = 1;

  constructor(coreThreads: number, maxThreads: number, keepAliveTimeMs: number = 5000) {
    this.coreThreads = coreThreads;
    this.maxThreads = maxThreads;
    this.keepAliveTimeMs = keepAliveTimeMs;

    // Start core threads
    for (let i = 0; i < this.coreThreads; i++) {
        this.addWorker(true);
    }

    // Start main queue distributor
    this.startDistributor();
  }

  private addWorker(isCore: boolean) {
    const threadId = this.nextThreadId++;
    const worker = {
        id: threadId,
        state: "IDLE" as const,
        currentTask: null as Task | null,
        isCore,
        taskStartedAt: 0,
        timer: null as NodeJS.Timeout | null
    };
    this.workers.push(worker);
    this.processNextTask(worker);
  }

  private startDistributor() {
    setInterval(() => {
      // Clean finished threads or process tasks
      this.workers.forEach(w => {
          if (w.state === "IDLE") {
              this.processNextTask(w);
          }
      });
    }, 100);
  }

  public setPoolSizes(core: number, max: number) {
    this.coreThreads = core;
    this.maxThreads = max;
    
    // Scale up if workers below core count
    const currentCount = this.workers.length;
    if (currentCount < core) {
        for (let i = 0; i < core - currentCount; i++) {
            this.addWorker(true);
        }
    }
  }

  public submitTask(type: TaskType, priority: number, delayMs: number, duration: number, retries: number, failProb: number): Task {
    const task: Task = {
        id: "task-" + Math.random().toString(36).substring(2, 9),
        type,
        priority,
        delayMs,
        status: TaskStatus.QUEUED,
        submittedAt: Date.now(),
        startedAt: 0,
        completedAt: 0,
        waitTimeMs: 0,
        execTimeMs: 0,
        threadId: "",
        retryCount: 0,
        maxRetries: retries,
        errorMessage: "",
        workDurationMs: duration,
        failureProbability: failProb
    };

    // Push and sort queue: highest priority first
    this.queue.push(task);
    this.queue.sort((a, b) => b.priority - a.priority);

    // If queue is full and we are below max threads, spawn a temporary thread
    if (this.queue.length > 5 && this.workers.length < this.maxThreads) {
        this.addWorker(false);
    }

    return task;
  }

  public cancelTask(id: string): boolean {
    const idx = this.queue.findIndex(t => t.id === id);
    if (idx !== -1) {
        const task = this.queue[idx];
        task.status = TaskStatus.CANCELLED;
        task.completedAt = Date.now();
        this.queue.splice(idx, 1);
        return true;
    }
    return false;
  }

  private processNextTask(worker: typeof this.workers[0]) {
    if (this.queue.length === 0) {
        // If not core thread and has been idle, start keep-alive timer
        if (!worker.isCore && worker.state === "IDLE" && !worker.timer) {
            worker.timer = setTimeout(() => {
                const idx = this.workers.findIndex(w => w.id === worker.id);
                if (idx !== -1 && this.queue.length === 0) {
                    worker.state = "TERMINATED";
                    this.workers.splice(idx, 1);
                }
            }, this.keepAliveTimeMs);
        }
        return;
    }

    // Cancel keep-alive timer if active
    if (worker.timer) {
        clearTimeout(worker.timer);
        worker.timer = null;
    }

    // Look for a task. For scheduled tasks, check if delay has elapsed
    let taskIndex = -1;
    for (let i = 0; i < this.queue.length; i++) {
        const t = this.queue[i];
        if (t.type === TaskType.SCHEDULED) {
            if (Date.now() - t.submittedAt >= t.delayMs) {
                taskIndex = i;
                break;
            }
        } else {
            taskIndex = i;
            break;
        }
    }

    if (taskIndex === -1) {
        return; // nothing ready
    }

    const task = this.queue.splice(taskIndex, 1)[0];
    worker.state = "RUNNING";
    worker.currentTask = task;
    worker.taskStartedAt = Date.now();

    task.status = TaskStatus.RUNNING;
    task.startedAt = worker.taskStartedAt;
    task.threadId = String(worker.id);
    task.waitTimeMs = task.startedAt - task.submittedAt;

    // Simulate work execution
    setTimeout(() => {
        try {
            if (task.type === TaskType.RETRY && Math.random() < task.failureProbability) {
                throw new Error("Simulated transient task failure");
            }
            
            // Success
            task.status = TaskStatus.COMPLETED;
            this.completedCounter++;
        } catch (err: any) {
            task.errorMessage = err.message || "Failed";
            if (task.retryCount < task.maxRetries) {
                task.retryCount++;
                task.status = TaskStatus.RETRYING;
                setTimeout(() => {
                    task.status = TaskStatus.QUEUED;
                    // Re-queue task
                    this.queue.push(task);
                    this.queue.sort((a, b) => b.priority - a.priority);
                }, 1000); // 1s wait before retry
            } else {
                task.status = TaskStatus.FAILED;
                this.failedCounter++;
            }
        } finally {
            task.completedAt = Date.now();
            task.execTimeMs = task.completedAt - task.startedAt;
            
            worker.state = "IDLE";
            worker.currentTask = null;
            worker.taskStartedAt = 0;

            // Call completion listener
            if (this.onTaskCompleted) {
                try {
                    this.onTaskCompleted(task);
                } catch (e) {
                    console.error("Error in onTaskCompleted callback:", e);
                }
            }

            // Trigger immediate process loop
            this.processNextTask(worker);
        }
    }, task.workDurationMs);
  }

  public getStats(): PoolStats {
    const active = this.workers.filter(w => w.state === "RUNNING").length;
    return {
        activeThreads: active,
        queueSize: this.queue.length,
        completedCount: this.completedCounter,
        failedCount: this.failedCounter,
        poolSize: this.workers.length,
        workers: this.workers.map(w => ({
            threadId: w.id,
            state: w.state,
            currentTaskId: w.currentTask ? w.currentTask.id : "",
            isCore: w.isCore,
            runningTimeMs: w.taskStartedAt > 0 ? Date.now() - w.taskStartedAt : 0
        }))
    };
  }

  public getQueue(): Task[] {
    return [...this.queue];
  }
}

import { readDatabase, writeDatabase } from "../utils/dbLocal.js";
import { runAIGeneration } from "./aiService.js";

// Global thread pool instance to be shared across controllers
export const globalPool = new TypeScriptThreadPool(4, 8, 15000);
export const activeTasksMap = new Map<string, Task>();

globalPool.onTaskCompleted = (completedTask: Task) => {
  const db = readDatabase();
  
  // 1. Persist completed/failed task to DB history
  const taskIndex = db.tasks.findIndex(t => t.id === completedTask.id);
  if (taskIndex !== -1) {
    db.tasks[taskIndex] = { ...completedTask };
  } else {
    db.tasks.push({ ...completedTask });
  }
  writeDatabase(db);

  // Remove from in-memory tracking
  activeTasksMap.delete(completedTask.id);

  // 2. Multi-step Workflow check
  if (completedTask.workflowId && completedTask.status === TaskStatus.COMPLETED) {
    const wTasks = db.workflowTasks.filter(wt => wt.workflowId === completedTask.workflowId);
    
    // Mark current workflow step as completed
    const currentWTask = wTasks.find(wt => wt.schedulerTaskId === completedTask.id);
    if (currentWTask) {
      currentWTask.status = TaskStatus.COMPLETED;
      writeDatabase(db);
      
      const currentStepOrder = currentWTask.stepOrder;

      // Search for next steps that depend on the completed step
      const nextWTasks = wTasks.filter(wt => wt.dependsOnStep === currentStepOrder && wt.status === TaskStatus.QUEUED);

      nextWTasks.forEach(async (nextStep) => {
        const workflow = db.workflows.find(w => w.id === completedTask.workflowId);
        const channel = workflow ? db.channels.find(c => c.id === workflow.channelId) : undefined;

        // Mark next step as RUNNING
        nextStep.status = TaskStatus.RUNNING;
        writeDatabase(db);

        // Submit the next task in the dependency chain
        const tDetail = globalPool.submitTask(
          nextStep.taskType,
          nextStep.priority,
          nextStep.delayMs,
          Math.floor(Math.random() * 1500 + 800),
          nextStep.retryCount,
          0.0
        );

        // Link metadata
        tDetail.workflowId = completedTask.workflowId;
        tDetail.channelId = completedTask.channelId;
        tDetail.topic = completedTask.topic;
        tDetail.niche = completedTask.niche;
        tDetail.channelName = completedTask.channelName;
        
        nextStep.schedulerTaskId = tDetail.id;
        activeTasksMap.set(tDetail.id, tDetail);
        writeDatabase(db);

        // Trigger Gemini or Offline local generation
        tDetail.resultText = await runAIGeneration(tDetail.type, {
          channelName: tDetail.channelName,
          niche: tDetail.niche,
          topic: tDetail.topic || "Concurrency Architecture"
        });
        writeDatabase(db);
      });

      // If all tasks for this workflow are completed, mark workflow as COMPLETED
      const activeStepsCount = wTasks.filter(wt => wt.status !== TaskStatus.COMPLETED).length;
      if (activeStepsCount === 0) {
        const wf = db.workflows.find(w => w.id === completedTask.workflowId);
        if (wf) {
          wf.status = "COMPLETED";
          wf.completedAt = Date.now();
          writeDatabase(db);
        }
      }
    }
  }
};

