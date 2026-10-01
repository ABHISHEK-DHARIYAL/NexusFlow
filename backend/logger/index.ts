import winston from 'winston';
import { env } from '../config/env';

const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, category, ...meta }) => {
    const cat = category ? `[${category}] ` : '';
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level}: ${cat}${message}${metaStr}`;
  })
);

export const rootLogger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: customFormat,
  defaultMeta: { service: 'nexusflow-backend' },
  transports: [
    new winston.transports.Console({
      format: env.NODE_ENV === 'production' ? customFormat : consoleFormat,
    }),
  ],
});

export const createCategoryLogger = (category: string) => {
  return {
    info: (message: string, meta?: Record<string, any>) =>
      rootLogger.info(message, { category, ...meta }),
    warn: (message: string, meta?: Record<string, any>) =>
      rootLogger.warn(message, { category, ...meta }),
    error: (message: string, meta?: Record<string, any>) =>
      rootLogger.error(message, { category, ...meta }),
    debug: (message: string, meta?: Record<string, any>) =>
      rootLogger.debug(message, { category, ...meta }),
  };
};

export const logger = {
  root: rootLogger,
  auth: createCategoryLogger('auth'),
  repository: createCategoryLogger('repository'),
  worker: createCategoryLogger('worker'),
  ai: createCategoryLogger('ai'),
  database: createCategoryLogger('database'),
  system: createCategoryLogger('system'),
  http: createCategoryLogger('http'),
};

export default logger;
