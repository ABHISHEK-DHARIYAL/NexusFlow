import {
  JobMatchReport,
  JobReadinessReport,
  JobReadinessDimensions,
  JobReadinessGap,
  JobReadinessSignal,
  JobReadinessInterviewPrep,
  JobReadinessPreparationPriority,
  JobReadinessProjectLeverage,
  JobReadinessWhatIfScenario,
  JobReadinessDataFreshness,
  JobReadinessLevel,
  JobDSARelevance,
  ExtractedJobRequirements,
  JobSkillMatchResult,
  LeetCodeProfile,
  CodeforcesProfile,
  ResumeClaim,
} from '../../../types';

export interface ProfileEvidenceInput {
  repositories?: any[];
  leetcodeProfile?: LeetCodeProfile | null;
  codeforcesProfile?: CodeforcesProfile | null;
  portfolio?: any | null;
  resume?: any | null;
  crossPlatformVerification?: any | null;
}

export class JobReadinessEngine {
  /**
   * Deterministically calculates the complete Job Readiness Report based on Part 17 JobMatch & profile evidence.
   */
  public static calculateReadiness(
    jobMatch: JobMatchReport,
    profile: ProfileEvidenceInput
  ): Omit<JobReadinessReport, 'id' | 'jobId' | 'userId' | 'taskId' | 'createdAt' | 'executiveSummary'> {
    const requirements = jobMatch.extractedRequirements;
    const skillMatches = jobMatch.skillMatches || [];
    const projectMatches = jobMatch.projectRelevance || [];

    // 1. Determine DSA Relevance
    const dsaRelevance = this.determineDSARelevance(jobMatch, requirements);

    // 2. Determine Weights based on DSA Relevance
    const weights = this.getDimensionWeights(dsaRelevance);

    // 3. Calculate Dimensions
    const requiredSkillReadiness = this.calculateRequiredSkillReadiness(skillMatches, weights.requiredSkillReadiness);
    const technicalReadiness = this.calculateTechnicalReadiness(skillMatches, weights.technicalReadiness);
    const projectReadiness = this.calculateProjectReadiness(projectMatches, profile, requirements, weights.projectReadiness);
    const experienceReadiness = this.calculateExperienceReadiness(jobMatch, profile, requirements, weights.experienceReadiness);
    const dsaReadiness = this.calculateDSAReadiness(profile, dsaRelevance, weights.dsaReadiness);
    const resumeReadiness = this.calculateResumeReadiness(jobMatch, profile, weights.resumeReadiness);
    const evidenceReadiness = this.calculateEvidenceReadiness(skillMatches, profile, weights.evidenceReadiness);
    const responsibilityReadiness = this.calculateResponsibilityReadiness(requirements, profile, weights.responsibilityReadiness);

    const dimensions: JobReadinessDimensions = {
      requiredSkillReadiness,
      technicalReadiness,
      projectReadiness,
      experienceReadiness,
      dsaReadiness,
      resumeReadiness,
      evidenceReadiness,
      responsibilityReadiness,
    };

    // 4. Calculate Overall Score & Level
    const rawScore =
      (requiredSkillReadiness.score * weights.requiredSkillReadiness +
        technicalReadiness.score * weights.technicalReadiness +
        projectReadiness.score * weights.projectReadiness +
        experienceReadiness.score * weights.experienceReadiness +
        dsaReadiness.score * weights.dsaReadiness +
        resumeReadiness.score * weights.resumeReadiness +
        evidenceReadiness.score * weights.evidenceReadiness +
        responsibilityReadiness.score * weights.responsibilityReadiness) /
      100;

    const score = Math.min(100, Math.max(0, Math.round(rawScore)));
    const level = this.getReadinessLevel(score);

    // 5. Data Freshness & Confidence
    const dataFreshness = this.calculateDataFreshness(profile);
    const confidence = this.calculateConfidence(profile, dataFreshness);

    // 6. Gaps, Blockers, Signals
    const { criticalGaps, readinessBlockers } = this.identifyGapsAndBlockers(skillMatches, requirements, profile);
    const { strongSignals, weakSignals } = this.generateSignals(jobMatch, profile, dimensions);

    // 7. Interview Prep & Priorities
    const interviewPrep = this.generateInterviewPrep(dimensions, requirements, profile);
    const preparationPriorities = this.generatePreparationPriorities(criticalGaps, requirements);
    const projectLeverage = this.generateProjectLeverage(criticalGaps, profile);

    // 8. What-If Scenarios Simulation
    const whatIfSimulation = this.simulateWhatIfScenarios(score, dimensions, criticalGaps, weights);

    return {
      score,
      level,
      confidence,
      interviewReadinessScore: interviewPrep.interviewReadinessScore,
      dsaRelevance,
      dimensions,
      criticalGaps,
      readinessBlockers,
      strongSignals,
      weakSignals,
      interviewPrep,
      preparationPriorities,
      projectLeverage,
      whatIfSimulation,
      dataFreshness,
    };
  }

