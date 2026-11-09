import {
  CrossPlatformDiscrepancy,
  DiscrepancyCategory,
  DiscrepancySeverity,
  CrossPlatformPlatform,
} from '../../../types';

export class DiscrepancyDetector {
  private static idCounter = 1;

  public static createDiscrepancy(params: {
    category: DiscrepancyCategory;
    sourceA: CrossPlatformPlatform;
    sourceB: CrossPlatformPlatform;
    claim: string;
    observedValueA: string | number;
    observedValueB: string | number;
    severity: DiscrepancySeverity;
    explanation: string;
    recommendedAction?: string;
  }): CrossPlatformDiscrepancy {
    return {
      id: `disc_${Date.now()}_${DiscrepancyDetector.idCounter++}`,
      category: params.category,
      sourceA: params.sourceA,
      sourceB: params.sourceB,
      claim: params.claim,
      observedValueA: params.observedValueA,
      observedValueB: params.observedValueB,
      severity: params.severity,
      explanation: params.explanation,
      recommendedAction: params.recommendedAction || 'Update resume or sync connected profile data.',
      timestamp: new Date().toISOString(),
    };
  }

  public static sanitizeExplanation(text: string): string {
    return text
      .replace(/\bfake\b/gi, 'unverified')
      .replace(/\blie[sd]?\b|\blying\b/gi, 'differing entry')
      .replace(/\bliar\b/gi, 'candidate')
      .replace(/\bfraud\b/gi, 'inconsistency')
      .replace(/\bcheating\b|\bcheat\b/gi, 'unverified claim');
  }
}
