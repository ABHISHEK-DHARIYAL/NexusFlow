import { z } from 'zod';

export const PortfolioAiReportSchema = z.object({
  summary: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  recruiterPerspective: z.string(),
  seoRecommendations: z.array(z.string()),
  accessibilityRecommendations: z.array(z.string()),
  designContentRecommendations: z.array(z.string()),
  improvementRoadmap: z.array(
    z.object({
      phase: z.string(),
      focus: z.string(),
      milestones: z.array(z.string())
    })
  )
});

export type PortfolioAiReportOutput = z.infer<typeof PortfolioAiReportSchema>;
