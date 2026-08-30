import { z } from 'zod';

export const createRepositorySchema = z.object({
  body: z.object({
    userId: z.string().uuid(),
    githubRepoId: z.number().or(z.string()),
    owner: z.string().min(1),
    name: z.string().min(1),
    fullName: z.string().min(1),
    description: z.string().optional(),
    defaultBranch: z.string().default('main'),
    language: z.string().optional(),
    githubUrl: z.string().url(),
    cloneUrl: z.string().url(),
  }),
});
