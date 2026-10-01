import { Request, Response } from 'express';
import { CrossPlatformVerificationService } from '../services/CrossPlatformVerificationService';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { requireUserId } from '../utils/ownership';
import { logger } from '../logger';

const service = new CrossPlatformVerificationService();

export class CrossPlatformVerificationController {
  public async initiateVerification(req: Request, res: Response): Promise<void> {
    try {
      const userId = requireUserId((req as any).user);
      const result = await service.initiateVerification(userId, (req as any).user);
      res.status(202).json(result);
    } catch (err: any) {
      logger.system.error(`initiateVerification failed: ${err.message}`);
      const statusCode = err instanceof NotFoundError ? 404 : err instanceof BadRequestError ? 400 : 500;
      res.status(statusCode).json({ error: err.message });
    }
  }

  public async getLatestVerification(req: Request, res: Response): Promise<void> {
    try {
      const userId = requireUserId((req as any).user);
      const report = await service.getLatestVerification(userId, (req as any).user);
      if (!report) {
        res.status(404).json({ message: 'No cross-platform verification report found for user.' });
        return;
      }
      res.json(report);
    } catch (err: any) {
      logger.system.error(`getLatestVerification failed: ${err.message}`);
      res.status(500).json({ error: err.message });
    }
  }

  public async getClaims(req: Request, res: Response): Promise<void> {
    try {
      const userId = requireUserId((req as any).user);
      const claims = await service.getClaims(userId, (req as any).user);
      res.json({ claims });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  public async getDiscrepancies(req: Request, res: Response): Promise<void> {
    try {
      const userId = requireUserId((req as any).user);
      const discrepancies = await service.getDiscrepancies(userId, (req as any).user);
      res.json({ discrepancies });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  public async getSources(req: Request, res: Response): Promise<void> {
    try {
      const userId = requireUserId((req as any).user);
      const sources = await service.getSources(userId, (req as any).user);
      res.json({ sources });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  public async reanalyze(req: Request, res: Response): Promise<void> {
    try {
      const userId = requireUserId((req as any).user);
      const result = await service.initiateVerification(userId, (req as any).user);
      res.status(202).json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}

export const crossPlatformVerificationController = new CrossPlatformVerificationController();
