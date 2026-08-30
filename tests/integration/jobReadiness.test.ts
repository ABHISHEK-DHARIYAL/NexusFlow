import { describe, it, expect } from 'vitest';
import { JobReadinessEngine, ProfileEvidenceInput } from '../../backend/integrations/jobs/JobReadinessEngine';
import { JobMatchReport } from '../../types';
import { assertResourceOwnership } from '../../backend/utils/ownership';
import { ForbiddenError } from '../../backend/utils/errors';

describe('Part 18 - Job Readiness Intelligence Integration Tests', () => {
  const mockJobMatchHighMatch: JobMatchReport = {
    id: 'match_01',
    jobId: 'job_01',
    userId: 'usr_01',
    overallMatchScore: 88,
    matchLabel: 'Strong Match',
    requiredSkillCoverage: 90,
    preferredSkillCoverage: 75,
    projectRelevanceScore: 85,
    experienceMatchStatus: 'MATCHED',
    educationMatchStatus: 'MATCHED',
    cpRelevanceStatus: 'MATCHED',
    summary: 'Strong technical match for Senior Full Stack Engineer role.',
    extractedRequirements: {
      roleTitle: 'Senior Full Stack Engineer',
      companyName: 'NexusTech',
      requiredSkills: [
        { name: 'TypeScript', category: 'Programming Languages', isRequired: true, importance: 'CRITICAL' },
        { name: 'Node.js', category: 'Frameworks', isRequired: true, importance: 'CRITICAL' },
        { name: 'PostgreSQL', category: 'Databases', isRequired: true, importance: 'CRITICAL' },
        { name: 'Docker', category: 'DevOps', isRequired: true, importance: 'IMPORTANT' },
      ],
      preferredSkills: [
        { name: 'Kubernetes', category: 'DevOps', isRequired: false, importance: 'NICE_TO_HAVE' },
        { name: 'AWS', category: 'Cloud', isRequired: false, importance: 'NICE_TO_HAVE' },
      ],
      programmingLanguages: ['TypeScript', 'Node.js'],
      frameworks: ['Express.js'],
      databases: ['PostgreSQL'],
      cloudAndDevops: ['Docker', 'AWS'],
      responsibilities: ['Build high-throughput REST APIs and WebSocket real-time systems.'],
      educationRequirements: ["Bachelor's degree in CS"],
      experienceYears: 3,
      experienceRequirements: ['3+ years software engineering experience'],
      keywords: ['TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'AWS', 'LeetCode'],
      cpExpectations: 'LeetCode / DSA problem solving skills expected',
    },
    skillMatches: [
      {
        requirementName: 'TypeScript',
        category: 'Programming Languages',
        isRequired: true,
        state: 'MATCHED',
        matchStatus: 'MATCHED',
        confidence: 'HIGH',
        evidenceLevel: 'DIRECT',
        evidenceSources: ['GITHUB', 'RESUME', 'PORTFOLIO'],
        reasoning: 'Verified in multiple GitHub repositories and resume skills.',
      } as any,
      {
        requirementName: 'Node.js',
        category: 'Frameworks',
        isRequired: true,
        state: 'MATCHED',
        matchStatus: 'MATCHED',
        confidence: 'HIGH',
        evidenceLevel: 'DIRECT',
        evidenceSources: ['GITHUB', 'RESUME'],
        reasoning: 'Verified in backend services and resume work experience.',
      } as any,
      {
        requirementName: 'PostgreSQL',
        category: 'Databases',
        isRequired: true,
        state: 'MATCHED',
        matchStatus: 'MATCHED',
        confidence: 'HIGH',
        evidenceLevel: 'DIRECT',
        evidenceSources: ['GITHUB', 'RESUME'],
        reasoning: 'Verified in database schema definitions.',
      } as any,
      {
        requirementName: 'Docker',
        category: 'DevOps',
        isRequired: true,
        state: 'PARTIALLY_MATCHED',
        matchStatus: 'PARTIALLY_MATCHED',
        confidence: 'MEDIUM',
        evidenceLevel: 'PARTIAL',
        evidenceSources: ['RESUME'],
        reasoning: 'Listed in resume, but missing Dockerfile in primary GitHub repos.',
      } as any,
      {
        requirementName: 'Kubernetes',
        category: 'DevOps',
        isRequired: false,
        state: 'UNVERIFIABLE',
        matchStatus: 'UNVERIFIABLE',
        confidence: 'LOW',
        evidenceLevel: 'UNVERIFIABLE',
        evidenceSources: [],
        reasoning: 'No repository evidence found.',
      } as any,
    ],
    projectRelevance: [
      {
        projectName: 'nexusflow-core',
        relevanceScore: 90,
        technologyOverlap: ['TypeScript', 'Node.js', 'PostgreSQL'],
        architecturalOverlap: ['REST APIs', 'PostgreSQL Schema'],
        reasoning: 'Direct technology and architectural match for target role.',
      },
    ],
    missingSkills: [
      {
        skill: 'Kubernetes',
        category: 'DevOps',
        importance: 'NICE_TO_HAVE',
        transferrableSkills: ['Docker'],
        learningSuggestion: 'Complete hands-on Minikube deployment tutorial.',
      },
    ],
    keywordAlignment: [
      { keyword: 'TypeScript', status: 'MATCHED', source: 'RESUME' },
      { keyword: 'Node.js', status: 'MATCHED', source: 'RESUME' },
      { keyword: 'PostgreSQL', status: 'MATCHED', source: 'RESUME' },
      { keyword: 'Docker', status: 'MATCHED', source: 'RESUME' },
    ],
    recommendations: ['Build a sample Kubernetes deployment manifest.'],
    interviewPriorities: ['Prepare system design explanation for PostgreSQL indexing and WebSocket architecture.'],
    createdAt: new Date().toISOString(),
  };

  const mockProfile: ProfileEvidenceInput = {
    repositories: [
      {
        id: 'repo_1',
        fullName: 'usr/nexusflow-core',
        description: 'Developer intelligence platform',
        primaryLanguage: 'TypeScript',
        stargazersCount: 25,
        forksCount: 5,
        updatedAt: new Date(),
        lastSyncedAt: new Date().toISOString(),
        languages: [{ name: 'TypeScript', bytes: 120000 }],
      },
    ],
    leetcodeProfile: {
      totalSolved: 320,
      easySolved: 100,
      mediumSolved: 180,
      hardSolved: 40,
      ranking: 45000,
      contestRating: 1720,
      lastSyncedAt: new Date().toISOString(),
    } as any,
    codeforcesProfile: {
      handle: 'dev_coder',
      rating: 1550,
      maxRating: 1610,
      rank: 'specialist',
      maxRank: 'expert',
      lastSyncedAt: new Date().toISOString(),
    } as any,
    portfolio: {
      projects: [{ title: 'NexusFlow Engine', techStack: ['TypeScript', 'Node.js', 'PostgreSQL'] }],
      lastCrawledAt: new Date().toISOString(),
    },
    resume: {
      updatedAt: new Date().toISOString(),
      skills: { technical: ['TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'Express.js'] },
      workExperience: [
        {
          title: 'Full Stack Engineer',
          company: 'Tech Corp',
          duration: '3 years',
          highlights: ['Built TypeScript and Node.js REST APIs with PostgreSQL'],
        },
      ],
    },
    crossPlatformVerification: {
      technologyMatrix: [
        { technology: 'TypeScript', status: 'SUPPORTED' },
        { technology: 'Node.js', status: 'SUPPORTED' },
        { technology: 'PostgreSQL', status: 'SUPPORTED' },
      ],
    },
  };

  describe('JobReadinessEngine Deterministic Calculations', () => {
    it('should calculate high readiness score for candidate with verified evidence', () => {
      const report = JobReadinessEngine.calculateReadiness(mockJobMatchHighMatch, mockProfile);

      expect(report.score).toBeGreaterThanOrEqual(75);
      expect(report.level).toBe('STRONGLY_READY');
      expect(report.confidence).toBe('HIGH');
      expect(report.dsaRelevance).toBe('HIGH');

      // Check dimensions
      expect(report.dimensions.technicalReadiness.score).toBeGreaterThan(70);
      expect(report.dimensions.requiredSkillReadiness.score).toBeGreaterThan(80);
      expect(report.dimensions.projectReadiness.score).toBeGreaterThan(70);
      expect(report.dimensions.dsaReadiness.score).toBeGreaterThan(80);

      // Check priorities & what-if
      expect(report.preparationPriorities.length).toBeLessThanOrEqual(5);
      expect(report.whatIfSimulation?.length).toBeGreaterThan(0);
      expect(report.dataFreshness.overallNote).toBeDefined();
    });

    it('should correctly flag critical gaps and blockers when key skills are missing', () => {
      const lowMatch: JobMatchReport = {
        ...mockJobMatchHighMatch,
        overallMatchScore: 45,
        skillMatches: [
          {
            requirementName: 'TypeScript',
            category: 'Programming Languages',
            isRequired: true,
            state: 'MATCHED',
            matchStatus: 'MATCHED',
            confidence: 'HIGH',
            evidenceLevel: 'DIRECT',
            evidenceSources: ['GITHUB'],
            reasoning: 'Verified in GitHub repo.',
          } as any,
          {
            requirementName: 'Node.js',
            category: 'Frameworks',
            isRequired: true,
            state: 'MISSING',
            matchStatus: 'MISSING',
            confidence: 'HIGH',
            evidenceLevel: 'UNVERIFIABLE',
            evidenceSources: [],
            reasoning: 'Not found in profile or repositories.',
          } as any,
          {
            requirementName: 'PostgreSQL',
            category: 'Databases',
            isRequired: true,
            state: 'MISSING',
            matchStatus: 'MISSING',
            confidence: 'HIGH',
            evidenceLevel: 'UNVERIFIABLE',
            evidenceSources: [],
            reasoning: 'Not found in profile or repositories.',
          } as any,
        ],
      };

      const report = JobReadinessEngine.calculateReadiness(lowMatch, mockProfile);

      expect(report.score).toBeLessThan(65);
      expect(report.criticalGaps.length).toBeGreaterThan(0);
      const gapNames = report.criticalGaps.map((g) => g.skillOrRequirement);
      expect(gapNames).toContain('Node.js');
      expect(gapNames).toContain('PostgreSQL');

      // Check blocker flags
      const blockers = report.criticalGaps.filter((g) => g.isBlocker);
      expect(blockers.length).toBeGreaterThan(0);
    });

    it('should adjust DSA dimension weight dynamically based on role requirements', () => {
      const noDsaJobMatch: JobMatchReport = {
        ...mockJobMatchHighMatch,
        extractedRequirements: {
          ...mockJobMatchHighMatch.extractedRequirements!,
          cpExpectations: undefined,
          keywords: ['TypeScript', 'Node.js', 'PostgreSQL', 'Docker'],
        },
      };

      const reportWithDsa = JobReadinessEngine.calculateReadiness(mockJobMatchHighMatch, mockProfile);
      const reportWithoutDsa = JobReadinessEngine.calculateReadiness(noDsaJobMatch, mockProfile);

      expect(reportWithDsa.dsaRelevance).toBe('HIGH');
      expect(reportWithoutDsa.dsaRelevance).toBe('LOW');

      // Dimension weights should reallocate non-DSA weight into Required Skill and Project readiness
      expect(reportWithoutDsa.dimensions.dsaReadiness.weight).toBe(0);
      expect(reportWithoutDsa.dimensions.requiredSkillReadiness.weight).toBeGreaterThan(
        reportWithDsa.dimensions.requiredSkillReadiness.weight
      );
      expect(reportWithoutDsa.dimensions.projectReadiness.weight).toBeGreaterThan(
        reportWithDsa.dimensions.projectReadiness.weight
      );
    });

    it('should accurately calculate What-If score deltas', () => {
      const report = JobReadinessEngine.calculateReadiness(mockJobMatchHighMatch, mockProfile);
      const simulations = report.whatIfSimulation || [];

      expect(simulations.length).toBeGreaterThan(0);
      simulations.forEach((sim) => {
        expect(sim.estimatedDelta).toBeGreaterThan(0);
        expect(sim.estimatedNewScore).toBeGreaterThanOrEqual(report.score);
        expect(sim.estimatedNewScore).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('IDOR & Ownership Verification', () => {
    it('should allow resource owner to access their data', () => {
      expect(() => assertResourceOwnership('usr_01', { id: 'usr_01', role: 'USER' })).not.toThrow();
    });

    it('should throw ForbiddenError when accessing another user data', () => {
      expect(() => assertResourceOwnership('usr_01', { id: 'usr_02', role: 'USER' })).toThrow(ForbiddenError);
    });
  });
});