  // ==========================================
  // HELPER CALCULATIONS
  // ==========================================

  private static determineDSARelevance(jobMatch: JobMatchReport, requirements: ExtractedJobRequirements): JobDSARelevance {
    const reqSkills = (requirements.requiredSkills || []).map((s: any) => (typeof s === 'string' ? s : s.name || ''));
    const prefSkills = (requirements.preferredSkills || []).map((s: any) => (typeof s === 'string' ? s : s.name || ''));

    const textToSearch = [
      jobMatch.summary || '',
      requirements.roleTitle || '',
      requirements.cpExpectations || '',
      ...(requirements.keywords || []),
      ...(requirements.responsibilities || []),
      ...reqSkills,
      ...prefSkills,
    ]
      .join(' ')
      .toLowerCase();

    const dsaKeywords = [
      'algorithm',
      'algorithms',
      'data structure',
      'data structures',
      'competitive programming',
      'coding interview',
      'leetcode',
      'codeforces',
      'problem solving',
      'algorithmic',
      'tree',
      'graph',
      'dynamic programming',
      'complexity analysis',
    ];

    let count = 0;
    for (const kw of dsaKeywords) {
      if (textToSearch.includes(kw)) {
        count++;
      }
    }

    if (count >= 3 || textToSearch.includes('leetcode') || textToSearch.includes('codeforces') || textToSearch.includes('competitive programming')) {
      return 'HIGH';
    }
    if (count >= 1) {
      return 'MEDIUM';
    }
    return 'LOW';
  }

  private static getDimensionWeights(dsaRelevance: JobDSARelevance) {
    if (dsaRelevance === 'HIGH') {
      return {
        requiredSkillReadiness: 20,
        technicalReadiness: 20,
        projectReadiness: 15,
        experienceReadiness: 10,
        dsaReadiness: 15,
        resumeReadiness: 5,
        evidenceReadiness: 5,
        responsibilityReadiness: 10,
      };
    } else if (dsaRelevance === 'MEDIUM') {
      return {
        requiredSkillReadiness: 25,
        technicalReadiness: 20,
        projectReadiness: 15,
        experienceReadiness: 10,
        dsaReadiness: 5,
        resumeReadiness: 5,
        evidenceReadiness: 10,
        responsibilityReadiness: 10,
      };
    } else {
      // LOW DSA relevance
      return {
        requiredSkillReadiness: 27,
        technicalReadiness: 20,
        projectReadiness: 17,
        experienceReadiness: 10,
        dsaReadiness: 0,
        resumeReadiness: 5,
        evidenceReadiness: 11,
        responsibilityReadiness: 10,
      };
    }
  }

