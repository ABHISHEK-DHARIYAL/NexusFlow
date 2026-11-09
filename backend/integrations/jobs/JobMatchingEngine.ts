import {
  ExtractedJobRequirements,
  JobMatchReport,
  JobMatchingState,
  JobMissingSkillItem,
  JobProjectMatchResult,
  JobRequirementItem,
  JobSkillMatchResult,
  KeywordAlignmentItem,
  SkillCategory,
} from '../../../types';
import { JobRequirementExtractor } from './JobRequirementExtractor';

export interface UserProfileEvidenceSet {
  resume?: {
    skills?: { technical?: string[]; soft?: string[] };
    workExperience?: Array<{ title?: string; company?: string; highlights?: string[] }>;
    education?: Array<{ degree?: string; institution?: string; fieldOfStudy?: string; graduationYear?: string }>;
    projects?: Array<{ title?: string; description?: string; name?: string }>;
  };
  githubEvidence?: Array<{
    fullName: string;
    description?: string;
    primaryLanguage?: string;
    languages?: Array<{ name: string; bytes: number }>;
    dependencies?: string[];
  }>;
  leetcodeProfile?: {
    totalSolved?: number;
    contestRating?: number;
  };
  codeforcesProfile?: {
    rating?: number;
    rank?: string;
  };
  portfolio?: {
    projects?: Array<{ title?: string; techStack?: string[]; description?: string }>;
  };
  crossPlatformVerification?: {
    technologyMatrix?: Array<{ technology: string; status: string }>;
  };
}

