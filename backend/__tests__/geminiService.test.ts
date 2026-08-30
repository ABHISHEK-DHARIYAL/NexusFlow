import { describe, it, expect, vi } from 'vitest';

// Regression tests for two confirmed bugs:
//
// 1. analyzeRepositoryWithGemini() accepted a `contextFormatted` string
//    built from real file content, but never forwarded it (or any files)
//    to geminiAiService.analyzeRepository() - it was silently dropped.
//    Every analysis was generated from repository metadata alone, never
//    from real source code, regardless of how much real content was
//    fetched upstream.
//
// 2. When Gemini was unavailable (no API key, or the call failed after
//    retries), the fallback report generator returned randomized scores
//    and generic, repository-unrelated findings labelled with the real
//    model name - indistinguishable from genuine AI analysis output, with
//    no indication anywhere that it was fabricated placeholder data.

const analyzeRepositoryMock = vi.fn();

vi.mock('../services/GeminiAiService', () => ({
  geminiAiService: {
    analyzeRepository: (...args: any[]) => analyzeRepositoryMock(...args),
  },
}));

import { analyzeRepositoryWithGemini } from '../geminiService';

describe('analyzeRepositoryWithGemini - files are actually forwarded to Gemini', () => {
  it('forwards the files array through to geminiAiService.analyzeRepository', async () => {
    analyzeRepositoryMock.mockResolvedValueOnce({
      overallScore: 80,
      securityScore: 80,
      performanceScore: 80,
      architectureScore: 80,
      maintainabilityScore: 80,
      documentationScore: 80,
      summary: 'ok',
      recommendations: [],
      findings: [],
      modelName: 'gemini-3.6-flash',
      modelVersion: '1.0.0',
    });

    const files = [{ path: 'src/index.ts', content: 'const real = "actual source code";', size: 40 }];

    await analyzeRepositoryWithGemini('org/repo', 'desc', 'TypeScript', 'task1', 'repo1', files);

    expect(analyzeRepositoryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        repoFullName: 'org/repo',
        files,
      })
    );
  });

  it('still works when no files are provided (metadata-only analysis)', async () => {
    analyzeRepositoryMock.mockResolvedValueOnce({
      overallScore: 80,
      securityScore: 80,
      performanceScore: 80,
      architectureScore: 80,
      maintainabilityScore: 80,
      documentationScore: 80,
      summary: 'ok',
      recommendations: [],
      findings: [],
      modelName: 'gemini-3.6-flash',
      modelVersion: '1.0.0',
    });

    await analyzeRepositoryWithGemini('org/repo', 'desc', 'TypeScript', 'task1', 'repo1');

    expect(analyzeRepositoryMock).toHaveBeenCalledWith(
      expect.objectContaining({ files: undefined })
    );
  });
});
