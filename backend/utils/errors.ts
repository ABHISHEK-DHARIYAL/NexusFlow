export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors?: any[];

  constructor(message: string, statusCode = 500, isOperational = true, errors?: any[]) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request', errors?: any[]) {
    super(message, 400, true, errors);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, true);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, true);
  }
}

export class SecurityError extends AppError {
  constructor(message = 'Security violation detected') {
    super(message, 403, true);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource Not Found') {
    super(message, 404, true);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource Conflict') {
    super(message, 409, true);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation Error', errors?: any[]) {
    super(message, 422, true, errors);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal Server Error') {
    super(message, 500, false);
  }
}

export class GithubApiError extends AppError {
  public readonly githubStatus?: number;

  constructor(message: string, githubStatus?: number) {
    // Map GitHub HTTP status codes to standard app error status codes
    let statusCode = 502; // Default Bad Gateway / Upstream Error
    if (githubStatus === 401) statusCode = 401;
    else if (githubStatus === 403) statusCode = 403;
    else if (githubStatus === 404) statusCode = 404;
    else if (githubStatus === 409) statusCode = 409;
    else if (githubStatus === 422) statusCode = 422;
    else if (githubStatus === 429) statusCode = 429;

    super(message, statusCode, true);
    this.githubStatus = githubStatus;
  }
}

