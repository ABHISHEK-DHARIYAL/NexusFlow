import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  submitResume,
  getResume,
  triggerAnalysis,
  deleteResume
} from '../controllers/resumeController';
import {
  initiateGitHubVerification,
  getGitHubVerification,
  getVerificationClaims,
  getVerificationProjects
} from '../controllers/resumeVerificationController';

const router = Router();

router.post('/', requireAuth, submitResume);
router.get('/', requireAuth, getResume);
router.post('/analyze', requireAuth, triggerAnalysis);
router.delete('/:id', requireAuth, deleteResume);

// Part 15: Resume ↔ GitHub Verification Routes
router.post('/:resumeId/verify/github', requireAuth, initiateGitHubVerification);
router.post('/:resumeId/github-verification/reanalyze', requireAuth, initiateGitHubVerification);
router.get('/:resumeId/github-verification', requireAuth, getGitHubVerification);
router.get('/:resumeId/github-verification/claims', requireAuth, getVerificationClaims);
router.get('/:resumeId/github-verification/projects', requireAuth, getVerificationProjects);

export default router;
