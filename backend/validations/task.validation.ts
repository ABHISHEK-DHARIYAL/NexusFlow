import { z } from 'zod';
import { TaskType, TaskPriority, TaskStatus } from '@prisma/client';

export const createTaskSchema = z.object({
  body: z.object({
    repositoryId: z.string().uuid(),
    taskType: z.nativeEnum(TaskType).optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
  }),
});

export const updateTaskStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    status: z.nativeEnum(TaskStatus),
    progress: z.number().min(0).max(100).optional(),
    failureReason: z.string().optional(),
  }),
});
