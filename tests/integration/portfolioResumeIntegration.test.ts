import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateAndResolveUrl, SsrfError } from '../../backend/integrations/portfolio/ssrfValidator';
import { PortfolioCrawler } from '../../backend/integrations/portfolio/PortfolioCrawler';
import { PortfolioAnalysisEngine } from '../../backend/services/PortfolioAnalysisEngine';
import { PortfolioAiService } from '../../backend/services/PortfolioAiService';
import { ResumeParser } from '../../backend/integrations/resume/ResumeParser';
import { ResumeAnalyzer } from '../../backend/integrations/resume/ResumeAnalyzer';
import { portfolioEventEmitter } from '../../backend/services/PortfolioService';
import { resumeEventEmitter } from '../../backend/services/ResumeEventEmitter';

describe('Part 5 - Portfolio & Resume Intelligence Integration Tests', () => {
  describe('Portfolio Intelligence — SSRF & URL Validation', () => {
    it('should validate and normalize public http/https URLs', async () => {
      const result = await validateAndResolveUrl('https://example.com/portfolio');
      expect(result.normalizedUrl).toBe('https://example.com/portfolio');
      expect(result.domain).toBe('example.com');
    });

    it('should throw SsrfError for private IPv4 addresses', async () => {
      await expect(validateAndResolveUrl('http://127.0.0.1')).rejects.toThrow(SsrfError);
      await expect(validateAndResolveUrl('http://192.168.1.100')).rejects.toThrow(SsrfError);
      await expect(validateAndResolveUrl('http://10.0.0.1')).rejects.toThrow(SsrfError);
      await expect(validateAndResolveUrl('http://169.254.169.254')).rejects.toThrow(SsrfError);
    });

    it('should throw SsrfError for non-HTTP protocols', async () => {
      await expect(validateAndResolveUrl('file:///etc/passwd')).rejects.toThrow(SsrfError);
      await expect(validateAndResolveUrl('ftp://internal.server')).rejects.toThrow(SsrfError);
    });
  });

  describe('Portfolio Intelligence — Crawl & Deterministic Metrics Engine', () => {
    it('should compute deterministic quality, SEO, accessibility, and recruiter readiness scores', async () => {
      const crawler = new PortfolioCrawler();
      const crawlResult = crawler.getMockCrawlResult('https://jane.dev');

      const engine = new PortfolioAnalysisEngine();
      const metrics = engine.computeMetrics(crawlResult);

      expect(metrics.portfolioQualityScore).toBeGreaterThanOrEqual(0);
      expect(metrics.portfolioQualityScore).toBeLessThanOrEqual(100);
      expect(metrics.seoScore).toBeGreaterThanOrEqual(0);
      expect(metrics.accessibilityScore).toBeGreaterThanOrEqual(0);
      expect(metrics.navigationScore).toBeGreaterThanOrEqual(0);
      expect(metrics.recruiterReadinessScore).toBeGreaterThanOrEqual(0);
      expect(metrics.hasResumeLink).toBe(true);
      expect(metrics.hasContactInfo).toBe(true);
      expect(metrics.detectedTechnologies.length).toBeGreaterThan(0);
    });

    it('should generate structured fallback AI report when Gemini is not initialized', async () => {
      const crawler = new PortfolioCrawler();
      const crawlResult = crawler.getMockCrawlResult('https://jane.dev');
      const engine = new PortfolioAnalysisEngine();
      const metrics = engine.computeMetrics(crawlResult);

      const aiService = new PortfolioAiService();
      const report = aiService.generateFallbackReport('jane.dev', metrics);

      expect(report.summary).toContain('jane.dev');
      expect(report.strengths.length).toBeGreaterThan(0);
      expect(report.weaknesses.length).toBeGreaterThan(0);
      expect(report.recruiterPerspective).toBeDefined();
      expect(report.improvementRoadmap.length).toBe(2);
    });
  });

  describe('Resume Intelligence — Parser & ATS Evaluation Engine', () => {
    const sampleResumeText = `
Jane Developer
Senior Full-Stack Engineer | San Francisco, CA
jane.dev@example.com | (555) 123-4567 | github.com/janedev | linkedin.com/in/janedev

SUMMARY
Results-driven engineer with 6+ years of experience building web apps with TypeScript, React, Node.js, and PostgreSQL.

WORK EXPERIENCE
Senior Software Engineer | CloudTech Inc
Jan 2021 – Present
• Architected and deployed microservice event pipeline processing 10M daily events with 99.9% uptime.
• Reduced API latency by 45% by optimizing SQL queries and Redis cache invalidation.
• Mentored 4 junior engineers and enforced strict test coverage standards.

EDUCATION
Bachelor of Science in Computer Science
University of California | 2015 – 2019

TECHNICAL SKILLS
TypeScript, JavaScript, React, Node.js, Express, PostgreSQL, Redis, Docker, Git, REST API
    `;

    it('should parse contact details, sections, and calculate word & action verb metrics', () => {
      const parsed = ResumeParser.parseRawText(sampleResumeText);

      expect(parsed.contactInfo.email).toBe('jane.dev@example.com');
      expect(parsed.contactInfo.phone).toBe('(555) 123-4567');
      expect(parsed.contactInfo.github).toContain('github.com/janedev');
      expect(parsed.contactInfo.linkedin).toContain('linkedin.com/in/janedev');

      expect(parsed.workExperience.length).toBeGreaterThan(0);
      expect(parsed.education.length).toBeGreaterThan(0);
      expect(parsed.skills.technical).toContain('TypeScript');
      expect(parsed.skills.technical).toContain('React');

      expect(parsed.metrics.wordCount).toBeGreaterThan(50);
      expect(parsed.metrics.actionVerbCount).toBeGreaterThan(0);
      expect(parsed.metrics.metricBulletCount).toBeGreaterThan(0);
    });

    it('should compute deterministic ATS evaluation when Gemini is unavailable', () => {
      const parsed = ResumeParser.parseRawText(sampleResumeText);
      const analyzer = new ResumeAnalyzer();
      const result = analyzer['generateDeterministicAnalysis'](sampleResumeText, parsed);

      expect(result.atsScore).toBeGreaterThanOrEqual(0);
      expect(result.atsScore).toBeLessThanOrEqual(100);
      expect(result.formattingScore).toBeGreaterThan(0);
      expect(result.contentImpactScore).toBeGreaterThan(0);
      expect(result.skillsMatchScore).toBeGreaterThan(0);
      expect(result.completenessScore).toBeGreaterThan(0);
      expect(result.actionableSuggestions.length).toBeGreaterThan(0);
      expect(result.bulletEvaluations.length).toBeGreaterThan(0);
    });
  });

  describe('WebSocket Event Emmitters', () => {
    it('should emit portfolio crawl and resume analysis events correctly', () => {
      const portfolioSpy = vi.fn();
      const resumeSpy = vi.fn();

      portfolioEventEmitter.on('portfolio:crawl_completed', portfolioSpy);
      resumeEventEmitter.on('resume:analysis_completed', resumeSpy);

      portfolioEventEmitter.emit('portfolio:crawl_completed', {
        userId: 'user_123',
        portfolioId: 'port_123',
        pageCount: 5,
        qualityScore: 85
      });

      resumeEventEmitter.emit('resume:analysis_completed', {
        userId: 'user_123',
        resumeId: 'res_123',
        taskId: 'task_123',
        atsScore: 92,
        analysisId: 'ana_123'
      });

      expect(portfolioSpy).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user_123', qualityScore: 85 })
      );
      expect(resumeSpy).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user_123', atsScore: 92 })
      );

      portfolioEventEmitter.off('portfolio:crawl_completed', portfolioSpy);
      resumeEventEmitter.off('resume:analysis_completed', resumeSpy);
    });
  });
});
