import { careerReportRepository, CareerReportRepository } from '../repositories/CareerReportRepository';
import { unifiedCareerDashboardService, UnifiedCareerDashboardService } from './UnifiedCareerDashboardService';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import { logger } from '../logger';

export interface GenerateReportRequest {
  userId: string;
  type: string; // PROFILE, RESUME, GITHUB, PORTFOLIO, LEETCODE, CODEFORCES, JOB, READINESS, VERIFICATION, COMPANY_PREPARATION, CAREER
  title?: string;
}

export class CareerReportService {
  constructor(
    private repository: CareerReportRepository = careerReportRepository,
    private dashboardService: UnifiedCareerDashboardService = unifiedCareerDashboardService
  ) {}

  /**
   * Generates a new unified report of the specified type for a given user
   */
  async generateReport(req: GenerateReportRequest) {
    const overview = await this.dashboardService.getOverview(req.userId);

    let title = req.title || `${req.type} Intelligence Report`;
    let summary = '';
    let scores: any = {};
    let strengths: string[] = [];
    let gaps: string[] = [];
    let recommendations: string[] = [];
    let evidence: string[] = [];
    let sourcesUsed: string[] = [];

    switch (req.type.toUpperCase()) {
      case 'PROFILE':
      case 'CAREER':
        title = req.title || 'Unified Developer Career Report';
        summary = overview.aiCareerSummary?.summary || 'Aggregated developer profile report across all connected intelligence modules.';
        scores = overview.scorecard;
        strengths = overview.topStrengths.map((s) => `${s.strength} (Evidence: ${s.evidence.join(', ')})`);
        gaps = overview.topGaps.map((g) => `${g.gap}: ${g.whyItMatters}`);
        recommendations = overview.aiCareerSummary?.recommendations || [overview.nextBestAction.action];
        sourcesUsed = ['GitHub', 'LeetCode', 'Codeforces', 'Resume', 'Portfolio', 'Job Intelligence'];
        break;

      case 'RESUME':
        title = req.title || 'Resume Intelligence & ATS Audit Report';
        summary = `ATS Score: ${overview.resumeHealth.atsScore}/100. ${overview.resumeHealth.verification.summary}`;
        scores = {
          atsScore: overview.resumeHealth.atsScore,
          formatting: overview.resumeHealth.formattingScore,
          contentImpact: overview.resumeHealth.contentImpactScore,
          skillsMatch: overview.resumeHealth.skillsMatchScore,
        };
        strengths = ['ATS Formatting Compliance', 'Core Keywords Alignment'];
        gaps = overview.resumeHealth.topImprovements;
        recommendations = overview.resumeHealth.topImprovements;
        sourcesUsed = ['Resume', 'GitHub Verification'];
        break;

      case 'GITHUB':
        title = req.title || 'GitHub & Code Quality Report';
        summary = `Connected Repositories: ${overview.githubHealth.connectedReposCount}, Avg Health: ${overview.githubHealth.averageHealthScore}/100.`;
        scores = {
          averageHealthScore: overview.githubHealth.averageHealthScore,
          connectedReposCount: overview.githubHealth.connectedReposCount,
          activeReposCount: overview.githubHealth.activeReposCount,
        };
        strengths = overview.githubHealth.topLanguages.map((l) => `Active proficiency in ${l}`);
        gaps = ['Ensure commit activity is spread consistently across major projects'];
        recommendations = ['Keep README documentation up to date on top repositories'];
        sourcesUsed = ['GitHub OAuth API'];
        break;

      case 'PORTFOLIO':
        title = req.title || 'Portfolio Intelligence & UX Audit';
        summary = `Quality Score: ${overview.portfolioHealth.qualityScore}/100. Recruiter Readiness: ${overview.portfolioHealth.recruiterReadinessScore}/100.`;
        scores = {
          qualityScore: overview.portfolioHealth.qualityScore,
          seoScore: overview.portfolioHealth.seoScore,
          accessibilityScore: overview.portfolioHealth.accessibilityScore,
          recruiterReadinessScore: overview.portfolioHealth.recruiterReadinessScore,
        };
        strengths = ['Clear Navigation', 'Modern Design Aesthetic'];
        gaps = overview.portfolioHealth.detectedIssues;
        recommendations = overview.portfolioHealth.detectedIssues.map((issue) => `Fix: ${issue}`);
        sourcesUsed = ['Portfolio Web Crawler', 'UX Analysis Engine'];
        break;

      case 'LEETCODE':
      case 'CODEFORCES':
        title = req.title || `${req.type} Competitive Programming Report`;
        const isLeetCode = req.type.toUpperCase() === 'LEETCODE';
        const dsaData: any = isLeetCode ? overview.dsaSummary.leetcode : overview.dsaSummary.codeforces;
        summary = dsaData
          ? `Score: ${isLeetCode ? dsaData.dsaScore : dsaData.cpScore}/100.`
          : 'Competitive programming account not yet connected.';
        scores = dsaData || {};
        strengths = isLeetCode ? (dsaData?.strongTopics || []) : (dsaData?.strongTags || []);
        gaps = isLeetCode ? (dsaData?.weakTopics || []) : (dsaData?.weakTags || []);
        recommendations = gaps.map((g) => `Practice 3 medium level problems on topic: ${g}`);
        sourcesUsed = [req.type.toUpperCase()];
        break;

      case 'JOB':
      case 'READINESS':
      case 'COMPANY_PREPARATION':
        title = req.title || `${req.type} & Job Alignment Report`;
        const job = overview.jobOverview.selectedJobReadiness;
        summary = job
          ? `Readiness Score: ${job.readinessScore}/100 for ${job.title} at ${job.company}. Level: ${job.level}`
          : 'No target job selected for readiness analysis.';
        scores = job || {};
        strengths = job?.companyPrepTopics || [];
        gaps = job?.criticalGaps || [];
        recommendations = job?.criticalGaps.map((g) => `Address critical gap: ${g}`) || [];
        sourcesUsed = ['Job Description Parser', 'Readiness Engine', 'Company Prep Engine'];
        break;

      case 'VERIFICATION':
        title = req.title || 'Cross-Platform Developer Verification Report';
        summary = overview.resumeHealth.verification.summary;
        scores = {
          verifiedClaims: overview.resumeHealth.verification.verifiedClaims,
          partiallySupported: overview.resumeHealth.verification.partiallySupported,
          notFound: overview.resumeHealth.verification.notFound,
          unverifiable: overview.resumeHealth.verification.unverifiable,
        };
        strengths = ['Public GitHub commits match resume project claims'];
        gaps = overview.discrepancySummary.discrepancies.map((d) => d.description);
        recommendations = ['Link missing repositories to unverified resume claims'];
        sourcesUsed = ['Resume', 'GitHub Commits', 'Portfolio Crawl'];
        break;

      default:
        title = req.title || 'General Career Report';
        summary = 'Overview of current developer intelligence metrics.';
        scores = overview.scorecard;
        strengths = overview.topStrengths.map((s) => s.strength);
        gaps = overview.topGaps.map((g) => g.gap);
        recommendations = [overview.nextBestAction.action];
        sourcesUsed = ['NexusFlow Platform'];
        break;
    }

    return await this.repository.create({
      userId: req.userId,
      title,
      type: req.type.toUpperCase(),
      summary,
      scores,
      strengths,
      gaps,
      recommendations,
      evidence,
      sourcesUsed,
      freshnessStatus: 'FRESH',
    });
  }

