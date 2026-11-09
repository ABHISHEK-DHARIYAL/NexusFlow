import { CrawlResult } from '../integrations/portfolio/PortfolioCrawler';
import { PortfolioDeterministicMetrics } from '../../types';

export class PortfolioAnalysisEngine {
  public computeMetrics(crawlResult: CrawlResult): PortfolioDeterministicMetrics {
    const mainPage = crawlResult.pages[0];

    // 1. Navigation Score (0-100)
    let navigationScore = 60;
    if (crawlResult.pages.length >= 2) navigationScore += 15;
    if (crawlResult.pages.length >= 4) navigationScore += 10;
    if (crawlResult.brokenLinks.length === 0) navigationScore += 15;
    else navigationScore -= Math.min(crawlResult.brokenLinks.length * 10, 40);
    navigationScore = Math.max(0, Math.min(navigationScore, 100));

    // 2. SEO Score (0-100)
    let seoScore = 40;
    if (mainPage?.seoIndicators.hasTitle) {
      seoScore += 15;
      const titleLen = mainPage.title.length;
      if (titleLen >= 10 && titleLen <= 60) seoScore += 5;
    }
    if (mainPage?.seoIndicators.hasMetaDescription) {
      seoScore += 15;
      const descLen = mainPage.metaDescription.length;
      if (descLen >= 40 && descLen <= 160) seoScore += 5;
    }
    if (mainPage?.seoIndicators.hasCanonical) seoScore += 10;
    if (mainPage?.seoIndicators.h1Count === 1) seoScore += 10;
    seoScore = Math.max(0, Math.min(seoScore, 100));

    // 3. Accessibility Indicators Score (0-100)
    let accessibilityScore = 50;
    if (mainPage?.accessibilityIndicators.hasHtmlLang) accessibilityScore += 20;
    if (mainPage?.accessibilityIndicators.totalImages) {
      const altRatio =
        (mainPage.accessibilityIndicators.totalImages - mainPage.accessibilityIndicators.imagesMissingAlt) /
        mainPage.accessibilityIndicators.totalImages;
      accessibilityScore += Math.round(altRatio * 20);
    } else {
      accessibilityScore += 20; // No images means no missing alt tags
    }
    if (mainPage?.accessibilityIndicators.emptyLinks === 0) accessibilityScore += 10;
    accessibilityScore = Math.max(0, Math.min(accessibilityScore, 100));

    // 4. Project Presentation Score (0-100)
    let projectPresentationScore = 50;
    if (crawlResult.detectedProjects.length > 0) {
      const avgScore =
        crawlResult.detectedProjects.reduce((acc, p) => acc + p.presentationScore, 0) /
        crawlResult.detectedProjects.length;
      projectPresentationScore = Math.round(avgScore);
      if (crawlResult.detectedProjects.length >= 3) projectPresentationScore += 5;
    }
    projectPresentationScore = Math.max(0, Math.min(projectPresentationScore, 100));

    // 5. Recruiter Readiness Score (0-100)
    let recruiterReadinessScore = 20;
    if (crawlResult.allGithubLinks.length > 0) recruiterReadinessScore += 20;
    if (crawlResult.allResumeLinks.length > 0) recruiterReadinessScore += 20;
    if (crawlResult.hasContactInfo) recruiterReadinessScore += 20;
    if (crawlResult.allSocialLinks.length > 0) recruiterReadinessScore += 10;
    if (crawlResult.detectedProjects.length >= 2) recruiterReadinessScore += 10;
    recruiterReadinessScore = Math.max(0, Math.min(recruiterReadinessScore, 100));

    // 6. Overall Portfolio Quality Score (0-100)
    const portfolioQualityScore = Math.round(
      0.25 * recruiterReadinessScore +
        0.25 * projectPresentationScore +
        0.2 * navigationScore +
        0.15 * seoScore +
        0.15 * accessibilityScore
    );

    // Signals
    const recommendationSignals: string[] = [];
    if (crawlResult.allResumeLinks.length === 0) {
      recommendationSignals.push('Missing direct link to resume/CV');
    }
    if (crawlResult.allGithubLinks.length === 0) {
      recommendationSignals.push('Missing links to GitHub repositories');
    }
    if (!crawlResult.hasContactInfo) {
      recommendationSignals.push('Missing clear contact information or form');
    }
    if (mainPage && !mainPage.seoIndicators.hasMetaDescription) {
      recommendationSignals.push('Homepage missing SEO meta description');
    }
    if (mainPage && mainPage.accessibilityIndicators.imagesMissingAlt > 0) {
      recommendationSignals.push(`${mainPage.accessibilityIndicators.imagesMissingAlt} image(s) missing alt text`);
    }
    if (crawlResult.brokenLinks.length > 0) {
      recommendationSignals.push(`Detected ${crawlResult.brokenLinks.length} broken internal link(s)`);
    }

    return {
      portfolioQualityScore,
      seoScore,
      accessibilityScore,
      navigationScore,
      projectPresentationScore,
      recruiterReadinessScore,
      pageCount: crawlResult.pages.length,
      projectCount: crawlResult.detectedProjects.length,
      githubLinkCount: crawlResult.allGithubLinks.length,
      liveDemoCount: crawlResult.pages.reduce((acc, p) => acc + p.liveDemoLinks.length, 0),
      hasResumeLink: crawlResult.allResumeLinks.length > 0,
      hasContactInfo: crawlResult.hasContactInfo,
      brokenLinkCount: crawlResult.brokenLinks.length,
      detectedTechnologies: crawlResult.allTechnologies,
      recommendationSignals
    };
  }
}
