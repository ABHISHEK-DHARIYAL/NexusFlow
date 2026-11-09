import { prisma } from '../lib/prisma';
import { logger } from '../logger';
import { assertResourceOwnership } from '../utils/ownership';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { GoogleGenAI } from '@google/genai';
import { aiConfig } from '../config/aiConfig';
import { runGeminiWithRetryAndFallback, createGeminiClient } from '../utils/geminiRunner';
import { applicationEventEmitter } from './ApplicationEventEmitter';
import {
  Application,
  ApplicationEvent,
  ApplicationFollowUp,
  ApplicationStatus,
  ApplicationPriority,
  ApplicationHealth,
  ApplicationStats,
} from '../../types';
import {
  CreateApplicationInput,
  UpdateApplicationInput,
  UpdateStatusInput,
  CreateEventInput,
  CreateFollowUpInput,
  UpdateFollowUpInput,
} from '../validations/application.validation';

const STALLED_THRESHOLD_DAYS = 14;

export class ApplicationService {
  private getGeminiClient(): GoogleGenAI | null {
    return createGeminiClient();
  }

  /**
   * Validates if a status transition is allowed.
   */
  public isValidStatusTransition(currentStatus: ApplicationStatus, newStatus: ApplicationStatus): boolean {
    if (currentStatus === newStatus) return true;

    const transitionMap: Record<ApplicationStatus, ApplicationStatus[]> = {
      SAVED: ['APPLYING', 'APPLIED', 'WITHDRAWN', 'SAVED'],
      APPLYING: ['APPLIED', 'SAVED', 'WITHDRAWN'],
      APPLIED: ['SCREENING', 'ASSESSMENT', 'INTERVIEW', 'REJECTED', 'WITHDRAWN', 'ON_HOLD'],
      SCREENING: ['ASSESSMENT', 'INTERVIEW', 'REJECTED', 'WITHDRAWN', 'ON_HOLD'],
      ASSESSMENT: ['INTERVIEW', 'FINAL_ROUND', 'REJECTED', 'WITHDRAWN', 'ON_HOLD'],
      INTERVIEW: ['FINAL_ROUND', 'OFFER', 'REJECTED', 'WITHDRAWN', 'ON_HOLD'],
      FINAL_ROUND: ['OFFER', 'REJECTED', 'WITHDRAWN', 'ON_HOLD'],
      OFFER: ['ACCEPTED', 'REJECTED', 'WITHDRAWN', 'ON_HOLD'],
      ON_HOLD: ['APPLIED', 'SCREENING', 'ASSESSMENT', 'INTERVIEW', 'FINAL_ROUND', 'REJECTED', 'WITHDRAWN'],
      ACCEPTED: ['WITHDRAWN'], // Terminal states can only be force-overridden
      REJECTED: [],
      WITHDRAWN: [],
    };

    const allowed = transitionMap[currentStatus] || [];
    return allowed.includes(newStatus);
  }

  /**
   * Computes deterministic next action recommendation for an application.
   */
  public getNextAction(status: ApplicationStatus, priority: ApplicationPriority, companyName: string): string {
    switch (status) {
      case 'SAVED':
        return `Review job description match for ${companyName} before applying.`;
      case 'APPLYING':
        return `Complete application details and submit on ${companyName} portal.`;
      case 'APPLIED':
        return `Prepare for potential recruiter screening call at ${companyName}.`;
      case 'SCREENING':
        return `Review company research and key technical highlights for ${companyName}.`;
      case 'ASSESSMENT':
        return `Review DSA and role-specific technical topics for ${companyName}.`;
      case 'INTERVIEW':
        return `Open Interview Coach & prepare technical questions for ${companyName}.`;
      case 'FINAL_ROUND':
        return `Review system design, STAR behavioral answers, and ${companyName} values.`;
      case 'OFFER':
        return `Review offer compensation, benefits, and start date details.`;
      case 'ACCEPTED':
        return `Congratulate yourself and prepare onboarding documents for ${companyName}!`;
      case 'REJECTED':
        return `Review skill match and interview feedback to strengthen future applications.`;
      case 'WITHDRAWN':
        return `Application closed.`;
      case 'ON_HOLD':
        return `Check in with ${companyName} recruiter after 7-10 days.`;
      default:
        return `Review application status and prepare next steps.`;
    }
  }

