import { Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { PortfolioService } from '../services/PortfolioService';
import { BadRequestError } from '../utils/errors';

const portfolioService = new PortfolioService();

export const connectPortfolio = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestError('User authentication required.');
    }

    const { url } = req.body;
    if (!url) {
      throw new BadRequestError('Portfolio URL is required.');
    }

    const result = await portfolioService.connectPortfolio(userId, url);
    res.status(result.isExisting ? 200 : 202).json({
      success: true,
      message: result.isExisting
        ? 'A portfolio analysis is already in progress or completed.'
        : 'Portfolio crawl and analysis initiated successfully.',
      data: result
    });
  } catch (err) {
    next(err);
  }
};

export const getPortfolio = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestError('User authentication required.');
    }

    const portfolio = await portfolioService.getPortfolio(userId);
    res.json({
      success: true,
      data: portfolio
    });
  } catch (err) {
    next(err);
  }
};

export const getPages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestError('User authentication required.');
    }

    const pages = await portfolioService.getPages(userId);
    res.json({
      success: true,
      data: pages
    });
  } catch (err) {
    next(err);
  }
};

export const getProjects = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestError('User authentication required.');
    }

    const projects = await portfolioService.getProjects(userId);
    res.json({
      success: true,
      data: projects
    });
  } catch (err) {
    next(err);
  }
};

export const getAnalysis = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestError('User authentication required.');
    }

    const analysis = await portfolioService.getAnalysis(userId);
    res.json({
      success: true,
      data: analysis
    });
  } catch (err) {
    next(err);
  }
};

export const deletePortfolio = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestError('User authentication required.');
    }

    const result = await portfolioService.deletePortfolio(userId);
    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
};
