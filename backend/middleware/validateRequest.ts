import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

export const validateRequest = (schema: ZodTypeAny) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
        cookies: req.cookies,
      });
      if (parsed && typeof parsed === 'object') {
        if ('body' in parsed) req.body = parsed.body;
        if ('query' in parsed) req.query = parsed.query as any;
        if ('params' in parsed) req.params = parsed.params as any;
      }
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((issue) => ({
          field: issue.path.join('.').replace(/^(body|query|params)\./, ''),
          message: issue.message,
        }));
        return next(new ValidationError('Invalid request data', formattedErrors));
      }
      return next(error);
    }
  };
};

export default validateRequest;
