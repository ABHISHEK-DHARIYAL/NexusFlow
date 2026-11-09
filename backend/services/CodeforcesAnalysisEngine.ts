import {
  CodeforcesRawUser,
  CodeforcesRawRatingChange,
  CodeforcesRawSubmission
} from '../integrations/codeforces/CodeforcesTypes';
import { CodeforcesDeterministicMetrics } from '../../types';

export class CodeforcesAnalysisEngine {
  /**
   * Computes deterministic metrics for Codeforces profile, contest history, and submissions.
   */
  public computeMetrics(
    user: CodeforcesRawUser,
    ratingHistory: CodeforcesRawRatingChange[],
    submissions: CodeforcesRawSubmission[]
  ): CodeforcesDeterministicMetrics {
    const currentRating = user.rating ?? 0;
    const maxRating = user.maxRating ?? currentRating;
    const currentRank = user.rank || 'Unrated';
    const maxRank = user.maxRank || currentRank;
    const contestCount = ratingHistory.length;

    // Filter OK (passed) submissions
    const okSubmissions = submissions.filter((s) => s.verdict === 'OK');

    // Deduplicate solved problems by problem key (contestId-index or name)
    const solvedProblemKeys = new Set<string>();
    const solvedProblemsWithRating: { rating: number; tags: string[] }[] = [];
    const tagCountMap = new Map<string, { count: number; ratingSum: number; ratingCount: number }>();
    const difficultyDistribution: Record<string, number> = {
      '<1000': 0,
      '1000-1199': 0,
      '1200-1399': 0,
      '1400-1599': 0,
      '1600-1799': 0,
      '1800+': 0
    };

    for (const sub of okSubmissions) {
      if (!sub.problem) continue;
      const p = sub.problem;
      const key = p.contestId ? `${p.contestId}-${p.index}` : p.name;
      if (solvedProblemKeys.has(key)) continue;
      solvedProblemKeys.add(key);

      const rating = p.rating ?? 800;
      solvedProblemsWithRating.push({ rating, tags: p.tags || [] });

      // Difficulty distribution
      if (rating < 1000) difficultyDistribution['<1000']++;
      else if (rating < 1200) difficultyDistribution['1000-1199']++;
      else if (rating < 1400) difficultyDistribution['1200-1399']++;
      else if (rating < 1600) difficultyDistribution['1400-1599']++;
      else if (rating < 1800) difficultyDistribution['1600-1799']++;
      else difficultyDistribution['1800+']++;

      // Tag statistics
      for (const tag of p.tags || []) {
        const cleanTag = tag.trim().toLowerCase();
        if (!cleanTag) continue;
        const curr = tagCountMap.get(cleanTag) || { count: 0, ratingSum: 0, ratingCount: 0 };
        curr.count++;
        if (p.rating) {
          curr.ratingSum += p.rating;
          curr.ratingCount++;
        }
        tagCountMap.set(cleanTag, curr);
      }
    }

    const totalProblemsSolved = solvedProblemKeys.size;

    // Categorize Tags into Strong & Weak
    const strongTags: string[] = [];
    const weakTags: string[] = [];

    tagCountMap.forEach((stats, tag) => {
      const avgDiff = stats.ratingCount > 0 ? stats.ratingSum / stats.ratingCount : 1000;
      if (stats.count >= 12 || (stats.count >= 6 && avgDiff >= 1500)) {
        strongTags.push(tag);
      } else if (stats.count < 4 || (stats.count < 8 && avgDiff < 1100)) {
        weakTags.push(tag);
      }
    });

    // Rating Trend
    const ratingTrend = this.calculateRatingTrend(ratingHistory);

    // Consistency Score
    const consistencyScore = this.calculateConsistencyScore(ratingHistory, okSubmissions);

    // CP Score (0-100)
    const cpScore = this.calculateCpScore(
      currentRating,
      maxRating,
      totalProblemsSolved,
      solvedProblemsWithRating,
      contestCount,
      consistencyScore
    );

    // Recommendation Signals
    const recommendationSignals = this.generateRecommendationSignals(
      currentRating,
      maxRating,
      totalProblemsSolved,
      strongTags,
      weakTags,
      difficultyDistribution,
      ratingTrend
    );

    return {
      cpScore,
      currentRating,
      maxRating,
      currentRank,
      maxRank,
      ratingTrend,
      contestCount,
      totalProblemsSolved,
      strongTags: strongTags.slice(0, 8),
      weakTags: weakTags.slice(0, 8),
      difficultyDistribution,
      consistencyScore,
      recommendationSignals
    };
  }