  /**
   * Computes health state and stalled days.
   */
  public computeHealthAndStalled(
    status: ApplicationStatus,
    updatedAt: Date,
    events: any[],
    followUps: any[]
  ): { health: ApplicationHealth; stalledDays: number } {
    const activeStatuses: ApplicationStatus[] = [
      'APPLIED',
      'SCREENING',
      'ASSESSMENT',
      'INTERVIEW',
      'FINAL_ROUND',
    ];

    if (status === 'ACCEPTED' || status === 'OFFER') {
      return { health: 'COMPLETED', stalledDays: 0 };
    }

    if (status === 'REJECTED' || status === 'WITHDRAWN') {
      return { health: 'COMPLETED', stalledDays: 0 };
    }

    // Find latest activity date among application update date and event dates
    let latestActivity = new Date(updatedAt).getTime();
    for (const ev of events) {
      const evTime = new Date(ev.eventDate || ev.createdAt).getTime();
      if (evTime > latestActivity) {
        latestActivity = evTime;
      }
    }

    const now = Date.now();
    const diffMs = Math.max(0, now - latestActivity);
    const stalledDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Check pending due/overdue follow-ups
    const hasPendingDue = followUps.some((f) => {
      if (f.completed) return false;
      const fDate = new Date(f.followUpDate).getTime();
      return fDate <= now;
    });

    if (hasPendingDue) {
      return { health: 'NEEDS_ACTION', stalledDays };
    }

    if (activeStatuses.includes(status) && stalledDays >= STALLED_THRESHOLD_DAYS) {
      return { health: 'STALLED', stalledDays };
    }

    if (status === 'SAVED' || status === 'APPLYING') {
      return { health: 'NEEDS_ACTION', stalledDays };
    }

    return { health: 'ACTIVE', stalledDays };
  }

  /**
   * Computes follow-up status.
   */
  public computeFollowUpReminderStatus(
    completed: boolean,
    followUpDateStr: string
  ): 'UPCOMING' | 'DUE' | 'OVERDUE' | 'COMPLETED' {
    if (completed) return 'COMPLETED';

    const targetDate = new Date(followUpDateStr);
    const today = new Date();

    targetDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'OVERDUE';
    if (diffDays === 0) return 'DUE';
    return 'UPCOMING';
  }

  /**
   * Creates a new application.
   */
  public async createApplication(userId: string, input: CreateApplicationInput): Promise<Application> {
    const appRecord = await prisma.application.create({
      data: {
        userId,
        jobId: input.jobId || null,
        companyName: input.companyName,
        jobTitle: input.jobTitle,
        location: input.location || null,
        jobUrl: input.jobUrl || null,
        applicationDate: input.applicationDate ? new Date(input.applicationDate) : new Date(),
        status: input.status,
        priority: input.priority,
        notes: input.notes || null,
        salaryRange: input.salaryRange || null,
        source: input.source || 'OTHER',
        deadline: input.deadline ? new Date(input.deadline) : null,
      },
    });

    // Create initial timeline event
    await prisma.applicationEvent.create({
      data: {
        applicationId: appRecord.id,
        type: input.status === 'APPLIED' ? 'APPLICATION_SUBMITTED' : 'CUSTOM',
        title: `Application created with status ${input.status}`,
        description: `Created application for ${input.jobTitle} at ${input.companyName}`,
        eventDate: new Date(),
      },
    });

    // Emit WebSocket event
    applicationEventEmitter.emit('application:created', { applicationId: appRecord.id, userId });

    return this.getApplicationById(userId, appRecord.id);
  }

