# Part 19 — Company-Specific Preparation Architecture & Documentation

## Overview

**Company-Specific Preparation** in NexusFlow transforms:
- A targeted **Job Description**
- The target **Company**
- The candidate's **Verified Developer Profile** (GitHub repos, LeetCode, Codeforces, Portfolio, Resume)
- The **Job Match Report** (Part 17)
- The **Job Readiness Report** (Part 18)

into an actionable, company-tailored preparation roadmap.

NexusFlow directly answers:
> *"Given this company, this specific role, and my current verified profile, what exactly should I prepare?"*

---

## Zero-Fabrication & Grounding Principles

NexusFlow enforces strict anti-hallucination guardrails:
1. **No speculation on private interview questions**: The system never pretends to know internal confidential company interview questions or recruiter preferences.
2. **Grounding in verified evidence**: All preparation recommendations reference real candidate evidence (e.g. NexusFlow Java worker engine, LeetCode contest ratings, GitHub repositories).
3. **Public data & standard patterns**: Technical interview topics are derived strictly from the explicit requirements in the Job Description and standard software engineering interview paradigms.

---

## Priority Engine & Mathematical Formulas

### 1. Topic Priority Score ($P_{score}$)

For each technical topic or skill requirement, NexusFlow calculates a deterministic priority score:

$$P_{score} = W_{req} \times (1.0 - F_{ready}) \times R_{job}$$

Where:
- **$W_{req}$ (Requirement Importance Weight)**:
  - `3.0` for Critical Blocker / Primary Required Skill
  - `2.5` for Important Requirement
  - `1.0` for Optional / Nice-to-have
- **$F_{ready}$ (Current Evidence Readiness Factor)**:
  - `1.0` if fully verified by GitHub code, LeetCode, or Resume evidence ($Gap = 0.0$)
  - `0.5` if partial / related foundation exists ($Gap = 0.5$)
  - `0.0` if no verified evidence exists ($Gap = 1.0$)
- **$R_{job}$ (Job Relevance Multiplier)**:
  - `1.5` for core role architecture / primary stack
  - `1.0` for secondary or supporting technologies

#### Priority Classification Mapping:
- **`CRITICAL`**: $P_{score} \ge 3.5$ or ($W_{req} = 3.0$ and $F_{ready} = 0.0$)
- **`HIGH`**: $2.5 \le P_{score} < 3.5$
- **`MEDIUM`**: $1.5 \le P_{score} < 2.5$
- **`LOW`**: $P_{score} < 1.5$

---

### 2. Preparation Coverage Score (%)

The overall preparation coverage score measures how well the candidate's current verified profile and active study plans cover the job's weighted skill requirements:

$$\text{Preparation Coverage \%} = \min\left(100, \left\lfloor \frac{\sum_{i=1}^{N} w_i \cdot c_i}{\sum_{i=1}^{N} w_i} \times 100 \right\rfloor\right)$$

Where:
- $w_i$: Importance weight of skill $i$ (3 for Required, 1 for Preferred)
- $c_i$: Coverage state factor:
  - `1.0` for verified skill or active project action plan
  - `0.5` for partial foundation
  - `0.0` for unaddressed gap

---

## Database Schema (`prisma/schema.prisma`)

```prisma
model CompanyPreparation {
  id                            String         @id @default(uuid())
  jobId                         String
  userId                        String
  taskId                        String?        @unique
  companyName                   String
  jobTitle                      String
  jobMatchScore                 Float          @default(0.0)
  jobReadinessScore             Float          @default(0.0)
  preparationCoverageScore      Float          @default(0.0)
  topPriorityTopic              String         @default("")
  companyProfile                Json
  coverageFormulaBreakdown      Json
  priorityEngineFormulaDoc      String         @db.Text
  priorityItems                 Json
  dsaPreparation                Json
  technicalAndSystemDesignPrep  Json
  projectPreparations           Json
  behavioralPreparations        Json
  companyResearch               Json
  resumePositioning             Json
  profileGaps                   Json
  skillTransfers                Json
  roadmap                       Json
  executiveSummary              String         @db.Text
  noFabricationDisclaimer       String         @db.Text
  createdAt                     DateTime       @default(now())
  updatedAt                     DateTime       @updatedAt

  job                           JobDescription @relation(fields: [jobId], references: [id], onDelete: Cascade)
  user                          User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  task                          Task?          @relation(fields: [taskId], references: [id], onDelete: SetNull)

  @@index([jobId, createdAt])
  @@index([userId, createdAt])
  @@map("company_preparations")
}
```

---

## API Reference

### 1. Generate / Refresh Company Preparation
`POST /api/jobs/:jobId/company-preparation`
- **Auth**: Protected (`requireAuth`) + Resource Ownership Verification.
- **Request Body** *(Optional)*:
  ```json
  {
    "website": "https://company.example.com",
    "industry": "FinTech",
    "companyWebsiteInfo": "High throughput payment gateway provider"
  }
  ```
- **Response**: `201 Created` with full `CompanyPreparationReport`.

### 2. Get Latest Preparation Plan
`GET /api/jobs/:jobId/company-preparation`
- **Auth**: Protected (`requireAuth`).
- **Response**: `200 OK` with `CompanyPreparationReport`.

### 3. Get Ranked Topic Priorities
`GET /api/jobs/:jobId/company-preparation/topics`
- **Response**: Priority items, DSA evaluation, and skill transfer recommendations.

### 4. Get 4-Phase Roadmap
`GET /api/jobs/:jobId/company-preparation/roadmap`
- **Response**: Staged preparation roadmap with phase goals and action items.

---

## 4-Phase Preparation Roadmap Structure

1. **Phase 1 — Critical Technical Gaps & Role Core**: Focuses on closing `CRITICAL` skill gaps and building target proof-of-concept projects.
2. **Phase 2 — System Design & Technical Deep-Dive**: Concurrency, locking mechanisms, database indexing, and REST API routing.
3. **Phase 3 — Project Discussions & Algorithmic Practice**: Deep-dive STAR story preparation for existing projects (e.g. NexusFlow) + targeted DSA practice in weak areas.
4. **Phase 4 — Company Research & Behavioral STAR Prep**: Complete company research checklist and practice interviewer questions.
