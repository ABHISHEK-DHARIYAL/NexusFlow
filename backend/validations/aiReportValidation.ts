import { z } from 'zod';
import { FindingCategory, SeverityLevel } from '@prisma/client';

export const RawFindingSchema = z.object({
  category: z.string().default('MAINTAINABILITY'),
  severity: z.string().default('MEDIUM'),
  title: z.string().min(1, 'Finding title is required'),
  description: z.string().min(1, 'Finding description is required'),
  evidence: z.string().optional(),
  filePath: z.string().nullable().optional(),
  lineNumber: z.number().nullable().optional(),
  snippet: z.string().nullable().optional(),
  recommendation: z.string().nullable().optional(),
  insufficientEvidence: z.boolean().optional().default(false),
});

export const RawAIReportOutputSchema = z.object({
  overallScore: z.number().min(0).max(100),
  architectureScore: z.number().min(0).max(100),
  securityScore: z.number().min(0).max(100),
  performanceScore: z.number().min(0).max(100),
  maintainabilityScore: z.number().min(0).max(100),
  documentationScore: z.number().min(0).max(100),
  summary: z.string().min(1, 'Executive summary is required'),
  recommendations: z.array(z.string()).default([]),
  findings: z.array(RawFindingSchema).default([]),
});

export type RawAIReportOutput = z.infer<typeof RawAIReportOutputSchema>;

export function normalizeCategory(categoryStr: string): FindingCategory {
  const upper = (categoryStr || '').toUpperCase().trim();
  switch (upper) {
    case 'SECURITY':
      return FindingCategory.SECURITY;
    case 'PERFORMANCE':
      return FindingCategory.PERFORMANCE;
    case 'ARCHITECTURE':
      return FindingCategory.ARCHITECTURE;
    case 'MAINTAINABILITY':
    case 'DEPENDENCY':
      return FindingCategory.MAINTAINABILITY;
    case 'CODE_STYLE':
    case 'CODE_QUALITY':
      return FindingCategory.CODE_STYLE;
    case 'BUG_RISK':
    case 'TESTING':
      return FindingCategory.BUG_RISK;
    case 'DOCUMENTATION':
      return FindingCategory.DOCUMENTATION;
    default:
      return FindingCategory.MAINTAINABILITY;
  }
}

export function normalizeSeverity(severityStr: string): SeverityLevel {
  const upper = (severityStr || '').toUpperCase().trim();
  switch (upper) {
    case 'CRITICAL':
      return SeverityLevel.CRITICAL;
    case 'HIGH':
      return SeverityLevel.HIGH;
    case 'MEDIUM':
      return SeverityLevel.MEDIUM;
    case 'LOW':
      return SeverityLevel.LOW;
    case 'INFO':
      return SeverityLevel.INFO;
    default:
      return SeverityLevel.MEDIUM;
  }
}
