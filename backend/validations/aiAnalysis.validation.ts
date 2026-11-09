import { z } from 'zod';

export const FindingCategoryEnum = z.enum([
  'SECURITY',
  'ARCHITECTURE',
  'PERFORMANCE',
  'MAINTAINABILITY',
  'CODE_QUALITY',
  'CODE_STYLE',
  'BUG_RISK',
  'TESTING',
  'DOCUMENTATION',
  'DEPENDENCY',
]);

export const SeverityLevelEnum = z.enum([
  'CRITICAL',
  'HIGH',
  'MEDIUM',
  'LOW',
  'INFO',
]);

export const AIFindingSchema = z.object({
  category: FindingCategoryEnum.default('MAINTAINABILITY'),
  severity: SeverityLevelEnum.default('MEDIUM'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  evidence: z.string().optional(),
  filePath: z.string().nullable().optional(),
  lineNumber: z.number().nullable().optional(),
  snippet: z.string().nullable().optional(),
  recommendation: z.string().optional(),
  insufficientEvidence: z.boolean().optional().default(false),
});

export const AIAnalysisOutputSchema = z.object({
  overallScore: z.number().min(0).max(100).default(80),
  architectureScore: z.number().min(0).max(100).default(80),
  securityScore: z.number().min(0).max(100).default(80),
  performanceScore: z.number().min(0).max(100).default(80),
  maintainabilityScore: z.number().min(0).max(100).default(80),
  documentationScore: z.number().min(0).max(100).default(80),
  summary: z.string().min(1, 'Summary is required'),
  recommendations: z.array(z.string()).default([]),
  findings: z.array(AIFindingSchema).default([]),
});

export type AIFindingInput = z.infer<typeof AIFindingSchema>;
export type AIAnalysisOutput = z.infer<typeof AIAnalysisOutputSchema>;
