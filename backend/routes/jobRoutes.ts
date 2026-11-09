import { Router } from 'express';
import { jobController } from '../controllers/JobController';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Job Description & Profile Matching Endpoints
router.post('/', requireAuth, (req, res) => jobController.createJob(req, res));
router.get('/', requireAuth, (req, res) => jobController.getUserJobs(req, res));
router.get('/:id', requireAuth, (req, res) => jobController.getJobById(req, res));
router.delete('/:id', requireAuth, (req, res) => jobController.deleteJob(req, res));

router.post('/:id/match', requireAuth, (req, res) => jobController.initiateMatch(req, res));
router.get('/:id/match', requireAuth, (req, res) => jobController.getJobMatchReport(req, res));
router.get('/matches/:matchId', requireAuth, (req, res) => jobController.getMatchById(req, res));

// Job Readiness Intelligence Endpoints
router.post('/:jobId/readiness', requireAuth, (req, res) => jobController.calculateReadiness(req, res));
router.get('/:jobId/readiness', requireAuth, (req, res) => jobController.getReadiness(req, res));
router.get('/:jobId/readiness/gaps', requireAuth, (req, res) => jobController.getReadinessGaps(req, res));
router.get('/:jobId/readiness/recommendations', requireAuth, (req, res) => jobController.getReadinessRecommendations(req, res));
router.post('/:jobId/readiness/what-if', requireAuth, (req, res) => jobController.runWhatIfAnalysis(req, res));

// Company-Specific Preparation Endpoints
router.post('/:jobId/company-preparation', requireAuth, (req, res) => jobController.generateCompanyPreparation(req, res));
router.get('/:jobId/company-preparation', requireAuth, (req, res) => jobController.getCompanyPreparation(req, res));
router.get('/:jobId/company-preparation/topics', requireAuth, (req, res) => jobController.getCompanyPreparationTopics(req, res));
router.get('/:jobId/company-preparation/roadmap', requireAuth, (req, res) => jobController.getCompanyPreparationRoadmap(req, res));
router.post('/:jobId/company-preparation/refresh', requireAuth, (req, res) => jobController.refreshCompanyPreparation(req, res));

export default router;
