import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { aiConfig } from '../config/aiConfig';
import { logger } from '../logger';
import { JobMatchReport } from '../../types';

export const JobExplanationSchema = z.object({
  summary: z.string(),
  matchExplanation: z.string(),
  strengths: z.array(z.string()),
  skillGaps: z.array(z.string()),
  recommendations: z.array(z.string()),
  priorityAreas: z.array(z.string()),
  relevantProjects: z.array(z.string()),
  interviewPriorities: z.array(z.string()),
});

export type JobExplanationOutput = z.infer<typeof JobExplanationSchema>;

export class JobExplanationService {
  private getGeminiClient(): GoogleGenAI | null {
    const apiKey = aiConfig.getApiKey();
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey === 'your_gemini_api_key' || apiKey === 'placeholder') {
      return null;
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  public async explainJobMatch(matchReport: Omit<JobMatchReport, 'id' | 'createdAt' | 'updatedAt'>): Promise<JobExplanationOutput> {
    const gemini = this.getGeminiClient();

    if (!gemini) {
      logger.ai.info('GEMINI_API_KEY not configured or placeholder. Using deterministic job match explanation fallback.');
      return this.generateFallbackExplanation(matchReport);
    }

    try {
      const prompt = `
You are an expert AI Technical Career & Developer Profile Analyst.
Analyze the following deterministic Job Description Match analysis result and provide an objective, high-value career strategy report.

CRITICAL CONSTRAINTS & AI SAFETY RULES:
1. NEVER invent, fabricate, or hallucinate skills, experience, projects, or certifications that the candidate does not have.
2. If a skill state is MISSING, state clearly that there is no verified evidence in the profile.
3. Do NOT guarantee an interview or hiring outcome.
4. Always frame advice professionally and constructively ("Your profile currently demonstrates...", "Prioritize learning...").

DETERMINISTIC MATCH REPORT:
- Overall Match Score: ${matchReport.overallMatchScore}/100 (${matchReport.matchLabel})
- Required Skill Coverage: ${matchReport.requiredSkillCoverage}%
- Preferred Skill Coverage: ${matchReport.preferredSkillCoverage}%
- Project Relevance Score: ${matchReport.projectRelevanceScore}%
- Experience Match: ${matchReport.experienceMatchStatus}
- Education Match: ${matchReport.educationMatchStatus}
- Competitive Programming Relevance: ${matchReport.cpRelevanceStatus}

SKILL MATCHES:
${JSON.stringify(matchReport.skillMatches, null, 2)}

PROJECT RELEVANCE:
${JSON.stringify(matchReport.projectRelevance, null, 2)}

MISSING SKILLS GAPS:
${JSON.stringify(matchReport.missingSkills, null, 2)}

KEYWORD ALIGNMENT:
${JSON.stringify(matchReport.keywordAlignment, null, 2)}

Provide your response strictly in valid JSON format matching this schema:
{
  "summary": "High level executive summary of candidate fit for this job",
  "matchExplanation": "Detailed explanation of technical alignment and reasons behind the score",
  "strengths": ["List of 3-5 verified strong points in candidate profile"],
  "skillGaps": ["List of key missing or partial skill gaps"],
  "recommendations": ["List of 3-5 concrete action items to close gaps"],
  "priorityAreas": ["Top 3 focus areas to improve profile fit"],
  "relevantProjects": ["Key projects to highlight on application"],
  "interviewPriorities": ["Top 3 technical topics to prepare for interviews"]
}
`;

      const response = await gemini.models.generateContent({
        model: aiConfig.getModel(),
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const text = response.text || '';
      let jsonParsed: any;
      try {
        let cleaned = text.trim();
        if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
        }
        jsonParsed = JSON.parse(cleaned);
      } catch {
        jsonParsed = {};
      }

      const validated = JobExplanationSchema.safeParse(jsonParsed);
      if (validated.success) {
        return validated.data;
      } else {
        logger.ai.warn(`Gemini output failed schema validation. Falling back to deterministic explanation.`);
        return this.generateFallbackExplanation(matchReport);
      }
    } catch (err: any) {
      logger.ai.error(`JobExplanationService Gemini error: ${err.message}`);
      return this.generateFallbackExplanation(matchReport);
    }
  }

  public generateFallbackExplanation(matchReport: Omit<JobMatchReport, 'id' | 'createdAt' | 'updatedAt'>): JobExplanationOutput {
    const matchedSkills = matchReport.skillMatches.filter((s) => s.state === 'MATCHED').map((s) => s.requirementName);
    const missing = matchReport.missingSkills.map((m) => m.skill);

    return {
      summary: `Candidate achieves a ${matchReport.overallMatchScore}% (${matchReport.matchLabel}) alignment for this role. Required skill coverage is ${matchReport.requiredSkillCoverage}%, backed by ${matchReport.projectRelevanceScore}% project relevance.`,
      matchExplanation: `Strong match in core requirements (${matchedSkills.slice(0, 4).join(', ') || 'foundation technologies'}). Gap identified in ${missing.slice(0, 3).join(', ') || 'nice-to-have skills'}.`,
      strengths: matchedSkills.length > 0
        ? matchedSkills.map((s) => `Verified evidence and code experience in ${s}`)
        : ['Demonstrates strong foundational software engineering capabilities'],
      skillGaps: missing.length > 0
        ? missing.map((m) => `No verified evidence currently found for ${m}`)
        : ['Minor optimization of preferred tools recommended'],
      recommendations: matchReport.recommendations,
      priorityAreas: missing.slice(0, 3).map((m) => `Build a project demonstrating ${m}`),
      relevantProjects: matchReport.projectRelevance.map((p) => `${p.projectName} (${p.relevanceScore}% match)`),
      interviewPriorities: matchReport.interviewPriorities,
    };
  }
}

export const jobExplanationService = new JobExplanationService();
