import { Response } from "express";
import { readDatabase, writeDatabase } from "../utils/dbLocal.js";
import { TaskType, TaskStatus, TaskEntity as Task } from "../models/types.js";
import { globalPool, activeTasksMap } from "../services/threadPoolService.js";
import { runAIGeneration } from "../services/aiService.js";

export const submitTask = async (req: any, res: Response) => {
  const { type, priority, delayMs, duration, retries, failureProbability, channelId, topic } = req.body;
  
  const db = readDatabase();
  let niche = "General Concurrency";
  let channelName = "ThreadForge Engine Daemon";
  if (channelId) {
    const channel = db.channels.find(c => c.id === channelId);
    if (channel) {
      niche = channel.niche;
      channelName = channel.name;
    }
  }

  const tType = (type || "SIMPLE") as TaskType;
  const prio = Number(priority) || 5;
  const dMs = Number(delayMs) || 0;
  const xTime = Number(duration) || 1200;
  const ret = Number(retries) || 0;
  const fProb = Number(failureProbability) || 0;

  const task = globalPool.submitTask(tType, prio, dMs, xTime, ret, fProb);
  task.channelId = channelId;
  task.topic = topic || "Advanced Thread Allocation Patterns";
  task.niche = niche;
  task.channelName = channelName;

  // Persist immediately in active mapper
  activeTasksMap.set(task.id, task);

  // Fetch dynamic content right now (asynchronously we complete it)
  task.resultText = await runAIGeneration(task.type, {
    channelName,
    niche,
    topic: task.topic
  });

  return res.json({ success: true, task });
};

export const getTasks = (req: any, res: Response) => {
  const poolQueue = globalPool.getQueue();
  const stats = globalPool.getStats();
  const db = readDatabase();
  
  const currentTasks: Task[] = [];
  
  poolQueue.forEach(t => {
    currentTasks.push({ ...t, status: TaskStatus.QUEUED });
  });

  stats.workers.forEach(w => {
    if (w.state === "RUNNING" && w.currentTaskId) {
      const existing = activeTasksMap.get(w.currentTaskId);
      if (existing) {
        existing.status = TaskStatus.RUNNING;
        currentTasks.push(existing);
      }
    }
  });

  const allMerged = [...currentTasks];
  const presentIds = new Set(allMerged.map(t => t.id));

  db.tasks.forEach(t => {
    if (!presentIds.has(t.id)) {
      allMerged.push(t);
    }
  });

  allMerged.sort((a, b) => b.submittedAt - a.submittedAt);
  return res.json(allMerged);
};

export const cancelTask = (req: Request | any, res: Response) => {
  const cancelled = globalPool.cancelTask(req.params.id);
  const db = readDatabase();
  
  if (cancelled) {
    const idx = db.tasks.findIndex(t => t.id === req.params.id);
    if (idx !== -1) {
      db.tasks[idx].status = TaskStatus.CANCELLED;
      db.tasks[idx].completedAt = Date.now();
    } else {
      const cTask: Task = {
        id: req.params.id,
        type: TaskType.CANCELLABLE,
        priority: 5,
        delayMs: 0,
        status: TaskStatus.CANCELLED,
        submittedAt: Date.now() - 500,
        startedAt: 0,
        completedAt: Date.now(),
        waitTimeMs: 500,
        execTimeMs: 0,
        threadId: "",
        retryCount: 0,
        maxRetries: 0,
        errorMessage: "Manually Cancelled",
        workDurationMs: 0,
        failureProbability: 0
      };
      db.tasks.push(cTask);
    }
    writeDatabase(db);
    return res.json({ success: true });
  }
  return res.status(404).json({ error: "Task not found or already running" });
};
