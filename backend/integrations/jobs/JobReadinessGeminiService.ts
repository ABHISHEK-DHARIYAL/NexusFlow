import { z } from 'zod';
import { aiConfig } from '../../config/aiConfig';
import { logger } from '../../logger';
import { JobReadinessReport, JobMatchReport, ExtractedJobRequirements } from '../../../types';
import { runGeminiWithRetryAndFallback, createGeminiClient } from '../../utils/geminiRunner';

const GeminiReadinessSchema = z.object({
  executiveSummary: z.string().min(10),
  strongestAreas: z.array(z.string()).min(1),
  weakestAreas: z.array(z.string()).min(1),
  whyGapsMatter: z.array(z.string()),
  preparationStrategy: z.array(z.string()).min(1),
  projectRecommendations: z.array(z.string()),
});

export type GeminiReadinessResponse = z.infer<typeof GeminiReadinessSchema>;

export class JobReadinessGeminiService {
  /**
   * Generates qualitative readiness explanation using Gemini API, with strict validation and deterministic fallback.
   */
  public async generateReadinessExplanation(
    jobMatch: JobMatchReport,
    readinessReport: any
  ): Promise<string> {
    const defaultSummary = this.generateFallbackSummary(jobMatch, readinessReport);

    const client = createGeminiClient();
    if (!client) {
      logger.ai.info('GEMINI_API_KEY not set or placeholder; using deterministic readiness summary.');
      return defaultSummary;
    }

    try {
      const prompt = `
You are an expert technical career advisor analyzing a candidate's readiness for a specific engineering position.

CRITICAL CONSTRAINTS:
1. Do NOT calculate or change any scores.
2. Do NOT predict hiring probabilities or say "you will get hired" or "recruiter will select you".
3. Frame as technical readiness and alignment with the job's engineering requirements.
4. Keep the summary professional, concise (2-3 paragraphs), and directly actionable.

JOB TITLE: ${jobMatch.extractedRequirements?.roleTitle || 'Software Engineer'}
COMPANY: ${jobMatch.extractedRequirements?.companyName || 'Target Employer'}
READINESS SCORE: ${readinessReport.score} / 100 (${readinessReport.level})
CONFIDENCE: ${readinessReport.confidence}

DIMENSION SCORES:
- Required Skills: ${readinessReport.dimensions.requiredSkillReadiness.score}%
- Technical Readiness: ${readinessReport.dimensions.technicalReadiness.score}%
- Project Readiness: ${readinessReport.dimensions.projectReadiness.score}%
- Experience Readiness: ${readinessReport.dimensions.experienceReadiness.score}%
- DSA Readiness: ${readinessReport.dimensions.dsaReadiness.score}% (${readinessReport.dsaRelevance} relevance)
- Evidence Coverage: ${readinessReport.dimensions.evidenceReadiness.score}%

CRITICAL GAPS:
${readinessReport.criticalGaps.map((g: any) => `- ${g.skillOrRequirement}: ${g.whyRequired}`).join('\n') || 'None'}

STRONG SIGNALS:
${readinessReport.strongSignals.map((s: any) => `- ${s.title}: ${s.description}`).join('\n')}

Task: Generate a well-structured JSON response conforming to:
{
  "executiveSummary": "A 2-paragraph analysis summarizing candidate technical alignment, key project strengths, and primary preparation priorities.",
  "strongestAreas": ["3 key technical strengths"],
  "weakestAreas": ["3 areas needing attention"],
  "whyGapsMatter": ["Explanation of why identified gaps affect job readiness"],
  "preparationStrategy": ["3-4 actionable preparation steps"],
  "projectRecommendations": ["How to leverage existing projects to close gaps"]
}
`;

      const response = await runGeminiWithRetryAndFallback({
        params: {
          model: aiConfig.getModel(),
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        },
      });

      const text = response.text || '';
      const parsed = JSON.parse(text);
      const validated = GeminiReadinessSchema.parse(parsed);

      return validated.executiveSummary;
    } catch (err: any) {
      logger.ai.warn(`Gemini readiness generation failed, using deterministic fallback: ${err.message}`);
      return defaultSummary;
    }
  }

  private generateFallbackSummary(
    jobMatch: JobMatchReport,
    readinessReport: Omit<JobReadinessReport, 'executiveSummary'>
  ): string {
    const score = readinessReport.score;
    const level = readinessReport.level.replace(/_/g, ' ');
    const role = jobMatch.extractedRequirements?.roleTitle || 'the position';

    let paragraph1 = `Your technical profile shows an overall readiness score of ${score}/100 (${level}) for ${role}. `;

    if (score >= 75) {
      paragraph1 += `Your portfolio and connected repositories demonstrate solid engineering alignment across required programming languages, API architecture, and database integrations.`;
    } else if (score >= 60) {
      paragraph1 += `You possess a strong foundational baseline in relevant core technologies, with key project evidence supporting your technical skills.`;
    } else {
      paragraph1 += `Further targeted technical preparation and project evidence enhancement will significantly strengthen your profile alignment.`;
    }

    let paragraph2 = '';
    if (readinessReport.criticalGaps.length > 0) {
      const gapNames = readinessReport.criticalGaps.slice(0, 3).map((g) => g.skillOrRequirement).join(', ');
      paragraph2 = `The primary technical gaps identified include: ${gapNames}. Addressing these core requirements through project extension or targeted study will be your highest impact preparation priority.`;
    } else {
      paragraph2 = `All core required technical skills are supported by verified profile evidence. Focus on refining system design concepts and interview preparation.`;
    }

    return `${paragraph1}\n\n${paragraph2}`;
  }
}

export const jobReadinessGeminiService = new JobReadinessGeminiService();
