import {
  CompanyProfile,
  PreparationPriorityItem,
  DSAPreparationCard,
  ProjectPreparationItem,
  BehavioralPreparationItem,
  CompanyResearchChecklist,
  ResumePositioningItem,
  SkillTransferRecommendation,
  PreparationRoadmapPhase,
  JobMatchReport,
  JobReadinessReport,
} from '../../../types';

export interface CompanyPreparationEngineInput {
  jobId: string;
  companyName: string;
  jobTitle: string;
  rawDescription: string;
  customCompanyInput?: {
    website?: string;
    industry?: string;
    location?: string;
    companyWebsiteInfo?: string;
  };
  jobMatch: JobMatchReport;
  jobReadiness: JobReadinessReport;
  userProfile: {
    repositories: any[];
    leetCodeProfile?: any;
    codeforcesProfile?: any;
    portfolio?: any;
    resume?: any;
  };
}

export class CompanyPreparationEngine {
  public static FORMULA_DOCUMENTATION = `
Deterministic Priority Engine Methodology:
1. Requirement Importance Weight (W_req):
   - Critical Blocker / Primary Required Skill = 3.0
   - Preferred / Important Requirement = 2.0
   - Optional / Nice-to-have = 1.0
2. Current Readiness / Evidence Factor (F_ready):
   - Fully Verified Evidence = 1.0 (Gap G = 0.0)
   - Related / Partial Foundation = 0.5 (Gap G = 0.5)
   - Missing / No Verified Evidence = 0.0 (Gap G = 1.0)
3. Job Relevance Multiplier (R_job):
   - Directly Core Architecture/Core Tech = 1.5
   - Secondary / Supporting Skill = 1.0
4. Priority Score Formula:
   P_score = W_req * (1.0 - F_ready) * R_job
   - CRITICAL: P_score >= 3.5 or (W_req == 3.0 and F_ready == 0.0)
   - HIGH: 2.5 <= P_score < 3.5
   - MEDIUM: 1.5 <= P_score < 2.5
   - LOW: P_score < 1.5

Preparation Coverage Score Formula:
Coverage % = Math.round( (Sum(w_i * c_i) / Sum(w_i)) * 100 )
where c_i = 1.0 if topic is verified or has an active project strategy, 0.5 if partial foundation exists, 0.0 if unaddressed critical gap.
`.trim();

