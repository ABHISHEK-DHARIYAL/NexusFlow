# Job Description Intelligence & Matching Architecture (Part 17)

## Overview

The **Job Description Intelligence & Profile Matching** system in NexusFlow parses job descriptions provided by users and performs evidence-based matching against the candidate's verified multi-platform profile (Resume, GitHub, LeetCode, Codeforces, Portfolio, Cross-Platform Verification).

The system evaluates job fit across technical skills, project relevance, experience level, education, competitive programming expectations, and keyword alignment.

---

## Core Safety & Integrity Principles

1. **"Never pretend that a user has a skill they do not have."**
   - Matching relies on verified evidence from connected platforms. If no evidence exists, the skill is classified as `MISSING` or `UNVERIFIABLE`.
2. **"Gemini must never fabricate experience or guarantee hiring outcomes."**
   - AI explanations are grounded in deterministic evaluation results and schema-validated JSON outputs.
3. **"No arbitrary crawling of unverified external URLs."**
   - Job input accepts user-pasted text directly.
4. **"User Data Isolation & IDOR Protection."**
   - Every saved job description and match report is strictly scoped to `req.user.id`.

---

## Matching Engine & Scoring Formula

The matching engine calculates a deterministic overall match score (0–100) using a weighted composition:

| Component | Weight | Description |
| :--- | :--- | :--- |
| **Required Technical Skills** | 30% | Coverage of mandatory skills (`MATCHED` = 1.0, `PARTIALLY_MATCHED` = 0.5) |
| **Preferred Technical Skills** | 10% | Coverage of nice-to-have skills |
| **Project Relevance Score** | 15% | Technology and architectural alignment across user projects |
| **Responsibilities Alignment** | 15% | Overlap between job responsibilities and user project/work history |
| **Experience Level Match** | 10% | Work history years vs required years |
| **Education Match** | 5% | Degree / field of study alignment |
| **Competitive Programming / DSA** | 5% | LeetCode/Codeforces rating/solved count if requested |
| **Verified Evidence Strength** | 10% | Ratio of verified code artifacts supporting claimed skills |

### Overall Match Labels

- **90% - 100%**: `Excellent Match`
- **75% - 89%**: `Strong Match`
- **60% - 74%**: `Moderate Match`
- **40% - 59%**: `Developing Match`
- **0% - 39%**: `Low Match`

---

## Verification States & Evidence Mapping

| State | Meaning | Example |
| :--- | :--- | :--- |
| `MATCHED` | Verified in GitHub code or multi-platform evidence | TypeScript found in GitHub repos and resume |
| `PARTIALLY_MATCHED` | Related technology overlap with clear explanation | Express.js experience for Node.js requirement |
| `MISSING` | No evidence found in profile or resume | Kubernetes requested, no Docker/K8s in profile |
| `UNVERIFIABLE` | Insufficient data to determine alignment | Work environment specifics |

---

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/jobs` | Save job description text and initiate profile matching |
| `GET` | `/api/jobs` | List user's saved job descriptions and match scores |
| `GET` | `/api/jobs/:id` | Fetch specific job description |
| `DELETE` | `/api/jobs/:id` | Delete job description and associated match report |
| `POST` | `/api/jobs/:id/match` | Re-trigger profile matching against job description |
| `GET` | `/api/jobs/:id/match` | Retrieve latest match analysis result for job |
| `GET` | `/api/jobs/matches/:matchId` | Retrieve specific match report by ID |

---

## Data Models

- **JobDescription**: `id`, `userId`, `title`, `company`, `location`, `employmentType`, `sourceUrl`, `rawDescription`, `normalizedText`, `createdAt`
- **JobMatch**: `id`, `jobId`, `userId`, `taskId`, `overallMatchScore`, `requiredSkillCoverage`, `preferredSkillCoverage`, `projectRelevanceScore`, `experienceMatchStatus`, `educationMatchStatus`, `cpRelevanceStatus`, `summary`, `extractedRequirements`, `skillMatches`, `projectRelevance`, `missingSkills`, `keywordAlignment`, `recommendations`, `interviewPriorities`, `createdAt`
