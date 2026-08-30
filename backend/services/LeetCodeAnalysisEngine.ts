import { LeetCodeRawContest, LeetCodeRawProfile, LeetCodeRawTopicStat } from '../integrations/leetcode/LeetCodeTypes';
import { LeetCodeDeterministicMetrics } from '../../types';

export class LeetCodeAnalysisEngine {
  public computeDeterministicMetrics(
    profile: LeetCodeRawProfile,
    contests: LeetCodeRawContest[],
    topicStats: LeetCodeRawTopicStat[]
  ): LeetCodeDeterministicMetrics {
    const { easySolved, mediumSolved, hardSolved, streak } = profile;
    const totalSolved = easySolved + mediumSolved + hardSolved || profile.totalSolved;

    // 1. Compute DSA Score (0 - 100)
    // a. Volume & Difficulty Weighting (max 40 pts)
    const weightedPoints = easySolved * 0.2 + mediumSolved * 0.5 + hardSolved * 1.0;
    const volumeScore = Math.min(40, (weightedPoints / 100) * 40);

    // b. Topic Breadth (max 25 pts)
    const keyTopics = [
      'Arrays',
      'Strings',
      'Hash Table',
      'Two Pointers',
      'Binary Search',
      'Trees',
      'Graphs',
      'Dynamic Programming',
      'Sliding Window',
      'Stack',
      'Heap',
      'Greedy',
      'Backtracking',
    ];

    const coveredTopics = topicStats.filter(
      (t) => keyTopics.some((kt) => kt.toLowerCase() === t.topicName.toLowerCase()) && t.solvedCount >= 5
    );
    const breadthScore = Math.min(25, (coveredTopics.length / Math.min(10, keyTopics.length)) * 25);

    // c. Contest Performance (max 20 pts)
    const latestContest = contests.length > 0 ? contests[contests.length - 1] : null;
    const contestRating = latestContest ? latestContest.rating : profile.contestRating || 0;
    let maxRating = profile.maxRating || contestRating;
    for (const c of contests) {
      if (c.rating > maxRating) maxRating = c.rating;
    }

    let contestScore = 5; // Default base
    if (contestRating > 1200) {
      contestScore = Math.min(20, 5 + ((contestRating - 1200) / 600) * 15);
    }

    // d. Consistency & Streak (max 15 pts)
    const consistencyScore = Math.min(15, Math.round(streak * 0.75) + Math.min(5, Math.round(totalSolved / 50)));

    const rawDsaScore = volumeScore + breadthScore + contestScore + consistencyScore;
    const dsaScore = Math.min(100, Math.max(0, Math.round(rawDsaScore)));

    // 2. Rating Trend
    let ratingTrend: 'IMPROVING' | 'DECREASING' | 'STABLE' | 'VOLATILE' | 'NO_DATA' = 'NO_DATA';
    if (contests.length >= 2) {
      const first = contests[0].rating;
      const last = contests[contests.length - 1].rating;
      const diff = last - first;

      let changesSum = 0;
      for (let i = 1; i < contests.length; i++) {
        changesSum += Math.abs(contests[i].rating - contests[i - 1].rating);
      }
      const avgChange = changesSum / (contests.length - 1);

      if (avgChange > 45) {
        ratingTrend = 'VOLATILE';
      } else if (diff >= 30) {
        ratingTrend = 'IMPROVING';
      } else if (diff <= -30) {
        ratingTrend = 'DECREASING';
      } else {
        ratingTrend = 'STABLE';
      }
    } else if (contests.length === 1) {
      ratingTrend = 'STABLE';
    }

    // 3. Topic Strengths & Weaknesses
    const strongTopics: string[] = [];
    const weakTopics: string[] = [];

    for (const topic of topicStats) {
      if (topic.solvedCount >= 25 || topic.mediumCount + topic.hardCount >= 15) {
        strongTopics.push(topic.topicName);
      } else if (topic.solvedCount < 10 || (['Dynamic Programming', 'Graphs', 'Backtracking', 'Trees'].includes(topic.topicName) && topic.hardCount === 0)) {
        weakTopics.push(topic.topicName);
      }
    }

    // Fallback topic categorization if empty
    if (strongTopics.length === 0 && topicStats.length > 0) {
      strongTopics.push(...topicStats.slice(0, 3).map((t) => t.topicName));
    }

    // 4. Recommendation Signals
    const recommendationSignals: string[] = [];
    if (hardSolved < 20) {
      recommendationSignals.push('Low hard-problem exposure (less than 20 solved). Focus on Hard difficulty problems to master edge cases.');
    }
    if (weakTopics.includes('Dynamic Programming') || weakTopics.includes('dynamic-programming')) {
      recommendationSignals.push('Dynamic Programming is identified as a weak area. Practice 1D and 2D DP pattern problems.');
    }
    if (weakTopics.includes('Graphs') || weakTopics.includes('graphs')) {
      recommendationSignals.push('Graph algorithms (BFS, DFS, Dijkstra, Union-Find) need stronger problem coverage.');
    }
    if (contests.length < 3) {
      recommendationSignals.push('Participate in regular LeetCode Weekly or Biweekly contests to improve speed under time pressure.');
    }
    if (streak < 7) {
      recommendationSignals.push('Build a continuous problem-solving streak to maintain conceptual retention and speed.');
    }

    return {
      dsaScore,
      totalSolved,
      easySolved,
      mediumSolved,
      hardSolved,
      contestRating,
      maxRating,
      globalRanking: profile.ranking || null,
      ratingTrend,
      streak,
      strongTopics,
      weakTopics,
      consistencyScore,
      recommendationSignals,
    };
  }

  public classifyTopicStrength(solvedCount: number, easyCount: number, mediumCount: number, hardCount: number): 'STRONG' | 'MODERATE' | 'WEAK' {
    if (solvedCount >= 25 || (mediumCount >= 12 && hardCount >= 3)) {
      return 'STRONG';
    }
    if (solvedCount < 10) {
      return 'WEAK';
    }
    return 'MODERATE';
  }
}

export const leetCodeAnalysisEngine = new LeetCodeAnalysisEngine();