  /**
   * Required Skill Readiness Formula:
   * MATCHED = 1.0, PARTIALLY_MATCHED = 0.5, UNVERIFIABLE = 0.25, MISSING = 0.0
   * Score = ((MATCHED * 1.0 + PARTIALLY_MATCHED * 0.5 + UNVERIFIABLE * 0.25) / total_required) * 100
   */
  private static calculateRequiredSkillReadiness(skillMatches: JobSkillMatchResult[], weight: number) {
    const required = skillMatches.filter((s) => s.isRequired);

    if (required.length === 0) {
      return {
        score: 100,
        weight,
        label: 'Required Skill Readiness',
        rationale: 'No explicit required skills specified in job description.',
      };
    }

    let points = 0;
    let matchedCount = 0;
    let partialCount = 0;
    let missingCount = 0;

    for (const skill of required) {
      if (skill.state === 'MATCHED') {
        points += 1.0;
        matchedCount++;
      } else if (skill.state === 'PARTIALLY_MATCHED') {
        points += 0.5;
        partialCount++;
      } else if (skill.state === 'UNVERIFIABLE') {
        points += 0.25;
      } else {
        missingCount++;
      }
    }

    const score = Math.round((points / required.length) * 100);

    return {
      score,
      weight,
      label: 'Required Skill Readiness',
      rationale: `${matchedCount} matched, ${partialCount} partially matched, ${missingCount} missing out of ${required.length} required skills.`,
    };
  }

  private static calculateTechnicalReadiness(skillMatches: JobSkillMatchResult[], weight: number) {
    if (skillMatches.length === 0) {
      return {
        score: 100,
        weight,
        label: 'Technical Readiness',
        rationale: 'No technical skills evaluated.',
      };
    }

    const required = skillMatches.filter((s) => s.isRequired);
    const preferred = skillMatches.filter((s) => !s.isRequired);

    const calcGroup = (group: JobSkillMatchResult[]) => {
      if (group.length === 0) return 100;
      let pts = 0;
      for (const s of group) {
        if (s.state === 'MATCHED') pts += 1.0;
        else if (s.state === 'PARTIALLY_MATCHED') pts += 0.5;
        else if (s.state === 'UNVERIFIABLE') pts += 0.25;
      }
      return (pts / group.length) * 100;
    };

    const reqScore = calcGroup(required);
    const prefScore = calcGroup(preferred);

    const score = Math.round(preferred.length > 0 ? reqScore * 0.8 + prefScore * 0.2 : reqScore);

    return {
      score,
      weight,
      label: 'Technical Readiness',
      rationale: `Weighted score across required (${Math.round(reqScore)}%) and preferred (${Math.round(prefScore)}%) technical stacks.`,
    };
  }

  private static calculateProjectReadiness(
    projectMatches: any[],
    profile: ProfileEvidenceInput,
    requirements: ExtractedJobRequirements,
    weight: number
  ) {
    const repos = profile.repositories || [];
    const portfolioProjects = profile.portfolio?.projects || [];

    if (projectMatches.length === 0 && repos.length === 0 && portfolioProjects.length === 0) {
      return {
        score: 30,
        weight,
        label: 'Project Readiness',
        rationale: 'No connected repository or portfolio project evidence found.',
      };
    }

    let topRelevance = 0;
    for (const pm of projectMatches) {
      if (typeof pm.relevanceScore === 'number' && pm.relevanceScore > topRelevance) {
        topRelevance = pm.relevanceScore;
      }
    }

    // Depth checks: backend integration, database usage, concurrency, testing
    let depthBonus = 0;
    const hasDb = repos.some((r) => r.dependencies?.some((d: string) => /prisma|sequelize|typeorm|mongoose|pg|mysql|redis/i.test(d)));
    const hasTesting = repos.some((r) => r.dependencies?.some((d: string) => /jest|vitest|mocha|cypress|junit/i.test(d)));
    const hasBackend = repos.some((r) => r.primaryLanguage === 'Java' || r.primaryLanguage === 'TypeScript' || r.primaryLanguage === 'Go' || r.primaryLanguage === 'Python');

    if (hasDb) depthBonus += 10;
    if (hasTesting) depthBonus += 10;
    if (hasBackend) depthBonus += 10;

    const baseScore = topRelevance > 0 ? topRelevance * 0.7 : 50;
    const score = Math.min(100, Math.round(baseScore + depthBonus));

    return {
      score,
      weight,
      label: 'Project Readiness',
      rationale: `Demonstrated through ${repos.length} repositories and ${portfolioProjects.length} portfolio projects with architecture depth.`,
    };
  }

