import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/prisma', () => ({
  prisma: {},
}));

// Regression tests for two confirmed WebSocket bugs:
//
// 1. dispatch() broadcast any event with a missing userId to every
//    connected user instead of dropping it. Several real emit() call
//    sites (SchedulerService in particular) omitted userId, so schedule
//    execution details and error messages were leaking to every connected
//    user platform-wide.
//
// 2. The event name lists WebSocketServer subscribed to for career coach
//    events ('career:message', 'career:interview_started') didn't match
//    any event CareerCoachService actually emits
//    ('career_chat:response_started', 'interview:started', etc.), so
//    real-time career chat and mock interview updates were silently never
//    delivered to any client.

import { NexusWebSocketServer } from '../WebSocketServer';

function createServerWithMockedMethods() {
  const server = Object.create(NexusWebSocketServer.prototype);
  server.sendToUser = vi.fn();
  server.broadcast = vi.fn();
  const logErrorSpy = vi.fn();
  server['logger'] = { system: { error: logErrorSpy } };
  return { server, logErrorSpy };
}

describe('WebSocketServer.dispatch - safe-by-default on missing userId', () => {
  it('delivers to the specific user when userId is present', () => {
    const { server } = createServerWithMockedMethods();
    server.dispatch('schedule:completed', { userId: 'user-a', scheduleId: 's1' });

    expect(server.sendToUser).toHaveBeenCalledWith('user-a', 'schedule:completed', expect.any(Object));
    expect(server.broadcast).not.toHaveBeenCalled();
  });

  it('never broadcasts a private event to all users when userId is missing', () => {
    const { server } = createServerWithMockedMethods();
    server.dispatch('schedule:failed', { scheduleId: 's1', error: 'sensitive internal error detail' });

    expect(server.broadcast).not.toHaveBeenCalled();
    expect(server.sendToUser).not.toHaveBeenCalled();
  });

  it('reads userId from data.user.id as a fallback shape', () => {
    const { server } = createServerWithMockedMethods();
    server.dispatch('career_chat:response_completed', { user: { id: 'user-b' } });

    expect(server.sendToUser).toHaveBeenCalledWith('user-b', 'career_chat:response_completed', expect.any(Object));
    expect(server.broadcast).not.toHaveBeenCalled();
  });
});
