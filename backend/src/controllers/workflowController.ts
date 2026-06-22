import { Response } from "express";
import { readDatabase, writeDatabase } from "../utils/dbLocal.js";
import { Workflow, TaskStatus, TaskType } from "../models/types.js";
import { globalPool, activeTasksMap } from "../services/threadPoolService.js";
import { runAIGeneration } from "../services/aiService.js";

export const getWorkflows = (req: any, res: Response) => {
  const db = readDatabase();
  const userWorkflows = db.workflows.filter(w => w.userId === req.user.id);
  const workflowsWithTasks = userWorkflows.map(wf => {
    const steps = db.workflowTasks.filter(wt => wt.workflowId === wf.id);
    return { ...wf, steps };
  });
  return res.json(workflowsWithTasks);
};

export const createWorkflow = (req: any, res: Response) => {
  const { name, description, channelId, templateType, steps } = req.body;
  if (!name || !channelId || !steps || !Array.isArray(steps)) {
    return res.status(400).json({ error: "Missing required workflow properties" });
  }

  const db = readDatabase();
  const workflowId = "wf-" + Math.random().toString(36).substring(2, 9);
  const newWorkflow: Workflow = {
    id: workflowId,
    userId: req.user.id,
    channelId,
    name,
    description: description || "Custom creative pipeline",
    templateType: templateType || "CUSTOM",
    status: "QUEUED",
    createdAt: Date.now()
  };

  db.workflows.push(newWorkflow);

  steps.forEach((step: any, idx) => {
    db.workflowTasks.push({
      id: "wf-step-" + Math.random().toString(36).substring(2, 9),
      workflowId,
      stepOrder: idx + 1,
      taskType: step.taskType,
      dependsOnStep: step.dependsOnStep !== undefined ? step.dependsOnStep : null,
      priority: Number(step.priority) || 5,
      delayMs: Number(step.delayMs) || 0,
      retryCount: Number(step.retryCount) || 0,
      status: TaskStatus.QUEUED,
      aiPromptOverride: step.aiPromptOverride || ""
    });
  });

  writeDatabase(db);
  return res.json({ ...newWorkflow, steps: db.workflowTasks.filter(wt => wt.workflowId === workflowId) });
};

export const executeWorkflow = async (req: any, res: Response) => {
  const db = readDatabase();
  const wf = db.workflows.find(w => w.id === req.params.id && w.userId === req.user.id);
  if (!wf) {
    return res.status(404).json({ error: "Workflow pipeline not found" });
  }

  const steps = db.workflowTasks.filter(wt => wt.workflowId === wf.id);
  if (steps.length === 0) {
    return res.status(400).json({ error: "No executable steps in workflow" });
  }

  wf.status = "RUNNING";
  steps.forEach(st => {
    st.status = TaskStatus.QUEUED;
    st.schedulerTaskId = undefined;
  });
  writeDatabase(db);

  const channel = db.channels.find(c => c.id === wf.channelId);
  const channelName = channel ? channel.name : "Weekend Lore";
  const niche = channel ? channel.niche : "History/Lore";
  const customTopic = req.body.topic || "Frictional Concurrency Systems";

  // Entry steps (dependsOnStep = null or 0)
  const entrySteps = steps.filter(st => st.dependsOnStep === null || st.dependsOnStep === 0);

  entrySteps.forEach(async (entryStep) => {
    entryStep.status = TaskStatus.RUNNING;
    writeDatabase(db);

    const subTask = globalPool.submitTask(
      entryStep.taskType,
      entryStep.priority,
      entryStep.delayMs,
      Math.floor(Math.random() * 1200 + 600),
      entryStep.retryCount,
      0.0
    );

    subTask.workflowId = wf.id;
    subTask.channelId = wf.channelId;
    subTask.topic = customTopic;
    subTask.niche = niche;
    subTask.channelName = channelName;

    entryStep.schedulerTaskId = subTask.id;
    activeTasksMap.set(subTask.id, subTask);
    writeDatabase(db);

    subTask.resultText = await runAIGeneration(subTask.type, {
      channelName,
      niche,
      topic: customTopic
    });
    writeDatabase(db);
  });

  return res.json({ success: true, message: "Workflow pipeline active!" });
};
