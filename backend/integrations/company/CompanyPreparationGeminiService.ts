import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { aiConfig } from '../../config/aiConfig';
import { logger } from '../../logger';
import { CompanyPreparationReport } from '../../../types';
import { runGeminiWithRetryAndFallback, createGeminiClient } from '../../utils/geminiRunner';

const GeminiCompanyPrepSchema = z.object({
  executiveSummary: z.string(),
  studyRecommendations: z.array(z.string()),
  projectDiscussionGuidance: z.array(
    z.object({
      projectName: z.string(),
      relevance: z.string(),
      discussionTopics: z.array(z.string()),
      architectureNote: z.string(),
    })
  ),
  behavioralThemes: z.array(
    z.object({
      theme: z.string(),
      context: z.string(),
      preparationGuidance: z.string(),
    })
  ),
  companyResearchSuggestions: z.object({
    overview: z.string(),
    engineeringFocus: z.array(z.string()),
    questionsForInterviewers: z.array(z.string()),
  }),
  roadmapAdjustments: z.array(
    z.object({
      phaseNumber: z.number(),
      phaseTitle: z.string(),
      refinedGoals: z.array(z.string()),
      refinedActionItems: z.array(z.string()),
    })
  ),
});

export type GeminiCompanyPrepResult = z.infer<typeof GeminiCompanyPrepSchema>;

export class CompanyPreparationGeminiService {
  private getClient(): GoogleGenAI | null {
    return createGeminiClient();
  }

  public async generateRefinement(
    report: CompanyPreparationReport,
    rawDescription: string
  ): Promise<CompanyPreparationReport> {
    const client = this.getClient();
    if (!client) {
      logger.system.info('Using deterministic preparation report (Gemini API key unavailable).');
      return report;
    }

    try {
      const prompt = `
You are a Software Engineering Career & Interview Preparation Expert.
Synthesize a company-specific preparation strategy for a candidate applying to ${report.companyName} for the role of ${report.jobTitle}.

IMPORTANT CONSTRAINTS (NO FABRICATION):
1. Do NOT pretend to know ${report.companyName}'s private or confidential interview questions or internal hiring secrets.
2. Do NOT invent fake user experiences, fake projects, or fake skills. Use ONLY the candidate's verified project (${report.projectPreparations[0]?.projectName || 'NexusFlow'}).
3. Base all preparation guidance strictly on the provided Job Description, verified developer profile, and standard engineering preparation patterns.
4. If private company facts are unknown, state clearly: "Based on the job description and general preparation patterns..."

INPUT DATA:
- Company: ${report.companyName}
- Job Title: ${report.jobTitle}
- Match Score: ${report.jobMatchScore}%
- Readiness Score: ${report.jobReadinessScore}%
- Preparation Coverage Score: ${report.preparationCoverageScore}%
- Top Priority Focus: ${report.topPriorityTopic}
- Primary Gaps: ${JSON.stringify(report.profileGaps)}
- Job Description Excerpt:
${rawDescription.slice(0, 1500)}

Please return a JSON object with this EXACT structure:
{
  "executiveSummary": "A concise 2-3 sentence executive summary of candidate preparation strategy.",
  "studyRecommendations": [
    "Specific actionable recommendation 1",
    "Specific actionable recommendation 2"
  ],
  "projectDiscussionGuidance": [
    {
      "projectName": "${report.projectPreparations[0]?.projectName || 'NexusFlow'}",
      "relevance": "HIGH",
      "discussionTopics": [
        "Why custom thread pool instead of standard library?",
        "Tradeoffs between custom worker protocols and standard microservices."
      ],
      "architectureNote": "Highlights dual-service Node.js + Java concurrency worker architecture."
    }
  ],
  "behavioralThemes": [
    {
      "theme": "Ownership",
      "context": "Proactive system design",
      "preparationGuidance": "Prepare a STAR story from NexusFlow detailing how you built the task worker scheduling engine."
    }
  ],
  "companyResearchSuggestions": {
    "overview": "Public engineering profile overview for ${report.companyName}.",
    "engineeringFocus": ["Scalable services", "Backend reliability"],
    "questionsForInterviewers": [
      "What are the immediate engineering priorities for the team?",
      "How does the team handle deployment and code review feedback?"
    ]
  },
  "roadmapAdjustments": [
    {
      "phaseNumber": 1,
      "phaseTitle": "PHASE 1 — Critical Technical Gaps",
      "refinedGoals": ["Close critical skill gaps"],
      "refinedActionItems": ["Practice Spring Boot / Backend API fundamentals"]
    }
  ]
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

      const responseText = response.text;
      if (!responseText) {
        logger.system.warn('Empty Gemini response received for Company Preparation refinement.');
        return report;
      }

      const parsed = JSON.parse(responseText);
      const validated = GeminiCompanyPrepSchema.safeParse(parsed);

      if (!validated.success) {
        logger.system.warn(`Gemini Company Preparation response validation failed: ${validated.error.message}`);
        return report;
      }

      const geminiData = validated.data;

      // Merge Gemini insights into report safely
      const updatedReport: CompanyPreparationReport = {
        ...report,
        executiveSummary: geminiData.executiveSummary || report.executiveSummary,
        companyResearch: {
          ...report.companyResearch,
          companyOverview: geminiData.companyResearchSuggestions.overview || report.companyResearch.companyOverview,
          questionsToResearch: geminiData.companyResearchSuggestions.questionsForInterviewers || report.companyResearch.questionsToResearch,
        },
      };

      if (geminiData.projectDiscussionGuidance && geminiData.projectDiscussionGuidance.length > 0) {
        updatedReport.projectPreparations = report.projectPreparations.map((proj, idx) => {
          const geminiProj = geminiData.projectDiscussionGuidance[idx] || geminiData.projectDiscussionGuidance[0];
          return {
            ...proj,
            potentialDiscussionAreas: geminiProj.discussionTopics || proj.potentialDiscussionAreas,
            architectureOverview: geminiProj.architectureNote || proj.architectureOverview,
          };
        });
      }

      if (geminiData.behavioralThemes && geminiData.behavioralThemes.length > 0) {
        updatedReport.behavioralPreparations = geminiData.behavioralThemes.map((theme) => ({
          theme: theme.theme,
          context: theme.context,
          preparationGuidance: theme.preparationGuidance,
        }));
      }

      if (geminiData.roadmapAdjustments && geminiData.roadmapAdjustments.length > 0) {
        updatedReport.roadmap = geminiData.roadmapAdjustments.map((adj) => ({
          phaseNumber: adj.phaseNumber,
          phaseTitle: adj.phaseTitle,
          goals: adj.refinedGoals,
          actionItems: adj.refinedActionItems,
        }));
      }

      return updatedReport;
    } catch (err: any) {
      logger.system.error(`CompanyPreparationGeminiService failed: ${err.message}. Falling back to deterministic report.`);
      return report;
    }
  }
}

export const companyPreparationGeminiService = new CompanyPreparationGeminiService();
