import { describe, it, expect, vi, beforeEach } from 'vitest';
import { applicationService } from '../ApplicationService';
import {
  CreateApplicationSchema,
  UpdateStatusSchema,
  CreateEventSchema,
  CreateFollowUpSchema,
} from '../../validations/application.validation';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../utils/errors';

// Mock Prisma
vi.mock('../../lib/prisma', () => {
  const mockApp = {
    id: 'app-123',
    userId: 'usr_01h8x9p3',
    jobId: 'job-123',
    companyName: 'Microsoft',
    jobTitle: 'Software Engineer Intern',
    location: 'Redmond, WA',
    jobUrl: 'https://careers.microsoft.com',
    applicationDate: new Date('2026-05-01T00:00:00.000Z'),
    status: 'INTERVIEW',
    priority: 'HIGH',
    notes: 'Technical interview round 1 scheduled.',
    salaryRange: '$52/hr',
    source: 'COMPANY_WEBSITE',
    createdAt: new Date('2026-05-01T00:00:00.000Z'),
    updatedAt: new Date('2026-05-05T00:00:00.000Z'),
    events: [
      {
        id: 'ev-1',
        applicationId: 'app-123',
        type: 'APPLICATION_SUBMITTED',
        title: 'Application Submitted',
        description: 'Submitted online.',
        eventDate: new Date('2026-05-01T00:00:00.000Z'),
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
      },
    ],
    followUps: [
      {
        id: 'fu-1',
        applicationId: 'app-123',
        title: 'Review Java Concurrency',
        followUpDate: new Date('2026-05-10T00:00:00.000Z'),
        followUpNote: 'Practice interview questions.',
        completed: false,
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
        updatedAt: new Date('2026-05-01T00:00:00.000Z'),
      },
    ],
    job: {
      id: 'job-123',
      title: 'Software Engineer Intern',
      company: 'Microsoft',
      matches: [{ overallMatchScore: 87, matchLabel: 'Strong Alignment', requiredSkillCoverage: 0.85 }],
      readinesses: [{ score: 81, level: 'HIGH' }],
      companyPreparations: [{ preparationCoverageScore: 88, topPriorityTopic: 'Java Concurrency' }],
      interviewSessions: [{ overallScore: 85, createdAt: new Date() }],
    },
  };

  return {
    prisma: {
      application: {
        create: vi.fn().mockImplementation((args) => Promise.resolve({ ...mockApp, ...args.data, id: 'app-new-123' })),
        findUnique: vi.fn().mockImplementation(({ where }) => {
          if (where.id === 'app-123') return Promise.resolve(mockApp);
          if (where.id === 'app-stalled-123') {
            return Promise.resolve({
              ...mockApp,
              id: 'app-stalled-123',
              status: 'APPLIED',
              updatedAt: new Date(Date.now() - 20 * 86400000), // 20 days ago
              events: [
                {
                  id: 'ev-old',
                  applicationId: 'app-stalled-123',
                  type: 'APPLICATION_SUBMITTED',
                  title: 'Submitted',
                  eventDate: new Date(Date.now() - 20 * 86400000),
                  createdAt: new Date(Date.now() - 20 * 86400000),
                },
              ],
              followUps: [],
            });
          }
          if (where.id === 'app-other-user') {
            return Promise.resolve({ ...mockApp, id: 'app-other-user', userId: 'other-user-999' });
          }
          return Promise.resolve(null);
        }),
        findMany: vi.fn().mockResolvedValue([mockApp]),
        count: vi.fn().mockResolvedValue(1),
        update: vi.fn().mockImplementation(({ where, data }) => Promise.resolve({ ...mockApp, ...data, id: where.id })),
        delete: vi.fn().mockResolvedValue(mockApp),
      },
      applicationEvent: {
        create: vi.fn().mockResolvedValue({
          id: 'ev-new',
          applicationId: 'app-123',
          type: 'INTERVIEW',
          title: 'Interview Added',
          description: 'Details',
          eventDate: new Date(),
          createdAt: new Date(),
        }),
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'ev-1',
            applicationId: 'app-123',
            type: 'APPLICATION_SUBMITTED',
            title: 'Submitted',
            description: 'Submitted',
            eventDate: new Date(),
            createdAt: new Date(),
          },
        ]),
      },
      applicationFollowUp: {
        create: vi.fn().mockResolvedValue({
          id: 'fu-new',
          applicationId: 'app-123',
          title: 'Follow up reminder',
          followUpDate: new Date(Date.now() + 86400000),
          followUpNote: 'Check status',
          completed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        findUnique: vi.fn().mockImplementation(({ where }) => {
          if (where.id === 'fu-1') {
            return Promise.resolve({
              id: 'fu-1',
              applicationId: 'app-123',
              title: 'Review Java Concurrency',
              followUpDate: new Date(),
              completed: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
          return Promise.resolve(null);
        }),
        update: vi.fn().mockImplementation(({ where, data }) =>
          Promise.resolve({
            id: where.id,
            applicationId: 'app-123',
            title: 'Updated title',
            followUpDate: new Date(),
            completed: data.completed ?? false,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        ),
        delete: vi.fn().mockResolvedValue({ id: 'fu-1' }),
      },
      jobDescription: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    },
  };
});

describe('ApplicationService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Validation Schemas', () => {
    it('validates CreateApplicationSchema correctly', () => {
      const valid = {
        companyName: 'Microsoft',
        jobTitle: 'Software Engineer Intern',
        status: 'SAVED',
        priority: 'HIGH',
      };
      expect(CreateApplicationSchema.parse(valid)).toBeTruthy();
    });

    it('rejects invalid URL in CreateApplicationSchema', () => {
      const invalid = {
        companyName: 'Microsoft',
        jobTitle: 'Engineer',
        jobUrl: 'invalid-url',
      };
      expect(() => CreateApplicationSchema.parse(invalid)).toThrow();
    });

    it('validates UpdateStatusSchema', () => {
      const valid = { status: 'INTERVIEW', force: false };
      expect(UpdateStatusSchema.parse(valid).status).toBe('INTERVIEW');
    });
  });

  describe('Status Transition Matrix', () => {
    it('allows valid sequential status transitions', () => {
      expect(applicationService.isValidStatusTransition('SAVED', 'APPLIED')).toBe(true);
      expect(applicationService.isValidStatusTransition('APPLIED', 'INTERVIEW')).toBe(true);
      expect(applicationService.isValidStatusTransition('INTERVIEW', 'OFFER')).toBe(true);
      expect(applicationService.isValidStatusTransition('OFFER', 'ACCEPTED')).toBe(true);
    });

    it('prevents invalid backward transitions without force flag', () => {
      expect(applicationService.isValidStatusTransition('ACCEPTED', 'APPLIED')).toBe(false);
      expect(applicationService.isValidStatusTransition('REJECTED', 'INTERVIEW')).toBe(false);
    });

    it('throws BadRequestError when attempting invalid status transition without force', async () => {
      await expect(
        applicationService.updateStatus('usr_01h8x9p3', 'app-123', {
          status: 'APPLIED',
          force: false,
        })
      ).rejects.toThrow();
    });
  });

  describe('Application Retrieval & Enrichment', () => {
    it('retrieves application by ID and enriches with Part 17, 18, 19, 20 data', async () => {
      const app = await applicationService.getApplicationById('usr_01h8x9p3', 'app-123');

      expect(app.id).toBe('app-123');
      expect(app.companyName).toBe('Microsoft');
      expect(app.jobMatch?.overallMatchScore).toBe(87);
      expect(app.jobReadiness?.score).toBe(81);
      expect(app.companyPreparation?.preparationCoverageScore).toBe(88);
      expect(app.interviewHistory?.sessionCount).toBe(1);
      expect(app.nextAction).toContain('Interview Coach');
    });

    it('enforces IDOR protection when retrieving application belonging to another user', async () => {
      await expect(applicationService.getApplicationById('usr_01h8x9p3', 'app-other-user')).rejects.toThrow(
        ForbiddenError
      );
    });
  });

  describe('Stalled Application Detection', () => {
    it('detects stalled applications older than 14 days without activity', async () => {
      const app = await applicationService.getApplicationById('usr_01h8x9p3', 'app-stalled-123');

      expect(app.health).toBe('STALLED');
      expect(app.stalledDays).toBeGreaterThanOrEqual(14);
      // Does NOT change status to REJECTED automatically!
      expect(app.status).toBe('APPLIED');
    });
  });

  describe('Follow-up Reminders Lifecycle', () => {
    it('computes correct reminder status (UPCOMING, DUE, OVERDUE, COMPLETED)', () => {
      const future = new Date(Date.now() + 5 * 86400000).toISOString();
      const past = new Date(Date.now() - 5 * 86400000).toISOString();

      expect(applicationService.computeFollowUpReminderStatus(false, future)).toBe('UPCOMING');
      expect(applicationService.computeFollowUpReminderStatus(false, past)).toBe('OVERDUE');
      expect(applicationService.computeFollowUpReminderStatus(true, past)).toBe('COMPLETED');
    });

    it('creates a new follow-up reminder', async () => {
      const fu = await applicationService.addFollowUp('usr_01h8x9p3', 'app-123', {
        title: 'Send status inquiry',
        followUpDate: new Date(Date.now() + 86400000).toISOString(),
        followUpNote: 'Inquire politely',
      });

      expect(fu.title).toBe('Follow up reminder');
      expect(fu.completed).toBe(false);
    });

    it('updates follow-up completion state', async () => {
      const updated = await applicationService.updateFollowUp('usr_01h8x9p3', 'app-123', 'fu-1', {
        completed: true,
      });

      expect(updated.completed).toBe(true);
      expect(updated.reminderStatus).toBe('COMPLETED');
    });
  });

  describe('Stats & Funnel Analytics', () => {
    it('calculates application stats and conversion rates', async () => {
      const stats = await applicationService.getStats('usr_01h8x9p3');

      expect(stats.total).toBeGreaterThan(0);
      expect(stats.funnel).toBeDefined();
      expect(typeof stats.funnel.applied).toBe('number');
      expect(typeof stats.funnel.conversionRates.overallConversion).toBe('number');
    });
  });

  describe('Follow-Up Drafting Assistance', () => {
    it('generates structured follow-up draft', async () => {
      const draft = await applicationService.draftFollowUpMessage('usr_01h8x9p3', 'app-123');

      expect(draft.subject).toBeDefined();
      expect(draft.body).toBeDefined();
      expect(draft.body.length).toBeGreaterThan(10);
    }, 10000);
  });
});
