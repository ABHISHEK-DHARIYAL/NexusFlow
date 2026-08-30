import { z } from 'zod';

export const VALID_APPLICATION_STATUSES = [
  'SAVED',
  'APPLYING',
  'APPLIED',
  'SCREENING',
  'ASSESSMENT',
  'INTERVIEW',
  'FINAL_ROUND',
  'OFFER',
  'ACCEPTED',
  'REJECTED',
  'WITHDRAWN',
  'ON_HOLD',
] as const;

export const VALID_APPLICATION_PRIORITIES = ['HIGH', 'MEDIUM', 'LOW'] as const;

export const VALID_EVENT_TYPES = [
  'APPLICATION_SUBMITTED',
  'RECRUITER_CONTACT',
  'SCREENING',
  'ASSESSMENT',
  'INTERVIEW',
  'FINAL_INTERVIEW',
  'OFFER',
  'REJECTION',
  'WITHDRAWAL',
  'FOLLOW_UP',
  'CUSTOM',
] as const;

export const VALID_SOURCES = [
  'LINKEDIN',
  'COMPANY_WEBSITE',
  'REFERRAL',
  'COLLEGE_PORTAL',
  'HIRING_PLATFORM',
  'DIRECT_OUTREACH',
  'OTHER',
] as const;

export const CreateApplicationSchema = z.object({
  jobId: z.string().uuid().optional().nullable(),
  companyName: z.string().min(1, 'Company name is required').max(100),
  jobTitle: z.string().min(1, 'Job title is required').max(100),
  location: z.string().max(100).optional().nullable(),
  jobUrl: z.string().url('Invalid URL format').optional().nullable().or(z.literal('')),
  applicationDate: z.string().optional().nullable(),
  status: z.enum(VALID_APPLICATION_STATUSES).default('SAVED'),
  priority: z.enum(VALID_APPLICATION_PRIORITIES).default('MEDIUM'),
  notes: z.string().max(5000, 'Notes cannot exceed 5000 characters').optional().nullable(),
  salaryRange: z.string().max(100).optional().nullable(),
  source: z.string().max(50).optional().nullable(),
  deadline: z.string().optional().nullable(),
});

export const UpdateApplicationSchema = z.object({
  companyName: z.string().min(1).max(100).optional(),
  jobTitle: z.string().min(1).max(100).optional(),
  location: z.string().max(100).optional().nullable(),
  jobUrl: z.string().url('Invalid URL format').optional().nullable().or(z.literal('')),
  applicationDate: z.string().optional().nullable(),
  priority: z.enum(VALID_APPLICATION_PRIORITIES).optional(),
  notes: z.string().max(5000).optional().nullable(),
  salaryRange: z.string().max(100).optional().nullable(),
  source: z.string().max(50).optional().nullable(),
  deadline: z.string().optional().nullable(),
  jobId: z.string().uuid().optional().nullable(),
});

export const UpdateStatusSchema = z.object({
  status: z.enum(VALID_APPLICATION_STATUSES),
  note: z.string().max(1000).optional(),
  force: z.boolean().optional().default(false),
});

export const CreateEventSchema = z.object({
  type: z.enum(VALID_EVENT_TYPES),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional().nullable(),
  eventDate: z.string().optional().nullable(),
});

export const CreateFollowUpSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  followUpDate: z.string().min(1, 'Follow-up date is required'),
  followUpNote: z.string().max(1000).optional().nullable(),
});

export const UpdateFollowUpSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  followUpDate: z.string().optional(),
  followUpNote: z.string().max(1000).optional().nullable(),
  completed: z.boolean().optional(),
});

export type CreateApplicationInput = z.infer<typeof CreateApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof UpdateApplicationSchema>;
export type UpdateStatusInput = z.infer<typeof UpdateStatusSchema>;
export type CreateEventInput = z.infer<typeof CreateEventSchema>;
export type CreateFollowUpInput = z.infer<typeof CreateFollowUpSchema>;
export type UpdateFollowUpInput = z.infer<typeof UpdateFollowUpSchema>;
