# Node.js <-> Java Worker Integration Architecture

## Overview
NexusFlow features a high-performance hybrid architecture where the **Node.js Express API Server** delegates heavy concurrent background task processing to an isolated, multi-threaded **Java Concurrency Engine & Worker Service**.

Communication between Node.js and Java occurs over internal HTTP REST calls secured with shared secret authentication (`X-Worker-Secret`) and tracked across process boundaries using unified correlation IDs (`X-Correlation-Id`).

---

## 1. Network & Security Architecture

```
┌─────────────────────────┐               ┌─────────────────────────────────┐
│                         │  HTTP REST      │                                 │
│   Node.js Express API   ├───────────────►│  Java Worker Service            │
│   (Port 3000)           │  Internal API   │  (Port 8081)                    │
│                         │               │                                 │
│  - JavaWorkerClient     │               │  - WorkerHttpServer             │
│  - TaskSyncService      │               │  - InternalAuthFilter           │
│  - TaskService          │               │  - NexusThreadPool Engine       │
└─────────────────────────┘               └─────────────────────────────────┘
```

### Security & Shared Secrets
- **Header**: `X-Worker-Secret`
- **Validation**: Enforced on every internal request by `InternalAuthFilter` on the Java Worker using constant-time byte array comparison (`MessageDigest.isEqual`) to prevent timing attacks.
- **Environment Variable**: `JAVA_WORKER_SECRET` (default: `default_nexusflow_worker_secret_2026`).

### Distributed Request Tracing
- **Header**: `X-Correlation-Id`
- **Tracing**: Node.js passes its internal correlation ID to Java, which echoes it in headers and includes it in log output for end-to-end auditability.

---

## 2. API Endpoint Specification

The Java Worker exposes the following `/internal` endpoints:

| Endpoint | Method | Description | Response Code |
| :--- | :--- | :--- | :--- |
| `/internal/tasks` | `POST` | Submit task for execution (Idempotent) | `202 Accepted` |
| `/internal/tasks/{taskId}` | `GET` | Query task execution status & results | `200 OK` / `404 Not Found` |
| `/internal/tasks/{taskId}/cancel` | `POST` | Cancel queued or running task | `200 OK` / `404 Not Found` |
| `/internal/health` | `GET` | Service liveness & worker thread health | `200 OK` |
| `/internal/metrics` | `GET` | Thread pool throughput, queue depth & stats | `200 OK` |

---

## 3. Node.js Client Implementation (`JavaWorkerClient`)

- **HTTP Engine**: Standard Node.js `fetch` API.
- **Timeout Management**: `AbortController` with configurable timeout (`WORKER_REQUEST_TIMEOUT_MS`, default 5000ms).
- **Error Hierarchy**:
  - `WorkerConnectionError` (HTTP 503) - Network or connection refused errors.
  - `WorkerTimeoutError` (HTTP 504) - Execution timeout.
  - `WorkerAuthenticationError` (HTTP 401) - Secret mismatch.
  - `WorkerResponseError` - Non-2xx response from Java worker.

---

## 4. State Synchronization (`TaskSyncService`)

1. **Task Submission Flow**:
   - Node.js receives task creation request -> Saves task as `PENDING` in database.
   - Node.js asynchronously dispatches payload to Java worker (`submitTask`).
   - Java worker returns `QUEUED`/`RUNNING` -> Node.js updates status.

2. **Status Sync Flow**:
   - Node.js queries task status -> `TaskSyncService` queries Java worker (`getTaskStatus`).
   - Mapped status updates PostgreSQL database (`COMPLETED`, `FAILED`, `RUNNING`).

3. **Background Sync Poller**:
   - `TaskSyncService` periodically polls active tasks to sync terminal states.

---

## 5. Verification & Testing

- **Java Unit & Server Tests**: `mvn test -f worker/pom.xml`
- **Node Integration & E2E Tests**: `npm test`
