import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResumeClaimExtractor } from '../../backend/integrations/resume/ResumeClaimExtractor';
import { ClaimMatcher } from '../../backend/integrations/resume/ClaimMatcher';
import { GitHubEvidenceExtractor, ExtractedRepoEvidence } from '../../backend/integrations/resume/GitHubEvidenceExtractor';
import { ResumeGitHubVerificationService } from '../../backend/services/ResumeGitHubVerificationService';
import { isSecretFilePath, sanitizeContent } from '../../backend/utils/secretFilter';
import { UnauthorizedError, ForbiddenError, NotFoundError } from '../../backend/utils/errors';
import { ResumeClaim, VerificationStatus } from '../../types';

describe('Part 15 - Resume ↔ GitHub Verification Integration Tests', () => {
  describe('ResumeClaimExtractor', () => {
    it('should extract structured claims across multiple categories from resume data', () => {
      const resumeData = {
        contactInfo: { github: 'https://github.com/johndoe' },
        workExperience: [
          {
            company: 'TechScale Cloud',
            title: 'Senior Engineer',
            dateRange: '2022-Present',
            highlights: [
              'Architected microservice event pipeline processing 15M daily telemetry events with 99.99% uptime.',
              'Reduced API P99 latency by 42% across 12 core backend services.',
              'Developed custom Java multi-threaded worker engine with ReentrantLock concurrency.'
            ]
          }
        ],
        skills: {
          technical: ['TypeScript', 'Node.js', 'Go', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes', 'Gemini AI']
        },
        projects: [
          {
            title: 'NexusFlow Developer Intelligence Engine',
            description: 'Full-stack platform with AST analysis and Gemini AI reports.'
          }
        ],
        education: []
      };

      const claims = ResumeClaimExtractor.extractClaims(resumeData);

      expect(claims.length).toBeGreaterThan(0);
      expect(claims.some((c) => c.claimType === 'PROJECT')).toBe(true);
      expect(claims.some((c) => c.claimType === 'PROGRAMMING_LANGUAGE')).toBe(true);
      expect(claims.some((c) => c.claimType === 'QUANTITATIVE_IMPACT')).toBe(true);
      expect(claims.some((c) => c.claimType === 'CONCURRENCY')).toBe(true);
    });
  });

  describe('ClaimMatcher & Verification Logic', () => {
    let mockRepos: ExtractedRepoEvidence[];

    beforeEach(() => {
      mockRepos = [
        {
          repositoryId: 'repo_nexus_123',
          name: 'NexusFlow',
          fullName: 'johndoe/nexusflow',
          description: 'Full-stack developer portfolio intelligence platform with AST code analysis',
          htmlUrl: 'https://github.com/johndoe/nexusflow',
          isPrivate: false,
          stargazersCount: 42,
          forksCount: 5,
          primaryLanguage: 'TypeScript',
          languages: [
            { name: 'TypeScript', percentage: 75 },
            { name: 'Java', percentage: 20 },
            { name: 'HTML', percentage: 5 }
          ],
          dependencies: ['react', 'express', 'jsonwebtoken', '@google/genai', 'prisma'],
          filePaths: [
            'package.json',
            'server.ts',
            'src/App.tsx',
            'src/server/services/GeminiAiService.ts',
            'worker/src/main/java/WorkerPool.java',
            'worker/src/main/java/ConcurrencyHandler.java'
          ],
          fileContents: new Map()
        }
      ];
    });

    it('should verify matching project claims as SUPPORTED with DIRECT evidence level', () => {
      const claims: ResumeClaim[] = [
        {
          claimId: 'c1',
          claimType: 'PROJECT',
          claimText: 'NexusFlow',
          sourceSection: 'PROJECTS',
          projectName: 'NexusFlow',
          status: 'NOT_FOUND',
          confidence: 0,
          evidenceLevel: 'NONE',
          evidencePaths: [],
          evidenceSnippets: [],
          reason: ''
        }
      ];

      const result = ClaimMatcher.evaluateClaims(claims, mockRepos);

      expect(result.evaluatedClaims[0].status).toBe('SUPPORTED');
      expect(result.evaluatedClaims[0].evidenceLevel).toBe('DIRECT');
      expect(result.evaluatedClaims[0].repositoryName).toBe('johndoe/nexusflow');
    });

    it('should verify language and framework dependencies confirmed in repository files', () => {
      const claims: ResumeClaim[] = [
        {
          claimId: 'c2',
          claimType: 'PROGRAMMING_LANGUAGE',
          claimText: 'TypeScript',
          sourceSection: 'SKILLS',
          status: 'NOT_FOUND',
          confidence: 0,
          evidenceLevel: 'NONE',
          evidencePaths: [],
          evidenceSnippets: [],
          reason: ''
        },
        {
          claimId: 'c3',
          claimType: 'FRAMEWORK',
          claimText: 'Express',
          sourceSection: 'SKILLS',
          status: 'NOT_FOUND',
          confidence: 0,
          evidenceLevel: 'NONE',
          evidencePaths: [],
          evidenceSnippets: [],
          reason: ''
        }
      ];

      const result = ClaimMatcher.evaluateClaims(claims, mockRepos);

      expect(result.evaluatedClaims[0].status).toBe('SUPPORTED');
      expect(result.evaluatedClaims[1].status).toBe('SUPPORTED');
    });

    it('should verify concurrency and custom thread pool implementations', () => {
      const claims: ResumeClaim[] = [
        {
          claimId: 'c4',
          claimType: 'CONCURRENCY',
          claimText: 'Multi-threaded Java worker engine with custom concurrency locks',
          sourceSection: 'WORK_EXPERIENCE',
          status: 'NOT_FOUND',
          confidence: 0,
          evidenceLevel: 'NONE',
          evidencePaths: [],
          evidenceSnippets: [],
          reason: ''
        }
      ];

      const result = ClaimMatcher.evaluateClaims(claims, mockRepos);

      expect(result.evaluatedClaims[0].status).toBe('SUPPORTED');
      expect(result.evaluatedClaims[0].evidencePaths).toContain('worker/src/main/java/ConcurrencyHandler.java');
    });

    it('should mark quantitative performance claims without benchmark files as UNVERIFIABLE', () => {
      const claims: ResumeClaim[] = [
        {
          claimId: 'c5',
          claimType: 'QUANTITATIVE_IMPACT',
          claimText: 'Reduced API P99 latency by 42% across core microservices',
          sourceSection: 'WORK_EXPERIENCE',
          status: 'NOT_FOUND',
          confidence: 0,
          evidenceLevel: 'NONE',
          evidencePaths: [],
          evidenceSnippets: [],
          reason: ''
        }
      ];

      const result = ClaimMatcher.evaluateClaims(claims, mockRepos);

      expect(result.evaluatedClaims[0].status).toBe('UNVERIFIABLE');
      expect(result.evaluatedClaims[0].reason).toContain('load-test reports or APM benchmarks');
      expect(result.evaluatedClaims[0].reason).not.toContain('lying');
      expect(result.evaluatedClaims[0].reason).not.toContain('fake');
    });

    it('should mark competitive programming claims as UNVERIFIABLE without platform integration', () => {
      const claims: ResumeClaim[] = [
        {
          claimId: 'c6',
          claimType: 'COMPETITIVE_PROGRAMMING',
          claimText: '400+ Solved LeetCode Problems',
          sourceSection: 'ACHIEVEMENTS',
          status: 'NOT_FOUND',
          confidence: 0,
          evidenceLevel: 'NONE',
          evidencePaths: [],
          evidenceSnippets: [],
          reason: ''
        }
      ];

      const result = ClaimMatcher.evaluateClaims(claims, mockRepos);

      expect(result.evaluatedClaims[0].status).toBe('UNVERIFIABLE');
      expect(result.evaluatedClaims[0].reason).toContain('platform integration');
    });

    it('should calculate an accurate Evidence Coverage Score percentage', () => {
      const claims: ResumeClaim[] = [
        { claimId: 'c1', claimType: 'PROGRAMMING_LANGUAGE', claimText: 'TypeScript', sourceSection: 'SKILLS', status: 'NOT_FOUND', confidence: 0, evidenceLevel: 'NONE', evidencePaths: [], evidenceSnippets: [], reason: '' },
        { claimId: 'c2', claimType: 'FRAMEWORK', claimText: 'Express', sourceSection: 'SKILLS', status: 'NOT_FOUND', confidence: 0, evidenceLevel: 'NONE', evidencePaths: [], evidenceSnippets: [], reason: '' },
        { claimId: 'c3', claimType: 'DATABASE', claimText: 'Cassandra', sourceSection: 'SKILLS', status: 'NOT_FOUND', confidence: 0, evidenceLevel: 'NONE', evidencePaths: [], evidenceSnippets: [], reason: '' }
      ];

      const result = ClaimMatcher.evaluateClaims(claims, mockRepos);

      expect(result.coverageScore).toBeGreaterThan(0);
      expect(result.coverageScore).toBeLessThanOrEqual(100);
      expect(result.verifiedCount).toBe(2);
      expect(result.notFoundCount).toBe(1);
    });
  });

  describe('Secret Protection & Security Filtering', () => {
    it('should identify secret file paths and prevent them from being included in evidence', () => {
      expect(isSecretFilePath('.env')).toBe(true);
      expect(isSecretFilePath('.env.local')).toBe(true);
      expect(isSecretFilePath('server.key')).toBe(true);
      expect(isSecretFilePath('id_rsa')).toBe(true);
      expect(isSecretFilePath('src/server/app.ts')).toBe(false);
    });

    it('should redact GitHub tokens and Gemini API keys inline from snippets', () => {
      const rawSnippet = 'const token = "ghp_123456789012345678901234567890123456";';
      const { cleanContent, redactedCount } = sanitizeContent(rawSnippet);

      expect(cleanContent).not.toContain('ghp_123456789012345678901234567890123456');
      expect(cleanContent).toContain('[REDACTED GITHUB TOKEN]');
      expect(redactedCount).toBe(1);
    });
  });

  describe('ResumeGitHubVerificationService - IDOR & Ownership Protection', () => {
    let mockResumeRepo: any;
    let mockVerificationRepo: any;
    let mockTaskRepo: any;
    let mockEvidenceExtractor: any;
    let service: ResumeGitHubVerificationService;

    beforeEach(() => {
      mockResumeRepo = {
        findResumeById: vi.fn().mockResolvedValue({
          id: 'res_123',
          userId: 'usr_legit_123',
          title: 'Senior Developer Resume',
          contactInfo: {},
          workExperience: [],
          education: [],
          skills: { technical: ['TypeScript'] },
          projects: []
        })
      };

      mockVerificationRepo = {
        saveVerification: vi.fn().mockResolvedValue({
          id: 'ver_123',
          resumeId: 'res_123',
          userId: 'usr_legit_123',
          taskId: 'task_123',
          overallCoverageScore: 85,
          verifiedClaimsCount: 5,
          partialClaimsCount: 1,
          notFoundClaimsCount: 1,
          unverifiableClaimsCount: 1,
          summary: 'Verified resume against GitHub',
          claims: [],
          projectMatches: [],
          strongProjects: [],
          recommendations: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }),
        findLatestVerificationByResumeId: vi.fn()
      };

      mockTaskRepo = {
        create: vi.fn().mockResolvedValue({ id: 'task_123', status: 'RUNNING' }),
        updateStatus: vi.fn().mockResolvedValue({})
      };

      mockEvidenceExtractor = {
        extractUserEvidence: vi.fn().mockResolvedValue([])
      };

      service = new ResumeGitHubVerificationService(
        mockResumeRepo,
        mockVerificationRepo,
        mockTaskRepo,
        mockEvidenceExtractor,
        { generateResumeVerificationSummary: vi.fn().mockResolvedValue({ summary: 'Test summary', recommendations: [] }) } as any
      );
    });

    it('should reject verification request if user does not own resume (IDOR protection)', async () => {
      const attackerUser = { id: 'usr_attacker_999', role: 'USER' };

      await expect(
        service.initiateVerification('usr_attacker_999', 'res_123', attackerUser)
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw NotFoundError if resume does not exist', async () => {
      mockResumeRepo.findResumeById.mockResolvedValue(null);

      await expect(
        service.initiateVerification('usr_legit_123', 'res_nonexistent', { id: 'usr_legit_123', role: 'USER' })
      ).rejects.toThrow(NotFoundError);
    });

    it('should successfully initiate verification task for authorized resume owner', async () => {
      const result = await service.initiateVerification('usr_legit_123', 'res_123', {
        id: 'usr_legit_123',
        role: 'USER'
      });

      expect(result).toBeDefined();
      expect(result.taskId).toBe('task_123');
    });
  });
});
