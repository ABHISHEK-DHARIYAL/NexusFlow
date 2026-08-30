import { prisma } from '../lib/prisma';
import { logger } from '../logger';

export class ResumeRepository {
  public async findResumeByUserId(userId: string) {
    try {
      return await prisma.resume.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          analyses: {
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      });
    } catch (err: any) {
      logger.database.error(`ResumeRepository.findResumeByUserId failed: ${err.message}`);
      return null;
    }
  }

  public async findResumeById(resumeId: string) {
    try {
      return await prisma.resume.findUnique({
        where: { id: resumeId },
        include: {
          analyses: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });
    } catch (err: any) {
      logger.database.error(`ResumeRepository.findResumeById failed: ${err.message}`);
      return null;
    }
  }

  public async saveResume(data: {
    id?: string;
    userId: string;
    title: string;
    fileUrl?: string | null;
    rawText: string;
    contactInfo: any;
    workExperience: any;
    education: any;
    skills: any;
    projects: any;
    certifications: any;
    atsScore?: number;
  }) {
    try {
      if (data.id) {
        return await prisma.resume.update({
          where: { id: data.id },
          data: {
            title: data.title,
            fileUrl: data.fileUrl,
            rawText: data.rawText,
            contactInfo: data.contactInfo,
            workExperience: data.workExperience,
            education: data.education,
            skills: data.skills,
            projects: data.projects,
            certifications: data.certifications,
            atsScore: data.atsScore ?? 0
          }
        });
      }

      return await prisma.resume.create({
        data: {
          userId: data.userId,
          title: data.title,
          fileUrl: data.fileUrl,
          rawText: data.rawText,
          contactInfo: data.contactInfo,
          workExperience: data.workExperience,
          education: data.education,
          skills: data.skills,
          projects: data.projects,
          certifications: data.certifications,
          atsScore: data.atsScore ?? 0
        }
      });
    } catch (err: any) {
      logger.database.error(`ResumeRepository.saveResume failed: ${err.message}`);
      throw err;
    }
  }

  public async updateAtsScore(resumeId: string, atsScore: number) {
    try {
      return await prisma.resume.update({
        where: { id: resumeId },
        data: { atsScore }
      });
    } catch (err: any) {
      logger.database.error(`ResumeRepository.updateAtsScore failed: ${err.message}`);
      return null;
    }
  }

  public async saveAnalysis(data: {
    resumeId: string;
    taskId?: string;
    atsScore: number;
    formattingScore: number;
    contentImpactScore: number;
    skillsMatchScore: number;
    completenessScore: number;
    summary: string;
    actionableSuggestions: any;
    bulletEvaluations: any;
    missingKeywords: any;
    formattingIssues: any;
  }) {
    try {
      return await prisma.resumeAnalysis.create({
        data: {
          resumeId: data.resumeId,
          taskId: data.taskId,
          atsScore: data.atsScore,
          formattingScore: data.formattingScore,
          contentImpactScore: data.contentImpactScore,
          skillsMatchScore: data.skillsMatchScore,
          completenessScore: data.completenessScore,
          summary: data.summary,
          actionableSuggestions: data.actionableSuggestions,
          bulletEvaluations: data.bulletEvaluations,
          missingKeywords: data.missingKeywords,
          formattingIssues: data.formattingIssues
        }
      });
    } catch (err: any) {
      logger.database.error(`ResumeRepository.saveAnalysis failed: ${err.message}`);
      throw err;
    }
  }

  public async deleteResume(resumeId: string, userId: string) {
    try {
      return await prisma.resume.deleteMany({
        where: { id: resumeId, userId }
      });
    } catch (err: any) {
      logger.database.error(`ResumeRepository.deleteResume failed: ${err.message}`);
      throw err;
    }
  }
}
