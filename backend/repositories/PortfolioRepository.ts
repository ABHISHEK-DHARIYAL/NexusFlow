import { prisma } from '../lib/prisma';

export class PortfolioRepository {
  public async findPortfolioByUserId(userId: string) {
    return prisma.portfolio.findUnique({
      where: { userId },
      include: {
        pages: { orderBy: { depth: 'asc' } },
        projects: true,
        links: true,
        analyses: { orderBy: { createdAt: 'desc' }, take: 1 }
      }
    });
  }

  public async findPortfolioById(id: string) {
    return prisma.portfolio.findUnique({
      where: { id },
      include: {
        pages: true,
        projects: true,
        links: true,
        analyses: { orderBy: { createdAt: 'desc' }, take: 1 }
      }
    });
  }

  public async upsertPortfolio(
    userId: string,
    data: {
      url: string;
      domain: string;
      title?: string;
      description?: string;
      crawlStatus?: string;
      robotsAllowed?: boolean;
      pageCount?: number;
      qualityScore?: number;
      error?: string;
    }
  ) {
    return prisma.portfolio.upsert({
      where: { userId },
      create: {
        userId,
        url: data.url,
        domain: data.domain,
        title: data.title || null,
        description: data.description || null,
        crawlStatus: data.crawlStatus || 'QUEUED',
        robotsAllowed: data.robotsAllowed ?? true,
        pageCount: data.pageCount || 0,
        qualityScore: data.qualityScore || 0,
        error: data.error || null
      },
      update: {
        url: data.url,
        domain: data.domain,
        title: data.title || undefined,
        description: data.description || undefined,
        crawlStatus: data.crawlStatus || undefined,
        robotsAllowed: data.robotsAllowed ?? undefined,
        pageCount: data.pageCount ?? undefined,
        qualityScore: data.qualityScore ?? undefined,
        error: data.error || null,
        lastCrawledAt: new Date()
      }
    });
  }

  public async updateCrawlStatus(portfolioId: string, status: string, error?: string) {
    return prisma.portfolio.update({
      where: { id: portfolioId },
      data: {
        crawlStatus: status,
        error: error || null,
        ...(status === 'COMPLETED' ? { lastCrawledAt: new Date() } : {})
      }
    });
  }

  public async replacePages(portfolioId: string, pages: Array<any>) {
    await prisma.portfolioPage.deleteMany({ where: { portfolioId } });
    if (pages.length > 0) {
      await prisma.portfolioPage.createMany({
        data: pages.map((p) => ({
          portfolioId,
          url: p.url,
          path: p.path,
          title: p.title || null,
          metaDescription: p.metaDescription || null,
          canonical: p.canonical || null,
          depth: p.depth || 0,
          statusCode: p.statusCode || 200,
          contentType: p.contentType || 'text/html',
          wordCount: p.wordCount || 0,
          headings: p.headings || []
        }))
      });
    }
  }

  public async replaceProjects(portfolioId: string, projects: Array<any>) {
    await prisma.portfolioProject.deleteMany({ where: { portfolioId } });
    if (projects.length > 0) {
      await prisma.portfolioProject.createMany({
        data: projects.map((pr) => ({
          portfolioId,
          name: pr.name,
          description: pr.description || null,
          technologies: pr.technologies || [],
          githubUrl: pr.githubUrl || null,
          liveDemoUrl: pr.liveDemoUrl || null,
          documentationUrl: pr.documentationUrl || null,
          imageUrl: pr.imageUrl || null,
          sourcePageUrl: pr.sourcePageUrl || null,
          presentationScore: pr.presentationScore || 0
        }))
      });
    }
  }

  public async replaceLinks(portfolioId: string, links: Array<any>) {
    await prisma.portfolioLink.deleteMany({ where: { portfolioId } });
    if (links.length > 0) {
      await prisma.portfolioLink.createMany({
        data: links.map((l) => ({
          portfolioId,
          sourceUrl: l.sourceUrl,
          targetUrl: l.targetUrl,
          linkType: l.linkType || 'INTERNAL',
          anchorText: l.anchorText || null,
          isBroken: l.isBroken || false,
          statusCode: l.statusCode || null
        }))
      });
    }
  }

  public async saveAnalysis(
    portfolioId: string,
    taskId: string | null,
    data: {
      portfolioQualityScore: number;
      seoScore: number;
      accessibilityScore: number;
      navigationScore: number;
      projectPresentationScore: number;
      recruiterReadinessScore: number;
      summary: string;
      strengths: any;
      weaknesses: any;
      recruiterPerspective: string;
      seoRecommendations: any;
      accessibilityRecommendations: any;
      designContentRecommendations: any;
      improvementRoadmap: any;
    }
  ) {
    const analysis = await prisma.portfolioAnalysis.create({
      data: {
        portfolioId,
        taskId: taskId || undefined,
        portfolioQualityScore: data.portfolioQualityScore,
        seoScore: data.seoScore,
        accessibilityScore: data.accessibilityScore,
        navigationScore: data.navigationScore,
        projectPresentationScore: data.projectPresentationScore,
        recruiterReadinessScore: data.recruiterReadinessScore,
        summary: data.summary,
        strengths: data.strengths,
        weaknesses: data.weaknesses,
        recruiterPerspective: data.recruiterPerspective,
        seoRecommendations: data.seoRecommendations,
        accessibilityRecommendations: data.accessibilityRecommendations,
        designContentRecommendations: data.designContentRecommendations,
        improvementRoadmap: data.improvementRoadmap
      }
    });

    await prisma.portfolio.update({
      where: { id: portfolioId },
      data: { qualityScore: data.portfolioQualityScore }
    });

    return analysis;
  }

  public async deletePortfolio(userId: string) {
    const portfolio = await prisma.portfolio.findUnique({ where: { userId } });
    if (!portfolio) return null;
    return prisma.portfolio.delete({ where: { id: portfolio.id } });
  }
}
