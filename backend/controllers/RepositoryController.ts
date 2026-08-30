import { Request, Response } from 'express';
import { RepositoryService } from '../services/RepositoryService';
import { ApiResponse } from '../types';
import { UnauthorizedError } from '../utils/errors';

export class RepositoryController {
  constructor(private repoService = new RepositoryService()) {}

  getRepositories = async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw new UnauthorizedError('Authentication required');
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const language = req.query.language as string;
    const visibility = req.query.visibility as string;

    const { repositories, total } = await this.repoService.getAllRepositories(req.user.id, {
      page,
      limit,
      search,
      language,
      visibility,
    });

    const response: ApiResponse<any> = {
      success: true,
      data: repositories,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };

    res.json(response);
  };

  getRepositoryById = async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw new UnauthorizedError('Authentication required');
    }

    const repo = await this.repoService.getRepositoryById(req.params.id, req.user.id);
    const response: ApiResponse<any> = {
      success: true,
      data: repo,
    };

    res.json(response);
  };

  connectRepository = async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw new UnauthorizedError('Authentication required');
    }

    const repo = await this.repoService.connectRepository(req.user.id, req.body);
    const response: ApiResponse<any> = {
      success: true,
      message: 'Repository connected successfully',
      data: repo,
    };

    res.status(201).json(response);
  };

  importRepository = async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw new UnauthorizedError('Authentication required');
    }

    const repo = await this.repoService.importRepository(req.user.id, req.body);
    const response: ApiResponse<any> = {
      success: true,
      message: 'Repository imported successfully and synchronization queued',
      data: repo,
    };

    res.status(201).json(response);
  };

  syncRepository = async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw new UnauthorizedError('Authentication required');
    }

    const syncResult = await this.repoService.triggerRepositorySync(req.user.id, req.params.id);
    const response: ApiResponse<any> = {
      success: true,
      message: 'Repository synchronization task queued successfully',
      data: syncResult,
    };

    res.status(202).json(response);
  };

  getSyncStatus = async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw new UnauthorizedError('Authentication required');
    }

    const syncStatus = await this.repoService.getSyncStatus(req.user.id, req.params.id, req.params.syncId);
    const response: ApiResponse<any> = {
      success: true,
      data: syncStatus,
    };

    res.json(response);
  };

  getFiles = async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw new UnauthorizedError('Authentication required');
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const { files, total } = await this.repoService.getFiles(req.user.id, req.params.id, { page, limit });
    const response: ApiResponse<any> = {
      success: true,
      data: files,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };

    res.json(response);
  };

  getBranches = async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw new UnauthorizedError('Authentication required');
    }

    const branches = await this.repoService.getBranches(req.user.id, req.params.id);
    const response: ApiResponse<any> = {
      success: true,
      data: branches,
    };

    res.json(response);
  };

  getCommits = async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw new UnauthorizedError('Authentication required');
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 30;

    const { commits, total } = await this.repoService.getCommits(req.user.id, req.params.id, { page, limit });
    const response: ApiResponse<any> = {
      success: true,
      data: commits,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };

    res.json(response);
  };

  getContributors = async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw new UnauthorizedError('Authentication required');
    }

    const contributors = await this.repoService.getContributors(req.user.id, req.params.id);
    const response: ApiResponse<any> = {
      success: true,
      data: contributors,
    };

    res.json(response);
  };

  getIssues = async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw new UnauthorizedError('Authentication required');
    }

    const state = req.query.state as string;
    const issues = await this.repoService.getIssues(req.user.id, req.params.id, state);
    const response: ApiResponse<any> = {
      success: true,
      data: issues,
    };

    res.json(response);
  };

  getPullRequests = async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw new UnauthorizedError('Authentication required');
    }

    const state = req.query.state as string;
    const pullRequests = await this.repoService.getPullRequests(req.user.id, req.params.id, state);
    const response: ApiResponse<any> = {
      success: true,
      data: pullRequests,
    };

    res.json(response);
  };

  getLanguages = async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw new UnauthorizedError('Authentication required');
    }

    const languages = await this.repoService.getLanguages(req.user.id, req.params.id);
    const response: ApiResponse<any> = {
      success: true,
      data: languages,
    };

    res.json(response);
  };

  deleteRepository = async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw new UnauthorizedError('Authentication required');
    }

    await this.repoService.deleteRepository(req.user.id, req.params.id);
    const response: ApiResponse<any> = {
      success: true,
      message: 'Repository deleted successfully',
    };

    res.json(response);
  };
}
