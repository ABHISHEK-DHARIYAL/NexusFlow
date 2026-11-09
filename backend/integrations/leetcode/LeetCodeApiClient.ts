import { logger } from '../../logger';
import { AppError, BadRequestError, NotFoundError } from '../../utils/errors';
import { LeetCodeFetchDataResult, LeetCodeRawContest, LeetCodeRawProfile, LeetCodeRawTopicStat } from './LeetCodeTypes';

export class LeetCodeApiClient {
  private readonly baseUrl = 'https://leetcode.com/graphql';

  public validateUsername(username: string): boolean {
    if (!username || typeof username !== 'string') return false;
    // LeetCode usernames allow letters, numbers, underscores, and hyphens, 3 to 30 chars
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
    return usernameRegex.test(username.trim());
  }

  private isDemoUser(username: string): boolean {
    return process.env.NODE_ENV === 'test' || username.toLowerCase() === 'demo_user';
  }

  public async fetchUserData(username: string): Promise<LeetCodeFetchDataResult> {
    const cleanUsername = username.trim();
    if (!this.validateUsername(cleanUsername)) {
      throw new BadRequestError(`Invalid LeetCode username: '${username}'`);
    }

    // Demo / test mode only. Real usernames never receive mock data.
    if (this.isDemoUser(cleanUsername)) {
      return this.getMockData(cleanUsername);
    }

    // 1) Official LeetCode GraphQL API
    const gql = await this.fetchUserGraphQL(cleanUsername);
    if (gql.status === 'not_found') {
      throw new NotFoundError(`LeetCode user '${cleanUsername}' was not found. Check the username and make sure the profile is public.`);
    }

    if (gql.status === 'ok') {
      const contests = await this.fetchContestGraphQL(cleanUsername);
      return { profile: gql.profile, topicStats: gql.topicStats, contests };
    }

    // 2) LeetCode often blocks cloud-hosting IPs (Render, etc). Try public mirror APIs.
    logger.ai.warn(`LeetCode GraphQL unavailable for ${cleanUsername} (${gql.reason}). Trying fallback APIs.`);
    const fallback = await this.fetchFromFallbackApis(cleanUsername);
    if (fallback === 'not_found') {
      throw new NotFoundError(`LeetCode user '${cleanUsername}' was not found. Check the username and make sure the profile is public.`);
    }
    if (fallback) {
      return fallback;
    }

    throw new AppError(
      'Could not reach LeetCode right now (it may be blocking this server). Please try again in a few minutes.',
      502
    );
  }