  /**
   * Retrieves a report by ID with IDOR protection (must belong to userId)
   */
  async getReportById(reportId: string, currentUserId: string) {
    const report = await this.repository.findById(reportId);
    if (!report) {
      throw new NotFoundError(`Career Report with ID ${reportId} not found`);
    }

    // IDOR Enforcement
    if (report.userId !== currentUserId) {
      logger.auth.warn(`IDOR violation attempt: User ${currentUserId} requested Report ${reportId} owned by ${report.userId}`);
      throw new ForbiddenError('You do not have permission to view this report.');
    }

    return report;
  }

  /**
   * Lists reports for current authenticated user with IDOR safety
   */
  async getUserReports(userId: string, type?: string) {
    return await this.repository.findByUserId(userId, type);
  }

  /**
   * Refreshes an existing report with updated metrics
   */
  async refreshReport(reportId: string, currentUserId: string) {
    const existing = await this.getReportById(reportId, currentUserId);
    const updatedOverview = await this.dashboardService.getOverview(currentUserId);

    return await this.repository.update(reportId, {
      summary: updatedOverview.aiCareerSummary?.summary || existing.summary,
      scores: updatedOverview.scorecard,
      strengths: updatedOverview.topStrengths.map((s) => s.strength),
      gaps: updatedOverview.topGaps.map((g) => g.gap),
      recommendations: updatedOverview.aiCareerSummary?.recommendations || [updatedOverview.nextBestAction.action],
      freshnessStatus: 'FRESH',
    });
  }

