import { geminiAiService, GeminiAnalysisResult } from "./services/GeminiAiService";
import { FileInputItem } from "./services/AIInputSelectionService";
import { logger } from "./logger";

export async function analyzeRepositoryWithGemini(
  repoFullName: string,
  repoDescription: string,
  primaryLanguage: string,
  taskId: string,
  repoId: string,
  files?: FileInputItem[]
): Promise<GeminiAnalysisResult & { reportData: any; modelName: string; modelVersion: string }> {
  logger.ai.info(`analyzeRepositoryWithGemini called for ${repoFullName}`);

  // Fix for a confirmed severe bug: this previously accepted a
  // `contextFormatted` string built from real file content, but never
  // actually forwarded it (or any files) to geminiAiService.analyzeRepository -
  // it was silently dropped. Every analysis was generated from repo
  // metadata alone, with no real source code ever reaching Gemini.
  const result = await geminiAiService.analyzeRepository({
    repoFullName,
    repoDescription,
    primaryLanguage,
    taskId,
    repoId,
    files,
  });

  const reportData = {
    overallScore: result.overallScore,
    securityScore: result.securityScore,
    performanceScore: result.performanceScore,
    architectureScore: result.architectureScore,
    maintainabilityScore: result.maintainabilityScore,
    documentationScore: result.documentationScore,
    summary: result.summary,
    recommendations: result.recommendations,
    findings: result.findings,
  };

  return {
    ...result,
    reportData,
    modelName: result.modelName,
    modelVersion: result.modelVersion,
  };
}

export const callGeminiWithRetry = geminiAiService.analyzeRepository.bind(geminiAiService);
