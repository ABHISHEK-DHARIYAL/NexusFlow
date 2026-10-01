import { z } from 'zod';

export const RoadmapPhaseSchema = z.object({
  phase: z.string(),
  focus: z.string(),
  milestones: z.array(z.string()),
});

export const LeetCodeAiReportSchema = z.object({
  summary: z.string().min(10),
  strengths: z.array(z.string()).min(1),
  weaknesses: z.array(z.string()),
  recommendations: z.array(z.string()).min(1),
  learningRoadmap: z.array(RoadmapPhaseSchema).min(1),
  contestStrategy: z.array(z.string()).min(1),
});

export type LeetCodeAiReportOutput = z.infer<typeof LeetCodeAiReportSchema>;
