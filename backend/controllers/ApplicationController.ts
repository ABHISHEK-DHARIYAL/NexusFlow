import { Request, Response } from 'express';
import { applicationService } from '../services/ApplicationService';
import {
  CreateApplicationSchema,
  UpdateApplicationSchema,
  UpdateStatusSchema,
  CreateEventSchema,
  CreateFollowUpSchema,
  UpdateFollowUpSchema,
} from '../validations/application.validation';
import { logger } from '../logger';

export class ApplicationController {
  /**
   * POST /api/applications
   */
  public async create(req: Request, res: Response): Promise<void> {
    try {
      const authUser = (req as any).user;
      const userId = authUser?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const parsed = CreateApplicationSchema.parse(req.body);
      const app = await applicationService.createApplication(userId, parsed);

      res.status(201).json(app);
    } catch (err: any) {
      logger.system.error(`Error creating application: ${err.message}`);
      res.status(err.statusCode || 400).json({ error: err.message || 'Failed to create application' });
    }
  }

  /**
   * GET /api/applications
   */
  public async list(req: Request, res: Response): Promise<void> {
    try {
      const authUser = (req as any).user;
      const userId = authUser?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const filters = {
        status: req.query.status as string,
        priority: req.query.priority as string,
        company: req.query.company as string,
        role: req.query.role as string,
        search: req.query.search as string,
        minMatch: req.query.minMatch ? parseFloat(req.query.minMatch as string) : undefined,
        minReadiness: req.query.minReadiness ? parseFloat(req.query.minReadiness as string) : undefined,
      };

      const apps = await applicationService.listApplications(userId, filters);
      res.json(apps);
    } catch (err: any) {
      logger.system.error(`Error listing applications: ${err.message}`);
      res.status(err.statusCode || 500).json({ error: err.message || 'Failed to list applications' });
    }
  }

  /**
   * GET /api/applications/stats
   */
  public async getStats(req: Request, res: Response): Promise<void> {
    try {
      const authUser = (req as any).user;
      const userId = authUser?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const stats = await applicationService.getStats(userId);
      res.json(stats);
    } catch (err: any) {
      logger.system.error(`Error fetching application stats: ${err.message}`);
      res.status(err.statusCode || 500).json({ error: err.message || 'Failed to fetch application stats' });
    }
  }

