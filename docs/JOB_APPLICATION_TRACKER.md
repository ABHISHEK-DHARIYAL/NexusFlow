# NexusFlow — Job / Application Tracker (Part 21 Architecture)

## 1. Overview & Core Philosophy

The **Job / Application Tracker** serves as the operational command center for a developer's career pipeline within NexusFlow. Rather than acting as a simple static spreadsheet or generic CRM, it connects directly with NexusFlow's existing intelligence layers:

- **Part 17 — Job Description Intelligence + Matching**: Automatically links candidate profile match scores and gap skills to tracked applications.
- **Part 18 — Job Readiness**: Maps candidate overall readiness scores and top skill gaps.
- **Part 19 — Company Intelligence**: Exposes company tech stack coverage and interview focus areas.
- **Part 20 — AI Career + Interview Coach**: Injects active application context into the AI prompt so the Career Coach answers personalized questions ("How strong is my application for Microsoft?", "What should I review before my Amazon OA?").

---

## 2. Architecture & Data Model

```
               ┌──────────────────────────────┐
               │    Application (Prisma)      │
               │  - status: ApplicationStatus │
               │  - health: ApplicationHealth │
               │  - priority: Priority        │
               └──────────────┬───────────────┘
                              │ 1:N
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ApplicationEvent│     │  FollowUp     │     │ CareerCoach   │
│  - type       │     │  - title      │     │ Context       │
│  - eventDate  │     │  - reminder   │     │ Injection     │
└───────────────┘     └───────────────┘     └───────────────┘
```

### Deterministic Status Transitions

```
[SAVED] ──► [APPLYING] ──► [APPLIED] ──► [SCREENING] ──► [ASSESSMENT] ──► [INTERVIEW] ──► [FINAL_ROUND] ──► [OFFER] ──► [ACCEPTED]
                                  │             │               │               │               │
                                  └─────────────┴───────────────┴───────────────┴───────────────┴──► [REJECTED]
```

To prevent accidental data corruptions (e.g. moving an ACCEPTED job back to SAVED), status transitions follow a deterministic state machine enforce in `ApplicationService`. A `force: true` override parameter is available for manual user correction.

---

## 3. Key Services & Components

### Backend Layer
- `ApplicationService`: Central domain service handling application CRUD, status state machine validation, stalled application detection (`>= 14 days inactive`), timeline event recording, and Gemini follow-up email drafting.
- `ApplicationController`: RESTful API controller handling endpoint validation and response serialization.
- `applicationRoutes`: Express router exposing `/api/applications`.
- `ApplicationEventEmitter`: Isolated domain event emitter decoupled from core server events to prevent circular dependencies.
- `CareerCoachContextService`: Injects real-time active application state into Gemini system prompts.

### Frontend Layer
- `ApplicationsPage.tsx`: Main page housing view toggles, summary metrics, and modal dialogs.
- `ApplicationOverviewCards.tsx`: 6 summary cards (Total, Active, Interviewing, Offers, Stalled, Action Required).
- `ApplicationFunnelAnalytics.tsx`: Step conversion rate bars and funnel metrics.
- `ApplicationPipelineBoard.tsx`: Interactive Kanban board organized across 10 pipeline stages.
- `ApplicationListView.tsx`: Table view with filtering, sorting, and health indicators.
- `ApplicationDetailModal.tsx`: 7-tab deep intelligence modal (Overview, Timeline, Job Match, Readiness, Company Prep, Interview History, Follow-ups + Gemini Draft Generator).

---

## 4. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/applications` | Retrieves user application pipeline |
| `POST` | `/api/applications` | Creates new tracked application |
| `GET` | `/api/applications/stats` | Retrieves conversion funnel & health metrics |
| `GET` | `/api/applications/:id` | Retrieves single application with intelligence |
| `PATCH` | `/api/applications/:id/status` | Transitions application stage |
| `DELETE` | `/api/applications/:id` | Deletes application |
| `POST` | `/api/applications/:id/events` | Records timeline event |
| `GET` | `/api/applications/:id/events` | Retrieves timeline history |
| `POST` | `/api/applications/:id/follow-ups` | Creates follow-up reminder |
| `PATCH` | `/api/applications/:id/follow-ups/:fId` | Updates follow-up reminder |
| `DELETE` | `/api/applications/:id/follow-ups/:fId` | Deletes follow-up reminder |
| `POST` | `/api/applications/:id/draft-followup` | Generates Gemini AI follow-up email draft |

---

## 5. Security & Isolation

- Strict IDOR (Insecure Direct Object Reference) protection enforced on every endpoint via `assertResourceOwnership`.
- Zero user data bleeding: users can only view, update, or delete applications owned by their authenticated identity (`req.user.id`).
- No unsolicited scraping: applications are strictly created via direct user input or explicit job description linking.
