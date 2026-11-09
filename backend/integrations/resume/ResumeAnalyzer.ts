import { GoogleGenAI } from '@google/genai';
import { aiConfig } from '../../config/aiConfig';
import { logger } from '../../logger';
import { ParsedResumeResult } from './ResumeParser';
import { ResumeActionableSuggestion, ResumeBulletEvaluation } from '../../../types';
import { runGeminiWithRetryAndFallback, createGeminiClient } from '../../utils/geminiRunner';

export interface ResumeAnalysisOutput {
  atsScore: number;
  formattingScore: number;
  contentImpactScore: number;
  skillsMatchScore: number;
  completenessScore: number;
  summary: string;
  actionableSuggestions: ResumeActionableSuggestion[];
  bulletEvaluations: ResumeBulletEvaluation[];
  missingKeywords: string[];
  formattingIssues: string[];
}

export class ResumeAnalyzer {
  private getClient(): GoogleGenAI | null {
    return createGeminiClient();
  }

  public async analyzeResume(
    rawText: string,
    parsed: ParsedResumeResult
  ): Promise<ResumeAnalysisOutput> {
    const client = this.getClient();

    if (!client) {
      logger.root.warn('[ResumeAnalyzer] GEMINI_API_KEY not set. Using deterministic ATS evaluation.');
      return this.generateDeterministicAnalysis(rawText, parsed);
    }

    try {
      const prompt = `
You are an expert Senior Technical Recruiter and ATS (Applicant Tracking System) Specialist.
Analyze the following developer resume for software engineering, full-stack, DevOps, and backend roles.

RAW RESUME TEXT:
"""
${rawText.slice(0, 8000)}
"""

PARSED RESUME METRICS:
- Total Word Count: ${parsed.metrics.wordCount}
- Action Verbs Used: ${parsed.metrics.actionVerbCount}
- Bullets with Quantifiable Metrics: ${parsed.metrics.metricBulletCount}/${parsed.metrics.totalBulletCount}
- Contact Info Complete: ${Boolean(parsed.contactInfo.email && parsed.contactInfo.name && (parsed.contactInfo.linkedin || parsed.contactInfo.github))}
- Sections Detected: Experience (${parsed.workExperience.length}), Education (${parsed.education.length}), Skills (${parsed.skills.technical.length}), Projects (${parsed.projects.length})

EVALUATION REQUIREMENTS:
1. Provide ATS Score (0-100) and 4 sub-scores: formattingScore, contentImpactScore, skillsMatchScore, completenessScore.
2. Evaluate up to 8 core bullet points from work experience/projects for impact using Google's XYZ Formula ("Accomplished [X] as measured by [Y], by doing [Z]"). Provide improved rewrites.
3. Identify 5-10 missing high-impact technical keywords or industry terms expected in software engineering roles.
4. Highlight formatting & structural risks (e.g., word count, missing links, vague metrics, weak action verbs).
5. Give 4-6 prioritized actionable suggestions (HIGH, MEDIUM, LOW) with rationale and impact.

CRITICAL RULE FOR BULLET REWRITES: When producing "improvedVersion", you may only
rephrase, restructure, or clarify wording that is already present in "original".
You must NEVER invent a number, percentage, user count, revenue figure, or any
other quantifiable metric that does not already appear in the original bullet or
elsewhere in the resume text above. If a bullet lacks a real metric, improve its
verb choice and clarity, and instead note in "feedback" that it should be
strengthened with a real, specific metric the candidate can supply - do not
fabricate one yourself.

RETURN JSON EXACTLY IN THIS SCHEMA:
{
  "atsScore": number,
  "formattingScore": number,
  "contentImpactScore": number,
  "skillsMatchScore": number,
  "completenessScore": number,
  "summary": "3-4 sentence comprehensive executive summary of resume ATS readiness",
  "actionableSuggestions": [
    {
      "category": "Impact" | "Formatting" | "Keywords" | "Completeness" | "Skills",
      "priority": "HIGH" | "MEDIUM" | "LOW",
      "suggestion": "Specific directive recommendation",
      "impact": "Why this change matters to ATS and recruiters"
    }
  ],
  "bulletEvaluations": [
    {
      "original": "Original bullet text from resume",
      "impactScore": number (0-100),
      "feedback": "Analysis of action verbs, metrics, and technical depth",
      "improvedVersion": "High-impact rewrite following XYZ formula",
      "actionVerbUsed": boolean,
      "hasQuantifiableMetric": boolean
    }
  ],
  "missingKeywords": ["string"],
  "formattingIssues": ["string"]
}
`;

      const response = await runGeminiWithRetryAndFallback({
        params: {
          model: aiConfig.getModel(),
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Empty response from Gemini API');
      }

      const parsedJson = JSON.parse(responseText);

      const rawTextLower = rawText.toLowerCase();
      const bulletEvaluations = (Array.isArray(parsedJson.bulletEvaluations) ? parsedJson.bulletEvaluations : []).map(
        (evalItem: any) => this.guardAgainstFabricatedMetrics(evalItem, rawTextLower)
      );

      return {
        atsScore: Math.min(100, Math.max(0, parsedJson.atsScore || 70)),
        formattingScore: Math.min(100, Math.max(0, parsedJson.formattingScore || 75)),
        contentImpactScore: Math.min(100, Math.max(0, parsedJson.contentImpactScore || 68)),
        skillsMatchScore: Math.min(100, Math.max(0, parsedJson.skillsMatchScore || 72)),
        completenessScore: Math.min(100, Math.max(0, parsedJson.completenessScore || 80)),
        summary: parsedJson.summary || 'Resume analyzed successfully with ATS impact recommendations.',
        actionableSuggestions: Array.isArray(parsedJson.actionableSuggestions) ? parsedJson.actionableSuggestions : [],
        bulletEvaluations,
        missingKeywords: Array.isArray(parsedJson.missingKeywords) ? parsedJson.missingKeywords : [],
        formattingIssues: Array.isArray(parsedJson.formattingIssues) ? parsedJson.formattingIssues : []
      };
    } catch (err: any) {
      logger.root.error('[ResumeAnalyzer] Gemini analysis failed, falling back to deterministic:', err.message);
      return this.generateDeterministicAnalysis(rawText, parsed);
    }
  }

  /**
   * Defense-in-depth for the anti-fabrication prompt instruction above:
   * if the rewritten bullet ("improvedVersion") contains a number that
   * doesn't appear anywhere in the original bullet or the rest of the
   * resume text, Gemini most likely invented it (e.g. turning "Built a
   * Java application" into "...serving 1M users"). Rather than silently
   * shipping a fabricated metric to the user, this strips the rewrite
   * back to the model's own original bullet and flags it, so the person
   * making the decision knows a real metric is still needed.
   */
  private guardAgainstFabricatedMetrics(evalItem: any, rawTextLower: string): ResumeBulletEvaluation {
    const original: string = evalItem?.original || '';
    const improved: string = evalItem?.improvedVersion || '';

    const numbersInImproved = improved.match(/\d[\d,.]*\s*[%kKmMbB]?/g) || [];
    const fabricated = numbersInImproved.some((num) => {
      const normalized = num.replace(/,/g, '').trim();
      if (!normalized) return false;
      return !original.includes(normalized) && !rawTextLower.includes(normalized.toLowerCase());
    });

    if (fabricated) {
      return {
        ...evalItem,
        improvedVersion: original,
        hasQuantifiableMetric: false,
        feedback: `${evalItem?.feedback || ''} [Note: an AI-suggested rewrite introduced a metric not found in your resume and was removed - add a real, specific number here if you have one.]`.trim(),
      };
    }

    return evalItem;
  }

  private generateDeterministicAnalysis(
    rawText: string,
    parsed: ParsedResumeResult
  ): ResumeAnalysisOutput {
    const { metrics, contactInfo, workExperience, skills, projects, education } = parsed;

    const contactScore = metrics.sectionScores.contact;
    const completenessScore = Math.round((contactScore + metrics.sectionScores.experience + metrics.sectionScores.education + metrics.sectionScores.skills) / 4);

    const verbRatio = metrics.totalBulletCount > 0 ? (metrics.actionVerbCount / metrics.totalBulletCount) : 0;
    const metricRatio = metrics.totalBulletCount > 0 ? (metrics.metricBulletCount / metrics.totalBulletCount) : 0;

    const contentImpactScore = Math.min(100, Math.round((verbRatio * 50) + (metricRatio * 50)));

    let formattingScore = 85;
    const formattingIssues: string[] = [];

    if (metrics.wordCount < 250) {
      formattingScore -= 20;
      formattingIssues.push('Resume word count is under 250 words; appears too brief for ATS scanners.');
    } else if (metrics.wordCount > 1000) {
      formattingScore -= 10;
      formattingIssues.push('Resume length exceeds 1000 words; consider condensing to 1-2 pages.');
    }

    if (!contactInfo.linkedin) {
      formattingIssues.push('Missing LinkedIn profile link in contact section.');
    }
    if (!contactInfo.github) {
      formattingIssues.push('Missing GitHub profile link in contact section.');
    }

    const expectedKeywords = ['TypeScript', 'Docker', 'REST API', 'CI/CD', 'Microservices', 'SQL', 'Git', 'System Design', 'Testing'];
    const lowerText = rawText.toLowerCase();
    const missingKeywords = expectedKeywords.filter((kw) => !lowerText.includes(kw.toLowerCase()));

    const skillsMatchScore = Math.max(40, 100 - (missingKeywords.length * 7));

    const atsScore = Math.round(
      completenessScore * 0.25 +
      contentImpactScore * 0.35 +
      formattingScore * 0.20 +
      skillsMatchScore * 0.20
    );

    const bulletEvaluations: ResumeBulletEvaluation[] = [];
    workExperience.flatMap((w) => w.highlights || []).slice(0, 6).forEach((bullet) => {
      const hasMetric = /\d+/.test(bullet);
      const firstWord = bullet.split(/\s+/)[0]?.toLowerCase() || '';
      const hasActionVerb = ['built', 'developed', 'architected', 'designed', 'led', 'implemented', 'scaled', 'created'].includes(firstWord);

      bulletEvaluations.push({
        original: bullet,
        impactScore: (hasMetric ? 50 : 20) + (hasActionVerb ? 40 : 10),
        feedback: hasMetric ? 'Good inclusion of metric.' : 'Add quantifiable metric (e.g. % improvement, latency reduction, user count).',
        improvedVersion: hasMetric ? bullet : `Engineered and optimized ${bullet.toLowerCase()} resulting in a 35% efficiency boost.`,
        actionVerbUsed: hasActionVerb,
        hasQuantifiableMetric: hasMetric
      });
    });

    const actionableSuggestions: ResumeActionableSuggestion[] = [
      {
        category: 'Impact',
        priority: 'HIGH',
        suggestion: 'Incorporate quantifiable results in every experience bullet point.',
        impact: 'Resumes with metrics receive 40% higher callback rates from ATS filters.'
      },
      {
        category: 'Keywords',
        priority: 'HIGH',
        suggestion: `Add missing key technologies: ${missingKeywords.slice(0, 4).join(', ')}.`,
        impact: 'Aligns resume text with automated job description keyword screeners.'
      },
      {
        category: 'Formatting',
        priority: 'MEDIUM',
        suggestion: 'Ensure GitHub and LinkedIn URLs are clearly present and hyperlinked.',
        impact: 'Allows recruiters to instantly verify developer credentials.'
      }
    ];

    return {
      atsScore,
      formattingScore,
      contentImpactScore,
      skillsMatchScore,
      completenessScore,
      summary: `Resume scored ${atsScore}/100 for ATS readiness. Found ${workExperience.length} work experience entries and ${skills.technical.length} technical skills. Increasing quantifiable metrics and action verbs will boost impact score.`,
      actionableSuggestions,
      bulletEvaluations,
      missingKeywords,
      formattingIssues
    };
  }
}
