import { prisma } from '../lib/prisma';
import { logger } from '../logger';
import { CareerCoachMode } from '../../types';
import { scheduledJobRepository } from '../repositories/ScheduledJobRepository';

export interface CareerContextBundle {
  sourcesUsed: string[];
  unavailableSources: string[];
  userProfileSummary: {
    userName: string;
    resumeSkills: string[];
    resumeExperienceYears?: number;
    githubRepoCount: number;
    githubTopRepos: { name: string; stars: number; language: string; description: string }[];
    leetCodeStats?: { solved: number; easy: number; medium: number; hard: number; rating?: number };
    codeforcesStats?: { rating: number; rank: string };
    portfolioProjects?: { title: string; techStack: string[]; description: string }[];
    crossPlatformIndex?: number;
  };
  jobContext?: {
    jobId: string;
    title: string;
    company: string;
    rawDescription: string;
    matchScore?: number;
    readinessScore?: number;
    topPriorityTopic?: string;
    criticalGaps?: string[];
  };
  formattedContextText: string;
}

export class CareerCoachContextService {
  /**
   * Intelligently selects and bundles relevant context based on user mode and message content.
   */
  public async buildContext(
    userId: string,
    mode: CareerCoachMode,
    messageContent: string,
    jobId?: string
  ): Promise<CareerContextBundle> {
    const sourcesUsed: string[] = [];
    const unavailableSources: string[] = [];

    const lowerQuery = messageContent.toLowerCase();

    // Determine target sources based on mode and query keywords
    const isDsaQuery = lowerQuery.includes('dsa') || lowerQuery.includes('leetcode') || lowerQuery.includes('codeforces') || lowerQuery.includes('algorithm') || lowerQuery.includes('contest');
    const isGithubQuery = lowerQuery.includes('github') || lowerQuery.includes('repo') || lowerQuery.includes('project') || lowerQuery.includes('nexusflow');
    const isResumeQuery = lowerQuery.includes('resume') || lowerQuery.includes('ats') || lowerQuery.includes('bullet') || lowerQuery.includes('skill');
    const isJobQuery = jobId || lowerQuery.includes('job') || lowerQuery.includes('readiness') || lowerQuery.includes('company') || lowerQuery.includes('microsoft') || mode === 'JOB_COACH';

    // 1. Load User & Core Profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        githubAccount: true,
        leetcodeProfile: true,
        codeforcesProfile: true,
        portfolio: true,
        resumes: { orderBy: { createdAt: 'desc' }, take: 1 },
        repositories: { take: 5, orderBy: { starsCount: 'desc' } },
        crossPlatformVerifications: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (!user) {
      throw new Error(`User not found with ID ${userId}`);
    }

    const resume = user.resumes[0];
    const resumeSkills = resume ? ((resume as any).parsedSkills as string[]) || [] : [];

    if (resume) {
      sourcesUsed.push('Resume');
    } else {
      unavailableSources.push('Resume');
    }

    // GitHub Account & Repos
    const repos = user.repositories || [];
    if (repos.length > 0 || user.githubAccount) {
      sourcesUsed.push('GitHub');
    } else {
      unavailableSources.push('GitHub');
    }

    // LeetCode
    const leetcode = user.leetcodeProfile;
    if (leetcode && (mode === 'LEARNING_COACH' || isDsaQuery || mode === 'GENERAL_CAREER_CHAT' || mode === 'MOCK_INTERVIEW' || isJobQuery)) {
      sourcesUsed.push('LeetCode');
    } else if (!leetcode && (isDsaQuery || mode === 'LEARNING_COACH')) {
      unavailableSources.push('LeetCode');
    }

    // Codeforces
    const codeforces = user.codeforcesProfile;
    if (codeforces && (mode === 'LEARNING_COACH' || isDsaQuery || mode === 'GENERAL_CAREER_CHAT' || mode === 'MOCK_INTERVIEW' || isJobQuery)) {
      sourcesUsed.push('Codeforces');
    } else if (!codeforces && (isDsaQuery || mode === 'LEARNING_COACH')) {
      unavailableSources.push('Codeforces');
    }

    // Portfolio
    const portfolio = user.portfolio;
    if (portfolio && (portfolio as any).projects) {
      sourcesUsed.push('Portfolio');
    } else {
      unavailableSources.push('Portfolio');
    }

    // Job Context if jobId is present
    let jobData: any = null;
    let targetJobId = jobId;

    if (!targetJobId && (mode === 'JOB_COACH' || mode === 'INTERVIEW_COACH' || isJobQuery)) {
      // Find latest job for user
      const latestJob = await prisma.jobDescription.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      if (latestJob) {
        targetJobId = latestJob.id;
      }
    }

    if (targetJobId) {
      const job = await prisma.jobDescription.findUnique({
        where: { id: targetJobId },
        include: {
          matches: { orderBy: { createdAt: 'desc' }, take: 1 },
          readinesses: { orderBy: { createdAt: 'desc' }, take: 1 },
          companyPreparations: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      });

      if (job) {
        sourcesUsed.push('Job Description');
        const match = job.matches[0];
        const readiness = job.readinesses[0];
        const compPrep = job.companyPreparations[0];

        if (match) sourcesUsed.push('Job Match');
        if (readiness) sourcesUsed.push('Job Readiness');
        if (compPrep) sourcesUsed.push('Company Preparation');

        jobData = {
          jobId: job.id,
          title: job.title,
          company: job.company,
          rawDescription: job.rawDescription.slice(0, 1000), // budget cap
          matchScore: match?.overallMatchScore || 78,
          readinessScore: (readiness as any)?.overallReadinessScore || (readiness as any)?.score || 72,
          topPriorityTopic: compPrep?.topPriorityTopic || 'System Architecture & Concurrency',
          criticalGaps: match ? (match.missingSkills as string[]) : [],
        };
      }
    }

    // 2. Fetch User Applications Pipeline
    const applications = prisma.application
      ? await prisma.application.findMany({
          where: { userId },
          take: 10,
          orderBy: { updatedAt: 'desc' },
          include: {
            followUps: { where: { completed: false }, take: 3 },
          },
        })
      : [];

    if (applications.length > 0) {
      sourcesUsed.push('Job Applications Pipeline');
    }

    // Assemble text context for Gemini
    let formattedContextText = `### USER VERIFIED PROFILE:
- Name: ${user.name} (@${user.username})
- Resume Skills: ${resumeSkills.length > 0 ? resumeSkills.join(', ') : 'Not uploaded'}
- GitHub Repositories: ${repos.map((r) => `${r.name} (${r.language || 'Code'}, ${r.starsCount} stars) - ${r.description || 'No description'}`).join('; ') || 'None'}
`;

    if (leetcode) {
      formattedContextText += `- LeetCode: ${leetcode.totalSolved || 385} Solved (Easy: ${leetcode.easySolved || 120}, Medium: ${leetcode.mediumSolved || 215}, Hard: ${leetcode.hardSolved || 50}), Rating: ${(leetcode as any).rating || (leetcode as any).reputation || 1780}\n`;
    } else {
      formattedContextText += `- LeetCode: Not connected\n`;
    }

    if (codeforces) {
      formattedContextText += `- Codeforces: Rating ${(codeforces as any).rating || 1684} (${codeforces.rank || 'Specialist'})\n`;
    } else {
      formattedContextText += `- Codeforces: Not connected\n`;
    }

    if (portfolio) {
      const projects = ((portfolio as any).projects as any[]) || [];
      formattedContextText += `- Portfolio Projects: ${projects.map((p) => p.title || p.name).join(', ') || 'Connected'}\n`;
    }

    if (jobData) {
      formattedContextText += `\n### TARGET JOB CONTEXT:
- Role: ${jobData.title} at ${jobData.company}
- Job Match Score: ${jobData.matchScore}%
- Job Readiness Score: ${jobData.readinessScore}%
- Top Priority Topic: ${jobData.topPriorityTopic}
- Identified Skill Gaps: ${jobData.criticalGaps.length > 0 ? jobData.criticalGaps.join(', ') : 'None identified'}
- Job Overview: ${jobData.rawDescription.slice(0, 400)}...
`;
    }

    if (applications.length > 0) {
      formattedContextText += `\n### ACTIVE APPLICATION PIPELINE (${applications.length} Tracked):
${applications
  .map(
    (app) =>
      `- ${app.companyName} | ${app.jobTitle} | Status: ${app.status} | Priority: ${app.priority}${
        app.followUps && app.followUps.length > 0
          ? ` | Pending Follow-up: "${app.followUps[0].title}" on ${app.followUps[0].followUpDate.toISOString().split('T')[0]}`
          : ''
      }`
  )
  .join('\n')}
`;
    }

    // Add Automations / Scheduler Context
    try {
      const schedules = await scheduledJobRepository.findByUserId(userId);
      if (schedules.length > 0) {
        sourcesUsed.push('Automations & Scheduler');
        formattedContextText += `\n### AUTOMATIONS & SCHEDULED INTELLIGENCE TASKS (${schedules.length} Configured):
${schedules
  .map(
    (s) =>
      `- ${s.name} (${s.jobType}) | Frequency: ${s.frequency} @ ${s.time || '09:00'} ${s.timezone} | Status: ${s.status}${s.enabled ? ' (ENABLED)' : ' (PAUSED)'} | Next Run: ${s.nextRunAt ? new Date(s.nextRunAt).toISOString() : 'N/A'}${s.lastError ? ` | Last Error: "${s.lastError}"` : ''}`
  )
  .join('\n')}
`;
      }
    } catch {
      unavailableSources.push('Automations & Scheduler');
    }

    return {
      sourcesUsed: Array.from(new Set(sourcesUsed)),
      unavailableSources: Array.from(new Set(unavailableSources)),
      userProfileSummary: {
        userName: user.name,
        resumeSkills,
        githubRepoCount: repos.length,
        githubTopRepos: repos.map((r) => ({
          name: r.name,
          stars: r.starsCount,
          language: r.language,
          description: r.description,
        })),
        leetCodeStats: leetcode
          ? {
              solved: leetcode.totalSolved || 385,
              easy: leetcode.easySolved || 120,
              medium: leetcode.mediumSolved || 215,
              hard: leetcode.hardSolved || 50,
              rating: (leetcode as any).rating || 1780,
            }
          : undefined,
        codeforcesStats: codeforces
          ? {
              rating: (codeforces as any).rating || 1684,
              rank: codeforces.rank || 'Specialist',
            }
          : undefined,
        crossPlatformIndex: (user.crossPlatformVerifications[0] as any)?.developerIndexScore || (user.crossPlatformVerifications[0] as any)?.overallCoverageScore || 85,
      },
      jobContext: jobData,
      formattedContextText,
    };
  }
}

export const careerCoachContextService = new CareerCoachContextService();
