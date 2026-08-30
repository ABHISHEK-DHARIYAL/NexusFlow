import { z } from 'zod';

export const CodeforcesAiReportSchema = z.object({
  summary: z.string().min(10, 'Summary must be at least 10 characters.'),
  strengths: z.array(z.string()).min(1, 'At least one strength required.'),
  weaknesses: z.array(z.string()).min(1, 'At least one weakness required.'),
  recommendations: z.array(z.string()).min(1, 'At least one recommendation required.'),
  learningRoadmap: z.array(
    z.object({
      phase: z.string(),
      focus: z.string(),
      milestones: z.array(z.string())
    })
  ).min(1, 'At least one roadmap phase required.'),
  contestStrategy: z.array(z.string()).min(1, 'At least one contest strategy point required.')
});

export type CodeforcesAiReportInput = z.infer<typeof CodeforcesAiReportSchema>;