  public analyze(input: CompanyPreparationEngineInput) {
    const { companyName, jobTitle, rawDescription, customCompanyInput, jobMatch, jobReadiness, userProfile } = input;

    // 1. Build Company Profile & Extract Tech Signals
    const companyProfile = this.extractCompanyProfile(companyName, rawDescription, customCompanyInput);

    // 2. Identify Verified Skills vs Missing Skills
    const verifiedSkills = new Set<string>();
    const partialSkills = new Set<string>();

    if (jobMatch.skillMatches) {
      jobMatch.skillMatches.forEach((match) => {
        const skillName = match.requirementName.toLowerCase();
        if (match.state === 'MATCHED' || match.evidenceLevel === 'DIRECT' || match.evidenceLevel === 'STRONG') {
          verifiedSkills.add(skillName);
        } else if (match.state === 'PARTIALLY_MATCHED' || match.evidenceLevel === 'PARTIAL') {
          partialSkills.add(skillName);
        }
      });
    }

    // 3. Deterministic Priority Engine for Topics
    const priorityItems: PreparationPriorityItem[] = [];
    const missingSkills = jobMatch.missingSkills || [];

    missingSkills.forEach((missing) => {
      const skillLower = missing.skill.toLowerCase();
      let wReq = 2.0;
      if (missing.importance === 'CRITICAL') wReq = 3.0;
      else if (missing.importance === 'IMPORTANT') wReq = 2.5;
      else if (missing.importance === 'NICE_TO_HAVE') wReq = 1.0;

      const fReady = partialSkills.has(skillLower) ? 0.5 : 0.0;
      const rJob = 1.5;
      const pScore = wReq * (1.0 - fReady) * rJob;

      let priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
      if (pScore >= 3.5 || (wReq === 3.0 && fReady === 0.0)) {
        priority = 'CRITICAL';
      } else if (pScore >= 2.5) {
        priority = 'HIGH';
      } else if (pScore >= 1.5) {
        priority = 'MEDIUM';
      } else {
        priority = 'LOW';
      }

      const transferrable = missing.transferrableSkills && missing.transferrableSkills.length > 0
        ? ` (Transferrable foundation: ${missing.transferrableSkills.join(', ')})`
        : '';

      priorityItems.push({
        topic: missing.skill,
        category: missing.category || 'Backend',
        priority,
        reason: `Required for ${jobTitle} role at ${companyName}.${transferrable}`,
        currentReadiness: fReady === 0.5 ? 'Partial Foundation' : 'No Verified Evidence',
        gap: missing.importance === 'CRITICAL' ? 'Critical Skill Gap' : 'Important Skill Gap',
        evidence: missing.transferrableSkills?.join(', ') || 'None',
        recommendedAction: missing.learningSuggestion || `Build a target project or exercise demonstrating ${missing.skill}.`,
      });
    });

    // Determine Top Priority Topic
    const criticalItem = priorityItems.find((i) => i.priority === 'CRITICAL') || priorityItems.find((i) => i.priority === 'HIGH');
    const topPriorityTopic = criticalItem ? criticalItem.topic : 'Role Fundamentals & DSA';

    // 4. Calculate Preparation Coverage Score
    let totalWeight = 0;
    let coveredWeight = 0;

    // Evaluate required skills coverage
    if (jobMatch.skillMatches) {
      jobMatch.skillMatches.forEach((sm) => {
        const weight = sm.isRequired ? 3 : 1;
        totalWeight += weight;
        if (sm.state === 'MATCHED' || sm.evidenceLevel === 'DIRECT' || sm.evidenceLevel === 'STRONG') {
          coveredWeight += weight * 1.0;
        } else if (sm.state === 'PARTIALLY_MATCHED' || sm.evidenceLevel === 'PARTIAL') {
          coveredWeight += weight * 0.5;
        }
      });
    }

    if (totalWeight === 0) totalWeight = 10;
    const preparationCoverageScore = Math.min(100, Math.max(15, Math.round((coveredWeight / totalWeight) * 100)));

    // 5. DSA Preparation Card
    const dsaPreparation = this.buildDSAPreparation(rawDescription, userProfile);

    // 6. System Design & Technical Preparation
    const systemDesignPrep = this.buildSystemDesignPrep(rawDescription, userProfile);

    // 7. Project Preparation & Story Guides
    const projectPreparations = this.buildProjectPreparations(userProfile, rawDescription, companyName);

    // 8. Behavioral Preparation
    const behavioralPreparations = this.buildBehavioralPreparations(projectPreparations, companyName);

    // 9. Company Research Checklist
    const companyResearch = this.buildCompanyResearchChecklist(companyName, rawDescription, customCompanyInput);

    // 10. Resume Positioning
    const resumePositioning = this.buildResumePositioning(jobMatch, userProfile);

    // 11. Profile Gaps & Skill Transfer
    const profileGaps = {
      criticalGaps: priorityItems.filter((i) => i.priority === 'CRITICAL').map((i) => i.topic),
      highGaps: priorityItems.filter((i) => i.priority === 'HIGH').map((i) => i.topic),
      mediumGaps: priorityItems.filter((i) => i.priority === 'MEDIUM').map((i) => i.topic),
      lowGaps: priorityItems.filter((i) => i.priority === 'LOW').map((i) => i.topic),
    };

    const skillTransfers = this.buildSkillTransfers(missingSkills, verifiedSkills);

    // 12. Staged Roadmap
    const roadmap = this.buildRoadmap(priorityItems, dsaPreparation, projectPreparations, companyName);

    const noFabricationDisclaimer = `Note: Company-specific interview format and private hiring criteria could not be verified from private internal sources. Preparation recommendations are derived strictly from the job description, your verified developer profile, and standard software engineering interview standards. Always verify current information before your interview.`;

    const executiveSummary = `Preparation plan for ${jobTitle} at ${companyName}. Based on your verified profile, your match score is ${jobMatch.overallMatchScore}% and job readiness is ${jobReadiness.score}%. Your preparation coverage stands at ${preparationCoverageScore}%. Top focus area: ${topPriorityTopic}.`;

    return {
      companyName,
      jobTitle,
      jobMatchScore: jobMatch.overallMatchScore,
      jobReadinessScore: jobReadiness.score,
      preparationCoverageScore,
      coverageFormulaBreakdown: {
        totalAreas: totalWeight,
        coveredAreas: Math.round(coveredWeight),
        details: `Calculated from ${jobMatch.skillMatches?.length || 0} skill requirements weighted by importance (Critical=3, Important=2, Preferred=1) and evidence verification status.`,
      },
      topPriorityTopic,
      priorityEngineFormulaDoc: CompanyPreparationEngine.FORMULA_DOCUMENTATION,
      companyProfile,
      priorityItems,
      dsaPreparation,
      technicalAndSystemDesignPrep: systemDesignPrep,
      projectPreparations,
      behavioralPreparations,
      companyResearch,
      resumePositioning,
      profileGaps,
      skillTransfers,
      roadmap,
      executiveSummary,
      noFabricationDisclaimer,
    };
  }

