import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIInputSelectionService } from '../../backend/services/AIInputSelectionService';
import { GeminiAiService } from '../../backend/services/GeminiAiService';
import { AIAnalysisService } from '../../backend/services/AIAnalysisService';
import { AIAnalysisOutputSchema } from '../../backend/validations/aiAnalysis.validation';
import { ConflictError, NotFoundError, UnauthorizedError } from '../../backend/utils/errors';
import { TaskStatus, TaskType } from '@prisma/client';
import { prisma } from '../../backend/lib/prisma';
import { aiConfig } from '../../backend/config/aiConfig';

describe('Part 9 - Gemini AI Intelligence Integration Tests', () => {
  describe('AIInputSelectionService - Secret Filtering & Budget Enforcement', () => {
    let inputSelectionService: AIInputSelectionService;

    beforeEach(() => {
      inputSelectionService = new AIInputSelectionService();
    });

    it('should detect secret file patterns correctly', () => {
      expect(inputSelectionService.isSecretFile('.env')).toBe(true);
      expect(inputSelectionService.isSecretFile('.env.production')).toBe(true);
      expect(inputSelectionService.isSecretFile('server.key')).toBe(true);
      expect(inputSelectionService.isSecretFile('cert.pem')).toBe(true);
      expect(inputSelectionService.isSecretFile('id_rsa')).toBe(true);
      expect(inputSelectionService.isSecretFile('service_account_credentials.json')).toBe(true);

      expect(inputSelectionService.isSecretFile('package.json')).toBe(false);
      expect(inputSelectionService.isSecretFile('src/server/app.ts')).toBe(false);
    });

    it('should detect and redact inline secret content', () => {
      const contentWithGithubToken = 'const token = "ghp_1234567890abcdefghijklmnopqrstuvwxyz";';
      const contentWithGoogleKey = 'const key = "AIzaSyD1234567890abcdefghijklmnopqrstuv";';
      const contentClean = 'const value = 42;';

      expect(inputSelectionService.containsSecretContent(contentWithGithubToken)).toBe(true);
      expect(inputSelectionService.containsSecretContent(contentWithGoogleKey)).toBe(true);
      expect(inputSelectionService.containsSecretContent(contentClean)).toBe(false);
    });

    it('should assign higher priority to manifest files and READMEs', () => {
      const packageJsonScore = inputSelectionService.calculateFilePriority('package.json');
      const readmeScore = inputSelectionService.calculateFilePriority('README.md');
      const randomTsScore = inputSelectionService.calculateFilePriority('src/components/Button.tsx');

      expect(packageJsonScore).toBe(100);
      expect(readmeScore).toBe(100);
      expect(packageJsonScore).toBeGreaterThan(randomTsScore);
    });

    it('should enforce input size limits and set isPartial flag when exceeding budget', () => {
      const largeContent = 'a'.repeat(40 * 1024); // 40KB
      const files = [
        { path: 'package.json', content: '{"name":"test"}' },
        { path: 'README.md', content: '# Test Repo' },
        { path: 'src/large1.ts', content: largeContent },
        { path: 'src/large2.ts', content: largeContent },
      ];

      const result = inputSelectionService.selectFilesForAnalysis(files);

      expect(result.filesConsideredCount).toBe(4);
      expect(result.filesAnalyzedCount).toBeLessThan(4);
      expect(result.isPartial).toBe(true);
      expect(result.totalBytes).toBeLessThanOrEqual(60 * 1024 + 1000);
    });
  });

  describe('Zod Validation & Fallback Strategy', () => {
    it('should validate structured AI JSON responses with Zod', () => {
      const validAiOutput = {
        overallScore: 88,
        architectureScore: 90,
        securityScore: 85,
        performanceScore: 82,
        maintainabilityScore: 89,
        documentationScore: 80,
        summary: 'Clean architecture with robust typing.',
        recommendations: ['Add CI tests', 'Configure logger'],
        findings: [
          {
            category: 'SECURITY',
            severity: 'HIGH',
            title: 'Unvalidated env var',
            description: 'Env var missing Zod validation',
            filePath: 'src/config/env.ts',
            lineNumber: 12,
            snippet: 'const val = process.env.VAL;',
            recommendation: 'Wrap in Zod schema',
          },
        ],
      };

      const validated = AIAnalysisOutputSchema.parse(validAiOutput);

      expect(validated.overallScore).toBe(88);
      expect(validated.findings.length).toBe(1);
      expect(validated.findings[0].category).toBe('SECURITY');
    });

    it('should fallback gracefully when Gemini API key is missing or fails', async () => {
      vi.spyOn(aiConfig, 'getApiKey').mockReturnValue(undefined);

      const service = new GeminiAiService();

      const result = await service.analyzeRepository({
        repoFullName: 'test-org/test-repo',
        repoDescription: 'Test repository',
        primaryLanguage: 'TypeScript',
        taskId: 'task_test_123',
        repoId: 'repo_test_123',
        files: [{ path: 'package.json', content: '{"name": "test-repo"}' }],
      });

      expect(result).toBeDefined();
      expect(result.repositoryId).toBe('repo_test_123');
      expect(result.taskId).toBe('task_test_123');
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.findings.length).toBeGreaterThan(0);
      expect(result.summary).toContain('test-org/test-repo');
    });
  });

  describe('AIAnalysisService - IDOR & Idempotency', () => {
    let mockRepoRepo: any;
    let mockTaskRepo: any;
    let mockReportRepo: any;
    let analysisService: AIAnalysisService;

    const mockUserId = 'usr_owner_123';
    const mockRepoId = 'repo_123';

    beforeEach(() => {
      mockRepoRepo = {
        findById: vi.fn(),
        update: vi.fn().mockResolvedValue({}),
      };

      mockTaskRepo = {
        create: vi.fn().mockResolvedValue({
          id: 'task_new_123',
          repositoryId: mockRepoId,
          userId: mockUserId,
          taskType: TaskType.AI_ANALYSIS,
          status: TaskStatus.QUEUED,
        }),
        updateStatus: vi.fn().mockResolvedValue({}),
      };

      mockReportRepo = {
        create: vi.fn().mockResolvedValue({
          id: 'rep_new_123',
          repositoryId: mockRepoId,
          taskId: 'task_new_123',
          overallScore: 88,
          findings: [],
        }),
        findByRepositoryId: vi.fn().mockResolvedValue([]),
        findById: vi.fn().mockResolvedValue(null),
      };

      analysisService = new AIAnalysisService(
        mockRepoRepo,
        mockReportRepo,
        mockTaskRepo
      );

      (vi.spyOn(prisma.repository, 'findUnique') as any).mockImplementation(async (args: any) => {
        if (args.where?.id === mockRepoId) {
          return {
            id: mockRepoId,
            userId: mockUserId,
            name: 'test-repo',
            fullName: 'test-owner/test-repo',
            description: 'Test repository',
            language: 'TypeScript',
            files: [],
          };
        }
        return null;
      });

      (vi.spyOn(prisma.task, 'findFirst') as any).mockResolvedValue(null);
      (vi.spyOn(prisma.task, 'create') as any).mockResolvedValue({
        id: 'task_new_123',
        userId: mockUserId,
        repositoryId: mockRepoId,
        taskType: TaskType.AI_ANALYSIS,
        status: TaskStatus.QUEUED,
        priority: 'HIGH',
        progress: 0,
      });
    });

    it('should reject request if user does not own repository (IDOR protection)', async () => {
      await expect(
        analysisService.triggerAnalysis('attacker_user_999', mockRepoId)
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should prevent duplicate active analysis tasks (Idempotency)', async () => {
      (vi.spyOn(prisma.task, 'findFirst') as any).mockResolvedValue({
        id: 'task_existing_123',
        repositoryId: mockRepoId,
        taskType: TaskType.AI_ANALYSIS,
        status: TaskStatus.RUNNING,
      });

      await expect(
        analysisService.triggerAnalysis(mockUserId, mockRepoId)
      ).rejects.toThrow(ConflictError);
    });

    it('should successfully trigger AI analysis task when valid', async () => {
      const result = await analysisService.triggerAnalysis(mockUserId, mockRepoId);

      expect(result).toBeDefined();
      expect(result.task).toBeDefined();
      expect(result.task.id).toBe('task_new_123');
      expect(result.task.status).toBe(TaskStatus.QUEUED);
    });
  });
});
