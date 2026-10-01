# Resume ↔ GitHub Evidence Verification Architecture (Part 15)

## Overview

The **Resume ↔ GitHub Evidence Verification** system in NexusFlow cross-references claims extracted from developer resumes against verifiable evidence found in authorized GitHub repositories.

The system is designed to provide candidate credentials validation while adhering strictly to a foundational principle:

> **"GitHub is evidence, not absolute truth."**

If a claim cannot be verified on GitHub, the system assigns a state of `NOT_FOUND` or `UNVERIFIABLE`. The system **never** accuses a user of lying or labels a claim as "FAKE" or "FALSE".

---

## Verification States & Evidence Levels

### Verification States

| Status | Meaning | System Action |
| :--- | :--- | :--- |
| `SUPPORTED` | Direct source code or dependency manifest evidence found | High confidence badge, linked evidence paths & snippets |
| `PARTIALLY_SUPPORTED` | Indirect or partial evidence identified | Highlight matched repository with notes on unverified aspects |
| `NOT_FOUND` | No matching evidence found in connected repositories | Non-accusatory note: repo may be private or in an unlinked account |
| `UNVERIFIABLE` | Inherently unprovable via repository code alone | Clear explanation (e.g. requires APM benchmarks or external platforms) |

### Evidence Levels

- `DIRECT`: Direct match in language distribution, code file AST, or project URL.
- `STRONG`: Confirmed dependency in build manifest (`package.json`, `pom.xml`, etc.) or module imports.
- `PARTIAL`: Code files exist matching domain area but specific metric/claim lacks benchmark evidence.
- `WEAK`: Keyword match in commit messages or documentation.
- `NONE`: No evidence found in scanned repositories.

---

## Non-Code & Quantitative Claim Handling

1. **Competitive Programming Claims**: Claims such as *"400+ solved LeetCode problems"* cannot be verified by scanning GitHub source files alone. They are classified as `UNVERIFIABLE` with the explanation:
   > *"Competitive programming claims require platform-level integration (LeetCode/Codeforces) rather than GitHub repository analysis."*

2. **Quantitative Impact Claims**: Claims such as *"Reduced API latency by 42%"* or *"Handled 15M daily events"* without benchmark or load-testing files in the repo are classified as `UNVERIFIABLE` or `PARTIALLY_SUPPORTED` with the explanation:
   > *"Numerical performance optimization claims require load-test reports or APM benchmarks for full verification."*

---

## Architecture Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as Candidate / Recruiter
    participant Web as Frontend UI
    participant API as Express API Server
    participant Task as Task Engine
    participant Extractor as Claim & Evidence Extractor
    participant Matcher as Claim Matcher
    participant Gemini as Gemini AI
    participant DB as Postgres Database
    participant WS as WebSocket Server

    User->>Web: Click "Verify Resume with GitHub"
    Web->>API: POST /api/resumes/:resumeId/verify/github
    API->>API: Enforce User IDOR & Resource Ownership
    API->>Task: Create Task (RESUME_GITHUB_VERIFICATION)
    API-->>Web: 202 Accepted { taskId }
    Task->>WS: Emit "resume:github_verification_started"

    async
        Task->>Extractor: Extract Resume Claims & Repo Evidence
        Task->>WS: Emit "resume:github_verification_progress" (30%)
        Extractor->>Extractor: Redact Secret Files & API Keys
        Task->>Matcher: Cross-Match Claims against Repos
        Task->>WS: Emit "resume:github_verification_progress" (60%)
        Matcher->>Matcher: Discover Unmentioned Strong Repos
        Task->>Gemini: Generate Executive Summary & Recommendations
        Task->>WS: Emit "resume:github_verification_progress" (85%)
        Task->>DB: Save ResumeGitHubVerification Record
        Task->>WS: Emit "resume:github_verification_completed"
    end
```

---

## System Components

### 1. Resume Claim Extractor (`ResumeClaimExtractor`)
Parses candidate resume structured data and extracts testable claims across 17 claim types:
- `PROJECT`
- `TECHNOLOGY`
- `PROGRAMMING_LANGUAGE`
- `FRAMEWORK`
- `DATABASE`
- `ARCHITECTURE`
- `FEATURE`
- `CONCURRENCY`
- `AI`
- `API`
- `AUTHENTICATION`
- `DEPLOYMENT`
- `PERFORMANCE`
- `QUANTITATIVE_IMPACT`
- `COMPETITIVE_PROGRAMMING`
- `ROLE`
- `CONTRIBUTION`

### 2. GitHub Evidence Extractor (`GitHubEvidenceExtractor`)
Retrieves user-authorized repositories, language breakdowns, dependency manifests, and key source files.
- Automatically redacts secret files (`.env`, `*.pem`, `id_rsa`, `server.key`) and API tokens (`ghp_*`, `AIza*`).

### 3. Claim Matcher (`ClaimMatcher`)
Performs multi-signal matching between resume claims and repository evidence:
- **Project Matching**: Explicit GitHub URL, project name fuzzy matching, repository description overlap.
- **Technology Matching**: Primary language composition, package manager dependencies (`package.json`, `pom.xml`, `go.mod`), module imports.
- **Architecture Verification**: Detects custom thread pools (`ReentrantLock`, `Worker`, `BlockingQueue`), REST routes, JWT authentication middleware, and Gemini AI SDK integration.

### 4. Strong Project Discovery Engine
Scans connected GitHub repositories for high-impact repositories owned by the candidate that are **not** currently listed on their resume.
- Generates suggested project titles, descriptions, and high-impact resume bullet points to help candidates highlight unlisted work.

### 5. Gemini AI Executive Summary (`GeminiAiService`)
Generates candidate verification summaries using Gemini AI in non-accusatory, professional language:
- Highlights strongly supported candidate strengths.
- Identifies areas needing external platform clarification.
- Recommends resume formatting improvements for automated recruiter verification.

---

## Security & IDOR Protections

1. **Strict Ownership Check**: All endpoints (`/api/resumes/:resumeId/...`) enforce user authorization (`assertResourceOwnership`) ensuring candidates can only verify or view their own resumes and repositories.
2. **Secret Redaction**: Any file matching secret patterns (`.env`, credentials, private keys) is excluded from evidence extraction and never transmitted to AI or stored in verification logs.

---

## REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/resumes/:resumeId/verify/github` | Triggers asynchronous GitHub verification task |
| `POST` | `/api/resumes/:resumeId/github-verification/reanalyze` | Re-runs verification on updated resume content |
| `GET` | `/api/resumes/:resumeId/github-verification` | Fetches latest verification report for resume |
| `GET` | `/api/resumes/:resumeId/github-verification/claims` | Returns detailed evaluated claims list with status filters |
| `GET` | `/api/resumes/:resumeId/github-verification/projects` | Returns project-by-project verification breakdown |

---

## Real-Time WebSocket Events

- `resume:github_verification_started`
- `resume:github_verification_progress` (`progress`: 10-90%, `status`: string)
- `resume:github_verification_completed` (`overallCoverageScore`: number, `verificationId`: string)
- `resume:github_verification_failed` (`error`: string)
