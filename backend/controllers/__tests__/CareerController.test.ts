import { describe, it, expect, vi, beforeEach } from 'vitest';

// Regression test for a bug where CareerController fell back to
// req.body.userId / req.query.userId / a hardcoded 'mock-user-123' whenever
// req.user was missing. Although currently unreachable in production because
// every route is wrapped in requireAuth, this was a latent IDOR: if the
// middleware were ever bypassed, an attacker-supplied userId would have been
// trusted directly. The fix requires a verified authenticated identity and
// throws UnauthorizedError otherwise, with no client-supplied fallback.

vi.mock('../../services/CareerCoachService', () => ({
  careerCoachService: {
    createChat: vi.fn().mockResolvedValue({ id: 'chat1' }),
    getUserChats: vi.fn().mockResolvedValue([]),
    getDashboardMetrics: vi.fn().mockResolvedValue({}),
  },
}));

import { CareerController } from '../CareerController';
import { careerCoachService } from '../../services/CareerCoachService';

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('CareerController - identity handling', () => {
  let controller: CareerController;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new CareerController();
  });

  it('rejects createChat when req.user is missing, even if body.userId is supplied', async () => {
    const req: any = { body: { userId: 'attacker-supplied-id', mode: 'GENERAL_CAREER_CHAT' } };
    const res = mockRes();

    await controller.createChat(req, res);

    expect(careerCoachService.createChat).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('rejects getUserChats when req.user is missing, even if query.userId is supplied', async () => {
    const req: any = { query: { userId: 'attacker-supplied-id' } };
    const res = mockRes();

    await controller.getUserChats(req, res);

    expect(careerCoachService.getUserChats).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('uses only the authenticated user id when req.user is present', async () => {
    const req: any = { user: { id: 'real-authenticated-user' }, query: {} };
    const res = mockRes();

    await controller.getDashboardMetrics(req, res);

    expect(careerCoachService.getDashboardMetrics).toHaveBeenCalledWith('real-authenticated-user');
  });
});
