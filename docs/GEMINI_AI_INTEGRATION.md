# Part 9 — Gemini AI Intelligence

This document details the Google Gemini-powered Developer Intelligence engine integrated into NexusFlow.

---

## 1. Architectural Overview

The AI analysis pipeline integrates the Node.js Express backend, `@google/genai` TypeScript SDK, Zod output validation schema, secret filtering input selection, and task execution engine.

```mermaid
sequenceDiagram
    autonumber
    actor User as Developer / Frontend
    participant API as Node.js API Route (/api/repositories/:id/analyze)
    participant Auth as Auth & IDOR Guard
    participant Service as AIAnalysisService
    participant Strategy as AIInputSelectionStrategy
    participant Gemini as Google Gemini API (gemini-3.6-flash)
    participant DB as Supabase PostgreSQL / Prisma

    User->>API: POST /api/repositories/:id/analyze
    API->>Auth: Verify JWT & Repository Ownership
    Auth-->>API: Authorized (userId matches repo owner)
    API->>Service: triggerAnalysis(userId, repoId)
    Service->>DB: Check for active QUEUED/RUNNING analysis task (Idempotency)
    DB-->>Service: None active
    Service->>DB: Create Task record (taskType: AI_ANALYSIS, status: QUEUED)
    Service-->>API: 202 Accepted { task, repository }
    API-->>User: Task Queued Response

    Note over Service: Async Background Execution
    Service->>DB: Update Task status to RUNNING (progress 10%)
    Service->>DB: Query RepositoryFiles for repoId
    Service->>Strategy: selectContext(repositoryFiles)
    Note over Strategy: Excludes .env, secrets, binaries; prioritizes README/manifests; enforces 200KB budget
    Strategy-->>Service: Formatted Context & Coverage Metadata
    Service->>Gemini: callGeminiWithRetry(Prompt, SystemInstruction)
    Note over Gemini: Bounded Exponential Backoff on 429/Transient Errors
    Gemini-->>Service: Structured JSON Response
    Service->>Service: Validate with Zod (RawAIReportOutputSchema) & normalize enums
    Service->>DB: Create AIAnalysisReport & AIFindings
    Service->>DB: Update RepositoryStatistics (healthScore)
    Service->>DB: Update Task status to COMPLETED (progress 100%)
    Service->>DB: Create Notification (ANALYSIS_READY)
```

---

## 2. Key Components & Implementation

### A. AI Configuration (`src/server/config/aiConfig.ts`)
- **`GEMINI_API_KEY`**: Server-only API key loaded securely via system environment.
- **`GEMINI_MODEL`**: Configurable AI model alias (default: `gemini-3.6-flash`).
- **`GEMINI_REQUEST_TIMEOUT_MS`**: Request timeout threshold (default: `30000ms`).
- **Input Budget**: 200 KB total character budget, maximum 25 files per analysis batch.
- **Retry Backoff**: Up to 3 retries with exponential backoff (`1000ms`, `2000ms`, `4000ms`) on 429 rate limits and transient network glitches.

### B. Input Selection Strategy & Secret Filter (`src/server/utils/secretFilter.ts` & `src/server/services/AIInputSelectionStrategy.ts`)
- **Secret File Rejection**: Automatically excludes `.env*`, `*.pem`, `*.key`, `id_rsa`, `service_account*.json`, `shadow`, `passwd`.
- **Directory Exclusion**: Excludes `node_modules`, `.git`, `dist`, `build`, `target`, `coverage`, `.idea`, `.vscode`.
- **Inline Token Redaction**: Scans file contents for private keys, AWS keys (`AKIA...`), GitHub tokens (`ghp_...`), and inline secrets, replacing them with redaction placeholders prior to prompt submission.
- **Priority Ranking**:
  1. `README.md` & Documentation (Weight 10)
  2. Package & Build Manifests (`package.json`, `pom.xml`, `requirements.txt`, `go.mod`, `Dockerfile`) (Weight 9)
  3. Entrypoints (`index.ts`, `main.ts`, `server.ts`, `App.java`) (Weight 8)
  4. Configuration files (Weight 7)
  5. Application Source Code (Weight 5)

### C. Zod Validation & Enums Normalization (`src/server/validations/aiReportValidation.ts`)
Validates structured JSON output returned by Gemini using `RawAIReportOutputSchema`:
- `overallScore`, `securityScore`, `performanceScore`, `architectureScore`, `maintainabilityScore`, `documentationScore` (Numbers 0–100)
- `summary`: Concise executive summary
- `recommendations`: Array of actionable string bullet points
- `findings`: Array of code findings with `category`, `severity`, `title`, `description`, `filePath`, `lineNumber`, `snippet`, `recommendation`.
- Normalizes categories (`CODE_QUALITY` -> `CODE_STYLE`, `TESTING` -> `BUG_RISK`) and severities to align with Prisma database enums.

### D. IDOR Protection & Idempotency (`src/server/services/AIAnalysisService.ts`)
- **Ownership Verification**: Verifies that the requesting user's `userId` matches `repository.userId` before initiating analysis or fetching reports.
- **Concurrent Task Prevention**: Prevents duplicate trigger requests if an active `QUEUED` or `RUNNING` analysis task already exists for the repository.

---

## 3. API Endpoints

### 1. Trigger Repository AI Analysis
`POST /api/repositories/:id/analyze`
- **Auth**: Required
- **Response** (202 Accepted):
```json
{
  "success": true,
  "message": "AI repository analysis queued successfully",
  "data": {
    "task": {
      "id": "task_123",
      "repositoryId": "repo_456",
      "taskType": "AI_ANALYSIS",
      "status": "QUEUED",
      "priority": "HIGH"
    }
  }
}
```

### 2. List Repository Analyses
`GET /api/repositories/:id/analyses`
- **Auth**: Required
- **Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "rep_789",
      "repositoryId": "repo_456",
      "overallScore": 88,
      "summary": "Clean architecture with strong typing...",
      "findings": [...]
    }
  ]
}
```

### 3. Get Analysis Report
`GET /api/analyses/:analysisId`
- **Auth**: Required
- **Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "rep_789",
    "overallScore": 88,
    "securityScore": 92,
    "performanceScore": 84,
    "architectureScore": 90,
    "maintainabilityScore": 86,
    "documentationScore": 80,
    "summary": "Executive summary paragraph...",
    "recommendations": ["Recommendation 1", "Recommendation 2"],
    "findings": [...]
  }
}
```

### 4. Get Analysis Report Findings
`GET /api/analyses/:analysisId/findings`
- **Auth**: Required
- **Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "find_01",
      "category": "SECURITY",
      "severity": "HIGH",
      "title": "Unvalidated environment variable",
      "description": "Environment variable missing schema validation.",
      "filePath": "src/config/env.ts",
      "lineNumber": 12,
      "snippet": "const val = process.env.VAL;",
      "recommendation": "Wrap in Zod schema"
    }
  ]
}
```

---

## 4. Verification

Run integration test suite to verify Part 9:
```bash
npx vitest run tests/integration/geminiAiIntegration.test.ts
```
