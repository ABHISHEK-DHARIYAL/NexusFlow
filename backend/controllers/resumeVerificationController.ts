import { Request, Response, NextFunction } from 'express';
import { ResumeGitHubVerificationService } from '../services/ResumeGitHubVerificationService';
import { BadRequestError, NotFoundError } from '../utils/errors';

const verificationService = new ResumeGitHubVerificationService();

export const initiateGitHubVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id || (req as any).userId;
    const authUser = (req as any).user;
    if (!userId) {
      throw new BadRequestError('User authentication required.');
    }

    const { resumeId } = req.params;
    if (!resumeId) {
      throw new BadRequestError('resumeId parameter is required.');
    }

    const result = await verificationService.initiateVerification(userId, resumeId, authUser);

    res.status(202).json({
      success: true,
      message: 'Resume ↔ GitHub Verification task queued successfully.',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getGitHubVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id || (req as any).userId;
    const authUser = (req as any).user;
    if (!userId) {
      throw new BadRequestError('User authentication required.');
    }

    const { resumeId } = req.params;
    if (!resumeId) {
      throw new BadRequestError('resumeId parameter is required.');
    }

    const verification = await verificationService.getLatestVerification(resumeId, authUser);

    if (!verification) {
      res.status(200).json({
        success: true,
        data: null,
        message: 'No GitHub verification report found for this resume.'
      });
      return;
    }

    res.json({
      success: true,
      data: verification
    });
  } catch (error) {
    next(error);
  }
};

export const getVerificationClaims = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id || (req as any).userId;
    const authUser = (req as any).user;
    if (!userId) {
      throw new BadRequestError('User authentication required.');
    }

    const { resumeId } = req.params;
    const verification = await verificationService.getLatestVerification(resumeId, authUser);

    if (!verification) {
      res.status(200).json({ success: true, data: [] });
      return;
    }

    res.json({
      success: true,
      data: verification.claims
    });
  } catch (error) {
    next(error);
  }
};

export const getVerificationProjects = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id || (req as any).userId;
    const authUser = (req as any).user;
    if (!userId) {
      throw new BadRequestError('User authentication required.');
    }

    const { resumeId } = req.params;
    const verification = await verificationService.getLatestVerification(resumeId, authUser);

    if (!verification) {
      res.status(200).json({ success: true, data: { projectMatches: [], strongProjects: [] } });
      return;
    }

    res.json({
      success: true,
      data: {
        projectMatches: verification.projectMatches,
        strongProjects: verification.strongProjects
      }
    });
  } catch (error) {
    next(error);
  }
};
