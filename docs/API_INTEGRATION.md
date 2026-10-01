# NexusFlow API Integration Contract

This document outlines the API integration layer connecting the React 19 frontend to the Node.js/Express backend service.

---

## Architecture & Configuration

- **API Base URL**: Configured via environment variable `VITE_API_URL` (defaults to `/api` or `http://localhost:3000/api`).
- **HTTP Client**: Centralized Axios instance (`src/services/apiClient.ts`) configured with `withCredentials: true` for HTTP-only cookie persistence.
- **Access Token Security**:
  - Access tokens are kept **in-memory only** (`memoryAccessToken`) and attached via the `Authorization: Bearer <token>` header on outbound requests.
  - Refresh tokens are stored exclusively in **HTTP-only secure cookies** set by the backend server.
  - Automatic 401 interceptor silently invokes `/api/auth/refresh` to obtain a fresh access token and retries failed requests seamlessly.

---

## Endpoint Contract Summary

### 1. Authentication (`/api/auth`)
- `GET /api/auth/github`: Redirects to GitHub OAuth authorization.
- `GET /api/auth/github/callback`: Handles GitHub OAuth code exchange, sets `refreshToken` HTTP-only cookie, and redirects to app.
- `POST /api/auth/refresh`: Exchanges valid `refreshToken` cookie for new in-memory JWT access token.
- `GET /api/auth/session`: Returns current session state `{ isAuthenticated: boolean, user?: User }`.
- `GET /api/auth/me`: Returns detailed current user profile and linked GitHub account.
- `POST /api/auth/logout`: Clears HTTP-only refresh cookie and invalidates session.

### 2. User Management (`/api/v1/users`)
- `GET /api/auth/me`: Fetches current user profile.
- `PUT /api/v1/users/:id`: Updates user profile information.

### 3. Repositories (`/api/repositories`)
- `GET /api/repositories`: Lists repositories with optional search and language/visibility filters.
- `GET /api/repositories/:id`: Retrieves repository details, latest AI analysis report, and queue tasks.
- `POST /api/repositories/import`: Imports a GitHub repository (`fullName`, e.g., `facebook/react`).
- `POST /api/repositories/:id/sync`: Triggers AST and git branch synchronization.

### 4. Dashboard & Telemetry (`/api/dashboard`)
- `GET /api/dashboard/summary`: Fetches top-level system health metrics, active worker node counts, queue counts, and risk distributions.

### 5. Task Queue & Executions (`/api/tasks`)
- `GET /api/tasks`: Retrieves task queue entries.
- `GET /api/tasks/:id/logs`: Streams execution terminal logs for a specific task ID.
- `POST /api/tasks`: Enqueues a new verification/analysis task.
- `POST /api/tasks/:id/cancel`: Cancels a running or queued task.
- `POST /api/tasks/:id/retry`: Re-enqueues a failed task.

### 6. Workers (`/api/workers`)
- `GET /api/workers`: Lists virtual thread worker instances and CPU/Heap metrics.
- `GET /api/workers/metrics`: Retrieves cluster utilization metrics.
- `POST /api/workers/scale`: Adjusts virtual thread concurrency allocation.

### 7. AI Analysis Reports (`/api/analysis`)
- `GET /api/analysis/reports`: Lists historical AI analysis reports.
- `GET /api/analysis/report/:id`: Retrieves full report details including findings and recommendations.
- `GET /api/analysis/repo/:repoId`: Retrieves reports associated with a specific repository.
- `POST /api/analysis/trigger`: Initiates an automated AI security & architecture scan on a repository.

### 8. Notifications (`/api/notifications`)
- `GET /api/notifications`: Retrieves user notifications.
- `POST /api/notifications/:id/read`: Marks a notification as read.
- `POST /api/notifications/read-all`: Marks all notifications as read.

### 9. Platform Settings (`/api/v1/settings`)
- `GET /api/v1/settings`: Fetches system preferences and notification settings.
- `PUT /api/v1/settings`: Persists updated user preferences.

---

## State Management Integration

- **Zustand Auth Store (`src/store/useAuthStore.ts`)**:
  - Manages `user`, `githubAccount`, `isAuthenticated`, and in-memory `accessToken`.
  - Exposes `initializeAuth()`, `login()`, `logout()`, `refreshSession()`, and `setUser()`.
- **Custom Hooks (`src/hooks/`)**:
  - `useAuth()`, `useCurrentUser()`, `useRepositories()`, `useRepository()`, `useDashboard()`, `useTasks()`, `useWorkers()`, `useNotifications()`, `useAIReport()`.
  - Abstract API calls completely away from UI components, offering structured `{ data, isLoading, error, refetch, actions }` signatures.
