import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@prisma/client', () => ({
  UserRole: { ADMIN: 'ADMIN', USER: 'USER' },
}));

// Regression tests for the most severe confirmed bug in this audit:
// backend/routes/user.routes.ts had NO authentication at all - anyone
// could unauthenticated list every user, view any user's profile, update
// any user's fields (including `role`, enabling privilege escalation to
// ADMIN), or delete any account. Also fixes a mass-assignment bug where
// updateUser forwarded the entire request body directly as a Prisma
// update with no field whitelist.

vi.mock('../../services/UserService', () => {
  return {
    UserService: class {
      getAllUsers = vi.fn().mockResolvedValue({ users: [], total: 0 });
      getUserById = vi.fn().mockResolvedValue({ id: 'user-a', name: 'A' });
      createUser = vi.fn().mockResolvedValue({ id: 'new-user' });
      updateUser = vi.fn().mockImplementation((id: string, data: any) => Promise.resolve({ id, ...data }));
      deleteUser = vi.fn().mockResolvedValue({ id: 'user-a' });
    },
  };
});

import { UserController } from '../UserController';

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('UserController - authorization and mass-assignment fixes', () => {
  let controller: UserController;

  beforeEach(() => {
    controller = new UserController();
  });

  it('rejects getUserById for a different user who is not admin', async () => {
    const req: any = { params: { id: 'user-b' }, user: { id: 'user-a', role: 'USER' } };
    const res = mockRes();

    await expect(controller.getUserById(req, res)).rejects.toThrow();
  });

  it('allows getUserById for the authenticated user themself', async () => {
    const req: any = { params: { id: 'user-a' }, user: { id: 'user-a', role: 'USER' } };
    const res = mockRes();

    await controller.getUserById(req, res);
    expect(res.json).toHaveBeenCalled();
  });

  it('allows an admin to view any user', async () => {
    const req: any = { params: { id: 'user-b' }, user: { id: 'admin-1', role: 'ADMIN' } };
    const res = mockRes();

    await controller.getUserById(req, res);
    expect(res.json).toHaveBeenCalled();
  });

  it('rejects getUsers (list all) for a non-admin', async () => {
    const req: any = { query: {}, user: { id: 'user-a', role: 'USER' } };
    const res = mockRes();

    await expect(controller.getUsers(req, res)).rejects.toThrow();
  });

  it('strips role/status from a non-admin self-update (privilege escalation prevention)', async () => {
    const req: any = {
      params: { id: 'user-a' },
      user: { id: 'user-a', role: 'USER' },
      body: { name: 'New Name', role: 'ADMIN', status: 'ACTIVE', githubId: 'attacker-controlled' },
    };
    const res = mockRes();

    await controller.updateUser(req, res);

    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.data.name).toBe('New Name');
    expect(jsonArg.data.role).toBeUndefined();
    expect(jsonArg.data.status).toBeUndefined();
    expect(jsonArg.data.githubId).toBeUndefined();
  });

  it('rejects updateUser for a different user who is not admin', async () => {
    const req: any = {
      params: { id: 'user-b' },
      user: { id: 'user-a', role: 'USER' },
      body: { name: 'Hijacked' },
    };
    const res = mockRes();

    await expect(controller.updateUser(req, res)).rejects.toThrow();
  });

  it('allows an admin to set role on another user', async () => {
    const req: any = {
      params: { id: 'user-b' },
      user: { id: 'admin-1', role: 'ADMIN' },
      body: { role: 'ADMIN' },
    };
    const res = mockRes();

    await controller.updateUser(req, res);
    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.data.role).toBe('ADMIN');
  });

  it('rejects deleteUser for a different user who is not admin', async () => {
    const req: any = { params: { id: 'user-b' }, user: { id: 'user-a', role: 'USER' } };
    const res = mockRes();

    await expect(controller.deleteUser(req, res)).rejects.toThrow();
  });
});
