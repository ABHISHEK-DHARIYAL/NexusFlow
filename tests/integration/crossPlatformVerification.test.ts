import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EvidenceNormalizer, NormalizedEvidenceSet } from '../../backend/integrations/crossplatform/EvidenceNormalizer';
import { CrossPlatformMatcher } from '../../backend/integrations/crossplatform/CrossPlatformMatcher';
import { DiscrepancyDetector } from '../../backend/integrations/crossplatform/DiscrepancyDetector';
import { CrossPlatformVerificationService } from '../../backend/services/CrossPlatformVerificationService';
import { assertResourceOwnership } from '../../backend/utils/ownership';
import { ForbiddenError, NotFoundError } from '../../backend/utils/errors';
import { ResumeClaim, VerificationStatus } from '../../types';

describe('Part 16 - Cross-Platform Developer Verification Integration Tests', () => {
  describe('DiscrepancyDetector', () => {
    it('should create non-accusatory discrepancy items for problem count mismatches', () => {
      const disc = DiscrepancyDetector.createDiscrepancy({
        category: 'COUNT_MISMATCH',
        sourceA: 'RESUME',
        sourceB: 'LEETCODE',
        claim: '400+ LeetCode problems solved',
        observedValueA: '400+',
        observedValueB: 385,
        severity: 'LOW',
        explanation: 'Resume states 400+ problems, while the connected LeetCode profile currently shows 385 solved.',
        recommendedAction: 'Update resume to reflect current solved count (385).',
      });

      expect(disc.category).toBe('COUNT_MISMATCH');
      expect(disc.sourceA).toBe('RESUME');
      expect(disc.sourceB).toBe('LEETCODE');
      expect(disc.severity).toBe('LOW');
      expect(disc.explanation).not.toMatch(/fake|liar|fraud|cheat/i);
    });

    it('should sanitize explanations to remove any accusatory vocabulary', () => {
      const rawText = 'User claimed fake 1800 rating on resume, lying about actual score.';
      const sanitized = DiscrepancyDetector.sanitizeExplanation(rawText);

      expect(sanitized).not.toContain('fake');
      expect(sanitized).not.toContain('lying');
      expect(sanitized).toContain('unverified');
    });
  });

  describe('CrossPlatformMatcher Engine', () => {
    let mockEvidenceSet: NormalizedEvidenceSet;

    beforeEach(() => {
      mockEvidenceSet = {
        resume: {
          id: 'res_123',
          userId: 'usr_01',
          contactInfo: { github: 'https://github.com/alexdev' },
          workExperience: [
            {
              title: 'Senior Software Engineer',
              company: 'CloudScale',
              highlights: ['Architected NexusFlow distributed analysis platform.'],
            },
          ],
          education: [],
          skills: { technical: ['TypeScript', 'Node.js', 'React', 'Docker', 'PostgreSQL'] },
          projects: [
            {
              title: 'NexusFlow Developer Intelligence Engine',
              description: 'Developer intelligence platform.',
            },
          ],
        },
        resumeClaims: [
          {
            claimId: 'c1',
            claimType: 'COMPETITIVE_PROGRAMMING',
            claimText: '400+ LeetCode problems solved',
            sourceSection: 'Skills',
            status: 'UNVERIFIABLE',
            confidence: 0.5,
            evidenceLevel: 'NONE',
            evidencePaths: [],
            evidenceSnippets: [],
            reason: '',
          },
          {
            claimId: 'c2',
            claimType: 'COMPETITIVE_PROGRAMMING',
            claimText: 'Codeforces rating 1700 (Specialist rank)',
            sourceSection: 'Skills',
            status: 'UNVERIFIABLE',
            confidence: 0.5,
            evidenceLevel: 'NONE',
            evidencePaths: [],
            evidenceSnippets: [],
            reason: '',
          },
        ],
        githubEvidence: [
          {
            repositoryId: 'repo_1',
            name: 'NexusFlow',
            fullName: 'alexdev/nexusflow',
            description: 'Developer intelligence engine with AST analysis',
            htmlUrl: 'https://github.com/alexdev/nexusflow',
            isPrivate: false,
            stargazersCount: 42,
            forksCount: 8,
            primaryLanguage: 'TypeScript',
            languages: [{ name: 'TypeScript', percentage: 85 }],
            dependencies: ['react', 'express', 'prisma', 'redis'],
            filePaths: ['package.json', 'src/server.ts'],
            fileContents: new Map(),
          },
        ],
        leetcodeProfile: {
          username: 'alexdev_lc',
          totalSolved: 385,
          easySolved: 150,
          mediumSolved: 200,
          hardSolved: 35,
          contestRating: 1820,
          maxRating: 1850,
          streak: 45,
          lastSyncedAt: new Date(),
        },
        codeforcesProfile: {
          handle: 'alexdev_cf',
          rating: 1684,
          maxRating: 1720,
          rank: 'Specialist',
          lastSyncedAt: new Date(),
        },
        portfolio: {
          url: 'https://alexdev.io',
          domain: 'alexdev.io',
          projects: [
            {
              title: 'NexusFlow Developer Intelligence Engine',
              techStack: ['TypeScript', 'React', 'Node.js'],
            },
          ],
        },
        sourcesUsed: [
          { source: 'RESUME', connected: true, label: 'Resume' },
          { source: 'GITHUB', connected: true, label: 'GitHub' },
          { source: 'LEETCODE', connected: true, label: 'LeetCode' },
          { source: 'CODEFORCES', connected: true, label: 'Codeforces' },
          { source: 'PORTFOLIO', connected: true, label: 'Portfolio' },
        ],
        normalizedMetrics: [],
      };
    });

    it('should evaluate LeetCode problem count claim and flag a LOW severity discrepancy if actual is lower than claimed', () => {
      const evaluation = CrossPlatformMatcher.evaluateCrossPlatform(mockEvidenceSet);

      const lcClaim = evaluation.claims.find((c) => c.claimText.includes('LeetCode'));
      expect(lcClaim).toBeDefined();
      expect(lcClaim?.status).toBe('PARTIALLY_SUPPORTED');

      const disc = evaluation.discrepancies.find((d) => d.sourceB === 'LEETCODE');
      expect(disc).toBeDefined();
      expect(disc?.category).toBe('COUNT_MISMATCH');
      expect(disc?.observedValueB).toBe(385);
    });

    it('should evaluate Codeforces rating claim and confirm SUPPORTED if actual rating meets claimed rating', () => {
      mockEvidenceSet.codeforcesProfile.rating = 1710;
      const evaluation = CrossPlatformMatcher.evaluateCrossPlatform(mockEvidenceSet);

      const cfClaim = evaluation.claims.find((c) => c.claimText.includes('Codeforces'));
      expect(cfClaim).toBeDefined();
      expect(cfClaim?.status).toBe('SUPPORTED');
    });

    it('should perform project cross-verification across Resume, GitHub, and Portfolio', () => {
      const evaluation = CrossPlatformMatcher.evaluateCrossPlatform(mockEvidenceSet);

      const projectMatch = evaluation.projectCrossVerifications.find((p) => p.projectName.toLowerCase().includes('nexusflow'));
      expect(projectMatch).toBeDefined();
      expect(projectMatch?.resumePresent).toBe(true);
      expect(projectMatch?.githubRepoName).toBe('alexdev/nexusflow');
      expect(projectMatch?.portfolioProjectName).toBe('NexusFlow Developer Intelligence Engine');
      expect(projectMatch?.matchScore).toBe(100);
    });

    it('should generate technology matrix across 3 platforms', () => {
      const evaluation = CrossPlatformMatcher.evaluateCrossPlatform(mockEvidenceSet);

      expect(evaluation.technologyMatrix.length).toBeGreaterThan(0);
      const tsTech = evaluation.technologyMatrix.find((t) => t.technology === 'TypeScript');
      expect(tsTech).toBeDefined();
      expect(tsTech?.resumePresent).toBe(true);
      expect(tsTech?.githubPresent).toBe(true);
      expect(tsTech?.portfolioPresent).toBe(true);
      expect(tsTech?.status).toBe('SUPPORTED');
    });
  });

  describe('IDOR & Authorization Safety', () => {
    it('should throw ForbiddenError when user tries to access another user cross-platform verification report', () => {
      const authUser = { id: 'usr_owner_111', role: 'USER' };
      const targetUserId = 'usr_victim_999';

      expect(() => {
        assertResourceOwnership(targetUserId, authUser, 'User Profile');
      }).toThrow(ForbiddenError);
    });

    it('should allow ADMIN users to access any user cross-platform verification report', () => {
      const authAdmin = { id: 'usr_admin_777', role: 'ADMIN' };
      const targetUserId = 'usr_victim_999';

      expect(() => {
        assertResourceOwnership(targetUserId, authAdmin, 'User Profile');
      }).not.toThrow();
    });
  });
});
