import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  connectPortfolio,
  getPortfolio,
  getPages,
  getProjects,
  getAnalysis,
  deletePortfolio
} from '../controllers/portfolioController';

const router = Router();

router.post('/connect', requireAuth, connectPortfolio);
router.get('/', requireAuth, getPortfolio);
router.get('/pages', requireAuth, getPages);
router.get('/projects', requireAuth, getProjects);
router.get('/analysis', requireAuth, getAnalysis);
router.delete('/', requireAuth, deletePortfolio);

export default router;
