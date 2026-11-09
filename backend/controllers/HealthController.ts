import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { ApiResponse } from '../types';
import { javaWorkerClient } from '../worker/JavaWorkerClient';

export class HealthController {
  getHealth = async (_req: Request, res: Response) => {
    let dbStatus = 'disconnected';
    let dbError = null;

    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch (err) {
      dbStatus = 'error';
      dbError = (err as Error).message;
    }

    let javaWorkerStatus = 'OFFLINE';
    let javaWorkerDetails: any = null;

    try {
      javaWorkerDetails = await javaWorkerClient.getHealth();
      javaWorkerStatus = javaWorkerDetails.status;
    } catch (err: any) {
      javaWorkerStatus = 'UNREACHABLE';
      javaWorkerDetails = { error: err.message };
    }

    const response: ApiResponse = {
      success: true,
      message: 'NexusFlow API service operational',
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: {
          status: dbStatus,
          error: dbError,
        },
        javaWorker: {
          status: javaWorkerStatus,
          details: javaWorkerDetails,
        },
        version: '1.0.0',
      },
    };

    res.json(response);
  };
}
