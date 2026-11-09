import { Router } from 'express';
import { WorkerController } from '../controllers/WorkerController';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth.middleware';
import { requireWorkerSecret } from '../middleware/workerAuth.middleware';

const router = Router();
const workerController = new WorkerController();

// Fleet visibility: any authenticated user may view worker fleet status.
router.get('/', requireAuth, asyncHandler(workerController.getWorkers));
router.get('/metrics', requireAuth, asyncHandler(workerController.getMetrics));
router.get('/:id', requireAuth, asyncHandler(workerController.getWorkerById));

// Worker self-registration/heartbeat: called by the Java worker process
// itself, authenticated via the shared internal secret (not a user JWT).
router.post('/register', requireWorkerSecret, asyncHandler(workerController.registerWorker));
router.post('/heartbeat', requireWorkerSecret, asyncHandler(workerController.heartbeat));

export default router;