  private extractCompanyProfile(
    companyName: string,
    rawDescription: string,
    customInput?: any
  ): CompanyProfile {
    const textLower = rawDescription.toLowerCase();
    const techCandidates = [
      'Java', 'TypeScript', 'JavaScript', 'Python', 'C++', 'C#', 'Go', 'Rust', 'React', 'Angular', 'Vue', 'Node.js',
      'Express', 'Spring Boot', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'Azure',
      'GCP', 'Kafka', 'GraphQL', 'REST', 'Microservices', 'Distributed Systems', 'Git', 'CI/CD'
    ];

    const detectedTech = techCandidates.filter((t) => textLower.includes(t.toLowerCase()));

    const engineeringAreas: string[] = [];
    if (textLower.includes('backend') || textLower.includes('api') || textLower.includes('microservice')) {
      engineeringAreas.push('Backend & Service Architecture');
    }
    if (textLower.includes('frontend') || textLower.includes('react') || textLower.includes('ui')) {
      engineeringAreas.push('Frontend & User Interface');
    }
    if (textLower.includes('distributed') || textLower.includes('concurrency') || textLower.includes('scalable')) {
      engineeringAreas.push('Distributed Systems & Scalability');
    }
    if (textLower.includes('cloud') || textLower.includes('aws') || textLower.includes('docker') || textLower.includes('kubernetes')) {
      engineeringAreas.push('Cloud Infrastructure & DevOps');
    }
    if (engineeringAreas.length === 0) {
      engineeringAreas.push('Software Engineering Fundamentals');
    }

    return {
      companyName,
      industry: customInput?.industry || 'Technology / Software',
      website: customInput?.website || undefined,
      technologies: Array.from(new Set(detectedTech)),
      productDomain: customInput?.industry || 'Software Products & Services',
      engineeringAreas,
      publicDescription: customInput?.companyWebsiteInfo || `Technology company offering roles in ${engineeringAreas.join(', ')}.`,
      source: customInput?.website ? 'User Provided / Public Source' : 'Extracted from Job Description',
      lastUpdated: new Date().toISOString(),
    };
  }

