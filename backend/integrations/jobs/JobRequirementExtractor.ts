import { ExtractedJobRequirements, JobRequirementItem, SkillCategory } from '../../../types';

export const SKILL_ALIASES: Record<string, string> = {
  'node': 'Node.js',
  'nodejs': 'Node.js',
  'node.js': 'Node.js',
  'js': 'JavaScript',
  'javascript': 'JavaScript',
  'ts': 'TypeScript',
  'typescript': 'TypeScript',
  'postgres': 'PostgreSQL',
  'postgresql': 'PostgreSQL',
  'mongo': 'MongoDB',
  'mongodb': 'MongoDB',
  'react': 'React',
  'reactjs': 'React',
  'react.js': 'React',
  'vue': 'Vue.js',
  'vuejs': 'Vue.js',
  'vue.js': 'Vue.js',
  'k8s': 'Kubernetes',
  'kubernetes': 'Kubernetes',
  'aws': 'AWS',
  'amazon web services': 'AWS',
  'gcp': 'GCP',
  'google cloud': 'GCP',
  'google cloud platform': 'GCP',
  'azure': 'Azure',
  'py': 'Python',
  'python': 'Python',
  'java': 'Java',
  'cpp': 'C++',
  'c++': 'C++',
  'c#': 'C#',
  'csharp': 'C#',
  'go': 'Go',
  'golang': 'Go',
  'rust': 'Rust',
  'spring': 'Spring Boot',
  'springboot': 'Spring Boot',
  'spring boot': 'Spring Boot',
  'express': 'Express.js',
  'expressjs': 'Express.js',
  'express.js': 'Express.js',
  'docker': 'Docker',
  'redis': 'Redis',
  'kafka': 'Kafka',
  'graphql': 'GraphQL',
  'rest': 'REST APIs',
  'rest api': 'REST APIs',
  'restful': 'REST APIs',
  'rest apis': 'REST APIs',
  'mysql': 'MySQL',
  'sqlite': 'SQLite',
  'prisma': 'Prisma',
  'dsa': 'Data Structures & Algorithms',
  'data structures': 'Data Structures & Algorithms',
  'algorithms': 'Data Structures & Algorithms',
  'system design': 'System Design',
  'ci/cd': 'CI/CD',
  'github actions': 'GitHub Actions',
  'terraform': 'Terraform',
  'git': 'Git',
  'junit': 'JUnit',
  'jest': 'Jest',
  'vitest': 'Vitest',
  'testing': 'Testing',
};

const CATEGORY_MAP: Record<string, SkillCategory> = {
  'Java': 'Programming Languages',
  'JavaScript': 'Programming Languages',
  'TypeScript': 'Programming Languages',
  'Python': 'Programming Languages',
  'C++': 'Programming Languages',
  'C#': 'Programming Languages',
  'Go': 'Programming Languages',
  'Rust': 'Programming Languages',
  'React': 'Frameworks',
  'Vue.js': 'Frameworks',
  'Spring Boot': 'Frameworks',
  'Express.js': 'Frameworks',
  'MySQL': 'Databases',
  'PostgreSQL': 'Databases',
  'MongoDB': 'Databases',
  'Redis': 'Databases',
  'SQLite': 'Databases',
  'AWS': 'Cloud',
  'GCP': 'Cloud',
  'Azure': 'Cloud',
  'Docker': 'DevOps',
  'Kubernetes': 'DevOps',
  'CI/CD': 'DevOps',
  'GitHub Actions': 'DevOps',
  'Terraform': 'DevOps',
  'Jest': 'Testing',
  'Vitest': 'Testing',
  'JUnit': 'Testing',
  'REST APIs': 'Architecture',
  'GraphQL': 'Architecture',
  'System Design': 'System Design',
  'Data Structures & Algorithms': 'Data Structures & Algorithms',
  'Git': 'Tools',
};

const IGNORED_WORDS = new Set([
  'team', 'player', 'fast', 'paced', 'dynamic', 'environment', 'self', 'starter',
  'motivated', 'passionate', 'work', 'hard', 'play', 'experience', 'ability', 'strong',
  'excellent', 'good', 'years', 'degree', 'computer', 'science', 'job', 'role'
]);

export class JobRequirementExtractor {
  public static normalizeSkill(raw: string): string {
    const cleaned = raw.trim().toLowerCase();
    if (SKILL_ALIASES[cleaned]) {
      return SKILL_ALIASES[cleaned];
    }
    // Capitalize first letter of each word if not in aliases
    return raw.trim().replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  }

  public static categorizeSkill(skillName: string): SkillCategory {
    const norm = this.normalizeSkill(skillName);
    return CATEGORY_MAP[norm] || 'Other';
  }

