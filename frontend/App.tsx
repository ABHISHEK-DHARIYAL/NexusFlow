import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { DashboardPage } from './pages/DashboardPage';
import { RepositoriesPage } from './pages/RepositoriesPage';
import { RepositoryDetailPage } from './pages/RepositoryDetailPage';
import { ReportsListPage } from './pages/ReportsListPage';
import { ReportDetailPage } from './pages/ReportDetailPage';
import { QueueMonitorPage } from './pages/QueueMonitorPage';
import { WorkersDashboardPage } from './pages/WorkersDashboardPage';
import { ExecutionHistoryPage } from './pages/ExecutionHistoryPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { LeetCodePage } from './pages/LeetCodePage';
import { CodeforcesPage } from './pages/CodeforcesPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { ResumePage } from './pages/ResumePage';
import { VerificationPage } from './pages/VerificationPage';
import { JobPage } from './pages/JobPage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { CareerPage } from './pages/CareerPage';
import { AutomationsPage } from './pages/AutomationsPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { useAuthStore } from './store/useAuthStore';

export default function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Authenticated Protected Shell */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/repositories" element={<RepositoriesPage />} />
            <Route path="/repositories/:id" element={<RepositoryDetailPage />} />
            <Route path="/leetcode" element={<LeetCodePage />} />
            <Route path="/codeforces" element={<CodeforcesPage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/resume" element={<ResumePage />} />
            <Route path="/verification" element={<VerificationPage />} />
            <Route path="/jobs" element={<JobPage />} />
            <Route path="/applications" element={<ApplicationsPage />} />
            <Route path="/career" element={<CareerPage />} />
            <Route path="/automations" element={<AutomationsPage />} />
            <Route path="/schedules" element={<Navigate to="/automations" replace />} />
            <Route path="/analysis" element={<Navigate to="/analysis/reports" replace />} />
            <Route path="/analysis/reports" element={<ReportsListPage />} />
            <Route path="/analysis/reports/:id" element={<ReportDetailPage />} />
            <Route path="/tasks" element={<Navigate to="/queue" replace />} />
            <Route path="/queue" element={<QueueMonitorPage />} />
            <Route path="/workers" element={<WorkersDashboardPage />} />
            <Route path="/executions" element={<ExecutionHistoryPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