export class JobMatchingEngine {
  public static evaluateJobMatch(
    jobId: string,
    userId: string,
    requirements: ExtractedJobRequirements,
    profile: UserProfileEvidenceSet
  ): Omit<JobMatchReport, 'id' | 'createdAt' | 'updatedAt'> {
    // 1. Gather all user skills from various sources
    const resumeSkills = new Set<string>((profile.resume?.skills?.technical || []).map((s) => JobRequirementExtractor.normalizeSkill(s)));
    
    const githubSkills = new Set<string>();
    (profile.githubEvidence || []).forEach((repo) => {
      if (repo.primaryLanguage) githubSkills.add(JobRequirementExtractor.normalizeSkill(repo.primaryLanguage));
      (repo.languages || []).forEach((l) => githubSkills.add(JobRequirementExtractor.normalizeSkill(l.name)));
      (repo.dependencies || []).forEach((d) => githubSkills.add(JobRequirementExtractor.normalizeSkill(d)));
    });

    const portfolioSkills = new Set<string>();
    (profile.portfolio?.projects || []).forEach((p) => {
      (p.techStack || []).forEach((t) => portfolioSkills.add(JobRequirementExtractor.normalizeSkill(t)));
    });

    const verifiedSkills = new Set<string>();
    (profile.crossPlatformVerification?.technologyMatrix || []).forEach((tm) => {
      if (tm.status === 'SUPPORTED' || tm.status === 'PARTIALLY_SUPPORTED') {
        verifiedSkills.add(JobRequirementExtractor.normalizeSkill(tm.technology));
      }
    });

    // Combine all user profile skills
    const allProfileSkills = new Set<string>([...resumeSkills, ...githubSkills, ...portfolioSkills, ...verifiedSkills]);

    // 2. Evaluate Required & Preferred Skill Matches
    const skillMatches: JobSkillMatchResult[] = [];
    const allRequirements = [...requirements.requiredSkills, ...requirements.preferredSkills];

    let requiredMatchedCount = 0;
    let preferredMatchedCount = 0;

    allRequirements.forEach((req) => {
      const normReq = JobRequirementExtractor.normalizeSkill(req.name);
      let state: JobMatchingState = 'MISSING';
      let evidenceLevel: 'DIRECT' | 'STRONG' | 'PARTIAL' | 'UNVERIFIABLE' = 'UNVERIFIABLE';
      let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
      const evidenceSources: string[] = [];
      let reasoning = `No verified evidence found for ${req.name} in profile.`;

      const inResume = resumeSkills.has(normReq);
      const inGitHub = githubSkills.has(normReq);
      const inPortfolio = portfolioSkills.has(normReq);
      const inVerified = verifiedSkills.has(normReq);

      if (inGitHub) evidenceSources.push('GitHub');
      if (inResume) evidenceSources.push('Resume');
      if (inPortfolio) evidenceSources.push('Portfolio');
      if (inVerified) evidenceSources.push('Cross-Platform Matrix');

      if (inGitHub && (inResume || inVerified)) {
        state = 'MATCHED';
        evidenceLevel = 'DIRECT';
        confidence = 'HIGH';
        reasoning = `Supported by source code in GitHub repositories and verified profile evidence.`;
      } else if (inGitHub || (inResume && inPortfolio)) {
        state = 'MATCHED';
        evidenceLevel = 'STRONG';
        confidence = 'HIGH';
        reasoning = `Found in code repositories or verified portfolio projects.`;
      } else if (inResume) {
        state = 'MATCHED';
        evidenceLevel = 'PARTIAL';
        confidence = 'MEDIUM';
        reasoning = `Stated on resume, pending direct code artifact verification.`;
      } else {
        // Check semantic / related matching
        if (normReq === 'JavaScript' && allProfileSkills.has('TypeScript')) {
          state = 'PARTIALLY_MATCHED';
          evidenceLevel = 'PARTIAL';
          confidence = 'MEDIUM';
          reasoning = `TypeScript provides strong JavaScript ecosystem overlap, but the job explicitly requests JavaScript.`;
        } else if (normReq === 'Node.js' && allProfileSkills.has('Express.js')) {
          state = 'PARTIALLY_MATCHED';
          evidenceLevel = 'PARTIAL';
          confidence = 'MEDIUM';
          reasoning = `Profile demonstrates Express.js experience on Node runtime.`;
        } else if (normReq === 'PostgreSQL' && allProfileSkills.has('MySQL')) {
          state = 'PARTIALLY_MATCHED';
          evidenceLevel = 'PARTIAL';
          confidence = 'LOW';
          reasoning = `Relational SQL experience in MySQL, though job explicitly asks for PostgreSQL.`;
        } else if (normReq === 'Kubernetes' && allProfileSkills.has('Docker')) {
          state = 'PARTIALLY_MATCHED';
          evidenceLevel = 'PARTIAL';
          confidence = 'LOW';
          reasoning = `Containerization experience with Docker, though Kubernetes orchestration is missing.`;
        }
      }

      if (state === 'MATCHED') {
        if (req.isRequired) requiredMatchedCount += 1;
        else preferredMatchedCount += 1;
      } else if (state === 'PARTIALLY_MATCHED') {
        if (req.isRequired) requiredMatchedCount += 0.5;
        else preferredMatchedCount += 0.5;
      }

      skillMatches.push({
        requirementName: req.name,
        category: req.category,
        isRequired: req.isRequired,
        state,
        confidence,
        evidenceSources,
        evidenceLevel,
        reasoning,
      });
    });

    const totalRequiredCount = Math.max(1, requirements.requiredSkills.length);
    const totalPreferredCount = Math.max(1, requirements.preferredSkills.length);

    const requiredSkillCoverage = Math.round((requiredMatchedCount / totalRequiredCount) * 100);
    const preferredSkillCoverage = Math.round((preferredMatchedCount / totalPreferredCount) * 100);

    // 3. Evaluate Project Relevance
    const projectRelevance: JobProjectMatchResult[] = [];
    const userProjects = [
      ...(profile.resume?.projects || []).map((p) => ({ title: p.title || p.name || 'Unnamed Project', description: p.description || '', techStack: [] as string[] })),
      ...(profile.portfolio?.projects || []).map((p) => ({ title: p.title || 'Portfolio Project', description: p.description || '', techStack: p.techStack || [] })),
      ...(profile.githubEvidence || []).map((g) => ({ title: g.fullName, description: g.description || '', techStack: [g.primaryLanguage || ''].concat(g.dependencies || []).filter(Boolean) })),
    ];

    let totalProjectRelevanceScore = 0;

    userProjects.forEach((proj) => {
      let score = 20; // baseline
      const techOverlap: string[] = [];
      const archOverlap: string[] = [];

      const combinedText = `${proj.title} ${proj.description} ${(proj.techStack || []).join(' ')}`.toLowerCase();

      requirements.requiredSkills.forEach((req) => {
        if (combinedText.includes(req.name.toLowerCase())) {
          score += 15;
          techOverlap.push(req.name);
        }
      });

      requirements.preferredSkills.forEach((pref) => {
        if (combinedText.includes(pref.name.toLowerCase())) {
          score += 10;
          techOverlap.push(pref.name);
        }
      });

      if (/backend|rest|api|database|service/i.test(combinedText) && /backend|rest|api|database/i.test(requirements.responsibilities.join(' '))) {
        archOverlap.push('Backend / REST Architecture');
        score += 10;
      }

      const relevanceScore = Math.min(100, score);
      totalProjectRelevanceScore = Math.max(totalProjectRelevanceScore, relevanceScore);

      projectRelevance.push({
        projectName: proj.title,
        relevanceScore,
        technologyOverlap: Array.from(new Set(techOverlap)),
        architecturalOverlap: Array.from(new Set(archOverlap)),
        reasoning: `Demonstrates ${techOverlap.length} job-matching technologies and architectural concepts.`,
      });
    });

    const projectRelevanceScore = Math.round(totalProjectRelevanceScore);

    // 4. Experience Match
    let experienceMatchStatus: JobMatchingState = 'UNVERIFIABLE';
    const hasWorkExp = (profile.resume?.workExperience || []).length > 0;
    if (hasWorkExp) {
      if (requirements.experienceYears) {
        experienceMatchStatus = requirements.experienceYears <= 2 ? 'MATCHED' : 'PARTIALLY_MATCHED';
      } else {
        experienceMatchStatus = 'MATCHED';
      }
    } else {
      experienceMatchStatus = 'MISSING';
    }

    // 5. Education Match
    let educationMatchStatus: JobMatchingState = 'UNVERIFIABLE';
    const hasEdu = (profile.resume?.education || []).length > 0;
    if (hasEdu) {
      educationMatchStatus = 'MATCHED';
    } else if (requirements.educationRequirements.length > 0) {
      educationMatchStatus = 'MISSING';
    }

    // 6. Competitive Programming Relevance
    let cpRelevanceStatus: JobMatchingState = 'NOT_APPLICABLE';
    if (requirements.cpExpectations) {
      const lcSolved = profile.leetcodeProfile?.totalSolved || 0;
      const cfRating = profile.codeforcesProfile?.rating || 0;

      if (lcSolved >= 100 || cfRating >= 1200) {
        cpRelevanceStatus = 'MATCHED';
      } else {
        cpRelevanceStatus = 'MISSING';
      }
    }

    // 7. Keyword Alignment Analysis
    const keywordAlignment: KeywordAlignmentItem[] = requirements.keywords.map((kw) => {
      const normKw = JobRequirementExtractor.normalizeSkill(kw);
      const inRes = resumeSkills.has(normKw);
      const inProf = allProfileSkills.has(normKw);

      let status: 'MATCHED' | 'MISSING_FROM_RESUME' | 'MISSING_FROM_PROFILE' | 'PARTIAL' = 'MISSING_FROM_PROFILE';
      if (inRes && inProf) {
        status = 'MATCHED';
      } else if (!inRes && inProf) {
        status = 'MISSING_FROM_RESUME';
      } else if (inRes && !inProf) {
        status = 'PARTIAL';
      }

      return {
        keyword: normKw,
        status,
        source: inProf ? 'Profile / Code' : 'Job Description',
      };
    });

    // 8. Missing Skills Gap Prioritization
    const missingSkills: JobMissingSkillItem[] = skillMatches
      .filter((sm) => sm.state === 'MISSING' || sm.state === 'PARTIALLY_MATCHED')
      .map((sm) => {
        const transferrable: string[] = [];
        let suggestion = `Build a practical project utilizing ${sm.requirementName}.`;

        if (sm.requirementName === 'Spring Boot') {
          if (allProfileSkills.has('Java')) transferrable.push('Java');
          if (allProfileSkills.has('Express.js')) transferrable.push('Express.js / REST APIs');
          suggestion = 'Leverage existing Java & REST experience to learn Spring Boot dependency injection and annotations.';
        } else if (sm.requirementName === 'Kubernetes') {
          if (allProfileSkills.has('Docker')) transferrable.push('Docker');
          suggestion = 'Focus on Kubernetes pods, deployments, and services after containerizing applications with Docker.';
        } else if (sm.requirementName === 'AWS') {
          if (allProfileSkills.has('Docker')) transferrable.push('Docker');
          suggestion = 'Start with AWS EC2 and S3 basics before exploring ECS/EKS.';
        }

        return {
          skill: sm.requirementName,
          category: sm.category,
          importance: sm.isRequired ? 'CRITICAL' : 'NICE_TO_HAVE',
          transferrableSkills: transferrable,
          learningSuggestion: suggestion,
        };
      });

    // 9. Deterministic Overall Match Score Calculation
    // Formula:
    // Required technical skills: 30%
    // Preferred skills: 10%
    // Responsibilities / Project relevance: 15% + 15%
    // Experience: 10%
    // Education: 5%
    // Competitive programming: 5%
    // Verified evidence strength: 10%

    let expScore = experienceMatchStatus === 'MATCHED' ? 10 : (experienceMatchStatus as string) === 'PARTIALLY_MATCHED' ? 5 : 0;
    let eduScore = educationMatchStatus === 'MATCHED' ? 5 : (educationMatchStatus as string) === 'PARTIALLY_MATCHED' ? 2.5 : 0;
    let cpScore = cpRelevanceStatus === 'MATCHED' ? 5 : cpRelevanceStatus === 'NOT_APPLICABLE' ? 5 : 0;
    let evidenceStrengthScore = Math.min(10, (verifiedSkills.size / Math.max(1, requirements.requiredSkills.length)) * 10);

    const rawOverallScore =
      (requiredSkillCoverage * 0.30) +
      (preferredSkillCoverage * 0.10) +
      (projectRelevanceScore * 0.30) +
      expScore +
      eduScore +
      cpScore +
      evidenceStrengthScore;

    const overallMatchScore = Math.min(100, Math.max(0, Math.round(rawOverallScore)));

    let matchLabel = 'Low Match';
    if (overallMatchScore >= 90) matchLabel = 'Excellent Match';
    else if (overallMatchScore >= 75) matchLabel = 'Strong Match';
    else if (overallMatchScore >= 60) matchLabel = 'Moderate Match';
    else if (overallMatchScore >= 40) matchLabel = 'Developing Match';

    // Recommendations & Interview Priorities
    const recommendations: string[] = [
      ...missingSkills.slice(0, 3).map((m) => `Prioritize learning ${m.skill}: ${m.learningSuggestion}`),
      ...keywordAlignment.filter((k) => k.status === 'MISSING_FROM_RESUME').slice(0, 3).map((k) => `Add ${k.keyword} to resume (supported by verified code experience).`),
    ];

    const interviewPriorities: string[] = [
      `Be prepared to explain technical design choices in ${projectRelevance[0]?.projectName || 'your key projects'}.`,
      `Review core principles for ${requirements.requiredSkills.slice(0, 3).map((s) => s.name).join(', ')}.`,
    ];

    const summary = `Candidate achieves a ${overallMatchScore}% (${matchLabel}) for this job description. Required skills coverage is ${requiredSkillCoverage}%, with ${projectRelevanceScore}% project relevance.`;

    return {
      jobId,
      userId,
      overallMatchScore,
      matchLabel,
      requiredSkillCoverage,
      preferredSkillCoverage,
      projectRelevanceScore,
      experienceMatchStatus,
      educationMatchStatus,
      cpRelevanceStatus,
      summary,
      extractedRequirements: requirements,
      skillMatches,
      projectRelevance: projectRelevance.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 5),
      missingSkills,
      keywordAlignment,
      recommendations,
      interviewPriorities,
    };
  }
}
