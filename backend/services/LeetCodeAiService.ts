import { GoogleGenAI } from '@google/genai';
import { aiConfig } from '../config/aiConfig';
import { logger } from '../logger';
import { LeetCodeDeterministicMetrics } from '../../types';
import { LeetCodeAiReportOutput, LeetCodeAiReportSchema } from '../validations/leetcodeAiValidation';
import { runGeminiWithRetryAndFallback, createGeminiClient } from '../utils/geminiRunner';

export class LeetCodeAiService {
  private getClient(): GoogleGenAI | null {
    return createGeminiClient();
  }

  public async generateInsights(
    username: string,
    metrics: LeetCodeDeterministicMetrics
  ): Promise<LeetCodeAiReportOutput> {
    const ai = this.getClient();

    if (!ai) {
      logger.ai.info('GEMINI_API_KEY not set or placeholder. Using deterministic fallback report for LeetCode analysis.');
      return this.generateFallbackReport(username, metrics);
    }

    const prompt = `
You are a Senior Algorithm Engineer and Competitive Programming Coach at NexusFlow.
Analyze the following LeetCode deterministic problem-solving metrics for user "${username}" and provide structured strategic guidance.

DETERMINISTIC METRICS:
- DSA Overall Score: ${metrics.dsaScore} / 100
- Problems Solved: Total=${metrics.totalSolved} (Easy=${metrics.easySolved}, Medium=${metrics.mediumSolved}, Hard=${metrics.hardSolved})
- Contest Rating: ${metrics.contestRating} (Max: ${metrics.maxRating}, Rating Trend: ${metrics.ratingTrend})
- Global Ranking: ${metrics.globalRanking ? metrics.globalRanking : 'N/A'}
- Continuous Solving Streak: ${metrics.streak} days
- Strong Topics: ${metrics.strongTopics.join(', ') || 'None identified'}
- Weak Topics: ${metrics.weakTopics.join(', ') || 'None identified'}
- Recommended Signals: ${metrics.recommendationSignals.join(' | ') || 'None'}

INSTRUCTIONS:
1. Provide a professional, encouraging summary of the user's algorithmic capabilities based strictly on the provided data.
2. List key strengths and weak areas.
3. Formulate prioritized actionable recommendations.
4. Provide a 3-phase structured learning roadmap (e.g. Phase 1: Foundation, Phase 2: Core Patterns, Phase 3: Advanced & Contest Mastery).
5. Provide actionable contest strategy bullet points.
6. Do NOT invent problems solved or fake ratings not present in the metrics.

Respond ONLY with valid JSON adhering to the following structure:
{
  "summary": "...",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "recommendations": ["..."],
  "learningRoadmap": [
    {
      "phase": "Phase 1: Foundation Refinement",
      "focus": "Focus on ...",
      "milestones": ["Milestone 1", "Milestone 2"]
    }
  ],
  "contestStrategy": ["Strategy 1", "Strategy 2"]
}
`;

    try {
      const response = await runGeminiWithRetryAndFallback({
        params: {
          model: aiConfig.getModel(),
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
            maxOutputTokens: aiConfig.maxOutputTokens,
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Gemini returned an empty response text.');
      }

      const parsedJson = JSON.parse(responseText);
      const validated = LeetCodeAiReportSchema.parse(parsedJson);
      logger.ai.info(`Successfully generated Gemini LeetCode analysis for user ${username}`);
      return validated;
    } catch (err: any) {
      logger.ai.warn(`Gemini AI analysis generation failed for ${username}: ${err.message}. Using deterministic fallback report.`);
      return this.generateFallbackReport(username, metrics);
    }
  }

  public generateFallbackReport(username: string, metrics: LeetCodeDeterministicMetrics): LeetCodeAiReportOutput {
    const strengths: string[] = [];
    if (metrics.mediumSolved >= 100) {
      strengths.push(`Solid Medium-level problem volume (${metrics.mediumSolved} solved) demonstrating strong core DSA comprehension.`);
    }
    if (metrics.hardSolved >= 20) {
      strengths.push(`Good exposure to Hard-level problems (${metrics.hardSolved} solved) showing capability with complex algorithms.`);
    }
    if (metrics.strongTopics.length > 0) {
      strengths.push(`Demonstrated mastery in key topics: ${metrics.strongTopics.slice(0, 4).join(', ')}.`);
    }
    if (strengths.length === 0) {
      strengths.push(`Consistent practice baseline with ${metrics.totalSolved} total problems solved on LeetCode.`);
    }

    const weaknesses: string[] = [];
    if (metrics.weakTopics.length > 0) {
      weaknesses.push(`Requires additional practice and pattern recognition in: ${metrics.weakTopics.slice(0, 4).join(', ')}.`);
    }
    if (metrics.hardSolved < 25) {
      weaknesses.push(`Hard problem exposure is relatively low (${metrics.hardSolved} solved). Increase Hard problem frequency for top-tier interview readiness.`);
    }

    const recommendations = [...metrics.recommendationSignals];
    if (recommendations.length === 0) {
      recommendations.push('Maintain daily problem solving routines and participate in weekly LeetCode contests.');
    }

    return {
      summary: `User ${username} has attained a DSA Score of ${metrics.dsaScore}/100 with ${metrics.totalSolved} total problems solved (${metrics.easySolved} Easy, ${metrics.mediumSolved} Medium, ${metrics.hardSolved} Hard). Contest Rating stands at ${metrics.contestRating} with an overall ${metrics.ratingTrend.toLowerCase()} rating trend.`,
      strengths,
      weaknesses,
      recommendations,
      learningRoadmap: [
        {
          phase: 'Phase 1: Weak Area & Pattern Reinforcement',
          focus: `Target weak topic areas (${metrics.weakTopics.slice(0, 3).join(', ') || 'Dynamic Programming, Graphs'}).`,
          milestones: [
            'Solve 15-20 Medium problems in target weak topics',
            'Master core template code for BFS/DFS and DP transitions',
          ],
        },
        {
          phase: 'Phase 2: Hard Problem Mastery & Speed',
          focus: 'Expand Hard problem exposure and reduce time per problem to under 25 minutes.',
          milestones: [
            'Solve 10 Hard problems in Trees, Graphs, and Advanced DP',
            'Review optimal solutions for solved Medium problems to discover cleaner time/space complexities',
          ],
        },
        {
          phase: 'Phase 3: Contest Simulation & Mock Interviews',
          focus: 'Simulate live interview constraints through weekly contest participation.',
          milestones: [
            'Participate in 4 consecutive LeetCode weekly contests aiming for 3/4 problem solves per contest',
            'Target a contest rating threshold of 1600+',
          ],
        },
      ],
      contestStrategy: [
        'Spend the first 2 minutes scanning all 4 problems to estimate difficulty before coding.',
        'Solve Problem 1 (Easy) and Problem 2 (Medium) within the first 25 minutes.',
        'Budget at least 30 minutes for Problem 3 (Harder Medium / Hard).',
        'Avoid submitting without checking edge cases (empty arrays, boundary limits, single element inputs) to prevent 5-minute penalty deductions.',
      ],
    };
  }
}

export const leetCodeAiService = new LeetCodeAiService();