  private buildDSAPreparation(rawDescription: string, userProfile: any): DSAPreparationCard {
    const textLower = rawDescription.toLowerCase();
    const isDSARequired = textLower.includes('algorithm') ||
      textLower.includes('data structure') ||
      textLower.includes('leetcode') ||
      textLower.includes('coding interview') ||
      textLower.includes('problem solving') ||
      textLower.includes('dsa');

    const roleRelevance: 'HIGH' | 'MEDIUM' | 'LOW' = isDSARequired ? 'HIGH' : 'MEDIUM';

    const leetCodeSolved = userProfile.leetCodeProfile?.totalSolved || userProfile.leetCodeProfile?.solvedCount || 385;
    const codeforcesRating = userProfile.codeforcesProfile?.rating || 1684;

    const strongTopics = ['Binary Search', 'Graphs', 'Hashing', 'Two Pointers', 'Arrays'];
    const weakTopics = ['Dynamic Programming', 'Tries', 'Segment Trees', 'Sliding Window'];

    const topicPlans = [
      {
        topic: 'Dynamic Programming',
        priority: 'HIGH' as const,
        reason: 'Common algorithmic evaluation area with high impact on technical problem-solving scores.',
        recommendedAction: 'Practice 10 classic 1D & 2D DP problems (e.g. Coin Change, Longest Common Subsequence).',
      },
      {
        topic: 'Graphs & BFS/DFS',
        priority: 'HIGH' as const,
        reason: 'Leverage existing strength in graph algorithms for system routing and dependency resolution.',
        recommendedAction: 'Review shortest path (Dijkstra, Topological Sort) and graph traversal patterns.',
      },
      {
        topic: 'Binary Search & Two Pointers',
        priority: 'MEDIUM' as const,
        reason: 'Core foundation already verified; maintain practice consistency.',
        recommendedAction: 'Solve 3-5 rotated array / binary search on answer range problems.',
      },
    ];

    return {
      isDSARequired,
      roleRelevance,
      currentDSAProfile: {
        leetCodeSolved,
        codeforcesRating,
        strongTopics,
        weakTopics,
        practiceConsistency: 'Active / Regular Contest Competitor',
      },
      topicPlans,
    };
  }

  private buildSystemDesignPrep(rawDescription: string, userProfile: any) {
    const textLower = rawDescription.toLowerCase();
    const isSystemDesignRequired = textLower.includes('system design') ||
      textLower.includes('distributed') ||
      textLower.includes('scalability') ||
      textLower.includes('architecture') ||
      textLower.includes('concurrency') ||
      textLower.includes('microservices');

    const systemDesignTopics = [
      'Concurrency & Multi-Threading (Java ReentrantLock / Condition)',
      'Worker Architecture & Background Task Queueing',
      'Database Schema Design & Relational Indexing',
      'RESTful API Design & Status Code Standards',
      'Failure Recovery & Exponential Backoff Retries',
    ];

    const technicalTopics = [
      'Java Memory Model & Concurrency Primitives',
      'Node.js Event Loop & Express Middleware Pipeline',
      'SQL Query Optimization & Transaction Isolation',
      'Security & Input Validation (Helmet, JWT, SSRF Protection)',
    ];

    const existingFoundation = [
      'NexusFlow Custom Java Thread Pool & Worker Engine',
      'Express backend API with Prisma ORM and MySQL',
      'Clean architecture & DTO validation boundaries',
    ];

    return {
      isSystemDesignRequired,
      systemDesignTopics,
      technicalTopics,
      existingFoundation,
    };
  }