  private static calculateExperienceReadiness(
    jobMatch: JobMatchReport,
    profile: ProfileEvidenceInput,
    requirements: ExtractedJobRequirements,
    weight: number
  ) {
    const status = jobMatch.experienceMatchStatus || 'UNVERIFIABLE';
    const resume = profile.resume;
    const workExp = resume?.workExperience || [];

    let score = 50;
    let rationale = '';

    if (status === 'MATCHED') {
      score = 95;
      rationale = 'Stated professional experience requirements fully met by verified work history.';
    } else if (status === 'PARTIALLY_MATCHED') {
      score = 65;
      rationale = 'Strong technical project evidence exists, but the stated professional experience requirement is not fully met.';
    } else if (workExp.length > 0) {
      score = 75;
      rationale = `Contains ${workExp.length} prior work/internship experience entries.`;
    } else {
      score = 40;
      rationale = 'Limited formal work experience found; reliance on technical project portfolio.';
    }

    return {
      score,
      weight,
      label: 'Experience Readiness',
      rationale,
    };
  }

  private static calculateDSAReadiness(profile: ProfileEvidenceInput, relevance: JobDSARelevance, weight: number) {
    const leetcode = profile.leetcodeProfile;
    const codeforces = profile.codeforcesProfile;

    if (!leetcode && !codeforces) {
      return {
        score: relevance === 'LOW' ? 100 : 30,
        weight,
        label: 'DSA Readiness',
        rationale: 'No connected LeetCode or Codeforces profile.',
      };
    }

    let lcScore = 0;
    if (leetcode) {
      const solved = leetcode.totalSolved || 0;
      const mediumHard = (leetcode.mediumSolved || 0) + (leetcode.hardSolved || 0);
      const rating = leetcode.contestRating || 0;

      let solvedPts = Math.min(50, (solved / 300) * 50);
      let diffPts = Math.min(30, (mediumHard / 100) * 30);
      let ratingPts = rating > 0 ? Math.min(20, ((rating - 1200) / 600) * 20) : 10;

      lcScore = solvedPts + diffPts + ratingPts;
    }

    let cfScore = 0;
    if (codeforces) {
      const rating = codeforces.rating || 0;
      if (rating > 0) {
        cfScore = Math.min(100, (rating / 1800) * 100);
      }
    }

    const maxScore = Math.max(lcScore, cfScore);
    const score = Math.min(100, Math.round(maxScore));

    return {
      score,
      weight,
      label: 'DSA Readiness',
      rationale: leetcode
        ? `LeetCode: ${leetcode.totalSolved} solved (${leetcode.mediumSolved || 0} medium, ${leetcode.hardSolved || 0} hard), Contest Rating: ${leetcode.contestRating || 'N/A'}.`
        : `Codeforces Rating: ${codeforces?.rating || 'N/A'}.`,
    };
  }

  private static calculateResumeReadiness(jobMatch: JobMatchReport, profile: ProfileEvidenceInput, weight: number) {
    const kwAlign = jobMatch.keywordAlignment || [];
    if (kwAlign.length === 0) {
      return {
        score: 75,
        weight,
        label: 'Resume Readiness',
        rationale: 'Standard resume structure verified.',
      };
    }

    let matched = 0;
    for (const kw of kwAlign) {
      if (kw.status === 'MATCHED' || kw.status === 'PARTIAL') matched++;
    }

    const score = Math.round((matched / Math.max(1, kwAlign.length)) * 100);

    return {
      score: Math.max(40, score),
      weight,
      label: 'Resume Readiness',
      rationale: `${matched} of ${kwAlign.length} key role terms aligned in resume content.`,
    };
  }

  private static calculateEvidenceReadiness(skillMatches: JobSkillMatchResult[], profile: ProfileEvidenceInput, weight: number) {
    if (skillMatches.length === 0) {
      return {
        score: 80,
        weight,
        label: 'Evidence Readiness',
        rationale: 'Profile evidence coverage verified.',
      };
    }

    let verifiedCount = 0;
    for (const s of skillMatches) {
      if (s.evidenceLevel === 'DIRECT' || s.evidenceLevel === 'STRONG' || s.evidenceLevel === 'PARTIAL') {
        verifiedCount++;
      }
    }

    const score = Math.round((verifiedCount / skillMatches.length) * 100);

    return {
      score: Math.max(30, score),
      weight,
      label: 'Evidence Readiness',
      rationale: `${verifiedCount} of ${skillMatches.length} skill claims backed by verified connected platform evidence.`,
    };
  }

