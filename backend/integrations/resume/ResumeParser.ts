import { ResumeContactInfo, ResumeWorkExperience, ResumeEducation, ResumeSkills, ResumeProject, ResumeCertification } from '../../../types';

export interface ParsedResumeResult {
  contactInfo: ResumeContactInfo;
  workExperience: ResumeWorkExperience[];
  education: ResumeEducation[];
  skills: ResumeSkills;
  projects: ResumeProject[];
  certifications: ResumeCertification[];
  metrics: {
    wordCount: number;
    actionVerbCount: number;
    metricBulletCount: number;
    totalBulletCount: number;
    sectionScores: {
      contact: number;
      experience: number;
      education: number;
      skills: number;
      projects: number;
    };
  };
}

const ACTION_VERBS = new Set([
  'built', 'developed', 'architected', 'designed', 'implemented', 'engineered', 'led',
  'managed', 'created', 'launched', 'optimized', 'scaled', 'accelerated', 'reduced',
  'increased', 'improved', 'spearheaded', 'automated', 'refactored', 'migrated',
  'deployed', 'orchestrated', 'authored', 'established', 'integrated', 'revamped',
  'mentored', 'transformed', 'delivered', 'achieved', 'expanded', 'boosted', 'drove'
]);

const TECHNICAL_SKILL_KEYWORDS = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Express', 'Python', 'Java', 'C++',
  'Go', 'Rust', 'SQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes',
  'AWS', 'GCP', 'Azure', 'Git', 'GraphQL', 'REST API', 'Microservices', 'CI/CD',
  'Tailwind CSS', 'Next.js', 'System Design', 'Algorithms', 'Data Structures', 'Spring Boot'
];

export class ResumeParser {
  public static parseRawText(rawText: string): ParsedResumeResult {
    const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
    const textLower = rawText.toLowerCase();

    // 1. Contact Details Extraction
    const contactInfo = this.extractContactInfo(rawText, lines);

    // 2. Section Chunking
    const sections = this.chunkSections(lines);

    // 3. Extract Specific Sections
    const workExperience = this.extractWorkExperience(sections['work experience'] || sections['professional experience'] || sections['experience'] || sections['work'] || sections['employment'] || []);
    const education = this.extractEducation(sections['education'] || sections['academics'] || []);
    const skills = this.extractSkills(sections['skills'] || sections['technical skills'] || [], rawText);
    const projects = this.extractProjects(sections['projects'] || sections['personal projects'] || []);
    const certifications = this.extractCertifications(sections['certifications'] || sections['certificates'] || []);

    // 4. Metric Calculations
    const words = rawText.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    let actionVerbCount = 0;
    let metricBulletCount = 0;
    let totalBulletCount = 0;

    lines.forEach((line) => {
      const lineClean = line.replace(/^[•\-\*\d\.\s]+/, '').trim();
      if (lineClean.length > 10) {
        totalBulletCount++;
        const firstWord = lineClean.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '');
        if (firstWord && ACTION_VERBS.has(firstWord)) {
          actionVerbCount++;
        }
        if (/\d+([%kKmMbB]?|\s*(percent|ms|sec|x|X|users|requests|qps|ms))/i.test(lineClean)) {
          metricBulletCount++;
        }
      }
    });

    const contactScore = (contactInfo.email ? 25 : 0) + (contactInfo.phone ? 25 : 0) + (contactInfo.linkedin || contactInfo.github ? 25 : 0) + (contactInfo.name ? 25 : 0);
    const expScore = workExperience.length > 0 ? 100 : 0;
    const eduScore = education.length > 0 ? 100 : 0;
    const skillScore = (skills.technical.length > 3 ? 100 : skills.technical.length * 25);
    const projScore = projects.length > 0 ? 100 : 0;

