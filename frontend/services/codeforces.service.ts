import { apiClient } from './apiClient';
import {
  ApiResponse,
  CodeforcesAnalysis,
  CodeforcesContest,
  CodeforcesDeterministicMetrics,
  CodeforcesProfile,
  CodeforcesTagStats
} from '../types';

export interface CodeforcesProfileResponse {
  profile: CodeforcesProfile;
  metrics?: CodeforcesDeterministicMetrics;
  latestAnalysis?: CodeforcesAnalysis | null;
}

export interface CodeforcesStatsResponse {
  profile: CodeforcesProfile;
  metrics: CodeforcesDeterministicMetrics;
}

export const codeforcesService = {
  async connectProfile(handle: string): Promise<{ profile: CodeforcesProfile; task: any; isExisting: boolean }> {
    const response = await apiClient.post<ApiResponse<{ profile: CodeforcesProfile; task: any; isExisting: boolean }>>(
      '/codeforces/connect',
      { handle }
    );
    return response.data.data;
  },

  async syncData(): Promise<{ profile: CodeforcesProfile; task: any }> {
    const response = await apiClient.post<ApiResponse<{ profile: CodeforcesProfile; task: any }>>(
      '/codeforces/sync'
    );
    return response.data.data;
  },

  async getProfile(): Promise<CodeforcesProfile> {
    const response = await apiClient.get<ApiResponse<CodeforcesProfile>>('/codeforces/profile');
    return response.data.data;
  },

  async getStatistics(): Promise<CodeforcesStatsResponse> {
    const response = await apiClient.get<ApiResponse<CodeforcesStatsResponse>>('/codeforces/statistics');
    return response.data.data;
  },

  async getContests(): Promise<CodeforcesContest[]> {
    const response = await apiClient.get<ApiResponse<CodeforcesContest[]>>('/codeforces/contests');
    return response.data.data;
  },

  async getAnalysis(): Promise<CodeforcesAnalysis> {
    const response = await apiClient.get<ApiResponse<CodeforcesAnalysis>>('/codeforces/analysis');
    return response.data.data;
  }
};
