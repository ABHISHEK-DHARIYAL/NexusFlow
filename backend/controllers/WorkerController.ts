import { Request, Response } from 'express';
import { WorkerService } from '../services/WorkerService';
import { ApiResponse } from '../types';
import { WorkerStatus } from '@prisma/client';

export class WorkerController {
  constructor(private workerService = new WorkerService()) {}

  getWorkers = async (req: Request, res: Response) => {
    const status = req.query.status as WorkerStatus;
    const workers = await this.workerService.getAllWorkers({ status });

    const response: ApiResponse = {
      success: true,
      data: workers,
    };

    res.json(response);
  };

  getWorkerById = async (req: Request, res: Response) => {
    const worker = await this.workerService.getWorkerById(req.params.id);
    const response: ApiResponse = {
      success: true,
      data: worker,
    };
    res.json(response);
  };

  registerWorker = async (req: Request, res: Response) => {
    const worker = await this.workerService.registerWorker(req.body);
    const response: ApiResponse = {
      success: true,
      message: 'Worker node registered successfully',
      data: worker,
    };
    res.status(201).json(response);
  };

  heartbeat = async (req: Request, res: Response) => {
    const { workerId, status, activeThreads } = req.body;
    const worker = await this.workerService.heartbeat(workerId, status, activeThreads);
    const response: ApiResponse = {
      success: true,
      message: 'Heartbeat acknowledged',
      data: worker,
    };
    res.json(response);
  };

  getMetrics = async (req: Request, res: Response) => {
    const metrics = await this.workerService.getLatestMetrics();
    const response: ApiResponse = {
      success: true,
      data: metrics,
    };
    res.json(response);
  };
}