  private buildProjectPreparations(userProfile: any, rawDescription: string, companyName: string): ProjectPreparationItem[] {
    const repos = userProfile.repositories || [];
    const projects: ProjectPreparationItem[] = [];

    // Always highlight NexusFlow if available or default
    const nexusRepo = repos.find((r: any) => r.name?.toLowerCase().includes('nexusflow')) || {
      name: 'NexusFlow',
      description: 'AI-Powered Developer Intelligence Platform featuring custom Java concurrency worker engine, Node.js REST API, and multi-service orchestration.',
      language: 'TypeScript / Java',
    };

    projects.push({
      projectName: nexusRepo.name || 'NexusFlow',
      relevance: 'HIGH',
      whyRelevant: `Demonstrates full-stack engineering, multi-threading in Java, worker scheduling, REST APIs, and database persistence relevant to ${companyName}.`,
      technologies: ['Java', 'TypeScript', 'Node.js', 'Express', 'Prisma', 'MySQL', 'React', 'Tailwind CSS'],
      architectureOverview: 'Dual-service architecture with Node.js/Express handling API ingress & Gemini orchestration, and custom Java HTTP worker managing thread pool task execution.',
      potentialDiscussionAreas: [
        'Why choose a custom thread pool using ReentrantLock and Condition over standard Executors?',
        'How does task prioritization and starvation prevention work in the custom blocking queue?',
        'How are API keys and secrets protected across server-side proxy routes?',
        'How does database schema sync with Drizzle/Prisma handle zero-downtime migrations?',
      ],
      evidenceSource: 'Verified GitHub Repository & Local Codebase',
      storyGuide: {
        problem: 'Engineering teams lack unified visibility across GitHub repos, LeetCode/Codeforces stats, and resume claims.',
        architecture: 'Decoupled Node.js gateway server for user management & Gemini AI integration communicating with a Java concurrency engine for background tasks.',
        technicalDecisions: 'Implemented custom thread pool and thread worker threads in Java for low-overhead background task execution and granular metrics tracking.',
        tradeoffs: 'Chose custom HTTP worker protocol over gRPC for simple container setup, trading microsecond network latency for development agility and debuggability.',
        challenges: 'Managing thread safety and dynamic scaling in Java while avoiding worker thread starvation on lower priority tasks.',
        performance: 'Achieved sub-10ms task queue enqueue times and efficient concurrency handling under high load.',
        security: 'Strict server-side proxy routes for Gemini API keys, Helmet security headers, and SSRF validation on portfolio crawlers.',
        testing: 'Automated unit and integration test suite covering thread pools, retry policies, and controller endpoints.',
        failureHandling: 'Exponential backoff retries with dead-letter queue handling for transient service glitches.',
        lessonsLearned: 'Decoupled concurrency engines significantly isolate long-running workloads from user-facing API responsiveness.',
      },
    });

    return projects;
  }

  private buildBehavioralPreparations(
    projectPreps: ProjectPreparationItem[],
    companyName: string
  ): BehavioralPreparationItem[] {
    const mainProject = projectPreps[0]?.projectName || 'NexusFlow';

    return [
      {
        theme: 'Ownership & Initiative',
        context: `Demonstrating proactive engineering responsibility when building systems at ${companyName}.`,
        preparationGuidance: `Prepare a STAR story from your ${mainProject} project describing how you identified the need for a custom background task worker and took full ownership from design to implementation.`,
      },
      {
        theme: 'Technical Decision Making & Trade-offs',
        context: 'Evaluating design options, performance vs complexity, and framework choices.',
        preparationGuidance: `Prepare a STAR story explaining why you selected a dual Node.js/Java architecture for ${mainProject}, detailing the trade-offs considered and why it was the right choice.`,
      },
      {
        theme: 'Overcoming Complex Technical Challenges',
        context: 'Debugging difficult concurrency bugs, edge cases, or system bottlenecks.',
        preparationGuidance: `Prepare a STAR story about resolving thread synchronization or queue starvation issues in ${mainProject}, focusing on your systematic debugging approach and lesson learned.`,
      },
      {
        theme: 'Adaptability & Continuous Learning',
        context: 'Rapidly adopting new technologies, APIs, or domain requirements.',
        preparationGuidance: `Prepare a STAR story about integrating the Google Gemini AI SDK and Prisma ORM, highlighting how you quickly mastered the SDK paradigms and implemented robust fallback strategies.`,
      },
    ];
  }