  private buildHeaders(username?: string): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Origin: 'https://leetcode.com',
      Referer: username ? `https://leetcode.com/u/${username}/` : 'https://leetcode.com/',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    };
  }

  private async postGraphQL(query: string, username: string): Promise<{ ok: boolean; status: number; json: any }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const res = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.buildHeaders(username),
        body: JSON.stringify({ query, variables: { username } }),
        signal: controller.signal,
      });
      let json: any = null;
      try {
        json = await res.json();
      } catch {
        json = null;
      }
      return { ok: res.ok, status: res.status, json };
    } finally {
      clearTimeout(timeout);
    }
  }

  private async fetchUserGraphQL(
    username: string
  ): Promise<
    | { status: 'ok'; profile: LeetCodeRawProfile; topicStats: LeetCodeRawTopicStat[] }
    | { status: 'not_found' }
    | { status: 'unavailable'; reason: string }
  > {
    const query = `
      query userProfileData($username: String!) {
        matchedUser(username: $username) {
          username
          profile {
            realName
            ranking
            reputation
          }
          submitStats {
            acSubmissionNum {
              difficulty
              count
              submissions
            }
            totalSubmissionNum {
              difficulty
              count
              submissions
            }
          }
          userCalendar {
            streak
          }
          tagProblemCounts {
            advanced { tagName problemsSolved }
            intermediate { tagName problemsSolved }
            fundamental { tagName problemsSolved }
          }
        }
      }
    `;

    try {
      const { ok, status, json } = await this.postGraphQL(query, username);

      // GraphQL answered normally but there is no such user.
      if (json?.data && json.data.matchedUser === null) {
        return { status: 'not_found' };
      }
      if (!ok || !json?.data?.matchedUser) {
        return { status: 'unavailable', reason: `HTTP ${status}` };
      }

      const user = json.data.matchedUser;
      let totalSolved = 0;
      let easySolved = 0;
      let mediumSolved = 0;
      let hardSolved = 0;
      let acSubs = 0;
      let allSubs = 0;

      for (const stat of user.submitStats?.acSubmissionNum || []) {
        if (stat.difficulty === 'All') {
          totalSolved = stat.count || 0;
          acSubs = stat.submissions || 0;
        }
        if (stat.difficulty === 'Easy') easySolved = stat.count || 0;
        if (stat.difficulty === 'Medium') mediumSolved = stat.count || 0;
        if (stat.difficulty === 'Hard') hardSolved = stat.count || 0;
      }
      for (const stat of user.submitStats?.totalSubmissionNum || []) {
        if (stat.difficulty === 'All') allSubs = stat.submissions || 0;
      }
      const acceptanceRate = allSubs > 0 ? Math.round((acSubs / allSubs) * 1000) / 10 : 0;

      const topicStats: LeetCodeRawTopicStat[] = [];
      const tags = user.tagProblemCounts || {};
      for (const cat of ['fundamental', 'intermediate', 'advanced']) {
        if (!Array.isArray(tags[cat])) continue;
        for (const item of tags[cat]) {
          if (item.tagName && item.problemsSolved > 0) {
            // LeetCode does not expose per-topic difficulty; split by the user's overall mix.
            const base = totalSolved || 1;
            const easy = Math.round(item.problemsSolved * (easySolved / base));
            const hard = Math.round(item.problemsSolved * (hardSolved / base));
            topicStats.push({
              topicName: item.tagName,
              solvedCount: item.problemsSolved,
              easyCount: easy,
              mediumCount: Math.max(0, item.problemsSolved - easy - hard),
              hardCount: hard,
            });
          }
        }
      }

      return {
        status: 'ok',
        topicStats,
        profile: {
          username: user.username || username,
          realName: user.profile?.realName || username,
          profileUrl: `https://leetcode.com/u/${username}/`,
          ranking: user.profile?.ranking || 0,
          reputation: user.profile?.reputation || 0,
          totalSolved,
          easySolved,
          mediumSolved,
          hardSolved,
          acceptanceRate,
          streak: user.userCalendar?.streak || 0,
        },
      };
    } catch (err: any) {
      return { status: 'unavailable', reason: err?.name === 'AbortError' ? 'timeout' : err?.message || 'network error' };
    }
  }

  private async fetchContestGraphQL(username: string): Promise<LeetCodeRawContest[]> {
    const query = `
      query userContestRankingInfo($username: String!) {
        userContestRankingHistory(username: $username) {
          attended
          rating
          ranking
          problemsSolved
          totalProblems
          contest {
            title
            startTime
          }
        }
      }
    `;

    try {
      const { ok, json } = await this.postGraphQL(query, username);
      if (!ok) return [];
      const history = json?.data?.userContestRankingHistory || [];

      const contests: LeetCodeRawContest[] = [];
      let prevRating = 1500;
      for (const item of history) {
        if (!item?.attended) continue;
        const currentRating = Math.round(item.rating || prevRating);
        const ratingChange = currentRating - prevRating;
        prevRating = currentRating;
        const solved = item.problemsSolved || 0;
        contests.push({
          contestName: item.contest?.title || 'Contest',
          contestDate: item.contest?.startTime ? new Date(item.contest.startTime * 1000) : new Date(),
          rating: currentRating,
          ranking: item.ranking || 0,
          problemsSolved: solved,
          totalProblems: item.totalProblems || 4,
          score: solved * 4,
          ratingChange,
        });
      }
      // No contest history is a valid state (many users never joined a contest).
      return contests;
    } catch {
      return [];
    }
  }

  private async getJson(url: string): Promise<{ ok: boolean; status: number; json: any }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': this.buildHeaders()['User-Agent'] }, signal: controller.signal });
      let json: any = null;
      try {
        json = await res.json();
      } catch {
        json = null;
      }
      return { ok: res.ok, status: res.status, json };
    } finally {
      clearTimeout(timeout);
    }
  }

  /** Public mirror APIs used only when leetcode.com itself is unreachable from this server. */
  private async fetchFromFallbackApis(username: string): Promise<LeetCodeFetchDataResult | 'not_found' | null> {
    const enc = encodeURIComponent(username);
    try {
      const { ok, json } = await this.getJson(`https://leetcode-stats-api.herokuapp.com/${enc}`);
      if (json && json.status === 'error') {
        if (/does not exist|not exist|not found/i.test(String(json.message || ''))) return 'not_found';
      } else if (ok && json && json.status === 'success') {
        return {
          profile: {
            username,
            realName: username,
            profileUrl: `https://leetcode.com/u/${username}/`,
            ranking: json.ranking || 0,
            reputation: json.reputation || 0,
            totalSolved: json.totalSolved || 0,
            easySolved: json.easySolved || 0,
            mediumSolved: json.mediumSolved || 0,
            hardSolved: json.hardSolved || 0,
            acceptanceRate: json.acceptanceRate || 0,
            streak: 0,
          },
          contests: [],
          topicStats: [],
        };
      }
    } catch (err: any) {
      logger.ai.warn(`leetcode-stats-api fallback failed: ${err?.message}`);
    }

    try {
      const { ok, json } = await this.getJson(`https://alfa-leetcode-api.onrender.com/${enc}/solved`);
      if (ok && json && typeof json.solvedProblem === 'number') {
        return {
          profile: {
            username,
            realName: username,
            profileUrl: `https://leetcode.com/u/${username}/`,
            ranking: 0,
            reputation: 0,
            totalSolved: json.solvedProblem || 0,
            easySolved: json.easySolved || 0,
            mediumSolved: json.mediumSolved || 0,
            hardSolved: json.hardSolved || 0,
            acceptanceRate: 0,
            streak: 0,
          },
          contests: [],
          topicStats: [],
        };
      }
    } catch (err: any) {
      logger.ai.warn(`alfa-leetcode-api fallback failed: ${err?.message}`);
    }
    return null;
  }

  public getMockData(username: string): LeetCodeFetchDataResult {
    return {
      profile: {
        username,
        realName: `${username} Developer`,
        profileUrl: `https://leetcode.com/${username}/`,
        ranking: 34500,
        reputation: 185,
        totalSolved: 385,
        easySolved: 120,
        mediumSolved: 220,
        hardSolved: 45,
        acceptanceRate: 64.2,
        streak: 21,
      },
      contests: this.getDefaultContestHistory(),
      topicStats: this.getDefaultTopicStats(),
    };
  }

  private getDefaultContestHistory(): LeetCodeRawContest[] {
    const now = Date.now();
    const day = 86400000;
    return [
      {
        contestName: 'Weekly Contest 380',
        contestDate: new Date(now - 70 * day),
        rating: 1400,
        ranking: 4500,
        problemsSolved: 2,
        totalProblems: 4,
        score: 7,
        ratingChange: +20,
      },
      {
        contestName: 'Weekly Contest 382',
        contestDate: new Date(now - 56 * day),
        rating: 1430,
        ranking: 3800,
        problemsSolved: 3,
        totalProblems: 4,
        score: 12,
        ratingChange: +30,
      },
      {
        contestName: 'Biweekly Contest 123',
        contestDate: new Date(now - 42 * day),
        rating: 1475,
        ranking: 2900,
        problemsSolved: 3,
        totalProblems: 4,
        score: 12,
        ratingChange: +45,
      },
      {
        contestName: 'Weekly Contest 385',
        contestDate: new Date(now - 28 * day),
        rating: 1450,
        ranking: 4200,
        problemsSolved: 2,
        totalProblems: 4,
        score: 7,
        ratingChange: -25,
      },
      {
        contestName: 'Weekly Contest 388',
        contestDate: new Date(now - 14 * day),
        rating: 1510,
        ranking: 2100,
        problemsSolved: 3,
        totalProblems: 4,
        score: 12,
        ratingChange: +60,
      },
    ];
  }

  private getDefaultTopicStats(): LeetCodeRawTopicStat[] {
    return [
      { topicName: 'Arrays', solvedCount: 80, easyCount: 30, mediumCount: 40, hardCount: 10 },
      { topicName: 'Strings', solvedCount: 50, easyCount: 25, mediumCount: 20, hardCount: 5 },
      { topicName: 'Hash Table', solvedCount: 65, easyCount: 25, mediumCount: 35, hardCount: 5 },
      { topicName: 'Two Pointers', solvedCount: 40, easyCount: 15, mediumCount: 20, hardCount: 5 },
      { topicName: 'Binary Search', solvedCount: 35, easyCount: 10, mediumCount: 20, hardCount: 5 },
      { topicName: 'Trees', solvedCount: 42, easyCount: 12, mediumCount: 25, hardCount: 5 },
      { topicName: 'Graphs', solvedCount: 35, easyCount: 5, mediumCount: 20, hardCount: 10 },
      { topicName: 'Dynamic Programming', solvedCount: 18, easyCount: 2, mediumCount: 11, hardCount: 5 },
      { topicName: 'Sliding Window', solvedCount: 20, easyCount: 5, mediumCount: 12, hardCount: 3 },
    ];
  }
}

export const leetCodeApiClient = new LeetCodeApiClient();
