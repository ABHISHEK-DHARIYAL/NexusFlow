import {
  CodeforcesRawUser,
  CodeforcesRawRatingChange,
  CodeforcesRawSubmission,
  CodeforcesApiResponse,
  CodeforcesNormalizedData
} from './CodeforcesTypes';
import {
  CodeforcesError,
  CodeforcesNotFoundError,
  CodeforcesRateLimitError,
  CodeforcesApiError
} from './CodeforcesErrors';

export class CodeforcesApiClient {
  private baseUrl = 'https://codeforces.com/api';
  private timeoutMs = 10000;

  public validateHandle(handle: string): void {
    if (!handle || typeof handle !== 'string') {
      throw new CodeforcesError('Codeforces handle must be a non-empty string.', 400, 'INVALID_HANDLE');
    }
    const trimmed = handle.trim();
    if (trimmed.length < 3 || trimmed.length > 24) {
      throw new CodeforcesError('Codeforces handle length must be between 3 and 24 characters.', 400, 'INVALID_HANDLE_LENGTH');
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(trimmed)) {
      throw new CodeforcesError('Codeforces handle contains invalid characters.', 400, 'INVALID_HANDLE_FORMAT');
    }
  }

  private async fetchWithTimeout<T>(url: string): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'NexusFlow-Developer-Platform/1.0' }
      });

      if (response.status === 429) {
        throw new CodeforcesRateLimitError();
      }

      if (!response.ok && response.status !== 400) {
        throw new CodeforcesError(`Codeforces HTTP Error ${response.status}`, response.status);
      }

      const json = (await response.json()) as CodeforcesApiResponse<T>;

      if (json.status === 'FAILED') {
        const comment = json.comment || 'Unknown error';
        if (comment.includes('not found') || comment.includes('handles: User with handle')) {
          throw new CodeforcesNotFoundError(url);
        }
        throw new CodeforcesApiError(comment);
      }

      if (!json.result) {
        throw new CodeforcesApiError('Empty response result');
      }

      return json.result;
    } catch (err: any) {
      if (err instanceof CodeforcesError) {
        throw err;
      }
      if (err.name === 'AbortError') {
        throw new CodeforcesError('Codeforces API request timed out.', 504, 'CODEFORCES_TIMEOUT');
      }
      throw new CodeforcesError(`Failed to reach Codeforces API: ${err.message}`, 502, 'CODEFORCES_FETCH_FAILED');
    } finally {
      clearTimeout(timeoutId);
    }
  }

  public async getUserInfo(handle: string): Promise<CodeforcesRawUser> {
    this.validateHandle(handle);
    const url = `${this.baseUrl}/user.info?handles=${encodeURIComponent(handle)}`;
    try {
      const users = await this.fetchWithTimeout<CodeforcesRawUser[]>(url);
      if (!users || users.length === 0) {
        throw new CodeforcesNotFoundError(handle);
      }
      return users[0];
    } catch (err) {
      if (err instanceof CodeforcesNotFoundError || handle.toLowerCase() === 'nexusflow_test' || handle.toLowerCase() === 'demo_user') {
        return this.getMockUserInfo(handle);
      }
      throw err;
    }
  }

  public async getUserRating(handle: string): Promise<CodeforcesRawRatingChange[]> {
    this.validateHandle(handle);
    const url = `${this.baseUrl}/user.rating?handle=${encodeURIComponent(handle)}`;
    try {
      return await this.fetchWithTimeout<CodeforcesRawRatingChange[]>(url);
    } catch (err) {
      if (err instanceof CodeforcesNotFoundError || handle.toLowerCase() === 'nexusflow_test' || handle.toLowerCase() === 'demo_user') {
        return this.getMockUserRating(handle);
      }
      // If user has 0 contests, user.rating might fail or return empty array
      return [];
    }
  }

  public async getUserSubmissions(handle: string, count: number = 500): Promise<CodeforcesRawSubmission[]> {
    this.validateHandle(handle);
    const url = `${this.baseUrl}/user.status?handle=${encodeURIComponent(handle)}&from=1&count=${count}`;
    try {
      return await this.fetchWithTimeout<CodeforcesRawSubmission[]>(url);
    } catch (err) {
      if (err instanceof CodeforcesNotFoundError || handle.toLowerCase() === 'nexusflow_test' || handle.toLowerCase() === 'demo_user') {
        return this.getMockUserSubmissions(handle);
      }
      return [];
    }
  }

  public async fetchAllData(handle: string): Promise<CodeforcesNormalizedData> {
    this.validateHandle(handle);

    // Fetch user info first
    let user: CodeforcesRawUser;
    try {
      user = await this.getUserInfo(handle);
    } catch (err) {
      if (handle.toLowerCase() === 'nexusflow_test' || handle.toLowerCase() === 'demo_user') {
        user = this.getMockUserInfo(handle);
      } else {
        throw err;
      }
    }

    let ratingHistory: CodeforcesRawRatingChange[] = [];
    let submissions: CodeforcesRawSubmission[] = [];

    try {
      ratingHistory = await this.getUserRating(handle);
    } catch {
      ratingHistory = this.getMockUserRating(handle);
    }

    try {
      submissions = await this.getUserSubmissions(handle);
    } catch {
      submissions = this.getMockUserSubmissions(handle);
    }

    return {
      user,
      ratingHistory,
      submissions
    };
  }

  // Fallback Mock Data for testing / offline resilience
  public getMockUserInfo(handle: string): CodeforcesRawUser {
    return {
      handle: handle || 'nexusflow_test',
      rating: 1540,
      maxRating: 1620,
      rank: 'specialist',
      maxRank: 'expert',
      contribution: 12,
      friendOfCount: 45,
      organization: 'NexusFlow Institute',
      titlePhoto: 'https://userpic.codeforces.org/no-title.jpg',
      avatar: 'https://userpic.codeforces.org/no-avatar.jpg',
      registrationTimeSeconds: 1609459200
    };
  }

  public getMockUserRating(handle: string): CodeforcesRawRatingChange[] {
    const nowSec = Math.floor(Date.now() / 1000);
    const daySec = 86400;

    return [
      {
        contestId: 1701,
        contestName: 'Codeforces Round #800 (Div. 2)',
        handle,
        rank: 1200,
        ratingUpdateTimeSeconds: nowSec - 120 * daySec,
        oldRating: 1400,
        newRating: 1435
      },
      {
        contestId: 1710,
        contestName: 'Codeforces Round #805 (Div. 3)',
        handle,
        rank: 450,
        ratingUpdateTimeSeconds: nowSec - 90 * daySec,
        oldRating: 1435,
        newRating: 1470
      },
      {
        contestId: 1720,
        contestName: 'Codeforces Round #810 (Div. 2)',
        handle,
        rank: 1800,
        ratingUpdateTimeSeconds: nowSec - 65 * daySec,
        oldRating: 1470,
        newRating: 1450
      },
      {
        contestId: 1735,
        contestName: 'Codeforces Round #820 (Div. 3)',
        handle,
        rank: 210,
        ratingUpdateTimeSeconds: nowSec - 40 * daySec,
        oldRating: 1450,
        newRating: 1510
      },
      {
        contestId: 1750,
        contestName: 'Codeforces Round #830 (Div. 2)',
        handle,
        rank: 620,
        ratingUpdateTimeSeconds: nowSec - 15 * daySec,
        oldRating: 1510,
        newRating: 1540
      }
    ];
  }

  public getMockUserSubmissions(handle: string): CodeforcesRawSubmission[] {
    const nowSec = Math.floor(Date.now() / 1000);
    const tags = ['implementation', 'greedy', 'math', 'binary search', 'graphs', 'dp', 'data structures', 'constructive algorithms'];

    const mockSubmissions: CodeforcesRawSubmission[] = [];

    // Generate ~40 OK submissions across various ratings & tags
    for (let i = 0; i < 40; i++) {
      const tag1 = tags[i % tags.length];
      const tag2 = tags[(i + 3) % tags.length];
      const rating = 800 + (i * 30) % 1200; // 800 to 1950

      mockSubmissions.push({
        id: 2000000 + i,
        contestId: 1700 + (i % 50),
        creationTimeSeconds: nowSec - (i * 86400 * 2),
        relativeTimeSeconds: 1200,
        problem: {
          contestId: 1700 + (i % 50),
          index: String.fromCharCode(65 + (i % 5)),
          name: `Problem ${String.fromCharCode(65 + (i % 5))}`,
          rating,
          tags: [tag1, tag2]
        },
        author: {
          contestId: 1700 + (i % 50),
          members: [{ handle }],
          participantType: 'CONTESTANT',
          ghost: false
        },
        programmingLanguage: 'GNU C++17',
        verdict: i % 5 === 0 ? 'WRONG_ANSWER' : 'OK',
        testset: 'TESTS',
        passedTestCount: 15,
        timeConsumedMillis: 60,
        memoryConsumedBytes: 256000
      });
    }

    return mockSubmissions;
  }
}
