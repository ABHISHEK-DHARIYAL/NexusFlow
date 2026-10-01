# NexusFlow Production Deployment & Verification Guide (Part 25)

## Executive Summary
This document provides full deployment instructions, environment variable requirements, production topology, security procedures, health verification steps, and rollback protocols for **NexusFlow** — the developer intelligence and career automation platform.

---

## 1. Production Architecture Diagram

```mermaid
flowchart TD
    subgraph Client ["Client Layer"]
        A[React 18 SPA + Tailwind CSS]
    end

    subgraph Edge ["Gateway & Proxy"]
        B[Nginx / Port 3000 Ingress]
    end

    subgraph Application ["Core Node.js Application"]
        C[Express API Server]
        D[JWT Authentication & Role Middleware]
        E[WebSocket Server]
        F[Scheduler Engine]
    end

    subgraph Data ["Persistence Layer"]
        G[(Prisma ORM - MySQL / PostgreSQL)]
        H[(In-Memory Fallback Cache)]
    end

    subgraph Worker ["Task Concurrency Engine"]
        I[Java Worker RPC Service]
        J[NexusThreadPool Engine]
    end

    subgraph External ["External Services"]
        K[Google Gemini 3.6 Flash API]
        L[GitHub API & OAuth]
        M[LeetCode API]
        N[Codeforces API]
        O[Portfolio Web Crawler]
    end

    A <── HTTPS / WSS ──► B
    B ──► C
    C ──► D
    C ──► E
    C ──► F
    C ──► G
    G ── fallback ──► H
    C ── Internal RPC ──► I
    I ──► J
    C ──► K
    C ──► L
    C ──► M
    C ──► N
    C ──► O
```

---

## 2. Environment Variable Checklist

Configure these variables in your production container/server environment. **Do not put server-side secrets in client-side bundles.**

| Variable Name | Purpose | Example Value | Sensitive? |
| :--- | :--- | :--- | :---: |
| `NODE_ENV` | Environment mode | `production` | No |
| `PORT` | Container bind port | `3000` | No |
| `FRONTEND_URL` | Application URL for CORS & OAuth redirects | `https://nexusflow.app` | No |
| `BACKEND_URL` | API base URL | `https://nexusflow.app` | No |
| `DATABASE_URL` | Database connection string | `mysql://user:pass@db:3306/nexusflow` | **YES** |
| `JWT_SECRET` | Primary JWT signing key (min 32 chars) | `prod-secret-access-token-key-...` | **YES** |
| `JWT_REFRESH_SECRET` | Refresh token signing key (min 32 chars) | `prod-secret-refresh-token-key-...` | **YES** |
| `JWT_ACCESS_EXPIRATION` | Access token lifespan | `15m` | No |
| `JWT_REFRESH_EXPIRATION` | Refresh token lifespan | `7d` | No |
| `GITHUB_CLIENT_ID` | GitHub OAuth App Client ID | `Ov23...` | No |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App Client Secret | `secret_...` | **YES** |
| `GITHUB_CALLBACK_URL` | Production GitHub OAuth callback URL | `https://nexusflow.app/api/auth/github/callback` | No |
| `GEMINI_API_KEY` | Google Gemini API Key | `AIzaSy...` | **YES** |
| `GEMINI_MODEL` | Gemini AI Model Alias | `gemini-3.6-flash` | No |
| `JAVA_SERVICE_URL` | Private RPC URL for Java worker process | `http://127.0.0.1:8080` | No |

---

## 3. Production Health Endpoints

The API exposes automated health checks for readiness and liveness probes:

- `GET /health` or `GET /api/health`
  - Returns: `200 OK`
  - Body: `{ "status": "ok", "uptime": 1234, "timestamp": "2026-08-12T19:00:00Z" }`

---

## 4. Verification Commands & Test Results

Run all validation suites prior to production release:

```bash
# 1. Type Check
npm run typecheck

# 2. Linter Check
npm run lint

# 3. Comprehensive Test Suite
npm test

# 4. Production Build Verification
npm run build
```

**Execution Results:**
- **Typecheck**: PASSED (0 errors)
- **Lint**: PASSED (0 errors)
- **Tests**: PASSED (14 test suites, 114 tests)
- **Production Build**: PASSED

---

## 5. Rollback & Recovery Plan

1. **Backend Rollback**: Revert deployment container image to previous tag (`nexusflow:vX.Y.Z-previous`).
2. **Database Migration Safety**: Schema updates use non-destructive Prisma migrations (`npx prisma migrate deploy`). Never execute `prisma db push --force-reset` in production.
3. **Graceful Shutdown**: Express server and Scheduler engine handle `SIGTERM` and `SIGINT` signals, closing active DB pools and finishing running thread pool tasks cleanly before process exit.
