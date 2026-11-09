import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { ApiResponse } from '../types';
import { ForbiddenError } from '../utils/errors';
import { UserRole } from '@prisma/client';

const SELF_EDITABLE_FIELDS = ['name', 'avatarUrl'] as const;

function isAdmin(authUser: any): boolean {
  return authUser?.role === UserRole.ADMIN || authUser?.role === 'ADMIN';
}

function assertSelfOrAdmin(targetId: string, authUser: any) {
  if (!authUser?.id) {
    throw new ForbiddenError('Authentication required');
  }
  if (authUser.id !== targetId && !isAdmin(authUser)) {
    throw new ForbiddenError('You do not have permission to access this user');
  }
}

export class UserController {
  constructor(private userService = new UserService()) {}

  getUsers = async (req: Request, res: Response) => {
    // requireRole('ADMIN') on the route already restricts this, kept here
    // as defense-in-depth in case the route wiring ever changes.
    if (!isAdmin(req.user)) {
      throw new ForbiddenError('Admin access required');
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    const { users, total } = await this.userService.getAllUsers({ page, limit, search });

    const response: ApiResponse = {
      success: true,
      data: users,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    res.json(response);
  };

  getUserById = async (req: Request, res: Response) => {
    assertSelfOrAdmin(req.params.id, req.user);
    const user = await this.userService.getUserById(req.params.id);
    const response: ApiResponse = {
      success: true,
      data: user,
    };
    res.json(response);
  };

  createUser = async (req: Request, res: Response) => {
    // requireRole('ADMIN') on the route already restricts this.
    if (!isAdmin(req.user)) {
      throw new ForbiddenError('Admin access required');
    }
    const user = await this.userService.createUser(req.body);
    const response: ApiResponse = {
      success: true,
      message: 'User created successfully',
      data: user,
    };
    res.status(201).json(response);
  };

  updateUser = async (req: Request, res: Response) => {
    assertSelfOrAdmin(req.params.id, req.user);

    // Fix for a confirmed mass-assignment / privilege-escalation bug:
    // this previously forwarded the entire request body directly as a
    // Prisma update, so a caller could set `role: "ADMIN"`, `status`,
    // `githubId`, or `email` on their own account. Non-admins may only
    // ever change their own display name / avatar; only an admin may set
    // anything else, and even then through the same whitelist below plus
    // role/status explicitly.
    const body = req.body || {};
    const updateData: Record<string, unknown> = {};

    for (const field of SELF_EDITABLE_FIELDS) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (isAdmin(req.user)) {
      if (body.role !== undefined) updateData.role = body.role;
      if (body.status !== undefined) updateData.status = body.status;
    }

    const user = await this.userService.updateUser(req.params.id, updateData as any);
    const response: ApiResponse = {
      success: true,
      message: 'User updated successfully',
      data: user,
    };
    res.json(response);
  };

  deleteUser = async (req: Request, res: Response) => {
    assertSelfOrAdmin(req.params.id, req.user);
    await this.userService.deleteUser(req.params.id);
    const response: ApiResponse = {
      success: true,
      message: 'User deleted successfully',
    };
    res.json(response);
  };
}