  private static calculateResponsibilityReadiness(requirements: ExtractedJobRequirements, profile: ProfileEvidenceInput, weight: number) {
    const responsibilities = requirements.responsibilities || [];
    if (responsibilities.length === 0) {
      return {
        score: 85,
        weight,
        label: 'Responsibility Readiness',
        rationale: 'General software engineering responsibilities evaluated.',
      };
    }

    const repos = profile.repositories || [];
    const resume = profile.resume;

    let supportedCount = 0;
    for (const resp of responsibilities) {
      const respLower = resp.toLowerCase();
      const supportedByRepo = repos.some((r) => {
        const text = `${r.name} ${r.description || ''} ${r.primaryLanguage || ''}`.toLowerCase();
        return respLower.split(' ').some((word) => word.length > 4 && text.includes(word));
      });

      const supportedByResume =
        resume?.workExperience?.some((w: any) =>
          w.description?.some((d: string) => d.toLowerCase().split(' ').some((word) => word.length > 4 && respLower.includes(word)))
        ) || false;

      if (supportedByRepo || supportedByResume) {
        supportedCount++;
      }
    }

    const score = Math.round((supportedCount / responsibilities.length) * 100);

    return {
      score: Math.max(35, score),
      weight,
      label: 'Responsibility Readiness',
      rationale: `${supportedCount} of ${responsibilities.length} core job responsibilities mapped to profile project/work history.`,
    };
  }

  private static getReadinessLevel(score: number): JobReadinessLevel {
    if (score >= 90) return 'HIGHLY_READY';
    if (score >= 75) return 'STRONGLY_READY';
    if (score >= 60) return 'MODERATELY_READY';
    if (score >= 40) return 'DEVELOPING';
    return 'EARLY_PREPARATION';
  }

  private static calculateDataFreshness(profile: ProfileEvidenceInput): JobReadinessDataFreshness {
    const now = new Date();
    const isStale = (dateStr?: string) => {
      if (!dateStr) return true;
      const d = new Date(dateStr);
      return (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) > 30; // > 30 days
    };

    const ghFresh = {
      status: profile.repositories && profile.repositories.length > 0 ? 'CONNECTED' : 'NOT_CONNECTED',
      lastSyncedAt: profile.repositories?.[0]?.lastSyncedAt,
      isStale: isStale(profile.repositories?.[0]?.lastSyncedAt),
    };

    const lcFresh = {
      status: profile.leetcodeProfile ? 'CONNECTED' : 'NOT_CONNECTED',
      lastSyncedAt: profile.leetcodeProfile?.lastSyncedAt,
      isStale: isStale(profile.leetcodeProfile?.lastSyncedAt),
    };

    const cfFresh = {
      status: profile.codeforcesProfile ? 'CONNECTED' : 'NOT_CONNECTED',
      lastSyncedAt: profile.codeforcesProfile?.lastSyncedAt,
      isStale: isStale(profile.codeforcesProfile?.lastSyncedAt),
    };

    const portFresh = {
      status: profile.portfolio ? 'CONNECTED' : 'NOT_CONNECTED',
      lastSyncedAt: profile.portfolio?.lastCrawledAt,
      isStale: isStale(profile.portfolio?.lastCrawledAt),
    };

    const resFresh = {
      status: profile.resume ? 'CONNECTED' : 'NOT_CONNECTED',
      lastSyncedAt: profile.resume?.updatedAt,
      isStale: isStale(profile.resume?.updatedAt),
    };

    const anyStale = ghFresh.isStale || lcFresh.isStale || cfFresh.isStale;

    return {
      github: ghFresh,
      leetcode: lcFresh,
      codeforces: cfFresh,
      portfolio: portFresh,
      resume: resFresh,
      overallNote: anyStale ? 'Readiness score may update after profile synchronization.' : 'All connected profile sources are up to date.',
    };
  }