    return {
      contactInfo,
      workExperience,
      education,
      skills,
      projects,
      certifications,
      metrics: {
        wordCount,
        actionVerbCount,
        metricBulletCount,
        totalBulletCount,
        sectionScores: {
          contact: contactScore,
          experience: expScore,
          education: eduScore,
          skills: skillScore,
          projects: projScore
        }
      }
    };
  }

  private static extractContactInfo(rawText: string, lines: string[]): ResumeContactInfo {
    const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = rawText.match(/(\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
    const linkedinMatch = rawText.match(/(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
    const githubMatch = rawText.match(/(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]+/i);
    const websiteMatch = rawText.match(/(https?:\/\/)?(www\.)?[a-zA-Z0-9_-]+\.(io|dev|com|net|org|app)(\/[a-zA-Z0-9_-]*)?/i);

    // Name heuristic: usually top 1-2 lines non-email, non-phone
    let name = '';
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const line = lines[i];
      if (!line.includes('@') && !line.includes('http') && !line.match(/\d{5,}/)) {
        if (line.length < 40) {
          name = line.replace(/[^a-zA-Z\s.-]/g, '').trim();
          break;
        }
      }
    }

    return {
      name: name || undefined,
      email: emailMatch ? emailMatch[0] : undefined,
      phone: phoneMatch ? phoneMatch[0] : undefined,
      linkedin: linkedinMatch ? (linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : `https://${linkedinMatch[0]}`) : undefined,
      github: githubMatch ? (githubMatch[0].startsWith('http') ? githubMatch[0] : `https://${githubMatch[0]}`) : undefined,
      website: websiteMatch ? (websiteMatch[0].startsWith('http') ? websiteMatch[0] : `https://${websiteMatch[0]}`) : undefined
    };
  }

  private static chunkSections(lines: string[]): Record<string, string[]> {
    const sections: Record<string, string[]> = {};
    let currentSection = 'header';
    sections[currentSection] = [];

    const sectionHeaderRegex = /^(experience|work experience|employment|education|skills|technical skills|projects|personal projects|certifications|certificates|summary|about me)$/i;

    lines.forEach((line) => {
      const cleanLine = line.replace(/[^a-zA-Z\s]/g, '').trim().toLowerCase();
      if (sectionHeaderRegex.test(cleanLine)) {
        currentSection = cleanLine;
        if (!sections[currentSection]) {
          sections[currentSection] = [];
        }
      } else {
        if (!sections[currentSection]) {
          sections[currentSection] = [];
        }
        sections[currentSection].push(line);
      }
    });

    return sections;
  }

  private static extractWorkExperience(lines: string[]): ResumeWorkExperience[] {
    if (lines.length === 0) return [];
    const expList: ResumeWorkExperience[] = [];
    let currentExp: Partial<ResumeWorkExperience> | null = null;

    lines.forEach((line) => {
      const isHeader = /^([A-Z0-9\s,&.-]{3,40})\s*[-–|]\s*([A-Z0-9\s,&.-]{3,40})/i.test(line) ||
                       /\b(20\d{2}|19\d{2}|present|current)\b/i.test(line);

      if (isHeader && (!currentExp || (currentExp.highlights && currentExp.highlights.length > 0))) {
        if (currentExp && currentExp.company) {
          expList.push({
            company: currentExp.company || 'Company',
            title: currentExp.title || 'Role',
            dateRange: currentExp.dateRange || '',
            highlights: currentExp.highlights || []
          });
        }
        const parts = line.split(/[-–|]/).map((p) => p.trim());
        currentExp = {
          company: parts[0] || 'Software Engineer',
          title: parts[1] || 'Developer',
          dateRange: line.match(/\b(20\d{2}|19\d{2}|present|current|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec).*/i)?.[0] || '2022 - Present',
          highlights: []
        };
      } else if (currentExp) {
        const bulletText = line.replace(/^[•\-\*\d\.\s]+/, '').trim();
        if (bulletText.length > 5) {
          if (!currentExp.highlights) currentExp.highlights = [];
          currentExp.highlights.push(bulletText);
        }
      } else {
        currentExp = {
          company: 'Software Company',
          title: line,
          dateRange: 'Recent',
          highlights: []
        };
      }
    });

    if (currentExp && currentExp.company) {
      expList.push({
        company: currentExp.company || 'Company',
        title: currentExp.title || 'Software Engineer',
        dateRange: currentExp.dateRange || 'Recent',
        highlights: currentExp.highlights || []
      });
    }

    return expList;
  }

  private static extractEducation(lines: string[]): ResumeEducation[] {
    if (lines.length === 0) return [];
    const eduList: ResumeEducation[] = [];
    let currentEdu: Partial<ResumeEducation> | null = null;

    lines.forEach((line) => {
      if (/\b(university|college|institute|bachelor|master|phd|bs|ms|b\.s|m\.s|degree)\b/i.test(line)) {
        if (currentEdu) {
          eduList.push({
            institution: currentEdu.institution || 'University',
            degree: currentEdu.degree || 'Bachelor of Science',
            field: currentEdu.field,
            gradYear: currentEdu.gradYear
          });
        }
        currentEdu = {
          institution: line,
          degree: line.includes('Master') ? 'Master of Science' : 'Bachelor of Science',
          gradYear: line.match(/\b(20\d{2}|19\d{2})\b/)?.[0]
        };
      } else if (currentEdu) {
        if (/\b(gpa|cgpa)\b/i.test(line)) {
          currentEdu.gpa = line.match(/\b[0-4]\.\d{1,2}\b/)?.[0] || line;
        } else if (!currentEdu.field) {
          currentEdu.field = line;
        }
      }
    });

    if (currentEdu) {
      eduList.push({
        institution: currentEdu.institution || 'University',
        degree: currentEdu.degree || 'Degree',
        field: currentEdu.field,
        gradYear: currentEdu.gradYear
      });
    }

    return eduList;
  }

  private static extractSkills(lines: string[], fullText: string): ResumeSkills {
    const techSkillsSet = new Set<string>();
    const softSkillsSet = new Set<string>();
    const toolsSet = new Set<string>();
    const languagesSet = new Set<string>();

    TECHNICAL_SKILL_KEYWORDS.forEach((kw) => {
      const regex = new RegExp(`\\b${kw.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}\\b`, 'i');
      if (regex.test(fullText)) {
        techSkillsSet.add(kw);
      }
    });

    // Check lines for comma separated skills
    lines.forEach((line) => {
      const parts = line.split(/[,:|•]/).map((p) => p.trim()).filter(Boolean);
      parts.forEach((p) => {
        if (p.length > 1 && p.length < 30) {
          if (/\b(english|spanish|hindi|french|german|mandarin)\b/i.test(p)) {
            languagesSet.add(p);
          } else if (/\b(leadership|communication|teamwork|problem solving|adaptability)\b/i.test(p)) {
            softSkillsSet.add(p);
          } else if (/\b(git|docker|vscode|jira|postman|figma|linux)\b/i.test(p)) {
            toolsSet.add(p);
          } else if (!/^(skills|technical|tools|languages)$/i.test(p)) {
            techSkillsSet.add(p);
          }
        }
      });
    });

    return {
      technical: Array.from(techSkillsSet),
      soft: Array.from(softSkillsSet),
      tools: Array.from(toolsSet),
      languages: Array.from(languagesSet)
    };
  }

  private static extractProjects(lines: string[]): ResumeProject[] {
    if (lines.length === 0) return [];
    const projects: ResumeProject[] = [];
    let current: Partial<ResumeProject> | null = null;

    lines.forEach((line) => {
      if (/^[A-Z0-9\s_-]{3,30}(\s*[-–|]\s*.*)?$/i.test(line) && !line.startsWith('•')) {
        if (current) {
          projects.push({
            title: current.title || 'Project',
            description: current.description || '',
            techStack: current.techStack || []
          });
        }
        const parts = line.split(/[-–|]/).map((p) => p.trim());
        current = {
          title: parts[0],
          description: parts[1] || '',
          techStack: []
        };
      } else if (current) {
        current.description += ' ' + line.replace(/^[•\-\*\d\.\s]+/, '').trim();
      }
    });

    if (current) {
      projects.push({
        title: current.title || 'Project',
        description: current.description || '',
        techStack: current.techStack || []
      });
    }

    return projects;
  }

  private static extractCertifications(lines: string[]): ResumeCertification[] {
    return lines.map((line) => ({
      name: line.replace(/^[•\-\*\d\.\s]+/, '').trim(),
      issuer: line.match(/\b(aws|google|meta|microsoft|coursera|udemy|oracle|cisco)\b/i)?.[0]
    })).filter((c) => c.name.length > 3);
  }
}