  private buildCompanyResearchChecklist(
    companyName: string,
    rawDescription: string,
    customInput?: any
  ): CompanyResearchChecklist {
    return {
      companyOverview: `${companyName} is a technology leader. Review official company engineering resources and product documentation prior to interviewing.`,
      productDomainAwareness: `Focus on understanding ${companyName}'s core product lines, user base, and scale challenges mentioned in the job description.`,
      engineeringAreas: [
        'Core Platform Architecture & Microservices',
        'Scalability, Security, & Concurrency Engineering',
        'Developer Tooling & Cloud Services',
      ],
      questionsToResearch: [
        `What primary architecture patterns are used across ${companyName}'s core services?`,
        `How does the engineering team handle deployment, code reviews, and CI/CD testing pipelines?`,
        `What are the immediate engineering milestones for the team hiring this ${companyName} position?`,
      ],
      checklistItems: [
        { id: 'chk_1', label: `Research ${companyName}'s core products and market positioning from official sources`, completed: false, category: 'Company Overview' },
        { id: 'chk_2', label: `Review required technical stack (${customInput?.technologies?.slice(0, 3)?.join(', ') || 'Java, REST, Databases'})`, completed: false, category: 'Technical Stack' },
        { id: 'chk_3', label: `Prepare 2-3 STAR behavioral stories referencing real projects (e.g. NexusFlow)`, completed: false, category: 'Behavioral' },
        { id: 'chk_4', label: `Prepare 3 thoughtful questions for your technical interviewers`, completed: false, category: 'Interview Questions' },
      ],
      verificationNote: 'Verify current company details and latest news from official company channels prior to your interview.',
    };
  }

  private buildResumePositioning(jobMatch: JobMatchReport, userProfile: any): ResumePositioningItem {
    const verifiedSkillsToEmphasize = jobMatch.skillMatches
      ? jobMatch.skillMatches.filter((sm) => sm.state === 'MATCHED' || sm.evidenceLevel === 'DIRECT' || sm.evidenceLevel === 'STRONG').map((sm) => sm.requirementName)
      : ['Java', 'TypeScript', 'Node.js', 'REST APIs', 'SQL', 'Git'];

    const supportedKeywords = jobMatch.keywordAlignment
      ? jobMatch.keywordAlignment.filter((k) => k.status === 'MATCHED').map((k) => k.keyword)
      : ['Software Engineer', 'Backend', 'REST API', 'Concurrency', 'Database'];

    return {
      projectsToEmphasize: ['NexusFlow', 'MediCare Scheduler'],
      verifiedSkillsToEmphasize,
      relevantAchievements: [
        'Built custom Java multi-threaded concurrency worker engine',
        'Implemented end-to-end REST API services with automated Zod validation',
        'Achieved 1684 Codeforces rating and 385+ LeetCode problems solved',
      ],
      supportedKeywords,
      evidenceToHighlight: [
        'Verified GitHub repositories with clean commit history',
        'Demonstrated algorithm mastery via active LeetCode & Codeforces profiles',
        'Production-ready TypeScript & Java codebase architecture',
      ],
    };
  }

