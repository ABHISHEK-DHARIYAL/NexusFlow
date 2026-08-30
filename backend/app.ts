import express from 'express';
import cookieParser from 'cookie-parser';
import { helmetMiddleware, corsMiddleware, apiRateLimiter } from './middleware/security';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';
import { NotFoundError } from './utils/errors';

export const createApp = (): express.Application => {
  const app = express();

  // Express trust proxy setting for reverse proxies / Cloud Run
  app.set('trust proxy', 1);

  // Core Security & Utilities
  app.use(helmetMiddleware);
  app.use(corsMiddleware);
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Logging
  app.use(requestLogger);

  // Rate Limiter
  app.use('/api/', apiRateLimiter);

  // Application Routes
  app.use(routes);

  // 404 Handler
  app.use((_req, _res, next) => {
    next(new NotFoundError('Requested API endpoint does not exist'));
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
};

export default createApp;
