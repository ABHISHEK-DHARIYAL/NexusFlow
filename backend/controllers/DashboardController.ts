import { Request, Response } from 'express';
import { unifiedCareerDashboardService } from '../services/UnifiedCareerDashboardService';
import { prisma } from '../lib/prisma';
import { UnauthorizedError } from '../utils/errors';

function requireUserId(req: Request): string {
  const userId = req.user?.id;
  if (!userId) {
    throw new UnauthorizedError('Authentication required');
  }
  return userId;
}

export class DashboardController {
  public getOverview = async (req: Request, res: Response): Promise<void> => {
    const userId = requireUserId(req);
    const overview = await unifiedCareerDashboardService.getOverview(userId);
    res.json(overview);
  };

  public getStrengths = async (req: Request, res: Response): Promise<void> => {
    const userId = requireUserId(req);
    const overview = await unifiedCareerDashboardService.getOverview(userId);
    res.json({
      strengths: overview.topStrengths,
    });
  };

  public getGaps = async (req: Request, res: Response): Promise<void> => {
    const userId = requireUserId(req);
    const overview = await unifiedCareerDashboardService.getOverview(userId);
    res.json({
      gaps: overview.topGaps,
    });
  };

  public getActions = async (req: Request, res: Response): Promise<void> => {
    const userId = requireUserId(req);
    const overview = await unifiedCareerDashboardService.getOverview(userId);
    res.json({
      nextBestAction: overview.nextBestAction,
      actions: overview.nextActions,
    });
  };

  public getTimeline = async (req: Request, res: Response): Promise<void> => {
    const userId = requireUserId(req);
    const overview = await unifiedCareerDashboardService.getOverview(userId);
    res.json({
      timeline: overview.careerTimeline,
    });
  };

  /**
   * GET /api/dashboard/summary
   *
   * Fix for a confirmed bug: the frontend (frontend/services/dashboard.service.ts)
   * called this exact path expecting real DashboardSummary data, but no
   * authenticated backend route existed for it. The request was silently
   * falling through to an unauthenticated legacy mock handler in server.ts
   * that returned hardcoded fake numbers to any caller. This implementation
   * is wired to real Prisma-backed data only, scoped to the authenticated
   * user for repository/task metrics. Worker fleet metrics (activeWorkers,
   * totalThroughputPerMin) are system-wide by nature - the Worker model has
   * no per-user ownership in the schema - so they reflect the whole worker
   * fleet rather than a single user's resources.
   */
  public getSummary = async (req: Request, res: Response): Promise<void> => {
    const userId = requireUserId(req);
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const since1m = new Date(Date.now() - 60 * 1000);

    const [
      totalRepositories,
      activeTasks,
      queuedTasks,
      completedTasks24h,
      activeWorkers,
      healthAgg,
      criticalSecurityIssues,
      throughput1m,
    ] = await Promise.all([
      prisma.repository.count({ where: { userId } }),
      prisma.task.count({ where: { userId, status: 'RUNNING' } }),
      prisma.task.count({ where: { userId, status: 'QUEUED' } }),
      prisma.task.count({ where: { userId, status: 'COMPLETED', completedAt: { gte: since24h } } }),
      prisma.worker.count({ where: { status: { in: ['IDLE', 'BUSY'] } } }),
      prisma.repository.aggregate({ where: { userId }, _avg: { healthScore: true } }),
      prisma.aIFinding.count({
        where: { severity: 'CRITICAL', report: { repository: { userId } } },
      }),
      prisma.task.count({ where: { status: 'COMPLETED', completedAt: { gte: since1m } } }),
    ]);

    res.json({
      totalRepositories,
      activeTasks,
      queuedTasks,
      completedTasks24h,
      activeWorkers,
      avgHealthScore: healthAgg._avg.healthScore ?? 0,
      criticalSecurityIssues,
      totalThroughputPerMin: throughput1m,
    });
  };
}
