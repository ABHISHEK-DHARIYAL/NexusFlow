import { Request, Response, NextFunction } from 'express';
import { ResumeService } from '../services/ResumeService';
import { BadRequestError } from '../utils/errors';

const resumeService = new ResumeService();

export const submitResume = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id || (req as any).userId;
    if (!userId) {
      throw new BadRequestError('User authentication required.');
    }

    const { rawText, title, fileUrl } = req.body;
    if (!rawText) {
      throw new BadRequestError('rawText is required.');
    }

    const result = await resumeService.saveOrUpdateResume(
      userId,
      rawText,
      title || 'My Resume',
      fileUrl
    );

    res.status(201).json({
      success: true,
      message: 'Resume processed and ATS analysis initiated.',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getResume = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id || (req as any).userId;
    if (!userId) {
      throw new BadRequestError('User authentication required.');
    }

    const resume = await resumeService.getResumeForUser(userId);

    res.json({
      success: true,
      data: resume
    });
  } catch (error) {
    next(error);
  }
};

export const triggerAnalysis = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id || (req as any).userId;
    if (!userId) {
      throw new BadRequestError('User authentication required.');
    }

    const result = await resumeService.triggerAnalysisForUser(userId);

    res.json({
      success: true,
      message: 'Resume ATS re-analysis triggered.',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const deleteResume = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id || (req as any).userId;
    const { id } = req.params;

    if (!userId) {
      throw new BadRequestError('User authentication required.');
    }

    await resumeService.deleteResumeForUser(id, userId);

    res.json({
      success: true,
      message: 'Resume deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
