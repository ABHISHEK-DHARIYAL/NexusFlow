import { Request, Response, NextFunction } from 'express';
import { schedulerService, SchedulerService } from '../services/SchedulerService';
import { UnauthorizedError, ForbiddenError, BadRequestError } from '../utils/errors';

export class ScheduleController {
  constructor(private service: SchedulerService = schedulerService) {}

  /**
   * POST /api/schedules - Create a new schedule
   */
  async createSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      if (!userId) {
        throw new UnauthorizedError('User authentication required');
      }

      const { name, description, jobType, frequency, schedule, time, timezone, resourceId } = req.body;

      const created = await this.service.createSchedule(userId, {
        name,
        description,
        jobType,
        frequency,
        schedule,
        time,
        timezone,
        resourceId,
      });

      res.status(201).json({
        success: true,
        message: 'Schedule created successfully',
        data: created,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/schedules - List schedules for current user
   */
  async getSchedules(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      if (!userId) {
        throw new UnauthorizedError('User authentication required');
      }

      const schedules = await this.service.getSchedules(userId);
      res.json({
        success: true,
        count: schedules.length,
        data: schedules,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/schedules/summary - Get automation dashboard summary
   */
  async getAutomationSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      if (!userId) {
        throw new UnauthorizedError('User authentication required');
      }

      const summary = await this.service.getAutomationSummary(userId);
      res.json({
        success: true,
        data: summary,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/schedules/templates - Get recommended automation templates
   */
  async getAutomationTemplates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const templates = this.service.getAutomationTemplates();
      res.json({
        success: true,
        count: templates.length,
        data: templates,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/schedules/:id - Get single schedule
   */
  async getScheduleById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      if (!userId) {
        throw new UnauthorizedError('User authentication required');
      }

      const schedule = await this.service.getScheduleById(userId, req.params.id);
      res.json({
        success: true,
        data: schedule,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/schedules/:id - Update schedule
   */
  async updateSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      if (!userId) {
        throw new UnauthorizedError('User authentication required');
      }

      const updated = await this.service.updateSchedule(userId, req.params.id, req.body);
      res.json({
        success: true,
        message: 'Schedule updated successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/schedules/:id/enable - Enable schedule
   */
  async enableSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      if (!userId) {
        throw new UnauthorizedError('User authentication required');
      }

      const enabled = await this.service.enableSchedule(userId, req.params.id);
      res.json({
        success: true,
        message: 'Schedule enabled successfully',
        data: enabled,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/schedules/:id/disable - Disable schedule
   */
  async disableSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      if (!userId) {
        throw new UnauthorizedError('User authentication required');
      }

      const disabled = await this.service.disableSchedule(userId, req.params.id);
      res.json({
        success: true,
        message: 'Schedule disabled successfully',
        data: disabled,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/schedules/:id - Delete schedule
   */
  async deleteSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      if (!userId) {
        throw new UnauthorizedError('User authentication required');
      }

      await this.service.deleteSchedule(userId, req.params.id);
      res.json({
        success: true,
        message: 'Schedule deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/schedules/:id/executions - Get execution history
   */
  async getExecutions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      if (!userId) {
        throw new UnauthorizedError('User authentication required');
      }

      const executions = await this.service.getExecutions(userId, req.params.id);
      res.json({
        success: true,
        count: executions.length,
        data: executions,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/schedules/:id/run-now - Immediately run schedule
   */
  async runNow(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      if (!userId) {
        throw new UnauthorizedError('User authentication required');
      }

      const execution = await this.service.runNow(userId, req.params.id);
      res.json({
        success: true,
        message: 'Immediate schedule execution triggered',
        data: execution,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const scheduleController = new ScheduleController();
