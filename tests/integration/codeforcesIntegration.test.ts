import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CodeforcesApiClient } from '../../backend/integrations/codeforces/CodeforcesApiClient';
import { CodeforcesAnalysisEngine } from '../../backend/services/CodeforcesAnalysisEngine';
import { CodeforcesAiService } from '../../backend/services/CodeforcesAiService';
import { CodeforcesAiReportSchema } from '../../backend/validations/codeforcesAiValidation';
import { CodeforcesError } from '../../backend/integrations/codeforces/CodeforcesErrors';

describe('Part 12 - Codeforces Intelligence & Contest Analytics Tests', () => {
  let apiClient: CodeforcesApiClient;
  let engine: CodeforcesAnalysisEngine;
  let aiService: CodeforcesAiService;

  beforeEach(() => {
    apiClient = new CodeforcesApiClient();
    engine = new CodeforcesAnalysisEngine();
    aiService = new CodeforcesAiService();
  });

  describe('CodeforcesApiClient Validation & Mock Data', () => {
    it('should validate valid handle strings', () => {
      expect(() => apiClient.validateHandle('tourist')).not.toThrow();
      expect(() => apiClient.validateHandle('nexusflow_test')).not.toThrow();
      expect(() => apiClient.validateHandle('user-123')).not.toThrow();
    });

    it('should throw error for invalid handles', () => {
      expect(() => apiClient.validateHandle('')).toThrow(CodeforcesError);
      expect(() => apiClient.validateHandle('a')).toThrow(CodeforcesError); // too short
      expect(() => apiClient.validateHandle('a'.repeat(30))).toThrow(CodeforcesError); // too long
      expect(() => apiClient.validateHandle('user@name')).toThrow(CodeforcesError); // invalid char
    });

    it('should return mock user info for test handle', async () => {
      const user = await apiClient.getUserInfo('nexusflow_test');
      expect(user).toBeDefined();
      expect(user.handle).toBe('nexusflow_test');
      expect(user.rating).toBe(1540);
      expect(user.maxRating).toBe(1620);
      expect(user.rank).toBe('specialist');
    });

    it('should return mock rating changes for test handle', async () => {
      const ratingHistory = await apiClient.getUserRating('nexusflow_test');
      expect(ratingHistory).toBeDefined();
      expect(ratingHistory.length).toBeGreaterThan(0);
      expect(ratingHistory[0].newRating).toBeGreaterThan(ratingHistory[0].oldRating);
    });

    it('should return mock submissions for test handle', async () => {
      const submissions = await apiClient.getUserSubmissions('nexusflow_test');
      expect(submissions).toBeDefined();
      expect(submissions.length).toBeGreaterThan(0);
      expect(submissions[0].problem).toBeDefined();
    });
  });

  describe('CodeforcesAnalysisEngine Metric Computation', () => {
    it('should compute deterministic metrics correctly', () => {
      const mockUser = apiClient.getMockUserInfo('nexusflow_test');
      const mockRating = apiClient.getMockUserRating('nexusflow_test');
      const mockSubmissions = apiClient.getMockUserSubmissions('nexusflow_test');

      const metrics = engine.computeMetrics(mockUser, mockRating, mockSubmissions);

      expect(metrics).toBeDefined();
      expect(metrics.cpScore).toBeGreaterThan(0);
      expect(metrics.cpScore).toBeLessThanOrEqual(100);
      expect(metrics.currentRating).toBe(1540);
      expect(metrics.maxRating).toBe(1620);
      expect(metrics.currentRank).toBe('specialist');
      expect(metrics.contestCount).toBe(5);
      expect(metrics.totalProblemsSolved).toBeGreaterThan(0);
      expect(metrics.ratingTrend).toBe('IMPROVING');
      expect(metrics.strongTags).toBeDefined();
      expect(metrics.weakTags).toBeDefined();
      expect(metrics.difficultyDistribution).toBeDefined();
      expect(metrics.recommendationSignals.length).toBeGreaterThan(0);
    });

    it('should compute NO_DATA rating trend when rating history is empty', () => {
      const mockUser = apiClient.getMockUserInfo('nexusflow_test');
      const metrics = engine.computeMetrics(mockUser, [], []);
      expect(metrics.ratingTrend).toBe('NO_DATA');
      expect(metrics.contestCount).toBe(0);
    });
  });

  describe('CodeforcesAiService Validation & Fallback Report', () => {
    it('should generate valid fallback AI report matching Zod schema', () => {
      const mockUser = apiClient.getMockUserInfo('nexusflow_test');
      const mockRating = apiClient.getMockUserRating('nexusflow_test');
      const mockSubmissions = apiClient.getMockUserSubmissions('nexusflow_test');

      const metrics = engine.computeMetrics(mockUser, mockRating, mockSubmissions);
      const report = aiService.generateFallbackReport('nexusflow_test', metrics);

      expect(report).toBeDefined();
      expect(() => CodeforcesAiReportSchema.parse(report)).not.toThrow();
      expect(report.summary).toContain('nexusflow_test');
      expect(report.strengths.length).toBeGreaterThan(0);
      expect(report.weaknesses.length).toBeGreaterThan(0);
      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(report.learningRoadmap.length).toBeGreaterThan(0);
      expect(report.contestStrategy.length).toBeGreaterThan(0);
    });
  });
});
