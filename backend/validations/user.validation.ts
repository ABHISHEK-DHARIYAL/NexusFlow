import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    username: z.string().min(3).max(30),
    email: z.string().email(),
    githubId: z.string(),
    avatarUrl: z.string().url().optional(),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().optional(),
    username: z.string().min(3).max(30).optional(),
    email: z.string().email().optional(),
    avatarUrl: z.string().url().optional(),
  }),
});
