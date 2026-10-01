import { GoogleGenAI } from '@google/genai';
import { aiConfig } from '../config/aiConfig';
import { PortfolioDeterministicMetrics } from '../../types';
import { PortfolioAiReportSchema, PortfolioAiReportOutput } from '../validations/portfolioAiValidation';
import { runGeminiWithRetryAndFallback, createGeminiClient } from '../utils/geminiRunner';

export class PortfolioAiService {
  private getClient(): GoogleGenAI | null {
    return createGeminiClient();
  }

  public async generateAnalysisReport(
    domain: string,
    metrics: PortfolioDeterministicMetrics
  ): Promise<PortfolioAiReportOutput> {
    const ai = this.getClient();
    if (!ai) {
      return this.generateFallbackReport(domain, metrics);
    }

    const prompt = `You are a Senior Tech Recruiter and Web Engineering Advisor.
Analyze the following portfolio metrics for domain "${domain}" based strictly on these deterministic signals:

- Portfolio Quality Score: ${metrics.portfolioQualityScore}/100
- Recruiter Readiness Score: ${metrics.recruiterReadinessScore}/100
- Project Presentation Score: ${metrics.projectPresentationScore}/100
- Navigation Score: ${metrics.navigationScore}/100
- SEO Score: ${metrics.seoScore}/100
- Accessibility Score: ${metrics.accessibilityScore}/100
- Total Crawled Pages: ${metrics.pageCount}
- Detected Projects: ${metrics.projectCount}
- GitHub Repositories Linked: ${metrics.githubLinkCount}
- Live Demo Links: ${metrics.liveDemoCount}
- Resume Available: ${metrics.hasResumeLink ? 'Yes' : 'No'}
- Contact Information Available: ${metrics.hasContactInfo ? 'Yes' : 'No'}
- Broken Links Detected: ${metrics.brokenLinkCount}
- Detected Technologies: ${metrics.detectedTechnologies.join(', ') || 'None'}
- System Signals: ${metrics.recommendationSignals.join('; ') || 'None'}

Provide a JSON object adhering strictly to this schema:
{
  "summary": "High-level recruiter summary of the portfolio's developer branding and technical impact",
  "strengths": ["Key strengths of the portfolio"],
  "weaknesses": ["Key areas lacking impact or clarity"],
  "recruiterPerspective": "How a hiring manager or recruiter evaluates this portfolio in 10 seconds",
  "seoRecommendations": ["Actionable steps to improve SEO"],
  "accessibilityRecommendations": ["Actionable steps to improve accessibility"],
  "designContentRecommendations": ["Actionable steps to improve layout and project descriptions"],
  "improvementRoadmap": [
    { "phase": "Immediate Fixes", "focus": "Critical recruiter friction", "milestones": ["Action 1", "Action 2"] },
    { "phase": "Enhancements", "focus": "Technical depth & demos", "milestones": ["Action 3", "Action 4"] }
  ]
}

Return ONLY valid JSON. Do NOT invent missing projects or technologies not present in the input.`;

    try {
      const response = await runGeminiWithRetryAndFallback({
        params: {
          model: aiConfig.getModel(),
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        },
      });

      const rawText = response.text || '';
      const parsed = JSON.parse(rawText);
      return PortfolioAiReportSchema.parse(parsed);
    } catch (err) {
      return this.generateFallbackReport(domain, metrics);
    }
  }

  public generateFallbackReport(
    domain: string,
    metrics: PortfolioDeterministicMetrics
  ): PortfolioAiReportOutput {
    return {
      summary: `Portfolio analysis for ${domain}: Overall Quality Score is ${metrics.portfolioQualityScore}/100 with Recruiter Readiness at ${metrics.recruiterReadinessScore}/100 across ${metrics.pageCount} crawled page(s) and ${metrics.projectCount} detected project(s).`,
      strengths: [
        metrics.hasResumeLink ? 'Direct link to resume/CV is easily accessible' : 'Portfolio structure is organized',
        metrics.githubLinkCount > 0 ? `${metrics.githubLinkCount} GitHub repository link(s) detected` : 'Clean page structure',
        metrics.hasContactInfo ? 'Contact information is clearly visible' : 'Detected modern technology stack'
      ],
      weaknesses: [
        !metrics.hasResumeLink ? 'Missing direct link to resume or CV' : 'Project descriptions can be enhanced with live metrics',
        metrics.brokenLinkCount > 0 ? `Detected ${metrics.brokenLinkCount} broken internal link(s)` : 'SEO meta descriptions can be expanded'
      ],
      recruiterPerspective: `Recruiters looking at ${domain} will quickly assess your technical projects and live demos. Ensure your best work is featured above the fold with working live links and GitHub repositories.`,
      seoRecommendations: [
        'Ensure all pages have a distinct title (10-60 characters) and meta description (50-160 characters).',
        'Use standard canonical URL tags on all primary pages.'
      ],
      accessibilityRecommendations: [
        'Add descriptive alt text to all portfolio image tags.',
        'Ensure proper HTML heading hierarchy (one H1 per page, followed by H2 and H3).'
      ],
      designContentRecommendations: [
        'Include measurable impact metrics (e.g. users served, latency reduced) for key projects.',
        'Add live demo badges and direct GitHub repository links to each project card.'
      ],
      improvementRoadmap: [
        {
          phase: 'Phase 1: Quick Wins',
          focus: 'Recruiter Accessibility & Broken Links',
          milestones: [
            !metrics.hasResumeLink ? 'Add a prominent "Download Resume" button in the header' : 'Verify all external demo links',
            'Fix any broken internal links and add image alt tags'
          ]
        },
        {
          phase: 'Phase 2: Project Presentation',
          focus: 'Technical Depth & Live Demos',
          milestones: [
            'Add architecture diagrams or key features lists to top projects',
            'Include technology tags and live deployment URLs for all featured work'
          ]
        }
      ]
    };
  }
}
