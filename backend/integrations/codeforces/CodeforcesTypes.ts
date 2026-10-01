export interface CodeforcesRawUser {
  handle: string;
  rating?: number;
  maxRating?: number;
  rank?: string;
  maxRank?: string;
  contribution: number;
  friendOfCount: number;
  titlePhoto?: string;
  organization?: string;
  avatar?: string;
  registrationTimeSeconds?: number;
}

export interface CodeforcesRawRatingChange {
  contestId: number;
  contestName: string;
  handle: string;
  rank: number;
  ratingUpdateTimeSeconds: number;
  oldRating: number;
  newRating: number;
}

export interface CodeforcesRawProblem {
  contestId?: number;
  index: string;
  name: string;
  type?: string;
  points?: number;
  rating?: number;
  tags: string[];
}

export interface CodeforcesRawMember {
  handle: string;
}

export interface CodeforcesRawParty {
  contestId?: number;
  members: CodeforcesRawMember[];
  participantType: string;
  ghost: boolean;
  room?: number;
  startTimeSeconds?: number;
}

export interface CodeforcesRawSubmission {
  id: number;
  contestId?: number;
  creationTimeSeconds: number;
  relativeTimeSeconds: number;
  problem: CodeforcesRawProblem;
  author: CodeforcesRawParty;
  programmingLanguage: string;
  verdict?: string; // "OK", "WRONG_ANSWER", etc.
  testset: string;
  passedTestCount: number;
  timeConsumedMillis: number;
  memoryConsumedBytes: number;
}

export interface CodeforcesApiResponse<T> {
  status: 'OK' | 'FAILED';
  result?: T;
  comment?: string;
}

export interface CodeforcesNormalizedData {
  user: CodeforcesRawUser;
  ratingHistory: CodeforcesRawRatingChange[];
  submissions: CodeforcesRawSubmission[];
}
