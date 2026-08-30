import { z } from 'zod';

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
