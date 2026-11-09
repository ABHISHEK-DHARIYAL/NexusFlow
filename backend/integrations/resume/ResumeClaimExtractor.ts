import { ClaimType, ResumeClaim } from '../../../types';

export class ResumeClaimExtractor {
  public static extractClaims(resume: {
    contactInfo?: any;
    workExperience?: any[];
    education?: any[];
    skills?: any;
    projects?: any[];
  }): ResumeClaim[] {
    const claims: ResumeClaim[] = [];
    let claimCounter = 1;

    const makeId = (prefix: string) => `${prefix}_${claimCounter++}`;

    // 1. Extract Project Claims
    if (Array.isArray(resume.projects)) {
      for (const proj of resume.projects) {
        if (!proj.title) continue;

        // Overall Project Claim
        claims.push({
          claimId: makeId('claim_proj'),
          claimType: 'PROJECT',
          claimText: `Project: ${proj.title} - ${proj.description || ''}`,
          sourceSection: 'Projects',
          projectName: proj.title,
          status: 'NOT_FOUND',
          confidence: 0,
          evidenceLevel: 'NONE',
          evidencePaths: [],
          evidenceSnippets: [],
          reason: 'Awaiting GitHub evidence extraction.'
        });

        // Project Technologies
        if (Array.isArray(proj.techStack)) {
          for (const tech of proj.techStack) {
            claims.push({
              claimId: makeId('claim_tech'),
              claimType: this.categorizeTechnologyType(tech),
              claimText: `Used ${tech} in project ${proj.title}`,
              sourceSection: 'Projects',
              projectName: proj.title,
              status: 'NOT_FOUND',
              confidence: 0,
              evidenceLevel: 'NONE',
              evidencePaths: [],
              evidenceSnippets: [],
              reason: 'Awaiting GitHub evidence extraction.'
            });
          }
        }
      }
    }

    // 2. Extract Skills Claims
    if (resume.skills) {
      const techSkills = Array.isArray(resume.skills.technical)
        ? resume.skills.technical
        : [];
      const languages = Array.isArray(resume.skills.languages)
        ? resume.skills.languages
        : [];
      const tools = Array.isArray(resume.skills.tools) ? resume.skills.tools : [];

      const allSkills = Array.from(
        new Set([...techSkills, ...languages, ...tools])
      );

      for (const skill of allSkills) {
        if (!skill || skill.length < 2) continue;
        claims.push({
          claimId: makeId('claim_skill'),
          claimType: this.categorizeTechnologyType(skill),
          claimText: `Proficiency in ${skill}`,
          sourceSection: 'Skills',
          status: 'NOT_FOUND',
          confidence: 0,
          evidenceLevel: 'NONE',
          evidencePaths: [],
          evidenceSnippets: [],
          reason: 'Awaiting GitHub evidence extraction.'
        });
      }
    }

    // 3. Extract Work Experience Claims
    if (Array.isArray(resume.workExperience)) {
      for (const exp of resume.workExperience) {
        if (Array.isArray(exp.highlights)) {
          for (const highlight of exp.highlights) {
            // Check for quantitative metrics
            if (this.isQuantitativeClaim(highlight)) {
              claims.push({
                claimId: makeId('claim_quant'),
                claimType: 'QUANTITATIVE_IMPACT',
                claimText: highlight,
                sourceSection: 'Work Experience',
                projectName: exp.company,
                status: 'UNVERIFIABLE',
                confidence: 0.5,
                evidenceLevel: 'PARTIAL',
                evidencePaths: [],
                evidenceSnippets: [],
                reason:
                  'Quantitative impact metrics cannot be verified from source code alone without telemetry/benchmarks.'
              });
            }

            // Check for concurrency / thread pool claims
            if (
              /thread pool|reentrantlock|condition|blockingqueue|concurrency|multithread/i.test(
                highlight
              )
            ) {
              claims.push({
                claimId: makeId('claim_conc'),
                claimType: 'CONCURRENCY',
                claimText: highlight,
                sourceSection: 'Work Experience',
                projectName: exp.company,
                status: 'NOT_FOUND',
                confidence: 0,
                evidenceLevel: 'NONE',
                evidencePaths: [],
                evidenceSnippets: [],
                reason: 'Awaiting GitHub evidence extraction.'
              });
            }

            // Check for AI / Gemini claims
            if (/gemini|openai|llm|ai engine|gpt/i.test(highlight)) {
              claims.push({
                claimId: makeId('claim_ai'),
                claimType: 'AI',
                claimText: highlight,
                sourceSection: 'Work Experience',
                projectName: exp.company,
                status: 'NOT_FOUND',
                confidence: 0,
                evidenceLevel: 'NONE',
                evidencePaths: [],
                evidenceSnippets: [],
                reason: 'Awaiting GitHub evidence extraction.'
              });
            }

            // Check for REST API / Auth / Architecture claims
            if (/jwt|oauth|auth|rbac/i.test(highlight)) {
              claims.push({
                claimId: makeId('claim_auth'),
                claimType: 'AUTHENTICATION',
                claimText: highlight,
                sourceSection: 'Work Experience',
                projectName: exp.company,
                status: 'NOT_FOUND',
                confidence: 0,
                evidenceLevel: 'NONE',
                evidencePaths: [],
                evidenceSnippets: [],
                reason: 'Awaiting GitHub evidence extraction.'
              });
            }
          }
        }
      }
    }

    return claims;
  }

  private static categorizeTechnologyType(tech: string): ClaimType {
    const lower = tech.toLowerCase();
    if (
      ['javascript', 'typescript', 'java', 'python', 'go', 'c++', 'c#', 'rust', 'sql', 'html', 'css'].includes(
        lower
      )
    ) {
      return 'PROGRAMMING_LANGUAGE';
    }
    if (
      ['react', 'express', 'node.js', 'next.js', 'vue', 'angular', 'spring', 'django', 'fastapi'].includes(
        lower
      )
    ) {
      return 'FRAMEWORK';
    }
    if (
      ['postgresql', 'mysql', 'mongodb', 'redis', 'sqlite', 'oracle', 'cassandra', 'dynamodb'].includes(
        lower
      )
    ) {
      return 'DATABASE';
    }
    return 'TECHNOLOGY';
  }

  private static isQuantitativeClaim(text: string): boolean {
    return /\b\d+(?:%|k|m|x|\+|\s*ms|\s*sec|\s*connections|\s*users|\s*events|\$)?\b/i.test(
      text
    ) && (text.includes('%') || text.includes('$') || /reduced|increased|improved|processed|supporting|cut|slashed/i.test(text));
  }
}
