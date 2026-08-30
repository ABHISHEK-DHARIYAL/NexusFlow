# NexusFlow — WebSocket Real-Time Transport Architecture Documentation (Part 1A)

**Document Date:** August 13, 2026  
**Status:** IMPLEMENTED & VERIFIED  
**Server Endpoint:** `ws://0.0.0.0:3000/ws` (and `/api/v1/ws`)  

---

## 1. Overview

Part 1A upgrades NexusFlow from an in-memory `EventEmitter` model to a dedicated **WebSocket transport layer**. The system provides authenticated, user-isolated, real-time event streaming between backend background workers/services and connected frontend clients.

---

## 2. Server Architecture (`src/server/websocket/WebSocketServer.ts`)

The `NexusWebSocketServer` is initialized in `server.ts` and mounted onto the Express `http.Server` upgrade listener on path `/ws` and `/api/v1/ws`.

### Key Characteristics:
- **Engine**: Built using `ws` (`WebSocketServer`).
- **Server Attachment**: Hooks directly into HTTP `upgrade` event before Express routing.
- **Heartbeat & Cleanup**: Sends `ping` frames every 30 seconds. Terminates inactive connections (`isAlive === false`) automatically.

---

## 3. Authentication & Security Handshake

Connections MUST be authenticated before receiving real-time events.

### Authentication Mechanisms:
1. **Query Parameter**: `ws://0.0.0.0:3000/ws?token=<JWT_ACCESS_TOKEN>`
2. **`Sec-WebSocket-Protocol` Header**: `bearer, <JWT_ACCESS_TOKEN>`
3. **Auth Handshake Frame**: Client can send `{ "type": "auth", "token": "<JWT_ACCESS_TOKEN>" }` within 2 seconds of connecting.

### Security Enforcements:
- Tokens are verified via `TokenService.verifyAccessToken(token)`.
- If verification fails or expires, the server closes the connection with close code `4001` (`Unauthorized: Invalid or expired token`).

---

## 4. User Isolation & Multi-Device Connections

To guarantee that **User A never receives User B's real-time events**:

- The server maintains a mapping: `Map<string, Set<WebSocket>>` mapping `userId` to a set of active connections for that user.
- Every event payload emitted by backend EventEmitters contains `userId` or `data.userId`.
- The WebSocket server filters recipients and sends messages ONLY to sockets belonging to that specific `userId`.
- Multi-tab and multi-device sessions for the same user receive events simultaneously across all connected sockets for that user.

---

## 5. Backend EventEmitter Integration

The WebSocket server subscribes to all domain EventEmitters upon startup:

1. **`ApplicationEventEmitter`**: `application:created`, `application:updated`, `application:status_changed`, `application:event_added`, `application:followup_due`
2. **`CareerEventEmitter`**: `career:message`, `career:interview_started`
3. **`ResumeEventEmitter`**: `resume:github_verification_started`, `resume:github_verification_progress`, `resume:github_verification_completed`, `resume:github_verification_failed`
4. **`CrossPlatformEventEmitter`**: `cross_platform:verification_started`, `cross_platform:verification_progress`, `cross_platform:verification_completed`, `cross_platform:verification_failed`
5. **`JobEventEmitter`**: `job_readiness:started`, `job_readiness:progress`, `job_readiness:completed`, `job_readiness:failed`, `job:analysis_started`, `job:analysis_completed`, `job:analysis_failed`
6. **`ScheduleEventEmitter`**: `schedule:created`, `schedule:updated`, `schedule:started`, `schedule:completed`, `schedule:failed`, `schedule:skipped`, `schedule:disabled`
7. **`CodeforcesEventEmitter`**: `codeforces:sync_started`, `codeforces:sync_progress`, `codeforces:sync_completed`, `codeforces:analysis_completed`, `codeforces:sync_failed`
8. **`PortfolioEventEmitter`**: `portfolio:crawl_started`, `portfolio:crawl_progress`, `portfolio:crawl_completed`, `portfolio:analysis_completed`, `portfolio:crawl_failed`
9. **`LeetCodeEventEmitter`**: `leetcode:sync_started`, `leetcode:sync_progress`, `leetcode:sync_completed`, `leetcode:analysis_completed`, `leetcode:sync_failed`
10. **`TaskEventEmitter`**: `task:created`, `task:status_changed`, `task:progress`, `task:completed`, `task:failed`, `task:log`

---

## 6. Frontend Integration & Stores (`useWebSocket.ts`)

The frontend hook `useWebSocket()` in `src/hooks/useWebSocket.ts`:
- Automatically initializes inside `AppShell` when a user is authenticated.
- Dynamically derives `ws://` / `wss://` protocol based on host.
- Implements **Exponential Backoff Reconnection** (1s, 2s, 4s, up to max 10s) on network drops or server restarts.
- Syncs events directly into Zustand stores:
  - `useQueueStore`: Updates task progress & status in real-time (`upsertTask`).
  - `useNotificationStore`: Spawns instant system alerts & analysis notifications (`addNotification`).

---

## 7. Verification & Test Suite (`tests/integration/websocket.test.ts`)

Ran and verified via Vitest (`npx vitest run tests/integration/websocket.test.ts`):

- `✓ should allow connection with valid mock access token`
- `✓ should reject connection with invalid token` (close code `4001`)
- `✓ should enforce user isolation (User A receives User A events, User B does not)`
- `✓ should forward LeetCode, Codeforces, Job, and Task events via EventEmitter`
- `✓ should handle ping and pong messages`

**Result:** 5 / 5 tests passed cleanly.
