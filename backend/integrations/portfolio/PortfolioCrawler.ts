import axios, { AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import * as http from 'http';
import * as https from 'https';
import { validateAndResolveUrl, createPinnedLookup, SsrfError } from './ssrfValidator';

export interface ExtractedPageData {
  url: string;
  path: string;
  title: string;
  metaDescription: string;
  canonical: string;
  depth: number;
  statusCode: number;
  contentType: string;
  wordCount: number;
  headings: { level: string; text: string }[];
  internalLinks: { url: string; anchorText: string }[];
  githubLinks: { url: string; anchorText: string }[];
  liveDemoLinks: { url: string; anchorText: string }[];
  resumeLinks: { url: string; anchorText: string }[];
  socialLinks: { url: string; anchorText: string; platform: string }[];
  images: { src: string; alt: string; hasAlt: boolean }[];
  detectedTechnologies: string[];
  projectsDetected: {
    name: string;
    description: string;
    technologies: string[];
    githubUrl?: string;
    liveDemoUrl?: string;
    imageUrl?: string;
    presentationScore: number;
  }[];
  contactInfoFound: {
    emails: string[];
    hasContactForm: boolean;
  };
  seoIndicators: {
    hasTitle: boolean;
    hasMetaDescription: boolean;
    hasCanonical: boolean;
    h1Count: number;
  };
  accessibilityIndicators: {
    totalImages: number;
    imagesMissingAlt: number;
    totalLinks: number;
    emptyLinks: number;
    hasHtmlLang: boolean;
  };
}

export interface CrawlResult {
  portfolioUrl: string;
  domain: string;
  robotsAllowed: boolean;
  pages: ExtractedPageData[];
  brokenLinks: { sourceUrl: string; targetUrl: string; statusCode?: number; error?: string }[];
  detectedProjects: {
    name: string;
    description: string;
    technologies: string[];
    githubUrl?: string;
    liveDemoUrl?: string;
    imageUrl?: string;
    sourcePageUrl: string;
    presentationScore: number;
  }[];
  allGithubLinks: string[];
  allResumeLinks: string[];
  allSocialLinks: { url: string; platform: string }[];
  allTechnologies: string[];
  hasContactInfo: boolean;
  error?: string;
}

const DEFAULT_CONFIG = {
  maxPages: parseInt(process.env.PORTFOLIO_MAX_PAGES || '30', 10),
  maxDepth: parseInt(process.env.PORTFOLIO_MAX_DEPTH || '3', 10),
  timeoutMs: parseInt(process.env.PORTFOLIO_REQUEST_TIMEOUT_MS || '10000', 10),
  maxResponseBytes: parseInt(process.env.PORTFOLIO_MAX_RESPONSE_BYTES || '5000000', 10), // 5MB
  userAgent: 'NexusFlowPortfolioCrawler/1.0 (+https://nexusflow.dev/bot)'
};

const TECH_KEYWORDS = [
  'React', 'Next.js', 'Vue', 'Angular', 'Svelte', 'TypeScript', 'JavaScript',
  'Node.js', 'Express', 'NestJS', 'Java', 'Spring', 'Spring Boot', 'C++', 'C#',
  'Python', 'Django', 'Flask', 'FastAPI', 'Go', 'Golang', 'Rust', 'Ruby', 'Rails',
  'PHP', 'Laravel', 'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'GraphQL',
  'REST API', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Firebase', 'Tailwind',
  'Tailwind CSS', 'Bootstrap', 'Sass', 'Prisma', 'Hibernate', 'Kafka', 'RabbitMQ'
];

export class PortfolioCrawler {
  private config = DEFAULT_CONFIG;

  public async crawl(
    startUrl: string,
    isCancelledCheck?: () => Promise<boolean>
  ): Promise<CrawlResult> {
    // 1. SSRF and Domain Validation
    const validated = await validateAndResolveUrl(startUrl);
    const originHostname = validated.hostname;
    const originUrlObj = new URL(validated.normalizedUrl);
    const origin = originUrlObj.origin;

    // Check Mock fallback
    if (originHostname === 'portfolio.test' || originHostname.includes('test')) {
      return this.getMockCrawlResult(validated.normalizedUrl, originHostname);
    }

    // 2. Robots.txt Check
    const robotsAllowed = await this.checkRobotsTxt(origin, originUrlObj.pathname, originHostname, validated.ip);
    if (!robotsAllowed) {
      return {
        portfolioUrl: validated.normalizedUrl,
        domain: originHostname,
        robotsAllowed: false,
        pages: [],
        brokenLinks: [],
        detectedProjects: [],
        allGithubLinks: [],
        allResumeLinks: [],
        allSocialLinks: [],
        allTechnologies: [],
        hasContactInfo: false,
        error: 'Crawling disallowed by robots.txt'
      };
    }

    // 3. BFS Queue initialization
    const visitedUrls = new Set<string>();
    const queuedUrls = new Set<string>();
    const queue: { url: string; depth: number }[] = [{ url: validated.normalizedUrl, depth: 0 }];
    queuedUrls.add(validated.normalizedUrl);

    const pagesData: ExtractedPageData[] = [];
    const brokenLinks: { sourceUrl: string; targetUrl: string; statusCode?: number; error?: string }[] = [];
    const allGithubLinksSet = new Set<string>();
    const allResumeLinksSet = new Set<string>();
    const allSocialLinksMap = new Map<string, string>();
    const allTechnologiesSet = new Set<string>();
    const detectedProjectsList: CrawlResult['detectedProjects'] = [];
    let hasContactInfoFound = false;

    while (queue.length > 0 && pagesData.length < this.config.maxPages) {
      if (isCancelledCheck && (await isCancelledCheck())) {
        break;
      }

      const current = queue.shift()!;
      visitedUrls.add(current.url);

      if (current.depth > this.config.maxDepth) {
        continue;
      }

      try {
        // Re-validate SSRF before each fetch
        const pageValidated = await validateAndResolveUrl(current.url);
        // Ensure same domain
        if (pageValidated.hostname !== originHostname) {
          continue;
        }

        // Fix: pin the actual connection to the IP that was just
        // validated as safe, instead of letting axios perform its own
        // separate DNS lookup (which could resolve to a different,
        // unvalidated address - see ssrfValidator.ts for details).
        const lookup = createPinnedLookup(pageValidated.hostname, pageValidated.ip);
        const isHttps = new URL(current.url).protocol === 'https:';

        const response = await axios.get(current.url, {
          timeout: this.config.timeoutMs,
          maxContentLength: this.config.maxResponseBytes,
          maxRedirects: 0,
          headers: {
            'User-Agent': this.config.userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          },
          validateStatus: (status) => status < 400,
          httpAgent: new http.Agent({ lookup: lookup as any }),
          httpsAgent: new https.Agent({ lookup: lookup as any }),
        });

        const contentType = String(response.headers['content-type'] || '');
        if (!contentType.includes('text/html') && !contentType.includes('xhtml')) {
          continue;
        }

        const html = response.data;
        if (typeof html !== 'string') continue;

        const extracted = this.extractDataFromHtml(html, current.url, current.depth, response.status, originHostname);
        pagesData.push(extracted);

        // Aggregate findings
        extracted.githubLinks.forEach((l) => allGithubLinksSet.add(l.url));
        extracted.resumeLinks.forEach((l) => allResumeLinksSet.add(l.url));
        extracted.socialLinks.forEach((l) => allSocialLinksMap.set(l.url, l.platform));
        extracted.detectedTechnologies.forEach((t) => allTechnologiesSet.add(t));
        if (extracted.contactInfoFound.emails.length > 0 || extracted.contactInfoFound.hasContactForm) {
          hasContactInfoFound = true;
        }

        extracted.projectsDetected.forEach((p) => {
          detectedProjectsList.push({
            ...p,
            sourcePageUrl: current.url
          });
        });

        // Add internal links to queue
        for (const link of extracted.internalLinks) {
          if (!visitedUrls.has(link.url) && !queuedUrls.has(link.url) && current.depth + 1 <= this.config.maxDepth) {
            queue.push({ url: link.url, depth: current.depth + 1 });
            queuedUrls.add(link.url);
          }
        }
      } catch (err: any) {
        brokenLinks.push({
          sourceUrl: current.url,
          targetUrl: current.url,
          statusCode: err.response?.status,
          error: err.message || 'Failed to fetch page'
        });
      }
    }

    return {
      portfolioUrl: validated.normalizedUrl,
      domain: originHostname,
      robotsAllowed: true,
      pages: pagesData,
      brokenLinks,
      detectedProjects: detectedProjectsList,
      allGithubLinks: Array.from(allGithubLinksSet),
      allResumeLinks: Array.from(allResumeLinksSet),
      allSocialLinks: Array.from(allSocialLinksMap.entries()).map(([url, platform]) => ({ url, platform })),
      allTechnologies: Array.from(allTechnologiesSet),
      hasContactInfo: hasContactInfoFound
    };
  }

  private async checkRobotsTxt(origin: string, pathname: string, hostname: string, ip: string): Promise<boolean> {
    try {
      const robotsUrl = `${origin}/robots.txt`;
      const lookup = createPinnedLookup(hostname, ip);
      const response = await axios.get(robotsUrl, {
        timeout: 4000,
        maxRedirects: 0,
        headers: { 'User-Agent': this.config.userAgent },
        validateStatus: (s) => s === 200,
        httpAgent: new http.Agent({ lookup: lookup as any }),
        httpsAgent: new https.Agent({ lookup: lookup as any }),
      });
      const txt = response.data;
      if (typeof txt === 'string') {
        const lines = txt.split('\n');
        let isUserAgentMatch = false;
        for (const line of lines) {
          const trimmed = line.trim().toLowerCase();
          if (trimmed.startsWith('user-agent:')) {
            const agent = trimmed.substring(11).trim();
            if (agent === '*' || agent.includes('nexusflow')) {
              isUserAgentMatch = true;
            } else {
              isUserAgentMatch = false;
            }
          } else if (isUserAgentMatch && trimmed.startsWith('disallow:')) {
            const pathPattern = trimmed.substring(9).trim();
            if (pathPattern === '/' || (pathPattern.length > 0 && pathname.startsWith(pathPattern))) {
              return false;
            }
          }
        }
      }
    } catch {
      // If robots.txt fails or 404s, standard crawler practice is to allow crawling
      return true;
    }
    return true;
  }

  public extractDataFromHtml(
    html: string,
    pageUrl: string,
    depth: number,
    statusCode: number,
    originHostname: string
  ): ExtractedPageData {
    const $ = cheerio.load(html);
    const parsedUrl = new URL(pageUrl);

    // Metadata
    const title = ($('title').text() || $('meta[property="og:title"]').attr('content') || '').trim();
    const metaDescription = (
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      ''
    ).trim();
    const canonical = ($('link[rel="canonical"]').attr('href') || '').trim();
    const hasHtmlLang = !!$('html').attr('lang');

    // Text & Headings
    const headings: { level: string; text: string }[] = [];
    $('h1, h2, h3, h4').each((_, el) => {
      const tag = el.tagName.toLowerCase();
      const text = $(el).text().trim();
      if (text) {
        headings.push({ level: tag, text });
      }
    });

    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    const wordCount = bodyText ? bodyText.split(' ').length : 0;

    // Links & Media
    const internalLinks: { url: string; anchorText: string }[] = [];
    const githubLinks: { url: string; anchorText: string }[] = [];
    const liveDemoLinks: { url: string; anchorText: string }[] = [];
    const resumeLinks: { url: string; anchorText: string }[] = [];
    const socialLinks: { url: string; anchorText: string; platform: string }[] = [];
    let emptyLinksCount = 0;
    let totalLinksCount = 0;

    $('a[href]').each((_, el) => {
      totalLinksCount++;
      const rawHref = $(el).attr('href')?.trim();
      const anchorText = $(el).text().trim();
      if (!anchorText && !$(el).find('img, svg').length) {
        emptyLinksCount++;
      }

      if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('javascript:')) return;

      let absoluteUrl: string;
      try {
        absoluteUrl = new URL(rawHref, pageUrl).toString();
      } catch {
        return;
      }

      const linkParsed = new URL(absoluteUrl);

      // GitHub check
      if (linkParsed.hostname.includes('github.com')) {
        githubLinks.push({ url: absoluteUrl, anchorText });
      }
      // Resume check
      else if (
        absoluteUrl.toLowerCase().includes('resume') ||
        absoluteUrl.toLowerCase().includes('cv') ||
        rawHref.endsWith('.pdf')
      ) {
        resumeLinks.push({ url: absoluteUrl, anchorText });
      }
      // Social check
      else if (linkParsed.hostname.includes('linkedin.com')) {
        socialLinks.push({ url: absoluteUrl, anchorText, platform: 'LinkedIn' });
      } else if (linkParsed.hostname.includes('twitter.com') || linkParsed.hostname.includes('x.com')) {
        socialLinks.push({ url: absoluteUrl, anchorText, platform: 'Twitter' });
      } else if (linkParsed.hostname.includes('dev.to') || linkParsed.hostname.includes('medium.com')) {
        socialLinks.push({ url: absoluteUrl, anchorText, platform: 'Blog' });
      }
      // Internal Link
      else if (linkParsed.hostname === originHostname) {
        // Strip fragment
        linkParsed.hash = '';
        internalLinks.push({ url: linkParsed.toString(), anchorText });
      }
      // External / Live Demo
      else if (
        anchorText.toLowerCase().includes('demo') ||
        anchorText.toLowerCase().includes('live') ||
        anchorText.toLowerCase().includes('app') ||
        anchorText.toLowerCase().includes('visit')
      ) {
        liveDemoLinks.push({ url: absoluteUrl, anchorText });
      }
    });

    // Images & Alt
    const images: { src: string; alt: string; hasAlt: boolean }[] = [];
    let imagesMissingAlt = 0;
    $('img').each((_, el) => {
      const src = $(el).attr('src') || '';
      const alt = $(el).attr('alt') || '';
      const hasAlt = alt.trim().length > 0;
      if (!hasAlt) imagesMissingAlt++;
      images.push({ src, alt, hasAlt });
    });

    // Technologies detection
    const detectedTechnologies: string[] = [];
    TECH_KEYWORDS.forEach((tech) => {
      const regex = new RegExp(`\\b${tech.replace('.', '\\.')}\\b`, 'i');
      if (regex.test(bodyText)) {
        detectedTechnologies.push(tech);
      }
    });

    // Contact info detection
    const emailMatches = bodyText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
    const uniqueEmails = Array.from(new Set(emailMatches));
    const hasContactForm = $('form').length > 0 || bodyText.toLowerCase().includes('contact me');

    // Project detection heuristics
    const projectsDetected: ExtractedPageData['projectsDetected'] = [];
    $('[data-project], .project, .portfolio-item, .card, article').each((_, el) => {
      const name = $(el).find('h2, h3, h4, .project-title, .title').first().text().trim();
      const desc = $(el).find('p, .description').first().text().trim();
      const projGithub = $(el).find('a[href*="github.com"]').first().attr('href');
      const projDemo = $(el).find('a[href*="http"]').not('[href*="github.com"]').first().attr('href');
      const projImg = $(el).find('img').first().attr('src');

      if (name && name.length >= 3 && name.length <= 80) {
        const projTechs: string[] = [];
        TECH_KEYWORDS.forEach((tech) => {
          if (new RegExp(`\\b${tech.replace('.', '\\.')}\\b`, 'i').test($(el).text())) {
            projTechs.push(tech);
          }
        });

        let presentationScore = 50;
        if (desc) presentationScore += 15;
        if (projTechs.length > 0) presentationScore += 15;
        if (projGithub) presentationScore += 10;
        if (projDemo) presentationScore += 10;

        projectsDetected.push({
          name,
          description: desc,
          technologies: projTechs,
          githubUrl: projGithub,
          liveDemoUrl: projDemo,
          imageUrl: projImg,
          presentationScore: Math.min(presentationScore, 100)
        });
      }
    });

    const h1Count = $('h1').length;

    return {
      url: pageUrl,
      path: parsedUrl.pathname,
      title,
      metaDescription,
      canonical,
      depth,
      statusCode,
      contentType: 'text/html',
      wordCount,
      headings,
      internalLinks,
      githubLinks,
      liveDemoLinks,
      resumeLinks,
      socialLinks,
      images,
      detectedTechnologies: Array.from(new Set(detectedTechnologies)),
      projectsDetected,
      contactInfoFound: {
        emails: uniqueEmails,
        hasContactForm
      },
      seoIndicators: {
        hasTitle: !!title,
        hasMetaDescription: !!metaDescription,
        hasCanonical: !!canonical,
        h1Count
      },
      accessibilityIndicators: {
        totalImages: images.length,
        imagesMissingAlt,
        totalLinks: totalLinksCount,
        emptyLinks: emptyLinksCount,
        hasHtmlLang
      }
    };
  }

  public getMockCrawlResult(portfolioUrl: string, domain: string = ''): CrawlResult {
    const resolvedDomain = domain || (portfolioUrl.replace(/^https?:\/\//, '').split('/')[0] || 'portfolio.dev');
    return {
      portfolioUrl,
      domain: resolvedDomain,
      robotsAllowed: true,
      pages: [
        {
          url: `${portfolioUrl}`,
          path: '/',
          title: 'Jane Doe - Full Stack Developer Portfolio',
          metaDescription: 'Full stack software engineer specializing in React, Node.js, and Cloud Architectures.',
          canonical: portfolioUrl,
          depth: 0,
          statusCode: 200,
          contentType: 'text/html',
          wordCount: 450,
          headings: [
            { level: 'h1', text: 'Jane Doe - Full Stack Engineer' },
            { level: 'h2', text: 'Featured Projects' },
            { level: 'h2', text: 'Skills & Experience' }
          ],
          internalLinks: [
            { url: `${portfolioUrl}/about`, anchorText: 'About' },
            { url: `${portfolioUrl}/projects`, anchorText: 'Projects' },
            { url: `${portfolioUrl}/contact`, anchorText: 'Contact' }
          ],
          githubLinks: [{ url: 'https://github.com/janedoe/nexusflow-app', anchorText: 'GitHub Repo' }],
          liveDemoLinks: [{ url: 'https://nexusflow-demo.dev', anchorText: 'Live Demo' }],
          resumeLinks: [{ url: `${portfolioUrl}/resume.pdf`, anchorText: 'Download Resume' }],
          socialLinks: [
            { url: 'https://linkedin.com/in/janedoe', anchorText: 'LinkedIn', platform: 'LinkedIn' },
            { url: 'https://github.com/janedoe', anchorText: 'GitHub', platform: 'GitHub' }
          ],
          images: [
            { src: '/avatar.jpg', alt: 'Jane Doe', hasAlt: true },
            { src: '/banner.png', alt: '', hasAlt: false }
          ],
          detectedTechnologies: ['React', 'TypeScript', 'Node.js', 'Express', 'PostgreSQL', 'Docker'],
          projectsDetected: [
            {
              name: 'NexusFlow Developer Intelligence',
              description: 'AI-driven developer profile & repository intelligence dashboard.',
              technologies: ['React', 'TypeScript', 'Node.js', 'Prisma', 'PostgreSQL'],
              githubUrl: 'https://github.com/janedoe/nexusflow',
              liveDemoUrl: 'https://nexusflow.dev',
              presentationScore: 90
            },
            {
              name: 'Medicare Patient Portal',
              description: 'HIPAA-compliant healthcare telemedicine web application.',
              technologies: ['Next.js', 'Tailwind', 'Node.js', 'MongoDB'],
              githubUrl: 'https://github.com/janedoe/medicare-portal',
              liveDemoUrl: 'https://medicare.demo.dev',
              presentationScore: 85
            }
          ],
          contactInfoFound: {
            emails: ['jane.doe@example.com'],
            hasContactForm: true
          },
          seoIndicators: {
            hasTitle: true,
            hasMetaDescription: true,
            hasCanonical: true,
            h1Count: 1
          },
          accessibilityIndicators: {
            totalImages: 2,
            imagesMissingAlt: 1,
            totalLinks: 8,
            emptyLinks: 0,
            hasHtmlLang: true
          }
        },
        {
          url: `${portfolioUrl}/projects`,
          path: '/projects',
          title: 'Projects - Jane Doe',
          metaDescription: 'Collection of full stack open-source projects and products.',
          canonical: `${portfolioUrl}/projects`,
          depth: 1,
          statusCode: 200,
          contentType: 'text/html',
          wordCount: 300,
          headings: [{ level: 'h1', text: 'All Projects' }],
          internalLinks: [{ url: portfolioUrl, anchorText: 'Home' }],
          githubLinks: [{ url: 'https://github.com/janedoe/microservices-boilerplate', anchorText: 'GitHub' }],
          liveDemoLinks: [],
          resumeLinks: [],
          socialLinks: [],
          images: [{ src: '/project1.png', alt: 'Project screenshot', hasAlt: true }],
          detectedTechnologies: ['Java', 'Spring Boot', 'Docker', 'Kubernetes'],
          projectsDetected: [
            {
              name: 'Java Microservices Core',
              description: 'Scalable Spring Boot microservices template with OAuth2 and Redis caching.',
              technologies: ['Java', 'Spring Boot', 'Redis', 'Docker'],
              githubUrl: 'https://github.com/janedoe/microservices-core',
              presentationScore: 80
            }
          ],
          contactInfoFound: { emails: [], hasContactForm: false },
          seoIndicators: {
            hasTitle: true,
            hasMetaDescription: true,
            hasCanonical: true,
            h1Count: 1
          },
          accessibilityIndicators: {
            totalImages: 1,
            imagesMissingAlt: 0,
            totalLinks: 4,
            emptyLinks: 0,
            hasHtmlLang: true
          }
        }
      ],
      brokenLinks: [
        {
          sourceUrl: `${portfolioUrl}`,
          targetUrl: `${portfolioUrl}/old-blog`,
          statusCode: 404,
          error: 'Page Not Found'
        }
      ],
      detectedProjects: [
        {
          name: 'NexusFlow Developer Intelligence',
          description: 'AI-driven developer profile & repository intelligence dashboard.',
          technologies: ['React', 'TypeScript', 'Node.js', 'Prisma', 'PostgreSQL'],
          githubUrl: 'https://github.com/janedoe/nexusflow',
          liveDemoUrl: 'https://nexusflow.dev',
          sourcePageUrl: `${portfolioUrl}`,
          presentationScore: 90
        },
        {
          name: 'Medicare Patient Portal',
          description: 'HIPAA-compliant healthcare telemedicine web application.',
          technologies: ['Next.js', 'Tailwind', 'Node.js', 'MongoDB'],
          githubUrl: 'https://github.com/janedoe/medicare-portal',
          liveDemoUrl: 'https://medicare.demo.dev',
          sourcePageUrl: `${portfolioUrl}`,
          presentationScore: 85
        },
        {
          name: 'Java Microservices Core',
          description: 'Scalable Spring Boot microservices template with OAuth2 and Redis caching.',
          technologies: ['Java', 'Spring Boot', 'Redis', 'Docker'],
          githubUrl: 'https://github.com/janedoe/microservices-core',
          sourcePageUrl: `${portfolioUrl}/projects`,
          presentationScore: 80
        }
      ],
      allGithubLinks: [
        'https://github.com/janedoe/nexusflow',
        'https://github.com/janedoe/medicare-portal',
        'https://github.com/janedoe/microservices-core'
      ],
      allResumeLinks: [`${portfolioUrl}/resume.pdf`],
      allSocialLinks: [
        { url: 'https://linkedin.com/in/janedoe', platform: 'LinkedIn' },
        { url: 'https://github.com/janedoe', platform: 'GitHub' }
      ],
      allTechnologies: ['React', 'TypeScript', 'Node.js', 'Prisma', 'PostgreSQL', 'Next.js', 'Tailwind', 'MongoDB', 'Java', 'Spring Boot', 'Docker'],
      hasContactInfo: true
    };
  }
}