  public static extractRequirements(rawDescription: string): ExtractedJobRequirements {
    const lines = rawDescription.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    
    const requiredSkills: JobRequirementItem[] = [];
    const preferredSkills: JobRequirementItem[] = [];
    const programmingLanguages: string[] = [];
    const frameworks: string[] = [];
    const databases: string[] = [];
    const cloudAndDevops: string[] = [];
    const responsibilities: string[] = [];
    const educationRequirements: string[] = [];
    const experienceRequirements: string[] = [];
    const keywordsSet = new Set<string>();

    let currentSection: 'REQUIRED' | 'PREFERRED' | 'GENERAL' = 'GENERAL';
    let experienceYears: number | undefined = undefined;
    let cpExpectations: string | undefined = undefined;

    // Scan for experience years regex
    const expRegex = /(\d+)\+?\s*(?:-\s*\d+\s*)?years?/i;
    const expMatch = rawDescription.match(expRegex);
    if (expMatch) {
      experienceYears = parseInt(expMatch[1], 10);
    }

    // Check CP / DSA expectations
    if (/competitive programming|leetcode|codeforces|dsa|data structures|algorithms/i.test(rawDescription)) {
      cpExpectations = 'Job emphasizes Data Structures, Algorithms, or Problem Solving performance.';
    }

    for (const line of lines) {
      const lower = line.toLowerCase();

      // Section header detection
      if (/must have|requirements|required|qualifications|what you need/i.test(lower) && !/nice to have|preferred/i.test(lower)) {
        currentSection = 'REQUIRED';
        continue;
      } else if (/nice to have|preferred|bonus|plus|desired/i.test(lower)) {
        currentSection = 'PREFERRED';
        continue;
      }

      // Check bullet/line responsibilities
      if (/^(?:•|\*|-|•)\s*(?:build|design|develop|deploy|maintain|implement|write|collaborate|lead|manage|optimize|create)/i.test(line) ||
          /^(?:build|design|develop|deploy|maintain|implement|write|collaborate)/i.test(line)) {
        responsibilities.push(line.replace(/^(?:•|\*|-|\d+\.)\s*/, ''));
      }

      // Check Education
      if (/degree|bachelor|master|phd|computer science|software engineering|bs|ms/i.test(lower)) {
        educationRequirements.push(line.replace(/^(?:•|\*|-|\d+\.)\s*/, ''));
      }

      // Check Experience
      if (/years|experience|internship|senior|junior|lead/i.test(lower) && !educationRequirements.includes(line)) {
        experienceRequirements.push(line.replace(/^(?:•|\*|-|\d+\.)\s*/, ''));
      }

      // Scan for known technical skills in the line
      for (const [aliasKey, normalizedName] of Object.entries(SKILL_ALIASES)) {
        const regex = new RegExp(`\\b${aliasKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(line)) {
          keywordsSet.add(normalizedName);
          const category = this.categorizeSkill(normalizedName);

          if (category === 'Programming Languages' && !programmingLanguages.includes(normalizedName)) {
            programmingLanguages.push(normalizedName);
          } else if (category === 'Frameworks' && !frameworks.includes(normalizedName)) {
            frameworks.push(normalizedName);
          } else if (category === 'Databases' && !databases.includes(normalizedName)) {
            databases.push(normalizedName);
          } else if ((category === 'Cloud' || category === 'DevOps') && !cloudAndDevops.includes(normalizedName)) {
            cloudAndDevops.push(normalizedName);
          }

          const isReq = currentSection !== 'PREFERRED';
          const targetList = isReq ? requiredSkills : preferredSkills;

          if (!targetList.some((s) => s.name === normalizedName)) {
            targetList.push({
              name: normalizedName,
              category,
              isRequired: isReq,
              importance: isReq ? 'CRITICAL' : 'NICE_TO_HAVE',
              extractedFrom: line.slice(0, 100),
            });
          }
        }
      }
    }

    // Fallback: If no required skills extracted explicitly, move first few skills to required
    if (requiredSkills.length === 0 && preferredSkills.length > 0) {
      requiredSkills.push(...preferredSkills);
      preferredSkills.length = 0;
    }

    return {
      requiredSkills,
      preferredSkills,
      programmingLanguages,
      frameworks,
      databases,
      cloudAndDevops,
      responsibilities: responsibilities.slice(0, 10),
      educationRequirements: educationRequirements.slice(0, 5),
      experienceYears,
      experienceRequirements: experienceRequirements.slice(0, 5),
      keywords: Array.from(keywordsSet),
      cpExpectations,
    };
  }
}
