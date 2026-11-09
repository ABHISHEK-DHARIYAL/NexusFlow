import { ResumeRepository } from '../repositories/ResumeRepository';
import { TaskRepository } from '../repositories/TaskRepository';
import { ResumeParser } from '../integrations/resume/ResumeParser';
import { ResumeAnalyzer } from '../integrations/resume/ResumeAnalyzer';
import { resumeEventEmitter } from './ResumeEventEmitter';
import { TaskType, TaskPriority, TaskStatus } from '@prisma/client';
import { logger } from '../logger';
import { BadRequestError, NotFoundError } from '../utils/errors';

export class ResumeService {
  private repository = new ResumeRepository();
  private taskRepository = new TaskRepository();
  private analyzer = new ResumeAnalyzer();

  public async saveOrUpdateResume(
    userId: string,
    rawText: string,
    title: string = 'My Resume',
    fileUrl?: string
  ) {
    if (!rawText || rawText.trim().length < 50) {
      throw new BadRequestError('Resume content must be at least 50 characters of text.');
    }

    // 1. Parse raw text into structured data
    const parsed = ResumeParser.parseRawText(rawText);

    // 2. Save or update Resume record
    const existingResume = await this.repository.findResumeByUserId(userId);

    const savedResume = await this.repository.saveResume({
      id: existingResume?.id,
      userId,
      title,
      fileUrl: fileUrl || existingResume?.fileUrl,
      rawText,
      contactInfo: parsed.contactInfo,
      workExperience: parsed.workExperience,
      education: parsed.education,
      skills: parsed.skills,
      projects: parsed.projects,
      certifications: parsed.certifications,
      atsScore: existingResume?.atsScore || 0
    });

    // 3. Create background task for ATS Analysis
    const task = await this.taskRepository.create({
      user: { connect: { id: userId } },
      taskType: TaskType.RESUME_ANALYSIS,
      priority: TaskPriority.HIGH,
      status: TaskStatus.RUNNING
    });

    // 4. Process ATS analysis in background
    this.processResumeAnalysis(userId, savedResume.id, rawText, parsed, task.id).catch((err) => {
      logger.root.error(`[ResumeService] Background analysis failed for resume ${savedResume.id}:`, err);
    });

    return {
      resume: savedResume,
      task,
      parsedMetrics: parsed.metrics
    };
  }

  public async getResumeForUser(userId: string) {
    const resume = await this.repository.findResumeByUserId(userId);
    if (!resume) {
      return null;
    }
    return resume;
  }

  public async triggerAnalysisForUser(userId: string) {
    const resume = await this.repository.findResumeByUserId(userId);
    if (!resume) {
      throw new NotFoundError('No resume found to analyze. Please submit or upload a resume first.');
    }

    const parsed = ResumeParser.parseRawText(resume.rawText);

    const task = await this.taskRepository.create({
      user: { connect: { id: userId } },
      taskType: TaskType.RESUME_ANALYSIS,
      priority: TaskPriority.HIGH,
      status: TaskStatus.RUNNING
    });

    this.processResumeAnalysis(userId, resume.id, resume.rawText, parsed, task.id).catch((err) => {
      logger.root.error(`[ResumeService] Re-analysis failed for resume ${resume.id}:`, err);
    });

    return { resume, task };
  }

  public async deleteResumeForUser(resumeId: string, userId: string) {
    return await this.repository.deleteResume(resumeId, userId);
  }

  private async processResumeAnalysis(
    userId: string,
    resumeId: string,
    rawText: string,
    parsed: any,
    taskId: string
  ) {
    try {
      logger.root.info(`[ResumeService] Running ATS AI analysis for resume ${resumeId}...`);
      resumeEventEmitter.emit('resume:analysis_started', {
        userId,
        resumeId,
        taskId,
        timestamp: new Date()
      });

      const analysis = await this.analyzer.analyzeResume(rawText, parsed);

      resumeEventEmitter.emit('resume:analysis_progress', {
        userId,
        resumeId,
        taskId,
        progress: 60,
        phase: 'Saving ATS Scores & Recommendations'
      });

      // Save Analysis
      const savedAnalysis = await this.repository.saveAnalysis({
        resumeId,
        taskId,
        atsScore: analysis.atsScore,
        formattingScore: analysis.formattingScore,
        contentImpactScore: analysis.contentImpactScore,
        skillsMatchScore: analysis.skillsMatchScore,
        completenessScore: analysis.completenessScore,
        summary: analysis.summary,
        actionableSuggestions: analysis.actionableSuggestions,
        bulletEvaluations: analysis.bulletEvaluations,
        missingKeywords: analysis.missingKeywords,
        formattingIssues: analysis.formattingIssues
      });

      // Update Resume overall ATS score
      await this.repository.updateAtsScore(resumeId, analysis.atsScore);

      // Complete task
      await this.taskRepository.updateStatus(taskId, TaskStatus.COMPLETED, 100);

      resumeEventEmitter.emit('resume:analysis_completed', {
        userId,
        resumeId,
        taskId,
        atsScore: analysis.atsScore,
        analysisId: savedAnalysis.id
      });

      logger.root.info(`[ResumeService] ATS Analysis complete for resume ${resumeId}. Score: ${analysis.atsScore}`);
    } catch (err: any) {
      logger.root.error(`[ResumeService] Error analyzing resume ${resumeId}:`, err);
      await this.taskRepository.updateStatus(taskId, TaskStatus.FAILED, 0, err.message);

      resumeEventEmitter.emit('resume:analysis_failed', {
        userId,
        resumeId,
        taskId,
        error: err.message
      });
    }
  }
}
