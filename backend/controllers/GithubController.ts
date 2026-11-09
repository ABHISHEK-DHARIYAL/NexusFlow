import { Request, Response } from 'express';
import { RepositoryService } from '../services/RepositoryService';
import { ApiResponse } from '../types';
import { UnauthorizedError } from '../utils/errors';

export class GithubController {
  constructor(private repoService = new RepositoryService()) {}

  getRepositories = async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw new UnauthorizedError('Authentication required');
    }

    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.per_page as string) || 30;
    const visibility = req.query.visibility as 'all' | 'public' | 'private';
    const sort = req.query.sort as 'created' | 'updated' | 'pushed' | 'full_name';
    const direction = req.query.direction as 'asc' | 'desc';
    const search = req.query.search as string;

    const result = await this.repoService.listGithubRepositories(req.user.id, {
      page,
      per_page: perPage,
      visibility,
      sort,
      direction,
      search,
    });

    const response: ApiResponse<any> = {
      success: true,
      data: result.repositories,
      meta: {
        page: result.page,
        limit: result.perPage,
        total: result.repositories.length,
        totalPages: result.hasMore ? result.page + 1 : result.page,
      },
    };

    res.json(response);
  };

  getRepositoryById = async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw new UnauthorizedError('Authentication required');
    }

    const githubRepoId = parseInt(req.params.githubRepositoryId, 10);
    const repoDetails = await this.repoService.getGithubRepositoryDetails(req.user.id, githubRepoId);

    const response: ApiResponse<any> = {
      success: true,
      data: repoDetails,
    };

    res.json(response);
  };
}
