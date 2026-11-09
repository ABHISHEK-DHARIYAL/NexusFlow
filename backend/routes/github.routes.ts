import { Router } from 'express';
import { GithubController } from '../controllers/GithubController';
import { requireAuth } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const githubController = new GithubController();

// All github proxy endpoints require authentication
router.use(requireAuth);

router.get('/repositories', asyncHandler(githubController.getRepositories));
router.get('/repositories/:githubRepositoryId', asyncHandler(githubController.getRepositoryById));

export default router;
