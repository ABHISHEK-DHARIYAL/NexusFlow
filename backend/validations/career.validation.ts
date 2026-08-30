import { z } from 'zod';

export const CareerCoachModeEnum = z.enum([
  'GENERAL_CAREER_CHAT',
  'CAREER_MENTOR',
  'JOB_COACH',
  'RESUME_REVIEWER',
  'GITHUB_REVIEWER',
  'LEARNING_COACH',
  'PLACEMENT_COACH',
  'INTERVIEW_COACH',
  'MOCK_INTERVIEW',
]);

export const InterviewTypeEnum = z.enum([
  'Technical',
  'DSA',
  'Project',
  'Behavioral',
  'System Design',
  'Mixed',
]);

export const InterviewDifficultyEnum = z.enum(['Easy', 'Medium', 'Hard']);

export const CareerCoachResponseSchema = z.object({
  answer: z.string().min(1),
  evidence: z.array(z.string()).default([]),
  meaningOrGaps: z.string().optional().default(''),
  recommendations: z.array(z.string()).default([]),
  sourcesUsed: z.array(z.string()).default([]),
  suggestedTitle: z.string().optional(),
});

export const InterviewQuestionSchema = z.object({
  questionText: z.string().min(1),
  category: z.string().default('General Technical'),
  difficulty: InterviewDifficultyEnum.default('Medium'),
  expectedKeyPoints: z.array(z.string()).default([]),
});

export const InterviewEvaluationSchema = z.object({
  score: z.number().min(0).max(100),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  missingPoints: z.array(z.string()).default([]),
  improvedAnswer: z.string().default(''),
});

export const InterviewFinalSummarySchema = z.object({
  overallScore: z.number().min(0).max(100),
  scoreBreakdown: z.object({
    technicalCorrectness: z.number().min(0).max(100),
    communication: z.number().min(0).max(100),
    depth: z.number().min(0).max(100),
    problemSolving: z.number().min(0).max(100),
    completeness: z.number().min(0).max(100),
    roleRelevance: z.number().min(0).max(100),
  }),
  finalFeedback: z.string().min(1),
  strongAreas: z.array(z.string()).default([]),
  weakAreas: z.array(z.string()).default([]),
  recommendedPreparation: z.array(z.string()).default([]),
});

export const CreateChatInputSchema = z.object({
  mode: CareerCoachModeEnum.default('GENERAL_CAREER_CHAT'),
  jobId: z.string().optional(),
  title: z.string().optional(),
  initialMessage: z.string().optional(),
});

export const SendMessageInputSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  jobId: z.string().optional(),
  mode: CareerCoachModeEnum.optional(),
});

export const StartInterviewInputSchema = z.object({
  jobId: z.string().optional(),
  interviewType: InterviewTypeEnum.default('Technical'),
  difficulty: InterviewDifficultyEnum.default('Medium'),
});

export const SubmitAnswerInputSchema = z.object({
  questionId: z.string().min(1, 'Question ID is required'),
  userResponse: z.string().min(1, 'Answer response cannot be empty'),
});
