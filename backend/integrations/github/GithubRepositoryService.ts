import { GithubApiClient } from './GithubApiClient';
import {
  GithubRepository,
  GithubBranch,
  GithubCommit,
  GithubContributor,
  GithubIssue,
  GithubPullRequest,
  GithubLanguagesResponse,
  GithubTreeResponse,
  GithubRateLimitStatus,
  PaginationParams,
} from './GithubTypes';

export class GithubRepositoryService {
  constructor(private apiClient: GithubApiClient) {}

  public async getRepository(owner: string, repo: string): Promise<GithubRepository> {
    const response = await this.apiClient.get<GithubRepository>(`/repos/${owner}/${repo}`);
    return response.data;
  }

  public async getRepositoryById(githubRepoId: number): Promise<GithubRepository> {
    const response = await this.apiClient.get<GithubRepository>(`/repositories/${githubRepoId}`);
    return response.data;
  }

  public async getBranches(owner: string, repo: string): Promise<GithubBranch[]> {
    const response = await this.apiClient.get<GithubBranch[]>(`/repos/${owner}/${repo}/branches`, {
      per_page: 100,
    });
    return response.data || [];
  }

  public async getTree(owner: string, repo: string, treeSha: string, recursive = true): Promise<GithubTreeResponse> {
    const response = await this.apiClient.get<GithubTreeResponse>(`/repos/${owner}/${repo}/git/trees/${treeSha}`, {
      recursive: recursive ? 1 : 0,
    });
    return response.data;
  }

  public async getFileContent(owner: string, repo: string, path: string, ref = 'main'): Promise<{ content: string; encoding: string }> {
    const response = await this.apiClient.get<{ content?: string; encoding?: string }>(`/repos/${owner}/${repo}/contents/${path}`, { ref });
    let rawContent = response.data.content || '';
    if (response.data.encoding === 'base64') {
      rawContent = Buffer.from(rawContent, 'base64').toString('utf8');
    }
    return { content: rawContent, encoding: 'utf8' };
  }

  public async getRateLimitStatus(): Promise<GithubRateLimitStatus> {
    const response = await this.apiClient.get<{ rate: GithubRateLimitStatus }>('/rate_limit');
    return response.data.rate;
  }

  public async getCommits(owner: string, repo: string, params?: PaginationParams): Promise<GithubCommit[]> {
    const response = await this.apiClient.get<GithubCommit[]>(`/repos/${owner}/${repo}/commits`, {
      page: params?.page || 1,
      per_page: params?.per_page || 30,
    });
    return response.data || [];
  }

  public async getContributors(owner: string, repo: string): Promise<GithubContributor[]> {
    const response = await this.apiClient.get<GithubContributor[]>(`/repos/${owner}/${repo}/contributors`, {
      per_page: 100,
    });
    return response.data || [];
  }

  public async getIssues(
    owner: string,
    repo: string,
    state: 'open' | 'closed' | 'all' = 'all',
    params?: PaginationParams
  ): Promise<GithubIssue[]> {
    const response = await this.apiClient.get<GithubIssue[]>(`/repos/${owner}/${repo}/issues`, {
      state,
      page: params?.page || 1,
      per_page: params?.per_page || 30,
    });
    const issuesOnly = (response.data || []).filter((issue) => !issue.pull_request);
    return issuesOnly;
  }

  public async getPullRequests(
    owner: string,
    repo: string,
    state: 'open' | 'closed' | 'all' = 'all',
    params?: PaginationParams
  ): Promise<GithubPullRequest[]> {
    const response = await this.apiClient.get<GithubPullRequest[]>(`/repos/${owner}/${repo}/pulls`, {
      state,
      page: params?.page || 1,
      per_page: params?.per_page || 30,
    });
    return response.data || [];
  }

  public async getLanguages(owner: string, repo: string): Promise<GithubLanguagesResponse> {
    const response = await this.apiClient.get<GithubLanguagesResponse>(`/repos/${owner}/${repo}/languages`);
    return response.data || {};
  }
}
