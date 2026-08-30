# Part 22 — Unified Career Dashboard + Reports Architecture & API Specification

## 1. Overview & Objectives

The **Unified Career Dashboard & Reports Engine** serves as the central aggregation and executive intelligence layer for NexusFlow. It unifies metrics across all independent intelligence modules:

1. **GitHub & Code Base Quality** (`githubHealth`)
2. **LeetCode & DSA** (`dsaSummary.leetcode`)
3. **Codeforces & Competitive Programming** (`dsaSummary.codeforces`)
4. **Portfolio UX & SEO Intelligence** (`portfolioHealth`)
5. **Resume ATS & Formatting Audit** (`resumeHealth`)
6. **Cross-Platform Claims Verification** (`resumeHealth.verification`)
7. **Job Readiness & Role Matching** (`jobOverview`)
8. **Application Tracker Pipeline** (`applicationPipeline`)

---

## 2. Core Architectural Principles

### 2.1 Aggregation, Not Calculation
The dashboard does **not** recalculate raw scores or invent fake metrics. Existing deterministic module services (`LeetCodeService`, `CodeforcesService`, `PortfolioAuditService`, `ResumeIntelligenceService`, `JobReadinessService`, `ApplicationTrackerService`) remain the single source of truth for their respective domain scores.

### 2.2 Server-Side Single-Flight Aggregation
To prevent browser client water-falling and dozens of redundant HTTP calls, `UnifiedCareerDashboardService.getOverview(userId)` executes server-side data fetching using `Promise.all` with individual module error isolation.

### 2.3 Resilient Error Isolation (`safeFetch`)
Each module fetcher is wrapped in `safeFetch<T>()`. If any single module fails (e.g., Codeforces API timeout or missing user account), the rest of the dashboard loads cleanly with a fallback state:
- `score: null`
- `status: "UNAVAILABLE"`
- Freshness: `UNAVAILABLE`

### 2.4 Deterministic Next Best Action Priority Engine
Next Best Action calculation uses strict rules instead of arbitrary AI choices:
1. **Critical Application Alerts**: Immediate action needed for interviews or active applications.
2. **Low Target Job Readiness**: If match score < 60%, prioritize filling critical skill gaps.
3. **Low Resume ATS Score**: If ATS score < 70%, fix formatting and content impact issues.
4. **Unconnected Key Profiles**: If GitHub, Portfolio, or LeetCode are missing, prompt connection.
5. **Competitive Programming Practice**: If DSA score < 70%, practice top weak topics.

---

## 3. Data Freshness Model

Each module's timestamp is evaluated against a 7-day threshold:
- **FRESH**: Updated within the last 7 days.
- **STALE**: Last synced > 7 days ago.
- **UNAVAILABLE**: Module not connected or no data exists.

---

## 4. Career Report Framework & IDOR Protection

Unified career reports can be generated on-demand (`POST /api/reports/generate`) across multiple report types:
- `PROFILE` / `CAREER`
- `RESUME`
- `GITHUB`
- `PORTFOLIO`
- `LEETCODE`
- `CODEFORCES`
- `JOB`
- `READINESS`
- `VERIFICATION`

### IDOR Enforcement
Every report is permanently associated with `report.userId`. When accessing `GET /api/reports/:id`, `POST /api/reports/:id/refresh`, or `GET /api/reports/:id/export`, the backend enforces:
```ts
if (report.userId !== req.user.id) {
  throw new ForbiddenError('You do not have permission to view this report.');
}
```

---

## 5. API Contracts & Endpoint Specifications

### 5.1 `GET /api/dashboard/overview`
Returns the complete unified career overview object for the authenticated user.

#### Response Schema (200 OK)
```json
{
  "user": {
    "id": "usr_01h8x9p3",
    "name": "Jane Doe",
    "username": "janedoe",
    "avatarUrl": "https://..."
  },
  "profileCompleteness": {
    "score": 85,
    "connectedCount": 6,
    "totalSources": 7,
    "label": "Most supported career data sources are connected",
    "sources": {
      "github": true,
      "leetcode": true,
      "codeforces": true,
      "portfolio": true,
      "resume": true,
      "jobTarget": true,
      "applications": true
    }
  },
  "dataFreshness": {
    "github": { "status": "FRESH", "lastSyncedAt": "2026-08-11T12:00:00Z" },
    "leetcode": { "status": "FRESH" },
    "codeforces": { "status": "FRESH" },
    "portfolio": { "status": "FRESH" },
    "resume": { "status": "FRESH" },
    "jobs": { "status": "FRESH" }
  },
  "careerSnapshot": {
    "technicalProfile": "Strong",
    "dsaScore": 82,
    "resumeScore": 88,
    "portfolioScore": 81,
    "jobReadinessScore": 81,
    "overallGrade": "A"
  },
  "nextBestAction": {
    "priority": "HIGH",
    "action": "Prepare for upcoming technical interview",
    "reason": "You have an active interview scheduled for Microsoft Software Engineer Intern.",
    "source": "APPLICATIONS",
    "link": "/applications"
  },
  "scorecard": {
    "technical": { "score": 85, "status": "STRONG" },
    "dsa": { "score": 82, "status": "ADVANCED" },
    "projects": { "score": 88, "status": "HIGH PROOF" },
    "resume": { "score": 88, "status": "OPTIMIZED" },
    "portfolio": { "score": 81, "status": "HIGH QUALITY" },
    "verification": { "score": 90, "status": "VERIFIED" },
    "jobReadiness": { "score": 81, "status": "STRONG MATCH" },
    "interviewPrep": { "score": 75, "status": "IN PROGRESS" }
  }
}
```

### 5.2 `POST /api/reports/generate`
Generates a new career report.

#### Request Body
```json
{
  "type": "CAREER",
  "title": "Unified Developer Career Report"
}
```

### 5.3 `GET /api/reports/:id`
Retrieves report details with IDOR verification.

### 5.4 `POST /api/reports/:id/refresh`
Recalculates metrics and refreshes report.

### 5.5 `GET /api/reports/:id/export`
Returns printable HTML string for export/PDF printing.
