export interface LeetCodeRawProfile {
  username: string;
  realName?: string;
  profileUrl: string;
  ranking?: number;
  reputation?: number;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  acceptanceRate: number;
  streak: number;
  contestRating?: number;
  maxRating?: number;
}

export interface LeetCodeRawContest {
  contestName: string;
  contestDate: Date;
  rating: number;
  ranking: number;
  problemsSolved: number;
  totalProblems: number;
  score: number;
  ratingChange: number;
}

export interface LeetCodeRawTopicStat {
  topicName: string;
  solvedCount: number;
  easyCount: number;
  mediumCount: number;
  hardCount: number;
}

export interface LeetCodeFetchDataResult {
  profile: LeetCodeRawProfile;
  contests: LeetCodeRawContest[];
  topicStats: LeetCodeRawTopicStat[];
}
