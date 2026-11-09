import { describe, it, expect } from 'vitest';
import { ResumeAnalyzer } from '../ResumeAnalyzer';

// Regression test for a confirmed gap: the Gemini prompt for rewriting
// resume bullets ("improvedVersion") had no instruction preventing it from
// inventing quantifiable metrics not present in the original text - the
// exact "Built a Java application" -> "...serving 1M users" scenario this
// audit explicitly warns against. This tests the defense-in-depth
// post-processing guard added alongside the prompt-level instruction.

describe('ResumeAnalyzer - anti-fabrication guard for bullet rewrites', () => {
  const analyzer = new ResumeAnalyzer() as any;

  it('strips a rewrite that introduces a metric not present anywhere in the resume', () => {
    const evalItem = {
      original: 'Built a Java application for internal tooling',
      improvedVersion: 'Built a Java application serving 1M users, reducing latency by 40%',
      feedback: 'Good verb choice.',
      hasQuantifiableMetric: true,
    };

    const result = analyzer.guardAgainstFabricatedMetrics(evalItem, 'built a java application for internal tooling');

    expect(result.improvedVersion).toBe(evalItem.original);
    expect(result.hasQuantifiableMetric).toBe(false);
    expect(result.feedback).toContain('removed');
  });

  it('keeps a rewrite whose numbers genuinely appear in the original resume text', () => {
    const evalItem = {
      original: 'Reduced API latency by 40% for 10 microservices',
      improvedVersion: 'Reduced API latency by 40% across 10 microservices, improving reliability',
      feedback: 'Strong metric usage.',
      hasQuantifiableMetric: true,
    };

    const resumeText = 'worked on backend systems. reduced api latency by 40% for 10 microservices in production.';
    const result = analyzer.guardAgainstFabricatedMetrics(evalItem, resumeText);

    expect(result.improvedVersion).toBe(evalItem.improvedVersion);
    expect(result.hasQuantifiableMetric).toBe(true);
  });

  it('leaves rewrites with no numbers untouched', () => {
    const evalItem = {
      original: 'Worked on the checkout flow',
      improvedVersion: 'Redesigned the checkout flow to improve conversion and reduce friction',
      feedback: 'Better verb, still needs a metric.',
      hasQuantifiableMetric: false,
    };

    const result = analyzer.guardAgainstFabricatedMetrics(evalItem, 'worked on the checkout flow');

    expect(result.improvedVersion).toBe(evalItem.improvedVersion);
  });
});
