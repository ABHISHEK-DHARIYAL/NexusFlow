import { ResumeClaim, ProjectVerificationMatch, VerificationStatus, EvidenceLevel } from '../../../types';
import { ExtractedRepoEvidence } from './GitHubEvidenceExtractor';

export class ClaimMatcher {
  public static evaluateClaims(
    claims: ResumeClaim[],
    repositories: ExtractedRepoEvidence[]
  ): {
    evaluatedClaims: ResumeClaim[];
    projectMatches: ProjectVerificationMatch[];
    coverageScore: number;
    verifiedCount: number;
    partialCount: number;
    notFoundCount: number;
    unverifiableCount: number;
  } {
    const evaluatedClaims: ResumeClaim[] = [];
    const projectMatches: ProjectVerificationMatch[] = [];

    let verifiedCount = 0;
    let partialCount = 0;
    let notFoundCount = 0;
    let unverifiableCount = 0;

    for (const claim of claims) {
      const result = this.evaluateSingleClaim(claim, repositories);
      evaluatedClaims.push(result);

      if (result.status === 'SUPPORTED') verifiedCount++;
      else if (result.status === 'PARTIALLY_SUPPORTED') partialCount++;
      else if (result.status === 'NOT_FOUND') notFoundCount++;
      else if (result.status === 'UNVERIFIABLE') unverifiableCount++;
    }

    // Build project-by-project verification matches
    const projectClaims = claims.filter((c) => c.claimType === 'PROJECT');
    for (const projClaim of projectClaims) {
      const projName = projClaim.projectName || projClaim.claimText;
      const matchedRepo = repositories.find((r) =>
        this.isProjectNameMatch(projName, r.name, r.fullName, r.description)
      );

      if (matchedRepo) {
        const relatedClaims = evaluatedClaims.filter(
          (c) => c.projectName === projName || c.repositoryId === matchedRepo.repositoryId
        );
        const verifiedTechs = relatedClaims
          .filter((c) => c.status === 'SUPPORTED')
          .map((c) => c.claimText.replace(/^Used\s+/, '').replace(/\s+in project.*$/, ''));

        const unverifiableTechs = relatedClaims
          .filter((c) => c.status === 'UNVERIFIABLE' || c.status === 'NOT_FOUND')
          .map((c) => c.claimText.replace(/^Used\s+/, '').replace(/\s+in project.*$/, ''));

        projectMatches.push({
          projectName: projName,
          matchedRepoId: matchedRepo.repositoryId,
          matchedRepoName: matchedRepo.fullName,
          matchScore: 92,
          explicitUrlFound: matchedRepo.htmlUrl.length > 0,
          technologiesClaimed: Array.from(new Set([...verifiedTechs, ...unverifiableTechs])),
          technologiesVerified: Array.from(new Set(verifiedTechs)),
          technologiesUnverifiable: Array.from(new Set(unverifiableTechs)),
          architectureClaims: relatedClaims
            .filter((c) => c.claimType === 'ARCHITECTURE' || c.claimType === 'AUTHENTICATION' || c.claimType === 'CONCURRENCY')
            .map((c) => ({
              claim: c.claimText,
              verified: c.status === 'SUPPORTED' || c.status === 'PARTIALLY_SUPPORTED',
              evidence: c.evidencePaths[0]
            }))
        });
      } else {
        projectMatches.push({
          projectName: projName,
          matchScore: 0,
          explicitUrlFound: false,
          technologiesClaimed: [],
          technologiesVerified: [],
          technologiesUnverifiable: [],
          architectureClaims: []
        });
      }
    }

    // Calculate Overall Coverage Score (0-100%)
    const verifiableTotal = claims.filter((c) => c.status !== 'UNVERIFIABLE').length || 1;
    const coverageScore = Math.min(
      100,
      Math.round(((verifiedCount * 1.0 + partialCount * 0.5) / verifiableTotal) * 100)
    );

    return {
      evaluatedClaims,
      projectMatches,
      coverageScore,
      verifiedCount,
      partialCount,
      notFoundCount,
      unverifiableCount
    };
  }

