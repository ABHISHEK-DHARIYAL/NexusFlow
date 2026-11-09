import { apiClient } from './apiClient';
import {
  Repository,
  AIAnalysisReport,
  Task,
  ApiResponse,
  RepositoryBranch,
  RepositoryCommit,
  RepositoryContributor,
  RepositoryIssue,
  RepositoryPullRequest,
  RepositoryLanguage,
  GithubRepositoryItem,
} from '../types';

export interface GetRepositoriesParams {
  page?: number;
  limit?: number;
  search?: string;
  visibility?: string;
  language?: string;
}

export interface ImportRepositoryPayload {
  fullName: string;
  description?: string;
  language?: string;
  visibility?: string;
}

export const repositoryService = {
  // GitHub User Repositories (from GitHub REST API proxy)
  async getGithubRepositories(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    visibility?: string;
  }): Promise<GithubRepositoryItem[]> {
    const response = await apiClient.get<ApiResponse<GithubRepositoryItem[]>>('/github/repositories', { params });
    return response.data.data || [];
  },

  async getGithubRepositoryDetails(githubRepoId: number): Promise<GithubRepositoryItem> {
    const response = await apiClient.get<ApiResponse<GithubRepositoryItem>>(`/github/repositories/${githubRepoId}`);
    return response.data.data;
  },

  // NexusFlow Imported Repositories
  async getRepositories(params?: GetRepositoriesParams): Promise<Repository[]> {
    try {
      const response = await apiClient.get<ApiResponse<Repository[]> | { repositories: Repository[] }>(
        '/repositories',
        { params }
      );
      if ('data' in response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return (response.data as { repositories: Repository[] }).repositories || [];
    } catch {
      const response = await apiClient.get<{ repositories: Repository[] }>('/repositories');
      return response.data.repositories || [];
    }
  },

  async getRepositoryById(
    id: string
  ): Promise<{ repository: Repository; latestReport?: AIAnalysisReport; tasks?: Task[] }> {
    const response = await apiClient.get<
      ApiResponse<Repository> | { repository: Repository; latestReport?: AIAnalysisReport; tasks?: Task[] }
    >(`/repositories/${id}`);

    if ('data' in response.data) {
      return { repository: response.data.data };
    }
    return response.data as any;
  },

  async importRepository(payload: ImportRepositoryPayload): Promise<{ repository: Repository; initialTask?: Task }> {
    const response = await apiClient.post<
      ApiResponse<Repository> | { repository: Repository; initialTask?: Task }
    >('/repositories/import', payload);

    if ('data' in response.data) {
      return { repository: response.data.data };
    }
    return response.data as any;
  },

  async syncRepository(id: string): Promise<{ message: string; repository: Repository }> {
    const response = await apiClient.post<ApiResponse<Repository> | { message: string; repository: Repository }>(
      `/repositories/${id}/sync`
    );

    if ('data' in response.data) {
      return { message: 'Synced successfully', repository: response.data.data };
    }
    return response.data as any;
  },

  // Sub-resource endpoints
  async getBranches(id: string): Promise<RepositoryBranch[]> {
    const response = await apiClient.get<ApiResponse<RepositoryBranch[]>>(`/repositories/${id}/branches`);
    return response.data.data || [];
  },

  async getCommits(id: string, params?: { page?: number; limit?: number }): Promise<RepositoryCommit[]> {
    const response = await apiClient.get<ApiResponse<RepositoryCommit[]>>(`/repositories/${id}/commits`, { params });
    return response.data.data || [];
  },

  async getContributors(id: string): Promise<RepositoryContributor[]> {
    const response = await apiClient.get<ApiResponse<RepositoryContributor[]>>(`/repositories/${id}/contributors`);
    return response.data.data || [];
  },

  async getIssues(id: string, state?: string): Promise<RepositoryIssue[]> {
    const response = await apiClient.get<ApiResponse<RepositoryIssue[]>>(`/repositories/${id}/issues`, {
      params: { state },
    });
    return response.data.data || [];
  },

  async getPullRequests(id: string, state?: string): Promise<RepositoryPullRequest[]> {
    const response = await apiClient.get<ApiResponse<RepositoryPullRequest[]>>(`/repositories/${id}/pulls`, {
      params: { state },
    });
    return response.data.data || [];
  },

  async getLanguages(id: string): Promise<RepositoryLanguage[]> {
    const response = await apiClient.get<ApiResponse<RepositoryLanguage[]>>(`/repositories/${id}/languages`);
    return response.data.data || [];
  },

  async deleteRepository(id: string): Promise<void> {
    await apiClient.delete(`/repositories/${id}`);
  },
};