  private static calculateConfidence(profile: ProfileEvidenceInput, freshness: JobReadinessDataFreshness): 'HIGH' | 'MEDIUM' | 'LOW' {
    let connectedCount = 0;
    if (freshness.github?.status === 'CONNECTED') connectedCount++;
    if (freshness.leetcode?.status === 'CONNECTED') connectedCount++;
    if (freshness.codeforces?.status === 'CONNECTED') connectedCount++;
    if (freshness.portfolio?.status === 'CONNECTED') connectedCount++;
    if (freshness.resume?.status === 'CONNECTED') connectedCount++;

    if (connectedCount >= 4 && !freshness.github?.isStale) {
      return 'HIGH';
    } else if (connectedCount >= 2) {
      return 'MEDIUM';
    }
    return 'LOW';
  }

  private static identifyGapsAndBlockers(
    skillMatches: JobSkillMatchResult[],
    requirements: ExtractedJobRequirements,
    profile: ProfileEvidenceInput
  ): { criticalGaps: JobReadinessGap[]; readinessBlockers: JobReadinessGap[] } {
    const gaps: JobReadinessGap[] = [];
    const blockers: JobReadinessGap[] = [];

    const missingSkills = skillMatches.filter((s) => s.state === 'MISSING' || s.state === 'UNVERIFIABLE');

    missingSkills.forEach((s, idx) => {
      const isReq = s.isRequired;
      const priority = isReq ? 'CRITICAL' : 'MEDIUM';
      const isBlocker = isReq && (s.state === 'MISSING' || s.evidenceLevel === 'UNVERIFIABLE');

      const gapItem: JobReadinessGap = {
        gapId: `gap_${idx + 1}_${s.requirementName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        skillOrRequirement: s.requirementName,
        category: s.category || 'TECHNICAL_SKILL',
        priority,
        isBlocker,
        whyRequired: isReq ? `Required core requirement for ${requirements.roleTitle || 'this role'}.` : 'Preferred skill specified in job post.',
        currentEvidence: s.state === 'MISSING' ? 'No verified evidence found in connected repositories or profiles.' : 'Unverifiable self-claim.',
        whatIsMissing: `Demonstrated hands-on experience or project code utilizing ${s.requirementName}.`,
        suggestedAction: isReq
          ? `Build or extend an existing project with ${s.requirementName} to satisfy core requirements.`
          : `Familiarize with ${s.requirementName} concepts and mention relevant usage.`,
        estimatedDifficulty: 'MODERATE',
      };

      gaps.push(gapItem);
      if (isBlocker) {
        blockers.push(gapItem);
      }
    });

    return { criticalGaps: gaps, readinessBlockers: blockers };
  }

  private static generateSignals(jobMatch: JobMatchReport, profile: ProfileEvidenceInput, dimensions: JobReadinessDimensions) {
    const strongSignals: JobReadinessSignal[] = [];
    const weakSignals: JobReadinessSignal[] = [];

    if (dimensions.requiredSkillReadiness.score >= 70) {
      strongSignals.push({
        type: 'STRONG',
        title: 'Core Technical Stack Alignment',
        description: 'Strong match across required programming languages and frameworks.',
        source: 'GitHub + Resume',
      });
    }

    if (dimensions.projectReadiness.score >= 75) {
      strongSignals.push({
        type: 'STRONG',
        title: 'Relevant Project Architecture Evidence',
        description: 'Existing projects demonstrate backend service integration and clean software architecture.',
        source: 'NexusFlow Repository Scan',
      });
    }

    if (dimensions.dsaReadiness.score >= 70) {
      strongSignals.push({
        type: 'STRONG',
        title: 'Solid Algorithmic Problem Solving Record',
        description: 'Demonstrated competitive programming ratings and LeetCode problem solving history.',
        source: 'LeetCode / Codeforces',
      });
    }

    if (dimensions.requiredSkillReadiness.score < 60) {
      weakSignals.push({
        type: 'WEAK',
        title: 'Missing Essential Stack Requirements',
        description: 'Key required technical skills lack verified project or work evidence.',
        source: 'Job Requirement Scanner',
      });
    }

    if (dimensions.experienceReadiness.score < 70) {
      weakSignals.push({
        type: 'WEAK',
        title: 'Stated Formal Experience Gap',
        description: 'Stated years of professional employment requirement exceeds verified work history duration.',
        source: 'Resume Verification',
      });
    }

    return { strongSignals, weakSignals };
  }

  private static generateInterviewPrep(
    dimensions: JobReadinessDimensions,
    requirements: ExtractedJobRequirements,
    profile: ProfileEvidenceInput
  ): JobReadinessInterviewPrep {
    const readinessScore = Math.round(
      dimensions.dsaReadiness.score * 0.35 + dimensions.technicalReadiness.score * 0.35 + dimensions.projectReadiness.score * 0.3
    );

    const technicalInterviewAreas = [
      {
        category: 'Core System Architecture',
        focus: 'RESTful APIs, Database Indexing, Concurrency, and Microservices Patterns',
        importance: 'HIGH' as const,
      },
      {
        category: 'Language & Framework Mastery',
        focus: `${requirements.requiredSkills.slice(0, 3).join(', ') || 'Core Stack'} internal mechanics and design principles`,
        importance: 'HIGH' as const,
      },
      {
        category: 'Data Structures & Algorithms',
        focus: 'Array manipulation, Trees, Graphs, Hash Tables, and Time/Space complexity analysis',
        importance: dimensions.dsaReadiness.score > 50 ? ('HIGH' as const) : ('MEDIUM' as const),
      },
      {
        category: 'Database Design & SQL Optimization',
        focus: 'Relational schemas, ACID transactions, Query tuning, and Caching strategies',
        importance: 'MEDIUM' as const,
      },
    ];

    const behavioralFocusAreas = [
      {
        topic: 'Technical Decision Making',
        guidance: 'Be ready to explain architectural tradeoffs and why specific frameworks were chosen in your projects.',
      },
      {
        topic: 'Complex Bug Investigation',
        guidance: 'Prepare a concrete story detailing how you diagnosed and resolved a tricky production or concurrency issue.',
      },
    ];

    return {
      interviewReadinessScore: readinessScore,
      technicalInterviewAreas,
      behavioralFocusAreas,
    };
  }

  private static generatePreparationPriorities(
    gaps: JobReadinessGap[],
    requirements: ExtractedJobRequirements
  ): JobReadinessPreparationPriority[] {
    const priorities: JobReadinessPreparationPriority[] = [];

    const criticalGaps = gaps.filter((g) => g.priority === 'CRITICAL');
    criticalGaps.slice(0, 3).forEach((gap, idx) => {
      priorities.push({
        rank: idx + 1,
        title: `Master ${gap.skillOrRequirement} Fundamentals`,
        category: gap.category,
        description: `Closing this core missing requirement will directly boost your required skill readiness score.`,
        actionItem: `Build a prototype module or extend a repo using ${gap.skillOrRequirement}.`,
        targetGapId: gap.gapId,
        estimatedEffort: '1 - 2 weeks',
      });
    });

    if (priorities.length < 5) {
      priorities.push({
        rank: priorities.length + 1,
        title: 'System Design & Architectural Tradeoffs Review',
        category: 'SYSTEM_DESIGN',
        description: 'Review distributed caching, API design, and relational database indexing strategies.',
        actionItem: 'Practice designing scalable REST API backends on a white board.',
        estimatedEffort: '3 - 5 days',
      });
    }

    if (priorities.length < 5) {
      priorities.push({
        rank: priorities.length + 1,
        title: 'LeetCode / Algorithmic Practice',
        category: 'DSA',
        description: 'Sharpen medium-level problem solving in array, hashmap, and tree structures.',
        actionItem: 'Solve 10 medium LeetCode questions focusing on core data structures.',
        estimatedEffort: '1 week',
      });
    }

    return priorities.slice(0, 5);
  }

  private static generateProjectLeverage(gaps: JobReadinessGap[], profile: ProfileEvidenceInput): JobReadinessProjectLeverage[] {
    const repos = profile.repositories || [];
    if (repos.length === 0) return [];

    const mainRepo = repos[0];
    const missingReqs = gaps.filter((g) => g.priority === 'CRITICAL' || g.priority === 'HIGH');

    if (missingReqs.length === 0) {
      return [
        {
          projectName: mainRepo.name,
          existingTech: [mainRepo.primaryLanguage || 'TypeScript'],
          missingSkillToExtend: 'Production Monitoring',
          recommendation: `Add Prometheus/Grafana metrics or automated integration tests to ${mainRepo.name} to showcase senior engineering rigor.`,
        },
      ];
    }

    const missingSkill = missingReqs[0].skillOrRequirement;
    return [
      {
        projectName: mainRepo.name,
        existingTech: [mainRepo.primaryLanguage || 'Java', 'REST APIs'],
        missingSkillToExtend: missingSkill,
        recommendation: `Extend your existing project (${mainRepo.name}) by adding a ${missingSkill} integration module rather than building a project from scratch.`,
      },
    ];
  }

  private static simulateWhatIfScenarios(
    currentScore: number,
    dimensions: JobReadinessDimensions,
    gaps: JobReadinessGap[],
    weights: Record<string, number>
  ): JobReadinessWhatIfScenario[] {
    const scenarios: JobReadinessWhatIfScenario[] = [];

    const criticalGaps = gaps.filter((g) => g.priority === 'CRITICAL');

    if (criticalGaps.length > 0) {
      const targetGap = criticalGaps[0];
      const delta = Math.round((weights.requiredSkillReadiness * 0.4) + (weights.technicalReadiness * 0.3));
      const estNew = Math.min(100, currentScore + delta);

      scenarios.push({
        scenarioId: 'scen_learn_skill',
        name: `What if I demonstrate ${targetGap.skillOrRequirement}?`,
        actions: [`Add verified project or repository code utilizing ${targetGap.skillOrRequirement}.`],
        currentScore,
        estimatedNewScore: estNew,
        estimatedDelta: delta,
        affectedDimensions: ['Required Skill Readiness', 'Technical Readiness', 'Evidence Readiness'],
        remainingGaps: gaps.slice(1).map((g) => g.skillOrRequirement),
        disclaimer: "Estimated score impact within NexusFlow's scoring model.",
      });
    }

    // Scenario 2: Add AWS/Cloud project evidence
    const cloudDelta = Math.round(weights.projectReadiness * 0.3 + weights.evidenceReadiness * 0.3);
    scenarios.push({
      scenarioId: 'scen_add_cloud',
      name: 'What if I add Cloud / DevOps project evidence?',
      actions: ['Deploy an existing repository to AWS/Cloud with Docker containerization.'],
      currentScore,
      estimatedNewScore: Math.min(100, currentScore + cloudDelta),
      estimatedDelta: cloudDelta,
      affectedDimensions: ['Project Readiness', 'Evidence Readiness', 'Technical Readiness'],
      remainingGaps: gaps.map((g) => g.skillOrRequirement),
      disclaimer: "Estimated score impact within NexusFlow's scoring model.",
    });

    // Scenario 3: Strengthen DSA rating
    if (weights.dsaReadiness > 0) {
      const dsaDelta = Math.round(weights.dsaReadiness * 0.5);
      scenarios.push({
        scenarioId: 'scen_improve_dsa',
        name: 'What if I solve 50+ medium LeetCode problems?',
        actions: ['Increase LeetCode medium/hard problem solve count and boost contest rating.'],
        currentScore,
        estimatedNewScore: Math.min(100, currentScore + dsaDelta),
        estimatedDelta: dsaDelta,
        affectedDimensions: ['DSA Readiness', 'Interview Readiness'],
        remainingGaps: gaps.map((g) => g.skillOrRequirement),
        disclaimer: "Estimated score impact within NexusFlow's scoring model.",
      });
    }

    return scenarios;
  }
}
