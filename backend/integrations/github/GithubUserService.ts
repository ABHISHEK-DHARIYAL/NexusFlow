import { GithubApiClient } from './GithubApiClient';
import { GithubUser, GithubRepository, ListUserRepositoriesParams } from './GithubTypes';

export class GithubUserService {
  constructor(private apiClient: GithubApiClient) {}

  public async getUserProfile(): Promise<GithubUser> {
    const response = await this.apiClient.get<GithubUser>('/user');
    return response.data;
  }

  public async getUserRepositories(params?: ListUserRepositoriesParams): Promise<{
    repositories: GithubRepository[];
    page: number;
    perPage: number;
    hasMore: boolean;
  }> {
    const page = params?.page || 1;
    const perPage = params?.per_page || 30;

    const queryParams: Record<string, any> = {
      page,
      per_page: perPage,
      sort: params?.sort || 'updated',
      direction: params?.direction || 'desc',
    };

    if (params?.visibility && params.visibility !== 'all') {
      queryParams.type = params.visibility;
    }

    const response = await this.apiClient.get<GithubRepository[]>('/user/repos', queryParams);
    let repositories = response.data || [];

    // Client-side search filtering if search query provided
    if (params?.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      repositories = repositories.filter(
        (r) => r.name.toLowerCase().includes(q) || (r.description && r.description.toLowerCase().includes(q))
      );
    }

    return {
      repositories,
      page,
      perPage,
      hasMore: response.data.length === perPage,
    };
  }
}