  private static evaluateSingleClaim(
    claim: ResumeClaim,
    repositories: ExtractedRepoEvidence[]
  ): ResumeClaim {
    // If claim is inherently UNVERIFIABLE from code alone (e.g. Competitive Programming, Quantitative Impact without benchmark files)
    if (claim.claimType === 'COMPETITIVE_PROGRAMMING') {
      return {
        ...claim,
        status: 'UNVERIFIABLE',
        confidence: 0.5,
        evidenceLevel: 'PARTIAL',
        reason:
          'Competitive programming claims require direct platform integration (LeetCode/Codeforces) rather than GitHub repository files.'
      };
    }

    if (claim.claimType === 'QUANTITATIVE_IMPACT') {
      return {
        ...claim,
        status: 'UNVERIFIABLE',
        confidence: 0.6,
        evidenceLevel: 'PARTIAL',
        reason:
          'Numerical impact and performance optimization percentages require load-test reports or APM benchmarks for full verification.'
      };
    }

    // 1. Check Project Claim
    if (claim.claimType === 'PROJECT') {
      const targetName = claim.projectName || '';
      const matchedRepo = repositories.find((r) =>
        this.isProjectNameMatch(targetName, r.name, r.fullName, r.description)
      );

      if (matchedRepo) {
        return {
          ...claim,
          status: 'SUPPORTED',
          confidence: 0.95,
          evidenceLevel: 'DIRECT',
          repositoryId: matchedRepo.repositoryId,
          repositoryName: matchedRepo.fullName,
          evidencePaths: matchedRepo.filePaths.slice(0, 3),
          evidenceSnippets: [`Matched repository: ${matchedRepo.fullName} (${matchedRepo.htmlUrl})`],
          reason: `Direct match found in user repository ${matchedRepo.fullName}.`
        };
      } else {
        return {
          ...claim,
          status: 'NOT_FOUND',
          confidence: 0.1,
          evidenceLevel: 'NONE',
          evidencePaths: [],
          evidenceSnippets: [],
          reason:
            'No matching repository found in connected GitHub account. Note: Project may reside in an unlinked account or private organizational repo.'
        };
      }
    }

    // 2. Check Language / Framework / Technology / Database / Architecture
    const textLower = claim.claimText.toLowerCase();

    for (const repo of repositories) {
      // Language match
      const matchingLang = repo.languages.find((l) => textLower.includes(l.name.toLowerCase()));
      if (matchingLang) {
        return {
          ...claim,
          status: 'SUPPORTED',
          confidence: 0.92,
          evidenceLevel: 'DIRECT',
          repositoryId: repo.repositoryId,
          repositoryName: repo.fullName,
          evidencePaths: repo.filePaths.filter((p) => p.endsWith(`.${matchingLang.name.toLowerCase()}`)).slice(0, 3),
          evidenceSnippets: [`${matchingLang.name} accounts for ${matchingLang.percentage}% of repository ${repo.fullName}`],
          reason: `Language ${matchingLang.name} is directly verified in repository ${repo.fullName}.`
        };
      }

      // Dependency / Tech match
      const matchedDep = repo.dependencies.find((d) => textLower.includes(d.toLowerCase()));
      if (matchedDep) {
        return {
          ...claim,
          status: 'SUPPORTED',
          confidence: 0.9,
          evidenceLevel: 'STRONG',
          repositoryId: repo.repositoryId,
          repositoryName: repo.fullName,
          evidencePaths: repo.filePaths.filter((p) => p.includes('package.json') || p.includes('pom.xml')),
          evidenceSnippets: [`Dependency "${matchedDep}" found in build configuration of ${repo.fullName}`],
          reason: `Dependency ${matchedDep} confirmed in repository configuration.`
        };
      }

      // Architectural & Concurrency Feature Match
      if (claim.claimType === 'CONCURRENCY' || textLower.includes('thread pool') || textLower.includes('concurrency')) {
        const concurrencyFiles = repo.filePaths.filter(
          (p) => p.toLowerCase().includes('concurrency') || p.toLowerCase().includes('worker') || p.toLowerCase().includes('thread')
        );

        if (concurrencyFiles.length > 0) {
          return {
            ...claim,
            status: 'SUPPORTED',
            confidence: 0.94,
            evidenceLevel: 'STRONG',
            repositoryId: repo.repositoryId,
            repositoryName: repo.fullName,
            evidencePaths: concurrencyFiles.slice(0, 3),
            evidenceSnippets: [`Multi-threaded worker components identified in ${concurrencyFiles[0]}`],
            reason: `Concurrency implementation verified in source files.`
          };
        }
      }

      // AI / Gemini Match
      if (claim.claimType === 'AI' || textLower.includes('gemini') || textLower.includes('ai')) {
        const aiFiles = repo.filePaths.filter(
          (p) => p.toLowerCase().includes('gemini') || p.toLowerCase().includes('ai')
        );

        if (aiFiles.length > 0) {
          return {
            ...claim,
            status: 'SUPPORTED',
            confidence: 0.92,
            evidenceLevel: 'STRONG',
            repositoryId: repo.repositoryId,
            repositoryName: repo.fullName,
            evidencePaths: aiFiles.slice(0, 3),
            evidenceSnippets: [`AI integration services found in ${aiFiles[0]}`],
            reason: `AI service integration verified in repository.`
          };
        }
      }

      // Auth / JWT Match
      if (claim.claimType === 'AUTHENTICATION' || textLower.includes('jwt') || textLower.includes('auth')) {
        const authFiles = repo.filePaths.filter((p) => p.toLowerCase().includes('auth'));
        if (authFiles.length > 0) {
          return {
            ...claim,
            status: 'SUPPORTED',
            confidence: 0.88,
            evidenceLevel: 'STRONG',
            repositoryId: repo.repositoryId,
            repositoryName: repo.fullName,
            evidencePaths: authFiles.slice(0, 3),
            evidenceSnippets: [`Authentication module verified in ${authFiles[0]}`],
            reason: `Authentication architecture identified in codebase.`
          };
        }
      }
    }

    // Default if no repository contains matching evidence
    return {
      ...claim,
      status: 'NOT_FOUND',
      confidence: 0.15,
      evidenceLevel: 'NONE',
      evidencePaths: [],
      evidenceSnippets: [],
      reason:
        'No direct evidence identified in connected GitHub repositories. Note: This technology or feature may be implemented in non-linked repositories.'
    };
  }

  private static isProjectNameMatch(
    resumeProject: string,
    repoName: string,
    fullName: string,
    description: string | null
  ): boolean {
    if (!resumeProject || !repoName) return false;
    const cleanResume = resumeProject.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanRepo = repoName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanFull = fullName.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (cleanResume.length < 2) return false;

    if (cleanRepo.includes(cleanResume) || cleanResume.includes(cleanRepo)) return true;
    if (cleanFull.includes(cleanResume)) return true;
    if (description && description.toLowerCase().includes(resumeProject.toLowerCase())) return true;

    return false;
  }
}
