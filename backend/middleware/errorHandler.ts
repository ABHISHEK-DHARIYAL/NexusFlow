import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../logger';
import { env } from '../config/env';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: any[] | undefined = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if ((err as any).code === 'P2002') {
    statusCode = 409;
    message = 'A record with these details already exists';
  } else if (['P1000', 'P1001', 'P1002', 'P1003', 'P1008', 'P1017'].includes((err as any).code)) {
    statusCode = 503;
    message = 'Database is unreachable. Check DATABASE_URL on the server.';
  } else if (['P2021', 'P2022'].includes((err as any).code)) {
    statusCode = 503;
    message = 'Database tables are missing or outdated. Run "npx prisma migrate deploy" on the server.';
  } else if ((err as any).name === 'PrismaClientInitializationError') {
    statusCode = 503;
    message = 'Database is unreachable. Check DATABASE_URL on the server.';
  } else if (err.name === 'SyntaxError') {
    statusCode = 400;
    message = 'Malformed JSON Payload';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  }

  // Log error
  if (statusCode >= 500) {
    logger.http.error(`[${req.method}] ${req.path} - ${statusCode} - ${err.message}`, {
      stack: err.stack,
      body: req.body,
    });
  } else {
    logger.http.warn(`[${req.method}] ${req.path} - ${statusCode} - ${err.message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default errorHandler;
