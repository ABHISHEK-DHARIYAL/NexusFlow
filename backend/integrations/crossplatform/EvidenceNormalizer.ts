import { ResumeRepository } from '../../repositories/ResumeRepository';
import { LeetCodeRepository } from '../../repositories/LeetCodeRepository';
import { CodeforcesRepository } from '../../repositories/CodeforcesRepository';
import { PortfolioRepository } from '../../repositories/PortfolioRepository';
import { GitHubEvidenceExtractor, ExtractedRepoEvidence } from '../resume/GitHubEvidenceExtractor';
import { ResumeClaimExtractor } from '../resume/ResumeClaimExtractor';
import { logger } from '../../logger';
import {
  NormalizedEvidence,
  SourceUsageInfo,
  ResumeClaim,
  CrossPlatformPlatform,
} from '../../../types';

export interface NormalizedEvidenceSet {
  resume: any | null;
  resumeClaims: ResumeClaim[];
  githubEvidence: ExtractedRepoEvidence[];
  leetcodeProfile: any | null;
  codeforcesProfile: any | null;
  portfolio: any | null;
  sourcesUsed: SourceUsageInfo[];
  normalizedMetrics: NormalizedEvidence[];
}

export class EvidenceNormalizer {
  constructor(
    private resumeRepo = new ResumeRepository(),
    private leetcodeRepo = new LeetCodeRepository(),
    private codeforcesRepo = new CodeforcesRepository(),
    private portfolioRepo = new PortfolioRepository(),
    private githubEvidenceExtractor = new GitHubEvidenceExtractor()
  ) {}

  public async normalizeUserEvidence(userId: string): Promise<NormalizedEvidenceSet> {
    const nowIso = new Date().toISOString();

    // 1. Fetch Resume & Extract Claims
    const resume = await this.resumeRepo.findResumeByUserId(userId);
    let resumeClaims: ResumeClaim[] = [];
    if (resume) {
      resumeClaims = ResumeClaimExtractor.extractClaims({
        contactInfo: resume.contactInfo,
        workExperience: resume.workExperience as any[],
        education: resume.education as any[],
        skills: resume.skills,
        projects: resume.projects as any[],
      } as any);
    }

    // 2. Fetch GitHub Evidence
    let githubEvidence: ExtractedRepoEvidence[] = [];
    try {
      githubEvidence = await this.githubEvidenceExtractor.extractUserEvidence(userId);
    } catch (err: any) {
      logger.database.warn(`Failed to extract GitHub evidence for user ${userId}: ${err.message}`);
    }

    // 3. Fetch LeetCode Profile
    const leetcodeProfile = await this.leetcodeRepo.findProfileByUserId(userId);

    // 4. Fetch Codeforces Profile
    const codeforcesProfile = await this.codeforcesRepo.findProfileByUserId(userId);

    // 5. Fetch Portfolio
    const portfolio = await this.portfolioRepo.findPortfolioByUserId(userId);

    // Track Sources Used and Data Freshness
    const sourcesUsed: SourceUsageInfo[] = [
      {
        source: 'RESUME',
        connected: !!resume,
        lastSyncedAt: resume?.updatedAt ? new Date(resume.updatedAt).toISOString() : undefined,
        label: 'Candidate Resume',
      },
      {
        source: 'GITHUB',
        connected: githubEvidence.length > 0,
        lastSyncedAt: githubEvidence.length > 0 ? new Date().toISOString() : undefined,
        label: 'GitHub Repositories',
      },
      {
        source: 'LEETCODE',
        connected: !!leetcodeProfile,
        lastSyncedAt: leetcodeProfile?.lastSyncedAt ? new Date(leetcodeProfile.lastSyncedAt).toISOString() : undefined,
        label: 'LeetCode Account',
      },
      {
        source: 'CODEFORCES',
        connected: !!codeforcesProfile,
        lastSyncedAt: codeforcesProfile?.lastSyncedAt ? new Date(codeforcesProfile.lastSyncedAt).toISOString() : undefined,
        label: 'Codeforces Account',
      },
      {
        source: 'PORTFOLIO',
        connected: !!portfolio,
        lastSyncedAt: portfolio?.updatedAt ? new Date(portfolio.updatedAt).toISOString() : undefined,
        label: 'Developer Portfolio',
      },
    ];

    // Build Normalized Metrics List
    const normalizedMetrics: NormalizedEvidence[] = [];

    // LeetCode normalized metrics
    if (leetcodeProfile) {
      normalizedMetrics.push(
        {
          source: 'LEETCODE',
          metric: 'PROBLEMS_SOLVED',
          value: leetcodeProfile.totalSolved || 0,
          collectedAt: leetcodeProfile.lastSyncedAt ? new Date(leetcodeProfile.lastSyncedAt).toISOString() : nowIso,
          confidence: 1.0,
          details: {
            easy: leetcodeProfile.easySolved,
            medium: leetcodeProfile.mediumSolved,
            hard: leetcodeProfile.hardSolved,
          },
        },
        {
          source: 'LEETCODE',
          metric: 'CONTEST_RATING',
          value: Math.round(leetcodeProfile.contestRating || 0),
          collectedAt: leetcodeProfile.lastSyncedAt ? new Date(leetcodeProfile.lastSyncedAt).toISOString() : nowIso,
          confidence: 1.0,
        },
        {
          source: 'LEETCODE',
          metric: 'MAX_RATING',
          value: Math.round(leetcodeProfile.maxRating || 0),
          collectedAt: leetcodeProfile.lastSyncedAt ? new Date(leetcodeProfile.lastSyncedAt).toISOString() : nowIso,
          confidence: 1.0,
        },
        {
          source: 'LEETCODE',
          metric: 'STREAK',
          value: leetcodeProfile.streak || 0,
          collectedAt: leetcodeProfile.lastSyncedAt ? new Date(leetcodeProfile.lastSyncedAt).toISOString() : nowIso,
          confidence: 1.0,
        }
      );
    }

    // Codeforces normalized metrics
    if (codeforcesProfile) {
      normalizedMetrics.push(
        {
          source: 'CODEFORCES',
          metric: 'RATING',
          value: codeforcesProfile.rating || 0,
          collectedAt: codeforcesProfile.lastSyncedAt ? new Date(codeforcesProfile.lastSyncedAt).toISOString() : nowIso,
          confidence: 1.0,
        },
        {
          source: 'CODEFORCES',
          metric: 'MAX_RATING',
          value: codeforcesProfile.maxRating || 0,
          collectedAt: codeforcesProfile.lastSyncedAt ? new Date(codeforcesProfile.lastSyncedAt).toISOString() : nowIso,
          confidence: 1.0,
        },
        {
          source: 'CODEFORCES',
          metric: 'RANK',
          value: codeforcesProfile.rank || 'Unrated',
          collectedAt: codeforcesProfile.lastSyncedAt ? new Date(codeforcesProfile.lastSyncedAt).toISOString() : nowIso,
          confidence: 1.0,
        }
      );
    }

    return {
      resume,
      resumeClaims,
      githubEvidence,
      leetcodeProfile,
      codeforcesProfile,
      portfolio,
      sourcesUsed,
      normalizedMetrics,
    };
  }
}