  private calculateRatingTrend(
    ratingHistory: CodeforcesRawRatingChange[]
  ): 'IMPROVING' | 'DECLINING' | 'STABLE' | 'VOLATILE' | 'NO_DATA' {
    if (ratingHistory.length === 0) return 'NO_DATA';
    if (ratingHistory.length < 3) {
      const last = ratingHistory[ratingHistory.length - 1];
      const diff = last.newRating - last.oldRating;
      if (diff >= 30) return 'IMPROVING';
      if (diff <= -30) return 'DECLINING';
      return 'STABLE';
    }

    const recent = ratingHistory.slice(-5);
    const totalChange = recent[recent.length - 1].newRating - recent[0].oldRating;

    // Check swings / volatility
    let maxSwing = 0;
    for (let i = 0; i < recent.length; i++) {
      const delta = Math.abs(recent[i].newRating - recent[i].oldRating);
      if (delta > maxSwing) maxSwing = delta;
    }

    if (maxSwing >= 90) return 'VOLATILE';
    if (totalChange >= 40) return 'IMPROVING';
    if (totalChange <= -40) return 'DECLINING';
    return 'STABLE';
  }

  private calculateConsistencyScore(
    ratingHistory: CodeforcesRawRatingChange[],
    okSubmissions: CodeforcesRawSubmission[]
  ): number {
    if (ratingHistory.length === 0 && okSubmissions.length === 0) {
      return 0;
    }

    let score = 50; // Base score

    // Contest participation bonus
    if (ratingHistory.length >= 10) score += 20;
    else score += ratingHistory.length * 2;

    // Submission volume bonus
    if (okSubmissions.length >= 50) score += 20;
    else score += Math.floor(okSubmissions.length * 0.4);

    // Recent activity check (within last 90 days)
    const nowSec = Math.floor(Date.now() / 1000);
    const ninetyDaysSec = 90 * 86400;
    const recentSubs = okSubmissions.filter((s) => nowSec - s.creationTimeSeconds <= ninetyDaysSec);

    if (recentSubs.length >= 15) score += 10;
    else if (recentSubs.length >= 5) score += 5;

    return Math.min(100, Math.max(10, score));
  }

  private calculateCpScore(
    rating: number,
    maxRating: number,
    totalSolved: number,
    solvedWithRating: { rating: number }[],
    contestCount: number,
    consistencyScore: number
  ): number {
    // 1. Rating component (max 40 pts)
    let ratingPts = 0;
    if (rating <= 800) {
      ratingPts = (rating / 800) * 12;
    } else if (rating <= 1200) {
      ratingPts = 12 + ((rating - 800) / 400) * 10; // 12 -> 22
    } else if (rating <= 1600) {
      ratingPts = 22 + ((rating - 1200) / 400) * 8;  // 22 -> 30
    } else if (rating <= 2000) {
      ratingPts = 30 + ((rating - 1600) / 400) * 6;  // 30 -> 36
    } else {
      ratingPts = 36 + Math.min(4, ((rating - 2000) / 400) * 4); // max 40
    }

    // 2. Problem volume & difficulty capability component (max 25 pts)
    const volumePts = Math.min(15, (totalSolved / 100) * 15);
    const hardSolved = solvedWithRating.filter((p) => p.rating >= 1400).length;
    const hardBonus = Math.min(10, (hardSolved / 25) * 10);
    const problemPts = volumePts + hardBonus;

    // 3. Contest experience component (max 20 pts)
    const contestExpPts = Math.min(10, (contestCount / 20) * 10);
    const peakBonus = Math.min(10, Math.max(0, (maxRating - 1000) / 100));
    const contestPts = contestExpPts + peakBonus;

    // 4. Consistency component (max 15 pts)
    const consistencyPts = (consistencyScore / 100) * 15;

    const total = ratingPts + problemPts + contestPts + consistencyPts;
    return Math.round(Math.min(100, Math.max(0, total)) * 10) / 10;
  }

  private generateRecommendationSignals(
    rating: number,
    maxRating: number,
    totalSolved: number,
    strongTags: string[],
    weakTags: string[],
    difficultyDistribution: Record<string, number>,
    ratingTrend: string
  ): string[] {
    const signals: string[] = [];

    if (rating < 1200) {
      signals.push('Focus on fundamental problem solving (ratings 800-1100) in Implementation and Math.');
    } else if (rating < 1500) {
      signals.push('Build strength in Greedy algorithms, Binary Search, and basic Data Structures (1200-1400 rating).');
    } else {
      signals.push('Practice Advanced Dynamic Programming, Graph algorithms, and Segment Trees (1500+ rating).');
    }

    if (maxRating - rating >= 80) {
      signals.push(`Address rating drop of ${maxRating - rating} points by reviewing recent contest errors.`);
    }

    if (weakTags.length > 0) {
      signals.push(`Target practice in weaker tag areas: ${weakTags.slice(0, 3).join(', ')}.`);
    }

    if ((difficultyDistribution['1400-1599'] || 0) < 5 && rating >= 1200) {
      signals.push('Increase volume of 1400-1600 rating problems to unlock the next rating tier.');
    }

    if (ratingTrend === 'DECLINING' || ratingTrend === 'VOLATILE') {
      signals.push('Stabilize contest performance by prioritizing speed on initial problems (A & B) during Div 2/3 rounds.');
    }

    return signals;
  }
}
