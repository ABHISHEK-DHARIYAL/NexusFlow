import { describe, it, expect } from 'vitest';
import { JobRequirementExtractor } from '../../backend/integrations/jobs/JobRequirementExtractor';
import { JobMatchingEngine, UserProfileEvidenceSet } from '../../backend/integrations/jobs/JobMatchingEngine';
import { JobExplanationService } from '../../backend/services/JobExplanationService';
import { assertResourceOwnership } from '../../backend/utils/ownership';
import { ForbiddenError } from '../../backend/utils/errors';

describe('Part 17 - Job Description Intelligence & Matching Integration Tests', () => {
  describe('JobRequirementExtractor', () => {
    it('should normalize skill aliases cleanly', () => {
      expect(JobRequirementExtractor.normalizeSkill('node')).toBe('Node.js');
      expect(JobRequirementExtractor.normalizeSkill('nodejs')).toBe('Node.js');
      expect(JobRequirementExtractor.normalizeSkill('postgres')).toBe('PostgreSQL');
      expect(JobRequirementExtractor.normalizeSkill('k8s')).toBe('Kubernetes');
      expect(JobRequirementExtractor.normalizeSkill('js')).toBe('JavaScript');
      expect(JobRequirementExtractor.normalizeSkill('ts')).toBe('TypeScript');
    });

    it('should extract required vs preferred skills from job description text', () => {
      const rawDescription = `
      Software Engineer Role at NexusFlow

      Requirements:
      • Experience with TypeScript, Node.js, and Express.js
      • Hands-on proficiency with PostgreSQL and Docker
      • Bachelor degree in Computer Science or 3+ years experience

      Nice to Have:
      • Experience with Kubernetes and AWS
      • Active competitive programming background on LeetCode
      `;

      const reqs = JobRequirementExtractor.extractRequirements(rawDescription);

      expect(reqs.requiredSkills.map((s) => s.name)).toContain('TypeScript');
      expect(reqs.requiredSkills.map((s) => s.name)).toContain('Node.js');
      expect(reqs.requiredSkills.map((s) => s.name)).toContain('PostgreSQL');
      expect(reqs.requiredSkills.map((s) => s.name)).toContain('Docker');

      expect(reqs.preferredSkills.map((s) => s.name)).toContain('Kubernetes');
      expect(reqs.preferredSkills.map((s) => s.name)).toContain('AWS');

      expect(reqs.programmingLanguages).toContain('TypeScript');
      expect(reqs.databases).toContain('PostgreSQL');
      expect(reqs.cloudAndDevops).toContain('Docker');
      expect(reqs.experienceYears).toBe(3);
      expect(reqs.cpExpectations).toBeDefined();
    });
  });

  describe('JobMatchingEngine', () => {
    const mockRequirements = {
      requiredSkills: [
        { name: 'TypeScript', category: 'Programming Languages' as const, isRequired: true, importance: 'CRITICAL' as const },
        { name: 'Node.js', category: 'Programming Languages' as const, isRequired: true, importance: 'CRITICAL' as const },
        { name: 'PostgreSQL', category: 'Databases' as const, isRequired: true, importance: 'CRITICAL' as const },
        { name: 'Docker', category: 'DevOps' as const, isRequired: true, importance: 'CRITICAL' as const },
      ],
      preferredSkills: [
        { name: 'Kubernetes', category: 'DevOps' as const, isRequired: false, importance: 'NICE_TO_HAVE' as const },
        { name: 'AWS', category: 'Cloud' as const, isRequired: false, importance: 'NICE_TO_HAVE' as const },
      ],
      programmingLanguages: ['TypeScript', 'Node.js'],
      frameworks: [],
      databases: ['PostgreSQL'],
      cloudAndDevops: ['Docker', 'Kubernetes', 'AWS'],
      responsibilities: ['Build scalable REST APIs and backend microservices.'],
      educationRequirements: ["Bachelor's in Computer Science"],
      experienceYears: 2,
      experienceRequirements: ['2+ years of software engineering experience'],
      keywords: ['TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'Kubernetes', 'AWS'],
      cpExpectations: 'DSA / Problem Solving expected',
    };

    const mockProfile: UserProfileEvidenceSet = {
      resume: {
        skills: { technical: ['TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'Express.js'] },
        workExperience: [{ title: 'Software Engineer', company: 'TechCorp', highlights: ['Built Node.js & PostgreSQL APIs'] }],
        education: [{ degree: 'BS Computer Science', institution: 'State University' }],
        projects: [{ title: 'NexusFlow Engine', description: 'Built with TypeScript, Node.js, and PostgreSQL' }],
      },
      githubEvidence: [
        {
          fullName: 'alexdev/nexusflow',
          description: 'Developer intelligence platform built with Node.js and PostgreSQL',
          primaryLanguage: 'TypeScript',
          dependencies: ['express', 'pg', 'prisma', 'docker'],
        },
      ],
      leetcodeProfile: { totalSolved: 250, contestRating: 1650 },
      portfolio: { projects: [{ title: 'NexusFlow', techStack: ['TypeScript', 'Node.js', 'PostgreSQL'] }] },
      crossPlatformVerification: {
        technologyMatrix: [
          { technology: 'TypeScript', status: 'SUPPORTED' },
          { technology: 'Node.js', status: 'SUPPORTED' },
          { technology: 'PostgreSQL', status: 'SUPPORTED' },
          { technology: 'Docker', status: 'SUPPORTED' },
        ],
      },
    };

    it('should compute high match score and strong coverage for well-aligned profile', () => {
      const match = JobMatchingEngine.evaluateJobMatch('job_123', 'usr_01', mockRequirements, mockProfile);

      expect(match.overallMatchScore).toBeGreaterThanOrEqual(75);
      expect(match.requiredSkillCoverage).toBe(100);
      expect(match.projectRelevanceScore).toBeGreaterThan(50);
      expect(match.experienceMatchStatus).toBe('MATCHED');
      expect(match.educationMatchStatus).toBe('MATCHED');
      expect(match.cpRelevanceStatus).toBe('MATCHED');
    });

    it('should identify missing skill gaps with transferable skills and learning recommendations', () => {
      const match = JobMatchingEngine.evaluateJobMatch('job_123', 'usr_01', mockRequirements, mockProfile);

      const k8sGap = match.missingSkills.find((m) => m.skill === 'Kubernetes');
      expect(k8sGap).toBeDefined();
      expect(k8sGap?.transferrableSkills).toContain('Docker');
      expect(k8sGap?.learningSuggestion).toContain('Docker');
    });

    it('should perform semantic partial matching for related technologies', () => {
      const jsRequirement = {
        ...mockRequirements,
        requiredSkills: [
          { name: 'JavaScript', category: 'Programming Languages' as const, isRequired: true, importance: 'CRITICAL' as const },
        ],
      };

      const tsOnlyProfile: UserProfileEvidenceSet = {
        resume: { skills: { technical: ['TypeScript'] } },
        githubEvidence: [{ fullName: 'repo', primaryLanguage: 'TypeScript' }],
      };

      const match = JobMatchingEngine.evaluateJobMatch('job_456', 'usr_02', jsRequirement, tsOnlyProfile);
      const jsMatch = match.skillMatches.find((s) => s.requirementName === 'JavaScript');

      expect(jsMatch?.state).toBe('PARTIALLY_MATCHED');
      expect(jsMatch?.reasoning).toContain('TypeScript provides strong JavaScript ecosystem overlap');
    });
  });

  describe('JobExplanationService', () => {
    it('should generate fallback explanation without failing when Gemini API key is placeholder', () => {
      const service = new JobExplanationService();
      const mockReportData = {
        jobId: 'job_123',
        userId: 'usr_01',
        overallMatchScore: 82,
        matchLabel: 'Strong Match',
        requiredSkillCoverage: 80,
        preferredSkillCoverage: 50,
        projectRelevanceScore: 75,
        experienceMatchStatus: 'MATCHED' as const,
        educationMatchStatus: 'MATCHED' as const,
        cpRelevanceStatus: 'MATCHED' as const,
        summary: 'Strong technical fit',
        extractedRequirements: {
          requiredSkills: [],
          preferredSkills: [],
          programmingLanguages: ['TypeScript'],
          frameworks: [],
          databases: [],
          cloudAndDevops: [],
          responsibilities: [],
          educationRequirements: [],
          experienceRequirements: [],
          keywords: [],
        },
        skillMatches: [
          {
            requirementName: 'TypeScript',
            category: 'Programming Languages' as const,
            isRequired: true,
            state: 'MATCHED' as const,
            confidence: 'HIGH' as const,
            evidenceSources: ['GitHub', 'Resume'],
            evidenceLevel: 'DIRECT' as const,
            reasoning: 'Verified in GitHub repositories.',
          },
        ],
        projectRelevance: [{ projectName: 'NexusFlow', relevanceScore: 85, technologyOverlap: ['TypeScript'], architecturalOverlap: [], reasoning: 'Matching project' }],
        missingSkills: [{ skill: 'Kubernetes', category: 'DevOps' as const, importance: 'NICE_TO_HAVE' as const, transferrableSkills: ['Docker'], learningSuggestion: 'Learn K8s pods' }],
        keywordAlignment: [],
        recommendations: ['Learn Kubernetes'],
        interviewPriorities: ['Review TypeScript design'],
      };

      const fallback = service.generateFallbackExplanation(mockReportData);

      expect(fallback.summary).toContain('82%');
      expect(fallback.strengths.length).toBeGreaterThan(0);
      expect(fallback.skillGaps.length).toBeGreaterThan(0);
      expect(fallback.recommendations).toContain('Learn Kubernetes');
    });
  });

  describe('Security & IDOR Ownership Protection', () => {
    it('should throw ForbiddenError when user accesses job belonging to another user', () => {
      const resourceOwnerId = 'usr_owner_99';
      const authenticatedUser = { id: 'usr_attacker_00', role: 'USER' };

      expect(() => {
        assertResourceOwnership(resourceOwnerId, authenticatedUser, 'JobDescription');
      }).toThrow(ForbiddenError);
    });

    it('should allow access when user accesses their own job description', () => {
      const resourceOwnerId = 'usr_owner_99';
      const authenticatedUser = { id: 'usr_owner_99', role: 'USER' };

      expect(() => {
        assertResourceOwnership(resourceOwnerId, authenticatedUser, 'JobDescription');
      }).not.toThrow();
    });
  });
});
