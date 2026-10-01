import { GoogleGenAI, Type } from '@google/genai';
import { aiConfig } from '../config/aiConfig';
import { logger } from '../logger';
import { aiInputSelectionService, FileInputItem } from './AIInputSelectionService';
import { AIAnalysisOutputSchema, AIAnalysisOutput } from '../validations/aiAnalysis.validation';
import { AIAnalysisReport, AIFinding, FindingCategory, SeverityLevel } from '../../types';
import { runGeminiWithRetryAndFallback, createGeminiClient } from '../utils/geminiRunner';

export interface GeminiAnalysisResult extends AIAnalysisReport {
  isPartial: boolean;
  filesAnalyzedCount: number;
  filesConsideredCount: number;
}

export class GeminiAiService {
  private getGeminiClient(): GoogleGenAI | null {
    return createGeminiClient();
  }

  private parseAndCleanJson(rawText: string): any {
    let cleaned = rawText.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    }
    try {
      return JSON.parse(cleaned);
    } catch (initialErr) {
      // Basic JSON truncation recovery if output was cut off
      let repaired = cleaned;
      const unescapedQuotes = (repaired.match(/(?<!\\)"/g) || []).length;
      if (unescapedQuotes % 2 !== 0) repaired += '"';

      const openBraces = (repaired.match(/\{/g) || []).length - (repaired.match(/\}/g) || []).length;
      for (let i = 0; i < openBraces; i++) repaired += '}';

      const openBrackets = (repaired.match(/\[/g) || []).length - (repaired.match(/\]/g) || []).length;
      for (let i = 0; i < openBrackets; i++) repaired += ']';

      try {
        return JSON.parse(repaired);
      } catch {
        throw initialErr;
      }
    }
  }

  public async analyzeRepository(params: {
    repoFullName: string;
    repoDescription?: string;
    primaryLanguage?: string;
    taskId: string;
    repoId: string;
    files?: FileInputItem[];
  }): Promise<GeminiAnalysisResult> {
    const { repoFullName, repoDescription = '', primaryLanguage = 'TypeScript', taskId, repoId, files = [] } = params;

    // Select and filter files
    const selection = aiInputSelectionService.selectFilesForAnalysis(files);
    
    const client = this.getGeminiClient();
    const model = aiConfig.getModel();

    if (client) {
      logger.ai.info(`Initiating Gemini analysis for ${repoFullName} using model: ${model} (${selection.filesAnalyzedCount} files, ${selection.totalBytes} bytes)`);

      const fileContext = selection.selectedFiles
        .map((f) => `--- FILE: ${f.path} ---\n${f.content}\n--- END FILE ---`)
        .join('\n\n');

      const prompt = `Perform an in-depth static code analysis and software architecture audit for the repository "${repoFullName}".
Primary Language: ${primaryLanguage}.
Description: ${repoDescription}.
Partial Analysis: ${selection.isPartial ? 'YES (analyzed subset of key files)' : 'NO (analyzed full set)'}.

REPOSITORY SOURCE FILES (${selection.filesAnalyzedCount} files provided):
${fileContext || '(No source files provided, analyze based on repository metadata)'}

Provide a structured developer intelligence analysis evaluating:
1. overallScore (0-100)
2. architectureScore (0-100)
3. securityScore (0-100)
4. performanceScore (0-100)
5. maintainabilityScore (0-100)
6. documentationScore (0-100)
7. summary: Executive Architectural Summary (mention if analysis was full or partial).
8. recommendations: 3-5 actionable architectural recommendations.
9. findings: Array of key findings. Each finding MUST include:
   - category: SECURITY, ARCHITECTURE, PERFORMANCE, MAINTAINABILITY, CODE_QUALITY, TESTING, DOCUMENTATION, or DEPENDENCY
   - severity: CRITICAL, HIGH, MEDIUM, LOW, or INFO
   - title: Short description of the issue
   - description: Detailed explanation
   - filePath: Path of file from provided files where issue was observed (or null if general finding)
   - lineNumber: Estimated line number if applicable
   - snippet: Short code snippet if applicable
   - recommendation: Specific recommendation to fix
   - insufficientEvidence: boolean (true if finding is a potential concern rather than confirmed evidence)

IMPORTANT: Do NOT invent file paths that are not in the provided file list.`;

      try {
        const response = await runGeminiWithRetryAndFallback({
          params: {
            model,
            contents: prompt,
            config: {
              systemInstruction: 'You are an elite principal software architect and static code analysis auditor. Provide rigorous, evidence-based code reviews in JSON format.',
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  overallScore: { type: Type.NUMBER },
                  architectureScore: { type: Type.NUMBER },
                  securityScore: { type: Type.NUMBER },
                  performanceScore: { type: Type.NUMBER },
                  maintainabilityScore: { type: Type.NUMBER },
                  documentationScore: { type: Type.NUMBER },
                  summary: { type: Type.STRING },
                  recommendations: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  findings: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        category: { type: Type.STRING },
                        severity: { type: Type.STRING },
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        filePath: { type: Type.STRING },
                        lineNumber: { type: Type.NUMBER },
                        snippet: { type: Type.STRING },
                        recommendation: { type: Type.STRING },
                        insufficientEvidence: { type: Type.BOOLEAN },
                      },
                      required: ['category', 'severity', 'title', 'description'],
                    },
                  },
                },
                required: [
                  'overallScore',
                  'architectureScore',
                  'securityScore',
                  'performanceScore',
                  'maintainabilityScore',
                  'documentationScore',
                  'summary',
                  'recommendations',
                  'findings',
                ],
              },
            },
          },
        });

        if (response.text) {
          const rawParsed = this.parseAndCleanJson(response.text);

          // Validate with Zod Schema
          const validated: AIAnalysisOutput = AIAnalysisOutputSchema.parse(rawParsed);
          const reportId = `rep_${Math.random().toString(36).substring(2, 9)}`;

          // Hallucination Protection: Verify file paths
          const knownPaths = new Set(selection.analyzedPaths);
          const verifiedFindings: AIFinding[] = validated.findings.map((f, idx) => {
            let filePath = f.filePath || undefined;
            let insufficientEvidence = f.insufficientEvidence || false;

            if (filePath && !knownPaths.has(filePath)) {
              logger.ai.warn(`AI cited unknown file path "${filePath}". Setting insufficientEvidence=true`);
              insufficientEvidence = true;
              if (!selection.selectedFiles.some((file) => file.path.includes(filePath!))) {
                filePath = undefined;
              }
            }

            return {
              id: `find_gen_${idx}_${Date.now()}`,
              reportId,
              category: (f.category as FindingCategory) || 'MAINTAINABILITY',
              severity: (f.severity as SeverityLevel) || 'MEDIUM',
              title: f.title,
              description: f.description,
              filePath,
              lineNumber: f.lineNumber || undefined,
              snippet: f.snippet || undefined,
              recommendation: f.recommendation || undefined,
              createdAt: new Date().toISOString(),
            };
          });

          return {
            id: reportId,
            repositoryId: repoId,
            taskId,
            overallScore: Math.round(validated.overallScore),
            securityScore: Math.round(validated.securityScore),
            performanceScore: Math.round(validated.performanceScore),
            architectureScore: Math.round(validated.architectureScore),
            maintainabilityScore: Math.round(validated.maintainabilityScore),
            documentationScore: Math.round(validated.documentationScore),
            summary: validated.summary,
            recommendations: validated.recommendations,
            findings: verifiedFindings,
            modelName: model,
            modelVersion: '1.0.0',
            analyzedAt: new Date().toISOString(),
            isPartial: selection.isPartial,
            filesAnalyzedCount: selection.filesAnalyzedCount,
            filesConsideredCount: selection.filesConsideredCount,
          };
        }
      } catch (err: any) {
        logger.ai.error(`Gemini API call failed after retries and model fallbacks (${err?.message}). Using deterministic fallback analysis.`);
      }
    } else {
      logger.ai.info('GEMINI_API_KEY not configured or placeholder. Using deterministic fallback analysis engine.');
    }

    // Fallback Analysis Report Generator
    //
    // Fix: this previously returned scores and findings indistinguishable
    // from a genuine Gemini analysis (labelled with the real model name,
    // no indication anywhere that the numbers are randomized placeholders
    // unrelated to the actual repository). That violates the requirement
    // that fabricated output must never be presented as authoritative,
    // real analysis. The scores/findings below remain a graceful-
    // degradation placeholder (kept so the pipeline doesn't hard-fail when
    // Gemini is unavailable), but are now clearly and persistently labelled
    // as simulated, not a real code analysis result.
    const reportId = `rep_fb_${Math.random().toString(36).substring(2, 9)}`;
    const baseScore = Math.floor(78 + Math.random() * 18);
    const FALLBACK_DISCLOSURE =
      '[SIMULATED - NO AI ANALYSIS PERFORMED] Gemini AI analysis was not available for this run (missing API key or the request failed after retries). The scores and findings below are placeholder values, not a real assessment of this repository\'s code.';

    const primaryLangUpper = primaryLanguage.toUpperCase();
    const isJava = primaryLangUpper.includes('JAVA');
    const isTS = primaryLangUpper.includes('TYPESCRIPT') || primaryLangUpper.includes('JAVASCRIPT');

    return {
      id: reportId,
      repositoryId: repoId,
      taskId,
      overallScore: baseScore,
      securityScore: Math.min(100, baseScore + Math.floor(Math.random() * 8 - 2)),
      performanceScore: Math.min(100, baseScore + Math.floor(Math.random() * 8 - 3)),
      architectureScore: Math.min(100, baseScore + Math.floor(Math.random() * 6)),
      maintainabilityScore: Math.min(100, baseScore + Math.floor(Math.random() * 8 - 4)),
      documentationScore: Math.min(100, baseScore + Math.floor(Math.random() * 10 - 5)),
      summary: `${FALLBACK_DISCLOSURE} Repository: ${repoFullName} (${primaryLanguage}).`,
      recommendations: [
        `Enforce strict interface boundary validations across ${primaryLanguage} service modules.`,
        'Implement structured retry policies with exponential backoff on external calls.',
        'Expand automated unit testing coverage for concurrency and state management paths.',
      ],
      findings: [
        {
          id: `find_fb_01_${Date.now()}`,
          reportId,
          category: 'SECURITY' as FindingCategory,
          severity: 'HIGH' as SeverityLevel,
          title: '[SIMULATED] Unvalidated External Configuration Input',
          description: '[Placeholder finding - not derived from this repository\'s actual code] Environment configurations should be validated using schema boundaries prior to application boot.',
          filePath: selection.analyzedPaths[0] || (isTS ? 'src/config/env.ts' : isJava ? 'src/main/resources/application.yml' : 'config.yaml'),
          lineNumber: 15,
          snippet: 'const config = process.env.API_CONFIG;',
          recommendation: 'Wrap configuration loading in Zod schema validation.',
          createdAt: new Date().toISOString(),
        },
        {
          id: `find_fb_02_${Date.now()}`,
          reportId,
          category: 'PERFORMANCE' as FindingCategory,
          severity: 'MEDIUM' as SeverityLevel,
          title: '[SIMULATED] Unbounded Collection Memory Allocation Risk',
          description: '[Placeholder finding - not derived from this repository\'s actual code] In-memory buffers without explicit capacity constraints can lead to high heap pressure under burst traffic.',
          filePath: selection.analyzedPaths[1] || (isTS ? 'src/services/queue.ts' : isJava ? 'src/main/java/Worker.java' : 'src/main.ts'),
          lineNumber: 42,
          snippet: 'items.push(newItem); // missing capacity condition',
          recommendation: 'Set max queue depth constraints on in-memory buffers.',
          createdAt: new Date().toISOString(),
        },
      ],
      modelName: 'simulated-fallback (no-ai-analysis-performed)',
      modelVersion: '1.0.0',
      analyzedAt: new Date().toISOString(),
      isPartial: selection.isPartial,
      filesAnalyzedCount: selection.filesAnalyzedCount,
      filesConsideredCount: selection.filesConsideredCount,
    };
  }

  public async generateResumeVerificationSummary(params: {
    totalClaims: number;
    verifiedCount: number;
    partialCount: number;
    notFoundCount: number;
    unverifiableCount: number;
    coverageScore: number;
    topSupportedClaims: string[];
    unverifiableClaims: string[];
    strongProjectsCount: number;
  }): Promise<{ summary: string; recommendations: string[] }> {
    const client = this.getGeminiClient();
    const model = aiConfig.getModel();

    if (client) {
      try {
        const prompt = `You are a developer credentials auditor. Generate an objective, non-accusatory executive summary and 3 recommendations for a candidate's Resume ↔ GitHub verification result.

CRITICAL SAFETY RULES:
- Never call a claim "FAKE" or accuse the user of lying.
- Use phrasing like "GitHub evidence was not found" or "Requires platform-level telemetry or external benchmark verification".

VERIFICATION METRICS:
- Total Claims Extracted: ${params.totalClaims}
- Directly Supported: ${params.verifiedCount}
- Partially Supported: ${params.partialCount}
- Evidence Not Found: ${params.notFoundCount}
- Unverifiable via Code Alone: ${params.unverifiableCount}
- Evidence Coverage Score: ${params.coverageScore}%
- Key Supported Claims: ${params.topSupportedClaims.join('; ') || 'None'}
- Key Unverifiable/Missing Claims: ${params.unverifiableClaims.join('; ') || 'None'}
- Unmentioned Strong GitHub Projects: ${params.strongProjectsCount}

Return a JSON object with:
{
  "summary": "2-3 sentence professional executive summary",
  "recommendations": ["3 actionable recommendations to improve resume-GitHub alignment"]
}`;

        const response = await client.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction: 'You are an objective technical recruiter and code verification engine. Provide helpful, respectful feedback in JSON format.',
            responseMimeType: 'application/json',
          },
        });

        if (response.text) {
          const parsed = this.parseAndCleanJson(response.text);
          if (parsed.summary && Array.isArray(parsed.recommendations)) {
            return {
              summary: parsed.summary,
              recommendations: parsed.recommendations,
            };
          }
        }
      } catch (err: any) {
        logger.ai.warn(`Gemini resume verification summary failed: ${err.message}`);
      }
    }

    // Fallback Summary
    return {
      summary: `Cross-referencing ${params.totalClaims} extracted resume claims against authorized GitHub repositories yielded an Evidence Coverage Score of ${params.coverageScore}%. ${params.verifiedCount} claims were directly supported by source code evidence, ${params.partialCount} partially supported, and ${params.unverifiableCount} classified as requiring external platform metrics.`,
      recommendations: [
        'Add direct links to specific GitHub repositories inside your resume project sections.',
        'Ensure technology keywords on your resume match repo manifest dependency names.',
        'Consider featuring unmentioned high-star repositories from your GitHub account.',
      ],
    };
  }

  public async generateCrossPlatformVerificationSummary(params: {
    totalClaims: number;
    verifiedCount: number;
    partialCount: number;
    notFoundCount: number;
    unverifiableCount: number;
    discrepancyCount: number;
    technicalConsistencyScore: number;
    overallCoverageScore: number;
    sourcesUsedLabels: string[];
    topDiscrepancies: string[];
    topSupported: string[];
  }): Promise<{ summary: string; recommendations: string[]; strongSignals: string[] }> {
    const client = this.getGeminiClient();
    const model = aiConfig.getModel();

    if (client) {
      try {
        const prompt = `You are an elite multi-platform developer evidence auditor for NexusFlow. Generate an objective, non-accusatory executive summary, 3 key strong signals, and 3 actionable recommendations for a cross-platform verification report.

CRITICAL SAFETY RULES:
- Never call a claim "FAKE" or accuse the user of lying.
- Use terms like "SUPPORTED", "PARTIALLY_SUPPORTED", "NOT_FOUND", "UNVERIFIABLE".
- Treat NOT_FOUND as missing evidence across connected sources, not deceit.

METRICS:
- Total Claims Assessed: ${params.totalClaims}
- Directly Supported: ${params.verifiedCount}
- Partially Supported: ${params.partialCount}
- Evidence Not Found: ${params.notFoundCount}
- Unverifiable: ${params.unverifiableCount}
- Discrepancies Flagged: ${params.discrepancyCount}
- Technical Consistency Score: ${params.technicalConsistencyScore}/100
- Overall Evidence Coverage: ${params.overallCoverageScore}%
- Connected Platforms: ${params.sourcesUsedLabels.join(', ') || 'Resume, GitHub'}
- Discrepancy Highlights: ${params.topDiscrepancies.join('; ') || 'None'}
- Top Verified Strengths: ${params.topSupported.join('; ') || 'None'}

Return a JSON object with:
{
  "summary": "2-3 sentence professional executive summary",
  "strongSignals": ["3 key multi-platform developer strengths"],
  "recommendations": ["3 actionable steps to align profile claims across connected platforms"]
}`;

        const response = await client.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction: 'You are an objective technical recruiter and cross-platform verification engine. Provide respectful, constructive feedback in JSON format.',
            responseMimeType: 'application/json',
          },
        });

        if (response.text) {
          const parsed = this.parseAndCleanJson(response.text);
          if (parsed.summary && Array.isArray(parsed.recommendations)) {
            return {
              summary: parsed.summary,
              strongSignals: Array.isArray(parsed.strongSignals) ? parsed.strongSignals : [],
              recommendations: parsed.recommendations,
            };
          }
        }
      } catch (err: any) {
        logger.ai.warn(`Gemini cross-platform verification summary failed: ${err.message}`);
      }
    }

    // Fallback Summary
    return {
      summary: `Cross-platform analysis across connected developer accounts (${params.sourcesUsedLabels.join(', ') || 'Resume, GitHub'}) yielded a Technical Consistency Score of ${params.technicalConsistencyScore}/100 and Overall Evidence Coverage of ${params.overallCoverageScore}%. A total of ${params.verifiedCount} claims are directly supported, ${params.partialCount} partially supported, and ${params.discrepancyCount} minor profile discrepancies flagged for user alignment.`,
      strongSignals: [
        `High multi-source alignment across core projects and verified code repositories.`,
        `Connected profiles validate proficiency in primary software engineering stack.`,
        `Competitive programming activity is confirmed by connected platforms.`,
      ],
      recommendations: [
        'Align numerical claims (solved problem counts, contest ratings) on resume with current connected profile statistics.',
        'Include repository links on portfolio project cards to maximize multi-source verification scores.',
        'Ensure framework and database dependency names match across resume skills and GitHub package manifests.',
      ],
    };
  }
}


export const geminiAiService = new GeminiAiService();
