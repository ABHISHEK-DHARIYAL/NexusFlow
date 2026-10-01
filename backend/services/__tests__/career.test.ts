import { describe, it, expect, vi, beforeEach } from 'vitest';
import { careerCoachContextService } from '../CareerCoachContextService';
import { careerCoachService } from '../CareerCoachService';
import { CareerCoachResponseSchema, InterviewQuestionSchema, InterviewEvaluationSchema } from '../../validations/career.validation';

// Mock Prisma
vi.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'mock-user-123',
        name: 'Alex Mercer',
        username: 'alexmercer',
        resumes: [{ parsedSkills: ['Java', 'Spring Boot', 'PostgreSQL', 'Docker', 'Concurrency'] }],
        repositories: [
          { name: 'NexusFlow', starsCount: 15, language: 'TypeScript', description: 'Developer intelligence platform' },
        ],
        leetcodeProfile: { totalSolved: 385, easySolved: 120, mediumSolved: 215, hardSolved: 50, rating: 1780 },
        codeforcesProfile: { rating: 1684, rank: 'Specialist' },
        portfolio: { projects: [{ title: 'NexusFlow Engine', techStack: ['Java', 'TypeScript'], description: 'Multi-threaded worker queue' }] },
        crossPlatformVerifications: [{ developerIndexScore: 88 }],
      }),
    },
    jobDescription: {
      findFirst: vi.fn().mockResolvedValue({
        id: 'mock-job-123',
        title: 'Senior Backend Engineer',
        company: 'Microsoft',
        rawDescription: 'Requires Java, Spring Boot, distributed concurrency, system design',
        matches: [{ overallMatchScore: 85, missingSkills: ['Kubernetes'] }],
        readinesses: [{ overallReadinessScore: 80 }],
        companyPreparations: [{ topPriorityTopic: 'Java Concurrency & System Architecture' }],
      }),
      findUnique: vi.fn().mockResolvedValue({
        id: 'mock-job-123',
        title: 'Senior Backend Engineer',
        company: 'Microsoft',
        rawDescription: 'Requires Java, Spring Boot, distributed concurrency, system design',
        matches: [{ overallMatchScore: 85, missingSkills: ['Kubernetes'] }],
        readinesses: [{ overallReadinessScore: 80 }],
        companyPreparations: [{ topPriorityTopic: 'Java Concurrency & System Architecture' }],
      }),
    },
    careerChat: {
      create: vi.fn().mockResolvedValue({
        id: 'mock-chat-123',
        userId: 'mock-user-123',
        title: 'Backend Career Review',
        mode: 'GENERAL_CAREER_CHAT',
        messages: [],
      }),
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue({
        id: 'mock-chat-123',
        userId: 'mock-user-123',
        title: 'Backend Career Review',
        mode: 'GENERAL_CAREER_CHAT',
        messages: [],
      }),
      update: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue({}),
    },
    careerChatMessage: {
      create: vi.fn().mockResolvedValue({
        id: 'mock-msg-123',
        chatId: 'mock-chat-123',
        sender: 'ASSISTANT',
        content: 'Your backend profile is strong.',
        sourcesUsed: ['Resume', 'GitHub', 'LeetCode'],
        evidence: ['Resume skills: Java', 'GitHub repo: NexusFlow'],
        recommendations: ['Practice concurrency'],
      }),
    },
    interviewSession: {
      create: vi.fn().mockResolvedValue({
        id: 'mock-interview-123',
        userId: 'mock-user-123',
        interviewType: 'Technical',
        difficulty: 'Medium',
        status: 'IN_PROGRESS',
        questions: [],
      }),
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue({
        id: 'mock-interview-123',
        userId: 'mock-user-123',
        interviewType: 'Technical',
        difficulty: 'Medium',
        status: 'IN_PROGRESS',
        questions: [],
      }),
      update: vi.fn().mockResolvedValue({
        id: 'mock-interview-123',
        status: 'COMPLETED',
        overallScore: 84,
      }),
    },
    interviewQuestion: {
      create: vi.fn().mockResolvedValue({
        id: 'mock-q-123',
        sessionId: 'mock-interview-123',
        questionIndex: 0,
        questionText: 'Explain ReentrantLock in Java.',
        category: 'Core Java & Concurrency',
        difficulty: 'Medium',
        expectedKeyPoints: ['Lock fairness', 'Interruptibility'],
      }),
    },
    interviewAnswer: {
      create: vi.fn().mockResolvedValue({
        id: 'mock-ans-123',
        questionId: 'mock-q-123',
        score: 85,
        strengths: ['Good terminology'],
        weaknesses: ['Missed condition handling'],
        missingPoints: ['Condition signal handling'],
        improvedAnswer: 'Comprehensive answer...',
      }),
    },
  },
}));

describe('Part 20 — AI Career + Interview Coach Unit Tests', () => {
  it('validates CareerCoachResponseSchema correctly', () => {
    const validData = {
      answer: 'Your backend profile is verified and strong.',
      evidence: ['385 LeetCode solved', 'NexusFlow repository on GitHub'],
      meaningOrGaps: 'Solid core skills with cloud deployment area for growth.',
      recommendations: ['Practice Kubernetes deployment'],
      sourcesUsed: ['Resume', 'GitHub', 'LeetCode'],
      suggestedTitle: 'Backend Career Assessment',
    };

    const parsed = CareerCoachResponseSchema.parse(validData);
    expect(parsed.answer).toBe('Your backend profile is verified and strong.');
    expect(parsed.sourcesUsed).toContain('GitHub');
  });

  it('validates InterviewQuestionSchema & InterviewEvaluationSchema correctly', () => {
    const validQuestion = {
      questionText: 'How do thread pools manage worker threads in NexusFlow?',
      category: 'Concurrency',
      difficulty: 'Medium',
      expectedKeyPoints: ['BlockingQueue', 'Core pool size'],
    };

    const parsedQ = InterviewQuestionSchema.parse(validQuestion);
    expect(parsedQ.questionText).toBe('How do thread pools manage worker threads in NexusFlow?');

    const validEval = {
      score: 88,
      strengths: ['Clear explanation of thread pool lifecycle'],
      weaknesses: ['Did not cover thread rejection policy'],
      missingPoints: ['CallerRunsPolicy'],
      improvedAnswer: 'An optimal answer explains ThreadPoolExecutor rejection policies...',
    };

    const parsedEval = InterviewEvaluationSchema.parse(validEval);
    expect(parsedEval.score).toBe(88);
  });

  it('builds context correctly with source selection layer', async () => {
    const bundle = await careerCoachContextService.buildContext('mock-user-123', 'GENERAL_CAREER_CHAT', 'How strong is my backend profile?');

    expect(bundle.sourcesUsed).toContain('Resume');
    expect(bundle.sourcesUsed).toContain('GitHub');
    expect(bundle.userProfileSummary.userName).toBe('Alex Mercer');
    expect(bundle.formattedContextText).toContain('Resume Skills: Java, Spring Boot');
  });

  it('fetches dashboard metrics deterministically without fabrication', async () => {
    const metrics = await careerCoachService.getDashboardMetrics('mock-user-123');

    expect(metrics.careerStrengthScore).toBeGreaterThan(0);
    expect(metrics.strongestProject).toBe('NexusFlow');
    expect(metrics.sourcesUsed.length).toBeGreaterThan(0);
  });
});
