import { GithubApiError } from '../../utils/errors';
import { logger } from '../../logger';

export interface GithubApiResponse<T> {
  data: T;
  status: number;
  rateLimitRemaining?: number;
  rateLimitReset?: number;
}

export class GithubApiClient {
  private baseUrl = 'https://api.github.com';
  private timeoutMs = 15000; // 15s timeout

  constructor(private accessToken: string) {
    if (!accessToken) {
      throw new GithubApiError('GitHub access token is required for integration API client', 401);
    }
  }

  public async get<T>(path: string, params?: Record<string, any>): Promise<GithubApiResponse<T>> {
    return this.request<T>('GET', path, undefined, params);
  }

  public async post<T>(path: string, body?: any): Promise<GithubApiResponse<T>> {
    return this.request<T>('POST', path, body);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: any,
    params?: Record<string, any>
  ): Promise<GithubApiResponse<T>> {
    let url = path.startsWith('http') ? path : `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      logger.repository.info(`[GitHubApiClient] ${method} ${path}`);

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'NexusFlow-GitHub-Integration',
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const rateLimitRemaining = response.headers.get('x-ratelimit-remaining')
        ? parseInt(response.headers.get('x-ratelimit-remaining')!, 10)
        : undefined;
      const rateLimitReset = response.headers.get('x-ratelimit-reset')
        ? parseInt(response.headers.get('x-ratelimit-reset')!, 10)
        : undefined;

      if (!response.ok) {
        await this.handleErrorResponse(response, path);
      }

      const data = (await response.json()) as T;

      return {
        data,
        status: response.status,
        rateLimitRemaining,
        rateLimitReset,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);

      if (err instanceof GithubApiError) {
        throw err;
      }

      if (err.name === 'AbortError') {
        logger.repository.error(`[GitHubApiClient] Request timed out for ${path}`);
        throw new GithubApiError('GitHub API request timed out. Please try again.', 504);
      }

      logger.repository.error(`[GitHubApiClient] Network error calling ${path}: ${err.message}`);
      throw new GithubApiError('Failed to communicate with GitHub API service. Check network connectivity.', 502);
    }
  }

  private async handleErrorResponse(response: Response, path: string): Promise<never> {
    const status = response.status;
    let errorMessage = `GitHub API request failed with status ${status}`;

    try {
      const errorJson = await response.json();
      if (errorJson.message) {
        errorMessage = errorJson.message;
      }
    } catch {
      // Body not JSON
    }

    logger.repository.error(`[GitHubApiClient] Error ${status} for ${path}: ${errorMessage}`);

    if (status === 401) {
      throw new GithubApiError('GitHub access token is invalid or expired. Please re-authenticate.', 401);
    }

    if (status === 403 || status === 429) {
      const remaining = response.headers.get('x-ratelimit-remaining');
      if (remaining === '0') {
        const resetTime = response.headers.get('x-ratelimit-reset');
        const resetDate = resetTime ? new Date(parseInt(resetTime, 10) * 1000).toLocaleTimeString() : 'later';
        throw new GithubApiError(`GitHub API rate limit exceeded. Resets at ${resetDate}.`, 429);
      }
      throw new GithubApiError(`Access to GitHub resource forbidden: ${errorMessage}`, 403);
    }

    if (status === 404) {
      throw new GithubApiError(`GitHub resource not found at ${path}`, 404);
    }

    if (status === 409) {
      throw new GithubApiError(`GitHub conflict error: ${errorMessage}`, 409);
    }

    if (status === 422) {
      throw new GithubApiError(`GitHub validation error: ${errorMessage}`, 422);
    }

    if (status >= 500) {
      throw new GithubApiError('GitHub service is currently unavailable. Please try again later.', status);
    }

    throw new GithubApiError(errorMessage, status);
  }
}