  /**
   * Generates a print-friendly HTML export string for a report
   */
  generatePrintHtml(report: any) {
    const scoresHtml = report.scores
      ? Object.entries(report.scores)
          .map(([k, v]: [string, any]) => {
            const scoreVal = typeof v === 'object' ? v?.score ?? JSON.stringify(v) : v;
            return `<div class="score-card"><div class="score-label">${k}</div><div class="score-value">${scoreVal ?? 'N/A'}</div></div>`;
          })
          .join('')
      : '';

    const strengthsHtml = Array.isArray(report.strengths)
      ? report.strengths.map((s: string) => `<li>✓ ${s}</li>`).join('')
      : '';

    const gapsHtml = Array.isArray(report.gaps)
      ? report.gaps.map((g: string) => `<li>⚠ ${g}</li>`).join('')
      : '';

    const recsHtml = Array.isArray(report.recommendations)
      ? report.recommendations.map((r: string) => `<li>→ ${r}</li>`).join('')
      : '';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${report.title} - NexusFlow Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.6; }
    .header { border-b: 2px solid #3b82f6; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
    .title { font-size: 24px; font-weight: bold; color: #0f172a; margin: 0; }
    .badge { background: #e0f2fe; color: #0369a1; padding: 4px 12px; rounded: 12px; font-weight: bold; font-size: 12px; text-transform: uppercase; }
    .summary-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px; font-size: 14px; }
    .scores-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
    .score-card { background: #f1f5f9; padding: 12px; border-radius: 6px; text-align: center; }
    .score-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; }
    .score-value { font-size: 18px; font-weight: bold; color: #1e293b; margin-top: 4px; }
    .section-title { font-size: 16px; font-weight: bold; margin-top: 24px; margin-bottom: 8px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    ul { padding-left: 20px; font-size: 13px; }
    li { margin-bottom: 6px; }
    .footer { margin-top: 40px; font-size: 11px; color: #94a3b8; text-align: center; border-t: 1px solid #f1f5f9; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">${report.title}</h1>
      <p style="margin:4px 0 0 0; font-size:12px; color:#64748b;">Generated on ${new Date(report.createdAt).toLocaleDateString()} | NexusFlow Developer Intelligence</p>
    </div>
    <span class="badge">${report.type}</span>
  </div>

  <div class="summary-box">
    <strong>Executive Summary:</strong><br/>
    ${report.summary}
  </div>

  ${scoresHtml ? `<div class="section-title">Key Scores & Metrics</div><div class="scores-grid">${scoresHtml}</div>` : ''}

  ${strengthsHtml ? `<div class="section-title">Verified Strengths</div><ul>${strengthsHtml}</ul>` : ''}

  ${gapsHtml ? `<div class="section-title">Identified Gaps</div><ul>${gapsHtml}</ul>` : ''}

  ${recsHtml ? `<div class="section-title">Recommended Actions</div><ul>${recsHtml}</ul>` : ''}

  <div class="footer">
    This document was generated automatically by NexusFlow Developer Intelligence Engine. ID: ${report.id}
  </div>

  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>
    `;
  }
}

export const careerReportService = new CareerReportService();
