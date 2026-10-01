import { GoogleGenAI } from '@google/genai';
import { aiConfig } from '../config/aiConfig';
import { CodeforcesDeterministicMetrics } from '../../types';
import { CodeforcesAiReportSchema, CodeforcesAiReportInput } from '../validations/codeforcesAiValidation';
import { runGeminiWithRetryAndFallback, createGeminiClient } from '../utils/geminiRunner';

export class CodeforcesAiService {
  private getClient(): GoogleGenAI | null {
    return createGeminiClient();
  }

  public async generateAnalysisReport(
    handle: string,
    metrics: CodeforcesDeterministicMetrics
  ): Promise<CodeforcesAiReportInput> {
    const ai = this.getClient();
    if (!ai) {
      return this.generateFallbackReport(handle, metrics);
    }
    const prompt = `You are a world-class Competitive Programming Coach and Technical Interview Expert.
Analyze the following Codeforces performance profile for handle "${handle}" based strictly on these deterministic metrics:

Profile Metrics:
- Competitive Programming Score: ${metrics.cpScore}/100
- Current Rating: ${metrics.currentRating} (${metrics.currentRank})
- Max Rating: ${metrics.maxRating} (${metrics.maxRank})
- Rating Trend: ${metrics.ratingTrend}
- Contests Participated: ${metrics.contestCount}
- Total Problems Solved: ${metrics.totalProblemsSolved}
- Consistency Score: ${metrics.consistencyScore}/100
- Strong Topics/Tags: ${metrics.strongTags.join(', ') || 'None identified yet'}
- Weak Topics/Tags: ${metrics.weakTags.join(', ') || 'None identified yet'}
- Difficulty Distribution: ${JSON.stringify(metrics.difficultyDistribution)}
- Recommendation Signals: ${metrics.recommendationSignals.join('; ')}

Strict Rules:
1. Ground ALL observations in the provided metrics. Do NOT hallucinate ratings, ranks, or problem counts.
2. Return ONLY a single valid JSON object matching this schema:
{
  "summary": "Executive summary of competitive programming profile",
  "strengths": ["Strength 1", "Strength 2", ...],
  "weaknesses": ["Weakness 1", "Weakness 2", ...],
  "recommendations": ["Recommendation 1", "Recommendation 2", ...],
  "learningRoadmap": [
    { "phase": "Phase 1 (1-2 weeks)", "focus": "Topic/Difficulty Focus", "milestones": ["Milestone 1", "Milestone 2"] }
  ],
  "contestStrategy": ["Strategy tip 1", "Strategy tip 2"]
}
Do NOT include markdown formatting wrappers around the JSON if possible, or use standard \`\`\`json.`;

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

      const text = response.text || '';
      const cleanJsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      const parsed = JSON.parse(cleanJsonStr);
      const validated = CodeforcesAiReportSchema.parse(parsed);
      return validated;
    } catch (err: any) {
      console.warn(`[CodeforcesAiService] Gemini analysis generation failed or key missing. Falling back to rule-based report: ${err.message}`);
      return this.generateFallbackReport(handle, metrics);
    }
  }

  public generateFallbackReport(
    handle: string,
    metrics: CodeforcesDeterministicMetrics
  ): CodeforcesAiReportInput {
    const isSpecialistOrAbove = metrics.currentRating >= 1400;

    return {
      summary: `Codeforces user "${handle}" holds a current rating of ${metrics.currentRating} (${metrics.currentRank}) with a maximum rating of ${metrics.maxRating} across ${metrics.contestCount} contests. CP Score stands at ${metrics.cpScore}/100 with an overall ${metrics.ratingTrend.toLowerCase()} rating trend.`,
      strengths: [
        `Active contest participant with ${metrics.contestCount} recorded contests.`,
        metrics.strongTags.length > 0
          ? `Demonstrated proficiency in topics: ${metrics.strongTags.slice(0, 3).join(', ')}.`
          : `Solid baseline problem-solving capability across basic problem sets.`,
        `Consistency score of ${metrics.consistencyScore}/100 across competitive activity.`
      ],
      weaknesses: [
        metrics.weakTags.length > 0
          ? `Lower accuracy and volume in topics: ${metrics.weakTags.slice(0, 3).join(', ')}.`
          : `Gap between current rating (${metrics.currentRating}) and peak capability (${metrics.maxRating}).`,
        metrics.currentRating < 1200
          ? `Needs deeper practice on problem ratings 1000-1300 to transition from Newbie.`
          : `Requires faster execution speed on Div 2 Problem C / Div 3 Problem D.`
      ],
      recommendations: metrics.recommendationSignals.length > 0
        ? metrics.recommendationSignals
        : [
            'Solve 3-5 Codeforces problems daily at rating +100 above your current rating.',
            'Participate regularly in Div 2 / Div 3 live contests.',
            'Review editorial solutions for un-solved contest problems immediately after rounds.'
          ],
      learningRoadmap: [
        {
          phase: 'Phase 1: Foundation & Accuracy (Weeks 1-2)',
          focus: isSpecialistOrAbove ? 'Intermediate Algorithms & DP' : 'Implementation & Math Basics',
          milestones: [
            'Solve 25 targeted rating-appropriate problems.',
            'Maintain 80%+ submission accuracy on Div 2 Problem A/B.'
          ]
        },
        {
          phase: 'Phase 2: Speed & Advanced Topics (Weeks 3-4)',
          focus: isSpecialistOrAbove ? 'Graph Algorithms & Segment Trees' : 'Greedy & Binary Search',
          milestones: [
            'Participate in at least 2 live Codeforces contests.',
            'Upsolve at least 1 extra problem per contest.'
          ]
        }
      ],
      contestStrategy: [
        'Read all problems A through C in the first 5 minutes to gauge difficulty.',
        'Prioritize submitting Problem A quickly to secure early points and confidence.',
        'Avoid spending >30 minutes on a single problem without sketching edge cases on paper.'
      ]
    };
  }
}
