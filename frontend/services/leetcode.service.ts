import { apiClient } from './apiClient';
import { ApiResponse, LeetCodeAnalysis, LeetCodeContest, LeetCodeDeterministicMetrics, LeetCodeProfile, LeetCodeTopicStats } from '../types';

export interface LeetCodeProfileResponse {
  profile: LeetCodeProfile;
  metrics: LeetCodeDeterministicMetrics;
  latestAnalysis: LeetCodeAnalysis | null;
}

export interface LeetCodeContestsResponse {
  contests: LeetCodeContest[];
  contestRating: number;
  maxRating: number;
  ratingTrend: string;
  globalRanking?: number | null;
}

export interface LeetCodeStatsResponse {
  profile: LeetCodeProfile;
  topicStats: LeetCodeTopicStats[];
  metrics: LeetCodeDeterministicMetrics;
}

export const leetCodeService = {
  async connectProfile(username: string): Promise<{ profile: LeetCodeProfile; task: any; isExisting: boolean }> {
    const response = await apiClient.post<ApiResponse<{ profile: LeetCodeProfile; task: any; isExisting: boolean }>>(
      '/leetcode/connect',
      { username }
    );
    return response.data.data;
  },

  async syncData(): Promise<{ profile: LeetCodeProfile; task: any }> {
    const response = await apiClient.post<ApiResponse<{ profile: LeetCodeProfile; task: any }>>(
      '/leetcode/sync'
    );
    return response.data.data;
  },

  async getProfile(): Promise<LeetCodeProfileResponse> {
    const response = await apiClient.get<ApiResponse<LeetCodeProfileResponse>>('/leetcode/profile');
    return response.data.data;
  },

  async getStatistics(): Promise<LeetCodeStatsResponse> {
    const response = await apiClient.get<ApiResponse<LeetCodeStatsResponse>>('/leetcode/statistics');
    return response.data.data;
  },

  async getContests(): Promise<LeetCodeContestsResponse> {
    const response = await apiClient.get<ApiResponse<LeetCodeContestsResponse>>('/leetcode/contests');
    return response.data.data;
  },

  async getAnalysis(): Promise<LeetCodeAnalysis> {
    const response = await apiClient.get<ApiResponse<LeetCodeAnalysis>>('/leetcode/analysis');
    return response.data.data;
  },
};
