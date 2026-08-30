export class CodeforcesError extends Error {
  constructor(message: string, public statusCode: number = 500, public code: string = 'CODEFORCES_ERROR') {
    super(message);
    this.name = 'CodeforcesError';
  }
}

export class CodeforcesNotFoundError extends CodeforcesError {
  constructor(handle: string) {
    super(`Codeforces handle '${handle}' was not found.`, 404, 'CODEFORCES_HANDLE_NOT_FOUND');
    this.name = 'CodeforcesNotFoundError';
  }
}

export class CodeforcesRateLimitError extends CodeforcesError {
  constructor() {
    super('Codeforces API rate limit exceeded. Please try again later.', 429, 'CODEFORCES_RATE_LIMIT');
    this.name = 'CodeforcesRateLimitError';
  }
}

export class CodeforcesApiError extends CodeforcesError {
  constructor(comment: string) {
    super(`Codeforces API error: ${comment}`, 502, 'CODEFORCES_API_ERROR');
    this.name = 'CodeforcesApiError';
  }
}
