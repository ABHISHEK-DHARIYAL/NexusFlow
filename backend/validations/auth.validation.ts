import { z } from 'zod';

export const signupSchema = z.object({
  body: z.object({
    email: z.string().email('A valid email address is required'),
    // Username is optional at signup: if omitted, one is derived from the
    // email (and de-duplicated) so the flow stays a single step.
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(39, 'Username must be at most 39 characters')
      .regex(/^[a-zA-Z0-9_-]+$/, 'Username may only contain letters, numbers, hyphens and underscores')
      .optional(),
    name: z.string().max(191).optional(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password is too long'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('A valid email address is required'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const githubCallbackSchema = z.object({
  query: z.object({
    code: z.string().min(1, 'Authorization code is required'),
    state: z.string().min(1, 'OAuth state is required'),
  }),
});

export const refreshTokenSchema = z.object({
  cookies: z.object({
    refreshToken: z.string().optional(),
  }).optional(),
  body: z.object({
    refreshToken: z.string().optional(),
  }).optional(),
}).refine(
  (data) => Boolean(data.cookies?.refreshToken || data.body?.refreshToken),
  {
    message: 'Refresh token cookie or body is required',
    path: ['refreshToken'],
  }
);

export const logoutSchema = z.object({
  cookies: z.object({
    refreshToken: z.string().optional(),
  }).optional(),
  body: z.object({
    refreshToken: z.string().optional(),
  }).optional(),
});
