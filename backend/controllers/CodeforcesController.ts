import { Request, Response } from 'express';
import { codeforcesService, CodeforcesService } from '../services/CodeforcesService';
import { ApiResponse } from '../../types';
import { UnauthorizedError } from '../utils/errors';

export class CodeforcesController {
  constructor(private service: CodeforcesService = codeforcesService) {}

  public connectProfile = async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw new UnauthorizedError('Authentication required.');
    }

    const { handle } = req.body;
    const result = await this.service.connectProfile(req.user.id, handle);

    const response: ApiResponse<any> = {
      success: true,
      data: result,
      message: result.isExisting
        ? 'Existing active synchronization task found and in progress.'
        : 'Codeforces profile connected and analysis task initiated.'
    };

    res.status(result.isExisting ? 200 : 201).json(response);
  };

  public syncData = async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw new UnauthorizedError('Authentication required.');
    }

    const result = await this.service.syncData(req.user.id);

    const response: ApiResponse<any> = {
      success: true,
      data: result,
      message: 'Codeforces synchronization task queued.'
    };

    res.json(response);
  };

  public getProfile = async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw new UnauthorizedError('Authentication required.');
    }

    const data = await this.service.getProfile(req.user.id);

    const response: ApiResponse<any> = {
      success: true,
      data
    };

    res.json(response);
  };

  public getStatistics = async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw new UnauthorizedError('Authentication required.');
    }

    const data = await this.service.getStatistics(req.user.id);

    const response: ApiResponse<any> = {
      success: true,
      data
    };

    res.json(response);
  };

  public getContests = async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw new UnauthorizedError('Authentication required.');
    }

    const data = await this.service.getContests(req.user.id);

    const response: ApiResponse<any> = {
      success: true,
      data
    };

    res.json(response);
  };

  public getAnalysis = async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw new UnauthorizedError('Authentication required.');
    }

    const data = await this.service.getAnalysis(req.user.id);

    const response: ApiResponse<any> = {
      success: true,
      data
    };

    res.json(response);
  };
}

export const codeforcesController = new CodeforcesController();
