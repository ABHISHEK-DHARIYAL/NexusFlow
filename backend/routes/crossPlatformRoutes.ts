import { Router } from 'express';
import { crossPlatformVerificationController } from '../controllers/crossPlatformVerificationController';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Cross-Platform Verification endpoints
router.post('/verify', requireAuth, crossPlatformVerificationController.initiateVerification);
router.post('/verification', requireAuth, crossPlatformVerificationController.initiateVerification);
router.get('/verification', requireAuth, crossPlatformVerificationController.getLatestVerification);
router.get('/verification/claims', requireAuth, crossPlatformVerificationController.getClaims);
router.get('/verification/discrepancies', requireAuth, crossPlatformVerificationController.getDiscrepancies);
router.get('/verification/sources', requireAuth, crossPlatformVerificationController.getSources);
router.post('/verification/reanalyze', requireAuth, crossPlatformVerificationController.reanalyze);

export default router;