  /**
   * Retrieves an application by ID with full enrichment.
   */
  public async getApplicationById(userId: string, applicationId: string): Promise<Application> {
    const appRecord = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        events: { orderBy: { eventDate: 'desc' } },
        followUps: { orderBy: { followUpDate: 'asc' } },
        job: {
          include: {
            matches: { where: { userId }, orderBy: { createdAt: 'desc' }, take: 1 },
            readinesses: { where: { userId }, orderBy: { createdAt: 'desc' }, take: 1 },
            companyPreparations: { where: { userId }, orderBy: { createdAt: 'desc' }, take: 1 },
            interviewSessions: { where: { userId }, orderBy: { createdAt: 'desc' } },
          },
        },
      },
    });

    if (!appRecord) {
      throw new NotFoundError(`Application with ID ${applicationId} not found`);
    }

    assertResourceOwnership(appRecord.userId, { id: userId, role: 'USER' }, 'Application');

    return this.enrichApplication(appRecord, userId);
  }

  /**
   * Lists user applications with optional filtering and search.
   */
  public async listApplications(
    userId: string,
    filters?: {
      status?: string;
      priority?: string;
      company?: string;
      role?: string;
      search?: string;
      minMatch?: number;
      minReadiness?: number;
    }
  ): Promise<Application[]> {
    // Check if user has zero applications; if so, seed deterministic mock data
    const existingCount = await prisma.application.count({ where: { userId } });
    if (existingCount === 0) {
      await this.seedMockApplications(userId);
    }

    const where: any = { userId };

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.priority) {
      where.priority = filters.priority;
    }
    if (filters?.company) {
      where.companyName = { contains: filters.company, mode: 'insensitive' };
    }
    if (filters?.role) {
      where.jobTitle = { contains: filters.role, mode: 'insensitive' };
    }
    if (filters?.search) {
      where.OR = [
        { companyName: { contains: filters.search, mode: 'insensitive' } },
        { jobTitle: { contains: filters.search, mode: 'insensitive' } },
        { location: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const appRecords = await prisma.application.findMany({
      where,
      include: {
        events: { orderBy: { eventDate: 'desc' } },
        followUps: { orderBy: { followUpDate: 'asc' } },
        job: {
          include: {
            matches: { where: { userId }, orderBy: { createdAt: 'desc' }, take: 1 },
            readinesses: { where: { userId }, orderBy: { createdAt: 'desc' }, take: 1 },
            companyPreparations: { where: { userId }, orderBy: { createdAt: 'desc' }, take: 1 },
            interviewSessions: { where: { userId }, orderBy: { createdAt: 'desc' } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    let enriched = await Promise.all(appRecords.map((record) => this.enrichApplication(record, userId)));

    // Filter by match or readiness if requested
    if (filters?.minMatch !== undefined && !isNaN(filters.minMatch)) {
      enriched = enriched.filter((a) => (a.jobMatch?.overallMatchScore ?? 0) >= filters.minMatch!);
    }
    if (filters?.minReadiness !== undefined && !isNaN(filters.minReadiness)) {
      enriched = enriched.filter((a) => (a.jobReadiness?.score ?? 0) >= filters.minReadiness!);
    }

    return enriched;
  }

  /**
   * Updates application details.
   */
  public async updateApplication(
    userId: string,
    applicationId: string,
    input: UpdateApplicationInput
  ): Promise<Application> {
    const existing = await prisma.application.findUnique({ where: { id: applicationId } });
    if (!existing) {
      throw new NotFoundError(`Application with ID ${applicationId} not found`);
    }
    assertResourceOwnership(existing.userId, { id: userId, role: 'USER' }, 'Application');

    await prisma.application.update({
      where: { id: applicationId },
      data: {
        companyName: input.companyName,
        jobTitle: input.jobTitle,
        location: input.location,
        jobUrl: input.jobUrl,
        applicationDate: input.applicationDate ? new Date(input.applicationDate) : undefined,
        priority: input.priority,
        notes: input.notes,
        salaryRange: input.salaryRange,
        source: input.source,
        deadline: input.deadline ? new Date(input.deadline) : undefined,
        jobId: input.jobId,
      },
    });

    applicationEventEmitter.emit('application:updated', { applicationId, userId });

    return this.getApplicationById(userId, applicationId);
  }

  /**
   * Updates application status with state transition enforcement.
   */
  public async updateStatus(
    userId: string,
    applicationId: string,
    input: UpdateStatusInput
  ): Promise<Application> {
    const existing = await prisma.application.findUnique({ where: { id: applicationId } });
    if (!existing) {
      throw new NotFoundError(`Application with ID ${applicationId} not found`);
    }
    assertResourceOwnership(existing.userId, { id: userId, role: 'USER' }, 'Application');

    const currentStatus = existing.status as ApplicationStatus;
    const newStatus = input.status as ApplicationStatus;

    if (!input.force && !this.isValidStatusTransition(currentStatus, newStatus)) {
      throw new BadRequestError(
        `Invalid status transition from ${currentStatus} to ${newStatus}. Pass force: true if overriding an accidental status entry.`
      );
    }

    await prisma.application.update({
      where: { id: applicationId },
      data: { status: newStatus },
    });

    // Determine event type for status change
    let eventType = 'CUSTOM';
    if (newStatus === 'APPLIED') eventType = 'APPLICATION_SUBMITTED';
    else if (newStatus === 'SCREENING') eventType = 'SCREENING';
    else if (newStatus === 'ASSESSMENT') eventType = 'ASSESSMENT';
    else if (newStatus === 'INTERVIEW') eventType = 'INTERVIEW';
    else if (newStatus === 'FINAL_ROUND') eventType = 'FINAL_INTERVIEW';
    else if (newStatus === 'OFFER') eventType = 'OFFER';
    else if (newStatus === 'REJECTED') eventType = 'REJECTION';
    else if (newStatus === 'WITHDRAWN') eventType = 'WITHDRAWAL';

    await prisma.applicationEvent.create({
      data: {
        applicationId,
        type: eventType,
        title: `Status changed to ${newStatus}`,
        description: input.note || `Application status updated from ${currentStatus} to ${newStatus}`,
        eventDate: new Date(),
      },
    });

    applicationEventEmitter.emit('application:status_changed', { applicationId, userId, oldStatus: currentStatus, newStatus });

    return this.getApplicationById(userId, applicationId);
  }

  /**
   * Deletes an application.
   */
  public async deleteApplication(userId: string, applicationId: string): Promise<void> {
    const existing = await prisma.application.findUnique({ where: { id: applicationId } });
    if (!existing) {
      throw new NotFoundError(`Application with ID ${applicationId} not found`);
    }
    assertResourceOwnership(existing.userId, { id: userId, role: 'USER' }, 'Application');

    await prisma.application.delete({ where: { id: applicationId } });
  }

  /**
   * Adds a timeline event to an application.
   */
  public async addEvent(userId: string, applicationId: string, input: CreateEventInput): Promise<ApplicationEvent> {
    const existing = await prisma.application.findUnique({ where: { id: applicationId } });
    if (!existing) {
      throw new NotFoundError(`Application with ID ${applicationId} not found`);
    }
    assertResourceOwnership(existing.userId, { id: userId, role: 'USER' }, 'Application');

    const eventRecord = await prisma.applicationEvent.create({
      data: {
        applicationId,
        type: input.type,
        title: input.title,
        description: input.description || null,
        eventDate: input.eventDate ? new Date(input.eventDate) : new Date(),
      },
    });

    // Touch application updatedAt
    await prisma.application.update({
      where: { id: applicationId },
      data: { updatedAt: new Date() },
    });

    applicationEventEmitter.emit('application:event_added', { applicationId, userId, eventId: eventRecord.id });

    return {
      id: eventRecord.id,
      applicationId: eventRecord.applicationId,
      type: eventRecord.type as any,
      title: eventRecord.title,
      description: eventRecord.description,
      eventDate: eventRecord.eventDate.toISOString(),
      createdAt: eventRecord.createdAt.toISOString(),
    };
  }

  /**
   * Gets timeline events for an application.
   */
  public async getEvents(userId: string, applicationId: string): Promise<ApplicationEvent[]> {
    const existing = await prisma.application.findUnique({ where: { id: applicationId } });
    if (!existing) {
      throw new NotFoundError(`Application with ID ${applicationId} not found`);
    }
    assertResourceOwnership(existing.userId, { id: userId, role: 'USER' }, 'Application');

    const events = await prisma.applicationEvent.findMany({
      where: { applicationId },
      orderBy: { eventDate: 'desc' },
    });

    return events.map((ev) => ({
      id: ev.id,
      applicationId: ev.applicationId,
      type: ev.type as any,
      title: ev.title,
      description: ev.description,
      eventDate: ev.eventDate.toISOString(),
      createdAt: ev.createdAt.toISOString(),
    }));
  }

  /**
   * Adds a follow-up reminder.
   */
  public async addFollowUp(
    userId: string,
    applicationId: string,
    input: CreateFollowUpInput
  ): Promise<ApplicationFollowUp> {
    const existing = await prisma.application.findUnique({ where: { id: applicationId } });
    if (!existing) {
      throw new NotFoundError(`Application with ID ${applicationId} not found`);
    }
    assertResourceOwnership(existing.userId, { id: userId, role: 'USER' }, 'Application');

    const followUpRecord = await prisma.applicationFollowUp.create({
      data: {
        applicationId,
        title: input.title,
        followUpDate: new Date(input.followUpDate),
        followUpNote: input.followUpNote || null,
        completed: false,
      },
    });

    applicationEventEmitter.emit('application:followup_due', {
      applicationId,
      userId,
      followUpId: followUpRecord.id,
      dueDate: followUpRecord.followUpDate,
    });

    return {
      id: followUpRecord.id,
      applicationId: followUpRecord.applicationId,
      title: followUpRecord.title,
      followUpDate: followUpRecord.followUpDate.toISOString(),
      followUpNote: followUpRecord.followUpNote,
      completed: followUpRecord.completed,
      createdAt: followUpRecord.createdAt.toISOString(),
      reminderStatus: this.computeFollowUpReminderStatus(false, followUpRecord.followUpDate.toISOString()),
    };
  }

  /**
   * Updates a follow-up reminder.
   */
  public async updateFollowUp(
    userId: string,
    applicationId: string,
    followUpId: string,
    input: UpdateFollowUpInput
  ): Promise<ApplicationFollowUp> {
    const app = await prisma.application.findUnique({ where: { id: applicationId } });
    if (!app) {
      throw new NotFoundError(`Application with ID ${applicationId} not found`);
    }
    assertResourceOwnership(app.userId, { id: userId, role: 'USER' }, 'Application');

    const followUp = await prisma.applicationFollowUp.findUnique({ where: { id: followUpId } });
    if (!followUp || followUp.applicationId !== applicationId) {
      throw new NotFoundError(`Follow-up with ID ${followUpId} not found for this application`);
    }

    const updated = await prisma.applicationFollowUp.update({
      where: { id: followUpId },
      data: {
        title: input.title,
        followUpDate: input.followUpDate ? new Date(input.followUpDate) : undefined,
        followUpNote: input.followUpNote,
        completed: input.completed,
      },
    });

    return {
      id: updated.id,
      applicationId: updated.applicationId,
      title: updated.title,
      followUpDate: updated.followUpDate.toISOString(),
      followUpNote: updated.followUpNote,
      completed: updated.completed,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      reminderStatus: this.computeFollowUpReminderStatus(updated.completed, updated.followUpDate.toISOString()),
    };
  }

  /**
   * Deletes a follow-up reminder.
   */
  public async deleteFollowUp(userId: string, applicationId: string, followUpId: string): Promise<void> {
    const app = await prisma.application.findUnique({ where: { id: applicationId } });
    if (!app) {
      throw new NotFoundError(`Application with ID ${applicationId} not found`);
    }
    assertResourceOwnership(app.userId, { id: userId, role: 'USER' }, 'Application');

    const followUp = await prisma.applicationFollowUp.findUnique({ where: { id: followUpId } });
    if (!followUp || followUp.applicationId !== applicationId) {
      throw new NotFoundError(`Follow-up with ID ${followUpId} not found`);
    }

    await prisma.applicationFollowUp.delete({ where: { id: followUpId } });
  }

  /**
   * Calculates dashboard summary statistics and funnel conversion analytics.
   */
  public async getStats(userId: string): Promise<ApplicationStats> {
    const applications = await this.listApplications(userId);

    const total = applications.length;
    const active = applications.filter((a) =>
      ['APPLIED', 'SCREENING', 'ASSESSMENT', 'INTERVIEW', 'FINAL_ROUND'].includes(a.status)
    ).length;
    const interviews = applications.filter((a) =>
      ['INTERVIEW', 'FINAL_ROUND'].includes(a.status)
    ).length;
    const offers = applications.filter((a) => ['OFFER', 'ACCEPTED'].includes(a.status)).length;
    const rejected = applications.filter((a) => a.status === 'REJECTED').length;
    const withdrawn = applications.filter((a) => a.status === 'WITHDRAWN').length;
    const saved = applications.filter((a) => a.status === 'SAVED' || a.status === 'APPLYING').length;
    const stalled = applications.filter((a) => a.health === 'STALLED').length;
    const needsAction = applications.filter((a) => a.health === 'NEEDS_ACTION').length;

    // Funnel stage counts
    const appliedCount = applications.filter((a) =>
      ['APPLIED', 'SCREENING', 'ASSESSMENT', 'INTERVIEW', 'FINAL_ROUND', 'OFFER', 'ACCEPTED', 'REJECTED'].includes(a.status)
    ).length;
    const screeningCount = applications.filter((a) =>
      ['SCREENING', 'ASSESSMENT', 'INTERVIEW', 'FINAL_ROUND', 'OFFER', 'ACCEPTED'].includes(a.status)
    ).length;
    const assessmentCount = applications.filter((a) =>
      ['ASSESSMENT', 'INTERVIEW', 'FINAL_ROUND', 'OFFER', 'ACCEPTED'].includes(a.status)
    ).length;
    const interviewCount = applications.filter((a) =>
      ['INTERVIEW', 'FINAL_ROUND', 'OFFER', 'ACCEPTED'].includes(a.status)
    ).length;
    const finalRoundCount = applications.filter((a) =>
      ['FINAL_ROUND', 'OFFER', 'ACCEPTED'].includes(a.status)
    ).length;
    const offerCount = applications.filter((a) => ['OFFER', 'ACCEPTED'].includes(a.status)).length;

    const hasSufficientData = total >= 3;

    const screeningFromApplied = appliedCount > 0 ? Math.round((screeningCount / appliedCount) * 100) : 0;
    const assessmentFromScreening = screeningCount > 0 ? Math.round((assessmentCount / screeningCount) * 100) : 0;
    const interviewFromAssessment = assessmentCount > 0 ? Math.round((interviewCount / assessmentCount) * 100) : 0;
    const finalFromInterview = interviewCount > 0 ? Math.round((finalRoundCount / interviewCount) * 100) : 0;
    const offerFromFinal = finalRoundCount > 0 ? Math.round((offerCount / finalRoundCount) * 100) : 0;
    const overallConversion = appliedCount > 0 ? Math.round((offerCount / appliedCount) * 100) : 0;

    return {
      total,
      active,
      interviews,
      offers,
      rejected,
      withdrawn,
      saved,
      stalled,
      needsAction,
      funnel: {
        applied: appliedCount,
        screening: screeningCount,
        assessment: assessmentCount,
        interview: interviewCount,
        finalRound: finalRoundCount,
        offer: offerCount,
        conversionRates: {
          screeningFromApplied,
          assessmentFromScreening,
          interviewFromAssessment,
          finalFromInterview,
          offerFromFinal,
          overallConversion,
        },
        hasSufficientData,
      },
    };
  }

  /**
   * Drafts a follow-up message for an application using Gemini or structured deterministic template.
   */
  public async draftFollowUpMessage(userId: string, applicationId: string): Promise<{ subject: string; body: string }> {
    const app = await this.getApplicationById(userId, applicationId);

    const client = this.getGeminiClient();

    if (!client) {
      // Return structured template without AI call if no key configured
      return {
        subject: `Following up on application for ${app.jobTitle} at ${app.companyName}`,
        body: `Dear Hiring Team at ${app.companyName},\n\nI hope this email finds you well. I am writing to express my continued enthusiasm for the ${app.jobTitle} position at ${app.companyName}.\n\nGiven my background and application submitted on ${new Date(app.applicationDate).toLocaleDateString()}, I would love to check on the status of my application and answer any additional questions.\n\nThank you for your time and consideration.\n\nBest regards,\n[Your Name]`,
      };
    }

    try {
      const eventsSummary = (app.events || [])
        .slice(0, 5)
        .map((e) => `- ${e.title} (${e.eventDate.split('T')[0]})`)
        .join('\n');

      const prompt = `You are an executive career advisor. Draft a professional, warm, and concise follow-up email for a candidate applying to a company.
Company: ${app.companyName}
Role: ${app.jobTitle}
Current Application Stage: ${app.status}
Application Date: ${app.applicationDate.split('T')[0]}
Recent Timeline Events:
${eventsSummary || 'No recent events'}

Guidelines:
- Do NOT fabricate recruiter names or emails. Use placeholders like [Hiring Manager / Recruiter Name] or [Your Name].
- Keep it concise (under 200 words), polite, and focused on genuine interest.
- Return output strictly as JSON with keys "subject" and "body".
`;

      const response = await runGeminiWithRetryAndFallback({
        params: {
          model: aiConfig.getModel(),
          contents: prompt,
        },
      });

      const raw = response.text || '';
      let cleaned = raw.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
      }

      const parsed = JSON.parse(cleaned);
      return {
        subject: parsed.subject || `Following up on ${app.jobTitle} application at ${app.companyName}`,
        body: parsed.body || `Dear ${app.companyName} Hiring Team,\n\nI am writing to follow up on my application for the ${app.jobTitle} position...`,
      };
    } catch (err) {
      logger.ai.warn(`Gemini follow-up drafting fallback used: ${err}`);
      return {
        subject: `Following up on application for ${app.jobTitle} at ${app.companyName}`,
        body: `Dear Hiring Team at ${app.companyName},\n\nI hope this email finds you well. I am writing to express my continued enthusiasm for the ${app.jobTitle} position at ${app.companyName}.\n\nI submitted my application on ${new Date(app.applicationDate).toLocaleDateString()} and wanted to check in on the recruitment timeline.\n\nThank you for your time and consideration.\n\nBest regards,\n[Your Name]`,
      };
    }
  }

  /**
   * Private helper to enrich an Application record with Part 17, 18, 19, 20 data.
   */
  private async enrichApplication(appRecord: any, userId: string): Promise<Application> {
    let jobMatch: any = null;
    let jobReadiness: any = null;
    let companyPreparation: any = null;
    let interviewHistory: any = null;

    if (appRecord.job) {
      const matchObj = appRecord.job.matches?.[0];
      if (matchObj) {
        jobMatch = {
          overallMatchScore: matchObj.overallMatchScore,
          matchLabel: matchObj.matchLabel,
          requiredSkillCoverage: matchObj.requiredSkillCoverage,
          skillMatches: matchObj.skillMatches,
          keywordAlignment: matchObj.keywordAlignment,
          missingSkills: matchObj.missingSkills,
          projectRelevance: matchObj.projectRelevance,
        };
      }

      const readObj = appRecord.job.readinesses?.[0];
      if (readObj) {
        jobReadiness = {
          score: readObj.score,
          level: readObj.level,
          criticalGaps: readObj.criticalGaps,
          preparationPriorities: readObj.preparationPriorities,
          executiveSummary: readObj.executiveSummary,
        };
      }

      const prepObj = appRecord.job.companyPreparations?.[0];
      if (prepObj) {
        companyPreparation = {
          preparationCoverageScore: prepObj.preparationCoverageScore,
          topPriorityTopic: prepObj.topPriorityTopic,
          priorityItems: prepObj.priorityItems,
          roadmap: prepObj.roadmap,
        };
      }

      const sessions = appRecord.job.interviewSessions || [];
      if (sessions.length > 0) {
        const scores = sessions.map((s: any) => s.overallScore || 0).filter((s: number) => s > 0);
        const latestScore = scores.length > 0 ? scores[0] : undefined;
        interviewHistory = {
          latestScore,
          sessionCount: sessions.length,
          strengths: ['Technical Correctness', 'Clear Problem Solving Structure'],
          weaknesses: ['Corner case handling details'],
        };
      }
    }

    const events = (appRecord.events || []).map((ev: any) => ({
      id: ev.id,
      applicationId: ev.applicationId,
      type: ev.type,
      title: ev.title,
      description: ev.description,
      eventDate: ev.eventDate ? ev.eventDate.toISOString() : new Date().toISOString(),
      createdAt: ev.createdAt ? ev.createdAt.toISOString() : new Date().toISOString(),
    }));

    const followUps = (appRecord.followUps || []).map((f: any) => ({
      id: f.id,
      applicationId: f.applicationId,
      title: f.title,
      followUpDate: f.followUpDate ? f.followUpDate.toISOString() : new Date().toISOString(),
      followUpNote: f.followUpNote,
      completed: f.completed,
      createdAt: f.createdAt ? f.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: f.updatedAt ? f.updatedAt.toISOString() : undefined,
      reminderStatus: this.computeFollowUpReminderStatus(
        f.completed,
        f.followUpDate ? f.followUpDate.toISOString() : new Date().toISOString()
      ),
    }));

    const status = appRecord.status as ApplicationStatus;
    const priority = appRecord.priority as ApplicationPriority;

    const { health, stalledDays } = this.computeHealthAndStalled(
      status,
      appRecord.updatedAt,
      events,
      followUps
    );

    const nextAction = this.getNextAction(status, priority, appRecord.companyName);

    return {
      id: appRecord.id,
      userId: appRecord.userId,
      jobId: appRecord.jobId,
      companyName: appRecord.companyName,
      jobTitle: appRecord.jobTitle,
      location: appRecord.location,
      jobUrl: appRecord.jobUrl,
      applicationDate: appRecord.applicationDate.toISOString(),
      status,
      priority,
      notes: appRecord.notes,
      salaryRange: appRecord.salaryRange,
      source: appRecord.source,
      deadline: appRecord.deadline ? appRecord.deadline.toISOString() : null,
      createdAt: appRecord.createdAt.toISOString(),
      updatedAt: appRecord.updatedAt ? appRecord.updatedAt.toISOString() : undefined,
      events,
      followUps,
      jobMatch,
      jobReadiness,
      companyPreparation,
      interviewHistory,
      health,
      stalledDays,
      nextAction,
    };
  }

  /**
   * Seeds 4 deterministic mock applications if user has zero applications.
   */
  private async seedMockApplications(userId: string): Promise<void> {
    try {
      // Find an existing JobDescription if any exists to link
      const existingJobs = await prisma.jobDescription.findMany({
        where: { userId },
        take: 3,
      });

      const msJobId = existingJobs[0]?.id || null;
      const amzJobId = existingJobs[1]?.id || null;

      // 1. Microsoft
      const msApp = await prisma.application.create({
        data: {
          userId,
          jobId: msJobId,
          companyName: 'Microsoft',
          jobTitle: 'Software Engineer Intern',
          location: 'Redmond, WA',
          jobUrl: 'https://careers.microsoft.com/us/en/job/123456',
          status: 'INTERVIEW',
          priority: 'HIGH',
          source: 'COMPANY_WEBSITE',
          notes: 'Technical round 1 scheduled. Need to review Java concurrency and System Design basics.',
          salaryRange: '$52/hr',
          applicationDate: new Date(Date.now() - 20 * 86400000),
        },
      });

      await prisma.applicationEvent.createMany({
        data: [
          {
            applicationId: msApp.id,
            type: 'APPLICATION_SUBMITTED',
            title: 'Application Submitted',
            description: 'Submitted online application on Microsoft Careers portal.',
            eventDate: new Date(Date.now() - 20 * 86400000),
          },
          {
            applicationId: msApp.id,
            type: 'RECRUITER_CONTACT',
            title: 'Recruiter Outreach',
            description: 'Recruiter invited to online technical assessment.',
            eventDate: new Date(Date.now() - 15 * 86400000),
          },
          {
            applicationId: msApp.id,
            type: 'ASSESSMENT',
            title: 'Online Assessment Completed',
            description: 'Passed 3 coding questions on Codility.',
            eventDate: new Date(Date.now() - 10 * 86400000),
          },
          {
            applicationId: msApp.id,
            type: 'INTERVIEW',
            title: 'Technical Interview Scheduled',
            description: '1-on-1 coding interview scheduled.',
            eventDate: new Date(Date.now() - 3 * 86400000),
          },
        ],
      });

      await prisma.applicationFollowUp.create({
        data: {
          applicationId: msApp.id,
          title: 'Review Java Concurrency & System Design',
          followUpDate: new Date(Date.now() + 2 * 86400000),
          followUpNote: 'Practice synchronized blocks, thread pools, and LRU cache in Interview Coach.',
        },
      });

      // 2. Amazon
      const amzApp = await prisma.application.create({
        data: {
          userId,
          jobId: amzJobId,
          companyName: 'Amazon',
          jobTitle: 'Software Development Engineer Intern',
          location: 'Seattle, WA',
          jobUrl: 'https://amazon.jobs/en/jobs/987654',
          status: 'APPLIED',
          priority: 'HIGH',
          source: 'LINKEDIN',
          notes: 'Applied via LinkedIn Easy Apply. Completed Work Simulation OA1.',
          salaryRange: '$55/hr',
          applicationDate: new Date(Date.now() - 16 * 86400000),
        },
      });

      await prisma.applicationEvent.create({
        data: {
          applicationId: amzApp.id,
          type: 'APPLICATION_SUBMITTED',
          title: 'Application Submitted',
          description: 'Applied via LinkedIn Easy Apply.',
          eventDate: new Date(Date.now() - 16 * 86400000),
        },
      });

      await prisma.applicationFollowUp.create({
        data: {
          applicationId: amzApp.id,
          title: 'Follow up with Amazon Recruiter',
          followUpDate: new Date(Date.now() - 1 * 86400000), // Explicit past date -> NEEDS_ACTION / OVERDUE test
          followUpNote: 'Send status inquiry email regarding OA2 portal update.',
        },
      });

      // 3. Google
      const googApp = await prisma.application.create({
        data: {
          userId,
          companyName: 'Google',
          jobTitle: 'Software Engineer Intern',
          location: 'Mountain View, CA',
          jobUrl: 'https://careers.google.com/jobs/results/112233',
          status: 'SAVED',
          priority: 'MEDIUM',
          source: 'REFERRAL',
          notes: 'Saved application. Need employee referral confirmation before submitting.',
          applicationDate: new Date(Date.now() - 5 * 86400000),
        },
      });

      await prisma.applicationEvent.create({
        data: {
          applicationId: googApp.id,
          type: 'CUSTOM',
          title: 'Job Saved',
          description: 'Saved position for referral check.',
          eventDate: new Date(Date.now() - 5 * 86400000),
        },
      });

      // 4. Example Technologies
      const exApp = await prisma.application.create({
        data: {
          userId,
          companyName: 'Example Technologies',
          jobTitle: 'Backend Engineer',
          location: 'Remote',
          status: 'REJECTED',
          priority: 'LOW',
          source: 'HIRING_PLATFORM',
          notes: 'Position closed. Feedback indicated missing experience in Go.',
          applicationDate: new Date(Date.now() - 40 * 86400000),
        },
      });

      await prisma.applicationEvent.createMany({
        data: [
          {
            applicationId: exApp.id,
            type: 'APPLICATION_SUBMITTED',
            title: 'Application Submitted',
            description: 'Submitted on hiring platform.',
            eventDate: new Date(Date.now() - 40 * 86400000),
          },
          {
            applicationId: exApp.id,
            type: 'REJECTION',
            title: 'Application Decision: Not Selected',
            description: 'Received automated update that position was filled.',
            eventDate: new Date(Date.now() - 25 * 86400000),
          },
        ],
      });
    } catch (err) {
      logger.system.error(`Failed to seed mock applications: ${err}`);
    }
  }
}

export const applicationService = new ApplicationService();
