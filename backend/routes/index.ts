import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import repoRoutes from './repository.routes';
import githubRoutes from './github.routes';
import taskRoutes from './task.routes';
import workerRoutes from './worker.routes';
import reportRoutes from './report.routes';
import leetcodeRoutes from './leetcode.routes';
import codeforcesRoutes from './codeforces.routes';
import portfolioRoutes from './portfolioRoutes';
import resumeRoutes from './resumeRoutes';
import crossPlatformRoutes from './crossPlatformRoutes';
import jobRoutes from './jobRoutes';
import careerRoutes from './careerRoutes';
import applicationRoutes from './applicationRoutes';
import dashboardRoutes from './dashboard.routes';
import scheduleRoutes from './scheduleRoutes';
import notificationRoutes from './notification.routes';
import settingsRoutes from './settings.routes';

const router = Router();

// Mount root health check
router.use('/', healthRoutes);

// Auth Endpoints
router.use('/api/auth', authRoutes);

// Direct GitHub, Repository, LeetCode, Codeforces, Portfolio, Resume & Analysis Endpoints
router.use('/api/dashboard', dashboardRoutes);
router.use('/api/github', githubRoutes);
router.use('/api/repositories', repoRoutes);
router.use('/api/tasks', taskRoutes);
router.use('/api/workers', workerRoutes);
router.use('/api/analyses', reportRoutes);
router.use('/api/analysis', reportRoutes);
router.use('/api/reports', reportRoutes);
router.use('/api/leetcode', leetcodeRoutes);
router.use('/api/codeforces', codeforcesRoutes);
router.use('/api/portfolio', portfolioRoutes);
router.use('/api/resume', resumeRoutes);
router.use('/api/resumes', resumeRoutes);
router.use('/api/profile', crossPlatformRoutes);
router.use('/api/verification', crossPlatformRoutes);
router.use('/api/jobs', jobRoutes);
router.use('/api/career', careerRoutes);
router.use('/api/applications', applicationRoutes);
router.use('/api/schedules', scheduleRoutes);
router.use('/api/automations', scheduleRoutes);
router.use('/api/notifications', notificationRoutes);

// API v1 Namespace
const v1Router = Router();
v1Router.use('/users', userRoutes);
v1Router.use('/repositories', repoRoutes);
v1Router.use('/github', githubRoutes);
v1Router.use('/tasks', taskRoutes);
v1Router.use('/workers', workerRoutes);
v1Router.use('/reports', reportRoutes);
v1Router.use('/analyses', reportRoutes);
v1Router.use('/leetcode', leetcodeRoutes);
v1Router.use('/codeforces', codeforcesRoutes);
v1Router.use('/portfolio', portfolioRoutes);
v1Router.use('/resume', resumeRoutes);
v1Router.use('/resumes', resumeRoutes);
v1Router.use('/profile', crossPlatformRoutes);
v1Router.use('/verification', crossPlatformRoutes);
v1Router.use('/jobs', jobRoutes);
v1Router.use('/career', careerRoutes);
v1Router.use('/applications', applicationRoutes);
v1Router.use('/dashboard', dashboardRoutes);
v1Router.use('/schedules', scheduleRoutes);
v1Router.use('/automations', scheduleRoutes);
v1Router.use('/notifications', notificationRoutes);
v1Router.use('/settings', settingsRoutes);

router.use('/api/v1', v1Router);

export default router;