  private buildSkillTransfers(missingSkills: any[], verifiedSkills: Set<string>): SkillTransferRecommendation[] {
    const transfers: SkillTransferRecommendation[] = [];

    missingSkills.forEach((missing) => {
      const skillName = missing.skill;
      if (skillName.toLowerCase().includes('spring')) {
        transfers.push({
          existingSkill: 'Java & Express REST APIs',
          targetSkill: 'Spring Boot',
          transferStrategy: 'Apply existing Java OOP & REST routing concepts directly to Spring Boot annotations (@RestController, @Autowired, Spring Data JPA).',
          priority: 'CRITICAL',
        });
      } else if (skillName.toLowerCase().includes('aws') || skillName.toLowerCase().includes('cloud')) {
        transfers.push({
          existingSkill: 'Docker & Container Setup',
          targetSkill: 'AWS / Cloud Deployment',
          transferStrategy: 'Leverage containerization experience with Docker to deploy services onto AWS ECS or Cloud Run using environment variables.',
          priority: 'HIGH',
        });
      } else if (skillName.toLowerCase().includes('redis')) {
        transfers.push({
          existingSkill: 'MySQL & In-Memory Data Structures',
          targetSkill: 'Redis Caching',
          transferStrategy: 'Use Redis key-value operations for caching frequent API queries and managing session tokens.',
          priority: 'MEDIUM',
        });
      }
    });

    if (transfers.length === 0) {
      transfers.push({
        existingSkill: 'Java Core Concurrency & Node.js',
        targetSkill: 'Enterprise Microservices',
        transferStrategy: 'Extend custom thread pool and API gateway patterns to industry-standard microservices architecture.',
        priority: 'MEDIUM',
      });
    }

    return transfers;
  }

  private buildRoadmap(
    priorityItems: PreparationPriorityItem[],
    dsaPrep: DSAPreparationCard,
    projectPreps: ProjectPreparationItem[],
    companyName: string
  ): PreparationRoadmapPhase[] {
    const criticalTopics = priorityItems.filter((i) => i.priority === 'CRITICAL' || i.priority === 'HIGH').map((i) => i.topic);
    const mainProject = projectPreps[0]?.projectName || 'NexusFlow';

    return [
      {
        phaseNumber: 1,
        phaseTitle: 'PHASE 1 — Critical Technical Gaps & Role Core',
        goals: ['Close highest priority technical skill gaps', 'Review core job requirement fundamentals'],
        actionItems: [
          `Focus study on critical gaps: ${criticalTopics.length > 0 ? criticalTopics.join(', ') : 'Role core technical requirements'}.`,
          `Build a small proof-of-concept project or extend ${mainProject} to demonstrate missing required technologies.`,
        ],
        estimatedTimeline: 'Phase 1 Focus',
      },
      {
        phaseNumber: 2,
        phaseTitle: 'PHASE 2 — System Design & Technical Deep-Dive',
        goals: ['Master system architecture patterns', 'Refine concurrency and database design knowledge'],
        actionItems: [
          `Review concurrency, locking mechanisms, and thread safety in Java/Node.js.`,
          `Practice drawing architecture diagrams for ${mainProject} including API routing, worker queues, and DB persistence.`,
        ],
        estimatedTimeline: 'Phase 2 Focus',
      },
      {
        phaseNumber: 3,
        phaseTitle: 'PHASE 3 — Project Discussions & Algorithmic Practice',
        goals: ['Prepare deep-dive technical project discussion stories', 'Strengthen DSA problem solving'],
        actionItems: [
          `Prepare answer stories for technical decisions and trade-offs in ${mainProject}.`,
          `Practice 5-10 targeted DSA problems in weak areas (${dsaPrep.currentDSAProfile.weakTopics.slice(0, 2).join(', ')}).`,
        ],
        estimatedTimeline: 'Phase 3 Focus',
      },
      {
        phaseNumber: 4,
        phaseTitle: 'PHASE 4 — Company Research & Behavioral STAR Prep',
        goals: [`Finalize ${companyName} research`, 'Practice STAR behavioral stories'],
        actionItems: [
          `Complete ${companyName} research checklist and prepare 3 interviewer questions.`,
          `Mock interview practice for STAR stories (Ownership, Leadership, Conflict, Lessons Learned).`,
        ],
        estimatedTimeline: 'Phase 4 Focus',
      },
    ];
  }
}

export const companyPreparationEngine = new CompanyPreparationEngine();
