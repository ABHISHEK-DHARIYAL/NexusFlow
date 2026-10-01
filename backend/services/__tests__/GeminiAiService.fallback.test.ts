import { describe, it, expect, vi, beforeEach } from 'vitest';

// Regression test: when Gemini is unavailable, the fallback report must be
// clearly and persistently labelled as simulated/placeholder data, never
// indistinguishable from a genuine AI analysis result.

vi.mock('../config/aiConfig', () => ({
  aiConfig: {
    getApiKey: () => undefined,
    getModel: () => 'gemini-3.6-flash',
    getTimeoutMs: () => 30000,
    getMaxOutputTokens: () => 8192,
    maxInputBytes: 60 * 1024,
    maxTotalInputBytes: 60 * 1024,
    maxFilesPerAnalysis: 25,
    maxSingleFileBytes: 30 * 1024,
    secretFilePatterns: [],
    secretContentRegexes: [],
  },
}));

import { GeminiAiService } from '../GeminiAiService';

describe('GeminiAiService - fallback report transparency', () => {
  let service: GeminiAiService;

  beforeEach(() => {
    service = new GeminiAiService();
  });

  it('clearly labels the fallback report as simulated, not real AI analysis', async () => {
    const result = await service.analyzeRepository({
      repoFullName: 'org/repo',
      repoDescription: 'a real project',
      primaryLanguage: 'TypeScript',
      taskId: 'task1',
      repoId: 'repo1',
      files: [],
    });

    expect(result.summary).toContain('SIMULATED');
    expect(result.modelName).not.toBe('gemini-3.6-flash');
    expect(result.modelName.toLowerCase()).toContain('simulated');
    for (const finding of result.findings) {
      expect(finding.title).toContain('[SIMULATED]');
    }
  });
});
