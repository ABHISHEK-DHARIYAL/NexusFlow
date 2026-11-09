import { describe, it, expect } from 'vitest';
import { AIInputSelectionStrategy } from '../AIInputSelectionStrategy';

// Regression test for a severe confirmed bug: AIAnalysisService always
// passed content: null for every file, so selectContext() fell back to a
// hardcoded "content truncated or unavailable" placeholder for every single
// file - meaning Gemini never saw any real source code, and every AI
// analysis report (scores, findings) was generated from file paths and
// repo metadata alone. The fix adds a candidate-selection step
// (selectCandidatePaths) so the caller can fetch real content only for the
// files that are actually going to be analyzed, before the final
// budget-aware selection in selectContext.

describe('AIInputSelectionStrategy - candidate selection for real content fetching', () => {
  const strategy = new AIInputSelectionStrategy();

  it('selectCandidatePaths ranks files by the same priority order used for final selection', () => {
    const files = [
      { path: 'src/random-util.ts', size: 100 },
      { path: 'README.md', size: 100 },
      { path: 'package.json', size: 100 },
      { path: 'src/index.ts', size: 100 },
    ];

    const candidates = strategy.selectCandidatePaths(files, 4);
    const paths = candidates.map((c) => c.path);

    // README, package.json, and index.ts are all higher-priority than an
    // arbitrary util file, so the util file should rank last.
    expect(paths.indexOf('src/random-util.ts')).toBe(paths.length - 1);
  });

  it('selectCandidatePaths excludes secret files and excluded directories, matching selectContext', () => {
    const files = [
      { path: '.env', size: 50 },
      { path: 'node_modules/pkg/index.js', size: 50 },
      { path: 'src/index.ts', size: 50 },
    ];

    const candidates = strategy.selectCandidatePaths(files, 10);
    const paths = candidates.map((c) => c.path);

    expect(paths).not.toContain('.env');
    expect(paths).not.toContain('node_modules/pkg/index.js');
    expect(paths).toContain('src/index.ts');
  });

  it('selectCandidatePaths respects the requested limit', () => {
    const files = Array.from({ length: 50 }, (_, i) => ({ path: `src/file${i}.ts`, size: 10 }));
    const candidates = strategy.selectCandidatePaths(files, 5);
    expect(candidates.length).toBe(5);
  });

  it('selectContext uses real content when populated instead of the placeholder', () => {
    const files = [{ path: 'src/index.ts', content: 'const real = "actual source code";', size: 40 }];
    const result = strategy.selectContext(files);

    expect(result.formattedContext).toContain('actual source code');
    expect(result.formattedContext).not.toContain('content truncated or unavailable');
  });

  it('selectContext still falls back gracefully to the placeholder when content genuinely could not be fetched', () => {
    const files = [{ path: 'src/index.ts', content: null, size: 40 }];
    const result = strategy.selectContext(files);

    expect(result.formattedContext).toContain('content truncated or unavailable');
  });
});
