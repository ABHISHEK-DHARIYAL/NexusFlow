import { Request, Response } from 'express';
import { TaskService } from '../services/TaskService';
import { ApiResponse } from '../types';
import { TaskStatus, TaskPriority, UserRole } from '@prisma/client';
import { UnauthorizedError } from '../utils/errors';

export class TaskController {
  constructor(private taskService = new TaskService()) {}

  getTasks = async (req: Request, res: Response) => {
    const authUser = req.user;
    if (!authUser?.id) {
      throw new UnauthorizedError('Authentication required');
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as TaskStatus;
    const priority = req.query.priority as TaskPriority;
    const repositoryId = req.query.repositoryId as string;

    // Regular users only ever see their own tasks. A client-supplied userId
    // query param is never trusted; admins may optionally filter by a
    // specific userId, but non-admins are always scoped to themselves.
    const isAdmin = authUser.role === UserRole.ADMIN || (authUser.role as string) === 'ADMIN';
    const userId = isAdmin ? ((req.query.userId as string) || undefined) : authUser.id;

    const { tasks, total } = await this.taskService.getAllTasks({ page, limit, status, priority, userId, repositoryId });

    const response: ApiResponse = {
      success: true,
      data: tasks,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    res.json(response);
  };

  getTaskById = async (req: Request, res: Response) => {
    const authUser = req.user;
    if (!authUser?.id) {
      throw new UnauthorizedError('Authentication required');
    }
    const task = await this.taskService.getTaskById(req.params.id, authUser);
    const response: ApiResponse = {
      success: true,
      data: task,
    };
    res.json(response);
  };

  createTask = async (req: Request, res: Response) => {
    const authUser = req.user;
    if (!authUser?.id) {
      throw new UnauthorizedError('Authentication required');
    }
    // The authenticated identity always wins over any userId in the body -
    // a client can never create a task on behalf of another user.
    const task = await this.taskService.createTask({ ...req.body, userId: authUser.id });
    const response: ApiResponse = {
      success: true,
      message: 'Task submitted successfully',
      data: task,
    };
    res.status(201).json(response);
  };

  updateTaskStatus = async (req: Request, res: Response) => {
    const authUser = req.user;
    if (!authUser?.id) {
      throw new UnauthorizedError('Authentication required');
    }
    const { status, progress, failureReason } = req.body;
    const task = await this.taskService.updateTaskStatus(req.params.id, status, progress, failureReason, authUser);
    const response: ApiResponse = {
      success: true,
      message: 'Task status updated',
      data: task,
    };
    res.json(response);
  };

  deleteTask = async (req: Request, res: Response) => {
    const authUser = req.user;
    if (!authUser?.id) {
      throw new UnauthorizedError('Authentication required');
    }
    await this.taskService.deleteTask(req.params.id, authUser);
    const response: ApiResponse = {
      success: true,
      message: 'Task deleted successfully',
    };
    res.json(response);
  };

  cancelTask = async (req: Request, res: Response) => {
    const authUser = req.user;
    if (!authUser?.id) {
      throw new UnauthorizedError('Authentication required');
    }
    const task = await this.taskService.cancelTask(req.params.id, authUser);
    const response: ApiResponse = {
      success: true,
      message: 'Task cancelled',
      data: task,
    };
    res.json(response);
  };

  retryTask = async (req: Request, res: Response) => {
    const authUser = req.user;
    if (!authUser?.id) {
      throw new UnauthorizedError('Authentication required');
    }
    const task = await this.taskService.retryTask(req.params.id, authUser);
    const response: ApiResponse = {
      success: true,
      message: 'Task re-queued for retry',
      data: task,
    };
    res.json(response);
  };

  getTaskLogs = async (req: Request, res: Response) => {
    const authUser = req.user;
    if (!authUser?.id) {
      throw new UnauthorizedError('Authentication required');
    }
    const logs = await this.taskService.getTaskLogs(req.params.id, authUser);
    const response: ApiResponse = {
      success: true,
      data: logs,
    };
    res.json(response);
  };
}
