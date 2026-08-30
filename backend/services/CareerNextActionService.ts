export interface NextActionItem {
  action: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
  source: string;
  link: string;
}

export interface NextActionContext {
  applications?: any[];
  jobReadinesses?: any[];
  resumes?: any[];
  portfolios?: any[];
  leetCode?: any;
  codeforces?: any;
  freshnessMap?: Record<string, 'FRESH' | 'STALE' | 'UNAVAILABLE'>;
}

export class CareerNextActionService {
  /**
   * Deterministically evaluates the user's data context and returns ranked next best actions.
   */
  public evaluateNextActions(ctx: NextActionContext): NextActionItem[] {
    const actions: NextActionItem[] = [];

    // Rule 1: Upcoming interview
    const upcomingInterviewApp = ctx.applications?.find((app) => {
      if (app.status === 'INTERVIEW' || app.status === 'OFFER') return true;
      const interviewEvent = app.events?.find(
        (e: any) =>
          e.type === 'INTERVIEW_SCHEDULED' ||
          e.title?.toLowerCase().includes('interview')
      );
      return Boolean(interviewEvent);
    });

    if (upcomingInterviewApp) {
      actions.push({
        action: `Prepare for upcoming technical interview at ${upcomingInterviewApp.companyName}.`,
        priority: 'CRITICAL',
        reason: `You have an active or upcoming interview scheduled for ${upcomingInterviewApp.jobTitle} at ${upcomingInterviewApp.companyName}.`,
        source: 'APPLICATION_TRACKER',
        link: `/applications`,
      });
    }

    // Rule 2: Overdue follow-up
    const overdueFollowUpApp = ctx.applications?.find((app) => {
      const pendingFollowUp = app.followUps?.find(
        (f: any) => !f.completed && new Date(f.followUpDate).getTime() < Date.now()
      );
      return Boolean(pendingFollowUp);
    });

    if (overdueFollowUpApp) {
      actions.push({
        action: `Complete overdue follow-up for ${overdueFollowUpApp.companyName}.`,
        priority: 'HIGH',
        reason: `A follow-up task for your application to ${overdueFollowUpApp.companyName} is past its due date.`,
        source: 'APPLICATION_TRACKER',
        link: `/applications`,
      });
    }

    // Rule 3: Critical job-readiness gap
    const criticalReadiness = ctx.jobReadinesses?.find(
      (jr) =>
        jr.level === 'DEVELOPING' ||
        (Array.isArray(jr.criticalGaps) && jr.criticalGaps.length > 0)
    );

    if (criticalReadiness) {
      const topGap = Array.isArray(criticalReadiness.criticalGaps) && criticalReadiness.criticalGaps[0]
        ? criticalReadiness.criticalGaps[0]
        : 'key job requirements';
      actions.push({
        action: `Address critical job readiness gap: ${topGap}.`,
        priority: 'HIGH',
        reason: `Target job readiness is currently in DEVELOPING status with critical skill gaps.`,
        source: 'JOB_READINESS',
        link: `/jobs`,
      });
    }

    // Rule 4: Stale critical data
    if (ctx.freshnessMap) {
      const staleSources = Object.entries(ctx.freshnessMap)
        .filter(([_, status]) => status === 'STALE')
        .map(([src]) => src);

      if (staleSources.length > 0) {
        actions.push({
          action: `Sync stale data sources (${staleSources.join(', ')}).`,
          priority: 'MEDIUM',
          reason: `Some of your profile integrations have not been refreshed in over 7 days.`,
          source: 'DATA_FRESHNESS',
          link: `/dashboard`,
        });
      }
    }

    // Rule 5: Important resume issue
    const mainResume = ctx.resumes?.[0];
    if (mainResume && (mainResume.atsScore < 75 || !mainResume.fileUrl)) {
      actions.push({
        action: `Optimize resume ATS formatting and keywords.`,
        priority: 'MEDIUM',
        reason: `Current resume ATS score is ${mainResume.atsScore || 0}/100, which is below the target 85+ threshold.`,
        source: 'RESUME_INTELLIGENCE',
        link: `/resume`,
      });
    }

    // Rule 6: Portfolio issue
    const mainPortfolio = ctx.portfolios?.[0];
    if (mainPortfolio && (mainPortfolio.qualityScore < 70 || mainPortfolio.crawlStatus === 'FAILED')) {
      actions.push({
        action: `Improve portfolio site presentation and accessibility.`,
        priority: 'MEDIUM',
        reason: `Portfolio quality score is ${mainPortfolio.qualityScore || 0}/100. Check for broken links or SEO metadata.`,
        source: 'PORTFOLIO_INTELLIGENCE',
        link: `/portfolio`,
      });
    }

    // Rule 7: DSA weakness
    const lc = ctx.leetCode;
    const cf = ctx.codeforces;
    if (lc || cf) {
      const weakTopics = [
        ...(Array.isArray(lc?.topicStats) ? lc.topicStats.filter((t: any) => t.strengthLevel === 'WEAK').map((t: any) => t.topicName) : []),
        ...(Array.isArray(cf?.tagStats) ? cf.tagStats.filter((t: any) => t.strengthLevel === 'WEAK').map((t: any) => t.tagName) : []),
      ];

      if (weakTopics.length > 0) {
        actions.push({
          action: `Practice weak DSA topics: ${weakTopics.slice(0, 2).join(', ')}.`,
          priority: 'LOW',
          reason: `Identified performance gaps in ${weakTopics.join(', ')} across coding platforms.`,
          source: 'DSA_ANALYTICS',
          link: `/leetcode`,
        });
      }
    }

    // Rule 8: General improvement (Fallback)
    if (actions.length === 0) {
      actions.push({
        action: `Target new high-match positions and update your project portfolio.`,
        priority: 'LOW',
        reason: `All core metrics are strong and up-to-date. Keep building proof of work!`,
        source: 'CAREER_COACH',
        link: `/jobs`,
      });
    }

    return actions;
  }
}

export const careerNextActionService = new CareerNextActionService();