  /**
   * GET /api/applications/:id
   */
  public async getById(req: Request, res: Response): Promise<void> {
    try {
      const authUser = (req as any).user;
      const userId = authUser?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }
      const applicationId = req.params.id;

      const app = await applicationService.getApplicationById(userId, applicationId);
      res.json(app);
    } catch (err: any) {
      logger.system.error(`Error getting application ${req.params.id}: ${err.message}`);
      res.status(err.statusCode || 404).json({ error: err.message || 'Application not found' });
    }
  }

  /**
   * PATCH /api/applications/:id
   */
  public async update(req: Request, res: Response): Promise<void> {
    try {
      const authUser = (req as any).user;
      const userId = authUser?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }
      const applicationId = req.params.id;

      const parsed = UpdateApplicationSchema.parse(req.body);
      const app = await applicationService.updateApplication(userId, applicationId, parsed);

      res.json(app);
    } catch (err: any) {
      logger.system.error(`Error updating application ${req.params.id}: ${err.message}`);
      res.status(err.statusCode || 400).json({ error: err.message || 'Failed to update application' });
    }
  }

  /**
   * DELETE /api/applications/:id
   */
  public async delete(req: Request, res: Response): Promise<void> {
    try {
      const authUser = (req as any).user;
      const userId = authUser?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }
      const applicationId = req.params.id;

      await applicationService.deleteApplication(userId, applicationId);
      res.json({ success: true, message: 'Application deleted successfully' });
    } catch (err: any) {
      logger.system.error(`Error deleting application ${req.params.id}: ${err.message}`);
      res.status(err.statusCode || 400).json({ error: err.message || 'Failed to delete application' });
    }
  }

  /**
   * POST /api/applications/:id/status
   */
  public async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const authUser = (req as any).user;
      const userId = authUser?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }
      const applicationId = req.params.id;

      const parsed = UpdateStatusSchema.parse(req.body);
      const app = await applicationService.updateStatus(userId, applicationId, parsed);

      res.json(app);
    } catch (err: any) {
      logger.system.error(`Error updating status for application ${req.params.id}: ${err.message}`);
      res.status(err.statusCode || 400).json({ error: err.message || 'Failed to update application status' });
    }
  }

  /**
   * POST /api/applications/:id/events
   */
  public async addEvent(req: Request, res: Response): Promise<void> {
    try {
      const authUser = (req as any).user;
      const userId = authUser?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }
      const applicationId = req.params.id;

      const parsed = CreateEventSchema.parse(req.body);
      const event = await applicationService.addEvent(userId, applicationId, parsed);

      res.status(201).json(event);
    } catch (err: any) {
      logger.system.error(`Error adding event to application ${req.params.id}: ${err.message}`);
      res.status(err.statusCode || 400).json({ error: err.message || 'Failed to add timeline event' });
    }
  }

  /**
   * GET /api/applications/:id/events
   */
  public async getEvents(req: Request, res: Response): Promise<void> {
    try {
      const authUser = (req as any).user;
      const userId = authUser?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }
      const applicationId = req.params.id;

      const events = await applicationService.getEvents(userId, applicationId);
      res.json(events);
    } catch (err: any) {
      logger.system.error(`Error fetching events for application ${req.params.id}: ${err.message}`);
      res.status(err.statusCode || 400).json({ error: err.message || 'Failed to fetch timeline events' });
    }
  }

  /**
   * POST /api/applications/:id/follow-ups
   */
  public async addFollowUp(req: Request, res: Response): Promise<void> {
    try {
      const authUser = (req as any).user;
      const userId = authUser?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }
      const applicationId = req.params.id;

      const parsed = CreateFollowUpSchema.parse(req.body);
      const followUp = await applicationService.addFollowUp(userId, applicationId, parsed);

      res.status(201).json(followUp);
    } catch (err: any) {
      logger.system.error(`Error adding follow-up to application ${req.params.id}: ${err.message}`);
      res.status(err.statusCode || 400).json({ error: err.message || 'Failed to add follow-up reminder' });
    }
  }

  /**
   * PATCH /api/applications/:id/follow-ups/:followUpId
   */
  public async updateFollowUp(req: Request, res: Response): Promise<void> {
    try {
      const authUser = (req as any).user;
      const userId = authUser?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }
      const { id: applicationId, followUpId } = req.params;

      const parsed = UpdateFollowUpSchema.parse(req.body);
      const followUp = await applicationService.updateFollowUp(userId, applicationId, followUpId, parsed);

      res.json(followUp);
    } catch (err: any) {
      logger.system.error(`Error updating follow-up ${req.params.followUpId}: ${err.message}`);
      res.status(err.statusCode || 400).json({ error: err.message || 'Failed to update follow-up reminder' });
    }
  }

  /**
   * DELETE /api/applications/:id/follow-ups/:followUpId
   */
  public async deleteFollowUp(req: Request, res: Response): Promise<void> {
    try {
      const authUser = (req as any).user;
      const userId = authUser?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }
      const { id: applicationId, followUpId } = req.params;

      await applicationService.deleteFollowUp(userId, applicationId, followUpId);
      res.json({ success: true, message: 'Follow-up deleted successfully' });
    } catch (err: any) {
      logger.system.error(`Error deleting follow-up ${req.params.followUpId}: ${err.message}`);
      res.status(err.statusCode || 400).json({ error: err.message || 'Failed to delete follow-up reminder' });
    }
  }

  /**
   * POST /api/applications/:id/draft-followup
   */
  public async draftFollowUp(req: Request, res: Response): Promise<void> {
    try {
      const authUser = (req as any).user;
      const userId = authUser?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }
      const applicationId = req.params.id;

      const draft = await applicationService.draftFollowUpMessage(userId, applicationId);
      res.json(draft);
    } catch (err: any) {
      logger.system.error(`Error drafting follow-up message: ${err.message}`);
      res.status(err.statusCode || 400).json({ error: err.message || 'Failed to draft follow-up message' });
    }
  }
}

export const applicationController = new ApplicationController();
