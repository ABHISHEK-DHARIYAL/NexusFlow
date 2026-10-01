import { NormalizedEvidenceSet } from './EvidenceNormalizer';
import { DiscrepancyDetector } from './DiscrepancyDetector';
import {
  CrossPlatformClaimResult,
  CrossPlatformDiscrepancy,
  ProjectCrossVerification,
  CompetitiveProgrammingVerification,
  TechnologyMatrixItem,
  VerificationStatus,
  EvidenceLevel,
  CrossPlatformClaimCategory,
  CrossPlatformPlatform,
  ResumeClaim,
} from '../../../types';

export class CrossPlatformMatcher {
  public static evaluateCrossPlatform(evidenceSet: NormalizedEvidenceSet) {
    const claims: CrossPlatformClaimResult[] = [];
    const discrepancies: CrossPlatformDiscrepancy[] = [];
    const cpVerifications: CompetitiveProgrammingVerification[] = [];

    const {
      resume,
      resumeClaims,
      githubEvidence,
      leetcodeProfile,
      codeforcesProfile,
      portfolio,
      sourcesUsed,
      normalizedMetrics,
    } = evidenceSet;

    // Helper: Normalize project/tech strings
    const normalizeName = (str: string) =>
      str.toLowerCase().replace(/[-_ ]/g, '').trim();

    // -------------------------------------------------------------
    // 1. COMPETITIVE PROGRAMMING CLAIMS VERIFICATION (LeetCode & Codeforces)
    // -------------------------------------------------------------
    for (const claim of resumeClaims) {
      const claimTextLower = claim.claimText.toLowerCase();

      // Check if claim is related to LeetCode
      if (claimTextLower.includes('leetcode')) {
        if (!leetcodeProfile) {
          claims.push({
            claimId: claim.claimId,
            category: 'PROBLEMS_SOLVED',
            claimText: claim.claimText,
            status: 'NOT_FOUND',
            primarySource: 'RESUME',
            evidence: [],
            reason: 'LeetCode account is not connected to NexusFlow.',
            confidence: 0.5,
          });
          continue;
        }

        // Check if solved problem count claim
        const countMatch = claim.claimText.match(/(\d+)\+?\s*(?:leetcode|problems|solved)/i) ||
          claim.claimText.match(/(?:leetcode|problems|solved)\s*(\d+)\+?/i);

        if (countMatch) {
          const claimedCount = parseInt(countMatch[1], 10);
          const actualCount = leetcodeProfile.totalSolved || 0;

          if (actualCount >= claimedCount) {
            claims.push({
              claimId: claim.claimId,
              category: 'PROBLEMS_SOLVED',
              claimText: claim.claimText,
              status: 'SUPPORTED',
              primarySource: 'RESUME',
              evidence: [
                {
                  source: 'LEETCODE',
                  metric: 'PROBLEMS_SOLVED',
                  value: actualCount,
                  details: `Easy: ${leetcodeProfile.easySolved}, Medium: ${leetcodeProfile.mediumSolved}, Hard: ${leetcodeProfile.hardSolved}`,
                },
              ],
              reason: `Verified ${actualCount} solved problems on connected LeetCode account (meets or exceeds claimed ${claimedCount}+).`,
              confidence: 0.95,
            });
          } else {
            const disc = DiscrepancyDetector.createDiscrepancy({
              category: 'COUNT_MISMATCH',
              sourceA: 'RESUME',
              sourceB: 'LEETCODE',
              claim: claim.claimText,
              observedValueA: `${claimedCount}+`,
              observedValueB: actualCount,
              severity: claimedCount - actualCount > 50 ? 'MEDIUM' : 'LOW',
              explanation: `Resume states ${claimedCount}+ problems, while the connected LeetCode profile currently shows ${actualCount} solved.`,
              recommendedAction: `Update resume to reflect current solved problem count (${actualCount}) or sync latest LeetCode activity.`,
            });
            discrepancies.push(disc);

            claims.push({
              claimId: claim.claimId,
              category: 'PROBLEMS_SOLVED',
              claimText: claim.claimText,
              status: 'PARTIALLY_SUPPORTED',
              primarySource: 'RESUME',
              evidence: [
                {
                  source: 'LEETCODE',
                  metric: 'PROBLEMS_SOLVED',
                  value: actualCount,
                },
              ],
              severity: disc.severity,
              reason: disc.explanation,
              confidence: 0.85,
            });
          }

          cpVerifications.push({
            platform: 'LEETCODE',
            metric: 'Problems Solved',
            resumeValue: `${claimedCount}+`,
            actualValue: actualCount,
            status: actualCount >= claimedCount ? 'SUPPORTED' : 'PARTIALLY_SUPPORTED',
            lastUpdated: leetcodeProfile.lastSyncedAt
              ? new Date(leetcodeProfile.lastSyncedAt).toISOString()
              : new Date().toISOString(),
          });
          continue;
        }

        // Check if LeetCode contest rating claim
        const ratingMatch = claim.claimText.match(/(?:rating|contest rating)\s*(\d+)/i) ||
          claim.claimText.match(/(\d{4})\s*leetcode/i);

        if (ratingMatch) {
          const claimedRating = parseInt(ratingMatch[1], 10);
          const actualRating = Math.round(leetcodeProfile.contestRating || leetcodeProfile.maxRating || 0);

          if (actualRating >= claimedRating) {
            claims.push({
              claimId: claim.claimId,
              category: 'CONTEST_RATING',
              claimText: claim.claimText,
              status: 'SUPPORTED',
              primarySource: 'RESUME',
              evidence: [
                {
                  source: 'LEETCODE',
                  metric: 'CONTEST_RATING',
                  value: actualRating,
                },
              ],
              reason: `Verified rating of ${actualRating} on connected LeetCode account.`,
              confidence: 0.95,
            });
          } else {
            const disc = DiscrepancyDetector.createDiscrepancy({
              category: 'RATING_MISMATCH',
              sourceA: 'RESUME',
              sourceB: 'LEETCODE',
              claim: claim.claimText,
              observedValueA: claimedRating,
              observedValueB: actualRating,
              severity: Math.abs(claimedRating - actualRating) > 100 ? 'MEDIUM' : 'LOW',
              explanation: `Connected LeetCode profile currently shows a contest rating of ${actualRating}, compared to claimed ${claimedRating}.`,
              recommendedAction: 'Contest ratings fluctuate; consider citing peak rating in resume.',
            });
            discrepancies.push(disc);

            claims.push({
              claimId: claim.claimId,
              category: 'CONTEST_RATING',
              claimText: claim.claimText,
              status: 'PARTIALLY_SUPPORTED',
              primarySource: 'RESUME',
              evidence: [{ source: 'LEETCODE', metric: 'CONTEST_RATING', value: actualRating }],
              severity: disc.severity,
              reason: disc.explanation,
              confidence: 0.85,
            });
          }

          cpVerifications.push({
            platform: 'LEETCODE',
            metric: 'Contest Rating',
            resumeValue: claimedRating,
            actualValue: actualRating,
            status: actualRating >= claimedRating ? 'SUPPORTED' : 'PARTIALLY_SUPPORTED',
            lastUpdated: new Date().toISOString(),
          });
          continue;
        }

        // Default LeetCode topic or general claim
        claims.push({
          claimId: claim.claimId,
          category: 'COMPETITIVE_PROGRAMMING',
          claimText: claim.claimText,
          status: 'SUPPORTED',
          primarySource: 'RESUME',
          evidence: [{ source: 'LEETCODE', metric: 'PROFILE', value: leetcodeProfile.username }],
          reason: `Connected LeetCode account ${leetcodeProfile.username} verified.`,
          confidence: 0.9,
        });
        continue;
      }

      // Check if claim is related to Codeforces
      if (claimTextLower.includes('codeforces')) {
        if (!codeforcesProfile) {
          claims.push({
            claimId: claim.claimId,
            category: 'CONTEST_RATING',
            claimText: claim.claimText,
            status: 'NOT_FOUND',
            primarySource: 'RESUME',
            evidence: [],
            reason: 'Codeforces account is not connected to NexusFlow.',
            confidence: 0.5,
          });
          continue;
        }

        // Extract rating from text e.g. "Codeforces rating 1700" or "Codeforces 1600 (May 2026)"
        const ratingMatch = claim.claimText.match(/(\d{4})/);
        if (ratingMatch) {
          const claimedRating = parseInt(ratingMatch[1], 10);
          const actualRating = codeforcesProfile.rating || 0;
          const actualMaxRating = codeforcesProfile.maxRating || actualRating;

          // Date awareness: check if claim specifies a date
          const hasDateInClaim = claim.claimText.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4})/i);

          if (actualRating >= claimedRating || actualMaxRating >= claimedRating) {
            claims.push({
              claimId: claim.claimId,
              category: 'CONTEST_RATING',
              claimText: claim.claimText,
              status: 'SUPPORTED',
              primarySource: 'RESUME',
              evidence: [
                {
                  source: 'CODEFORCES',
                  metric: 'RATING',
                  value: `${actualRating} (Max: ${actualMaxRating})`,
                  details: `Rank: ${codeforcesProfile.rank || 'Specialist'}`,
                },
              ],
              reason: `Verified rating of ${actualRating} (Max ${actualMaxRating}) on connected Codeforces profile (${codeforcesProfile.handle}).`,
              confidence: 0.95,
            });
          } else {
            const disc = DiscrepancyDetector.createDiscrepancy({
              category: 'RATING_MISMATCH',
              sourceA: 'RESUME',
              sourceB: 'CODEFORCES',
              claim: claim.claimText,
              observedValueA: claimedRating,
              observedValueB: actualRating,
              severity: Math.abs(claimedRating - actualRating) > 100 ? 'MEDIUM' : 'LOW',
              explanation: `Connected Codeforces profile currently shows a rating of ${actualRating}.${
                hasDateInClaim ? ' Note: Rating may have changed since the date specified on resume.' : ''
              }`,
              recommendedAction: 'Update resume to reflect current rating or state peak max rating.',
            });
            discrepancies.push(disc);

            claims.push({
              claimId: claim.claimId,
              category: 'CONTEST_RATING',
              claimText: claim.claimText,
              status: 'PARTIALLY_SUPPORTED',
              primarySource: 'RESUME',
              evidence: [{ source: 'CODEFORCES', metric: 'RATING', value: actualRating }],
              severity: disc.severity,
              reason: disc.explanation,
              confidence: 0.85,
            });
          }

          cpVerifications.push({
            platform: 'CODEFORCES',
            metric: 'Rating',
            resumeValue: claimedRating,
            actualValue: actualRating,
            status: actualRating >= claimedRating || actualMaxRating >= claimedRating ? 'SUPPORTED' : 'PARTIALLY_SUPPORTED',
            lastUpdated: codeforcesProfile.lastSyncedAt
              ? new Date(codeforcesProfile.lastSyncedAt).toISOString()
              : new Date().toISOString(),
            notes: hasDateInClaim ? 'Date-aware check applied.' : undefined,
          });
          continue;
        }

        claims.push({
          claimId: claim.claimId,
          category: 'COMPETITIVE_PROGRAMMING',
          claimText: claim.claimText,
          status: 'SUPPORTED',
          primarySource: 'RESUME',
          evidence: [{ source: 'CODEFORCES', metric: 'HANDLE', value: codeforcesProfile.handle }],
          reason: `Verified Codeforces handle ${codeforcesProfile.handle}.`,
          confidence: 0.9,
        });
        continue;
      }

      // Check for Contest Ranking claims (e.g. "Top 5% in contest", "Ranked 1200")
      if (claimTextLower.includes('rank') || claimTextLower.includes('top ') || claimTextLower.includes('contest')) {
        claims.push({
          claimId: claim.claimId,
          category: 'CONTEST_COUNT',
          claimText: claim.claimText,
          status: 'UNVERIFIABLE',
          primarySource: 'RESUME',
          evidence: [],
          reason: 'Contest ranking claims require direct contest platform integration rather than general profile sync.',
          confidence: 0.6,
        });
        continue;
      }
    }

    // Default CP verifications if not evaluated from claims
    if (leetcodeProfile && !cpVerifications.some((v) => v.platform === 'LEETCODE')) {
      cpVerifications.push({
        platform: 'LEETCODE',
        metric: 'Problems Solved',
        actualValue: leetcodeProfile.totalSolved,
        status: 'SUPPORTED',
        lastUpdated: leetcodeProfile.lastSyncedAt
          ? new Date(leetcodeProfile.lastSyncedAt).toISOString()
          : new Date().toISOString(),
      });
    }

    if (codeforcesProfile && !cpVerifications.some((v) => v.platform === 'CODEFORCES')) {
      cpVerifications.push({
        platform: 'CODEFORCES',
        metric: 'Rating',
        actualValue: codeforcesProfile.rating,
        status: 'SUPPORTED',
        lastUpdated: codeforcesProfile.lastSyncedAt
          ? new Date(codeforcesProfile.lastSyncedAt).toISOString()
          : new Date().toISOString(),
      });
    }

    // -------------------------------------------------------------
    // 2. PROJECT CROSS-VERIFICATION (Resume ↔ GitHub ↔ Portfolio)
    // -------------------------------------------------------------
    const projectCrossVerifications: ProjectCrossVerification[] = [];
    const resumeProjects = (resume?.projects as any[]) || [];
    const portfolioProjects = (portfolio?.projects as any[]) || [];

    // Collect all distinct project candidates
    const projectMap = new Map<string, { resumeName?: string; githubRepo?: any; portfolioProject?: any }>();

    const findMatchingKey = (name: string): string | null => {
      const norm = normalizeName(name);
      if (projectMap.has(norm)) return norm;
      for (const existingKey of Array.from(projectMap.keys())) {
        if (existingKey.length >= 4 && norm.length >= 4 && (norm.includes(existingKey) || existingKey.includes(norm))) {
          return existingKey;
        }
      }
      return null;
    };

    for (const rp of resumeProjects) {
      const name = rp.title || rp.name;
      if (!name) continue;
      const existingKey = findMatchingKey(name);
      const key = existingKey || normalizeName(name);
      const existing = projectMap.get(key) || {};
      existing.resumeName = name;
      projectMap.set(key, existing);
    }

    for (const ghRepo of githubEvidence) {
      const existingKey = findMatchingKey(ghRepo.name);
      const key = existingKey || normalizeName(ghRepo.name);
      const existing = projectMap.get(key) || {};
      existing.githubRepo = ghRepo;
      projectMap.set(key, existing);
    }

    for (const pProj of portfolioProjects) {
      const name = pProj.title || pProj.name;
      if (!name) continue;
      const existingKey = findMatchingKey(name);
      const key = existingKey || normalizeName(name);
      const existing = projectMap.get(key) || {};
      existing.portfolioProject = pProj;
      projectMap.set(key, existing);
    }

    projectMap.forEach((data, key) => {
      const pName = data.resumeName || data.githubRepo?.name || data.portfolioProject?.title || key;
      const resumePresent = !!data.resumeName;
      const githubRepoName = data.githubRepo?.fullName || data.githubRepo?.name;
      const portfolioProjectName = data.portfolioProject?.title;

      let sourceCount = 0;
      if (resumePresent) sourceCount++;
      if (githubRepoName) sourceCount++;
      if (portfolioProjectName) sourceCount++;

      let matchScore = sourceCount === 3 ? 100 : sourceCount === 2 ? 85 : 50;
      let evidenceStrength: EvidenceLevel = sourceCount === 3 ? 'DIRECT' : sourceCount === 2 ? 'STRONG' : 'PARTIAL';

      // Tech list
      const techList: string[] = [];
      if (data.githubRepo?.primaryLanguage) techList.push(data.githubRepo.primaryLanguage);
      if (data.githubRepo?.dependencies) techList.push(...data.githubRepo.dependencies.slice(0, 4));
      if (data.portfolioProject?.techStack) techList.push(...data.portfolioProject.techStack);

      const uniqueTechs = Array.from(new Set(techList));
      const techConsistency = uniqueTechs.length > 0 ? Math.min(100, 70 + uniqueTechs.length * 5) : 80;

      projectCrossVerifications.push({
        projectName: pName,
        resumePresent,
        githubRepoName,
        portfolioProjectName,
        matchScore,
        technologyConsistency: techConsistency,
        evidenceStrength,
        technologies: uniqueTechs,
      });

      // Add as claim evaluation
      if (resumePresent) {
        const isSupported = !!githubRepoName || !!portfolioProjectName;
        claims.push({
          claimId: `proj_${key}`,
          category: 'PROJECT',
          claimText: `Project: ${pName}`,
          status: isSupported ? 'SUPPORTED' : 'PARTIALLY_SUPPORTED',
          primarySource: 'RESUME',
          evidence: [
            ...(githubRepoName ? [{ source: 'GITHUB' as CrossPlatformPlatform, metric: 'REPOSITORY', value: githubRepoName }] : []),
            ...(portfolioProjectName ? [{ source: 'PORTFOLIO' as CrossPlatformPlatform, metric: 'PROJECT', value: portfolioProjectName }] : []),
          ],
          reason: isSupported
            ? `Verified project across ${githubRepoName ? 'GitHub repo ' + githubRepoName : ''} ${portfolioProjectName ? 'and Portfolio' : ''}.`
            : 'Project listed on resume. Add repository or live demo link for full verification.',
          confidence: isSupported ? 0.9 : 0.6,
        });
      }
    });

    // -------------------------------------------------------------
    // 3. TECHNOLOGY MATRIX & CROSS-SOURCE SKILLS
    // -------------------------------------------------------------
    const technologyMatrix: TechnologyMatrixItem[] = [];
    const resumeSkills: string[] = [];

    if (resume?.skills?.technical) {
      resumeSkills.push(...resume.skills.technical);
    } else if (Array.isArray(resume?.skills)) {
      resumeSkills.push(...resume.skills);
    }

    const githubTechs = new Set<string>();
    for (const gh of githubEvidence) {
      if (gh.primaryLanguage) githubTechs.add(gh.primaryLanguage);
      if (gh.languages) gh.languages.forEach((l) => githubTechs.add(l.name));
      if (gh.dependencies) {
        gh.dependencies.forEach((dep) => {
          if (dep.includes('react')) githubTechs.add('React');
          if (dep.includes('express')) githubTechs.add('Express');
          if (dep.includes('prisma')) githubTechs.add('Prisma');
          if (dep.includes('redis')) githubTechs.add('Redis');
          if (dep.includes('postgres')) githubTechs.add('PostgreSQL');
          if (dep.includes('genai') || dep.includes('openai')) githubTechs.add('Gemini AI');
        });
      }
    }

    const portfolioTechs = new Set<string>();
    if (portfolio?.projects) {
      for (const p of portfolio.projects) {
        if (p.techStack) p.techStack.forEach((t: string) => portfolioTechs.add(t));
      }
    }

    const allTechNames = Array.from(new Set([...resumeSkills, ...Array.from(githubTechs), ...Array.from(portfolioTechs)]));

    for (const tech of allTechNames) {
      const techNorm = normalizeName(tech);
      const resumePresent = resumeSkills.some((s) => normalizeName(s) === techNorm);
      const githubPresent = Array.from(githubTechs).some((gt) => normalizeName(gt) === techNorm);
      const portfolioPresent = Array.from(portfolioTechs).some((pt) => normalizeName(pt) === techNorm);

      let count = (resumePresent ? 1 : 0) + (githubPresent ? 1 : 0) + (portfolioPresent ? 1 : 0);
      let status: VerificationStatus = count >= 2 ? 'SUPPORTED' : count === 1 && githubPresent ? 'SUPPORTED' : 'UNVERIFIABLE';

      technologyMatrix.push({
        technology: tech,
        resumePresent,
        githubPresent,
        portfolioPresent,
        status,
      });

      if (resumePresent) {
        claims.push({
          claimId: `tech_${techNorm}`,
          category: 'TECHNOLOGY',
          claimText: `Skill / Technology: ${tech}`,
          status,
          primarySource: 'RESUME',
          evidence: [
            ...(githubPresent ? [{ source: 'GITHUB' as CrossPlatformPlatform, metric: 'CODE_EVIDENCE', value: tech }] : []),
            ...(portfolioPresent ? [{ source: 'PORTFOLIO' as CrossPlatformPlatform, metric: 'PROJECT_TECH', value: tech }] : []),
          ],
          reason: status === 'SUPPORTED'
            ? `Verified ${tech} across multiple connected sources.`
            : `No code or portfolio evidence found for ${tech}. Connected sources provide stronger evidence for other stack items.`,
          confidence: status === 'SUPPORTED' ? 0.9 : 0.5,
        });
      }
    }

    // -------------------------------------------------------------
    // 4. CALCULATE OVERALL SCORES & SIGNALS
    // -------------------------------------------------------------
    const verifiedCount = claims.filter((c) => c.status === 'SUPPORTED').length;
    const partialCount = claims.filter((c) => c.status === 'PARTIALLY_SUPPORTED').length;
    const notFoundCount = claims.filter((c) => c.status === 'NOT_FOUND').length;
    const unverifiableCount = claims.filter((c) => c.status === 'UNVERIFIABLE').length;

    const totalClaims = claims.length || 1;
    const overallCoverageScore = Math.round(((verifiedCount + partialCount * 0.5) / totalClaims) * 100);

    const projectScores = projectCrossVerifications.map((p) => p.matchScore);
    const projectConsistencyScore = projectScores.length > 0
      ? Math.round(projectScores.reduce((a, b) => a + b, 0) / projectScores.length)
      : 85;

    const cpScores = cpVerifications.map((cp) => (cp.status === 'SUPPORTED' ? 100 : 75));
    const cpConsistencyScore = cpScores.length > 0
      ? Math.round(cpScores.reduce((a, b) => a + b, 0) / cpScores.length)
      : 80;

    const techSupported = technologyMatrix.filter((t) => t.status === 'SUPPORTED').length;
    const techTotal = technologyMatrix.length || 1;
    const technologyConsistencyScore = Math.round((techSupported / techTotal) * 100);

    const technicalConsistencyScore = Math.round(
      (projectConsistencyScore * 0.35 + cpConsistencyScore * 0.25 + technologyConsistencyScore * 0.4)
    );

    // Strong profile signals
    const strongProfileSignals: string[] = [];
    if (projectCrossVerifications.some((p) => p.matchScore >= 85)) {
      const topProj = projectCrossVerifications.find((p) => p.matchScore >= 85);
      strongProfileSignals.push(`Your project "${topProj?.projectName}" is verified across Resume, GitHub, and Portfolio.`);
    }
    if (cpVerifications.some((cp) => cp.status === 'SUPPORTED')) {
      strongProfileSignals.push('Competitive programming statistics are confirmed by connected LeetCode / Codeforces accounts.');
    }
    if (technologyConsistencyScore >= 70) {
      strongProfileSignals.push(`Core technology stack exhibits ${technologyConsistencyScore}% multi-source consistency.`);
    }

    // Missing evidence recommendations
    const missingEvidenceRecommendations: string[] = [];
    const missingTechs = technologyMatrix.filter((t) => t.resumePresent && !t.githubPresent && !t.portfolioPresent);
    if (missingTechs.length > 0) {
      missingEvidenceRecommendations.push(
        `Add public GitHub repositories or portfolio projects demonstrating usage of ${missingTechs.map((t) => t.technology).slice(0, 3).join(', ')}.`
      );
    }
    if (discrepancies.length > 0) {
      missingEvidenceRecommendations.push(
        'Align problem counts and contest ratings on your resume with current connected platform values.'
      );
    }

    return {
      claims,
      discrepancies,
      projectCrossVerifications,
      competitiveProgrammingVerifications: cpVerifications,
      technologyMatrix,
      strongProfileSignals,
      missingEvidenceRecommendations,
      verifiedCount,
      partialCount,
      notFoundCount,
      unverifiableCount,
      discrepancyCount: discrepancies.length,
      technicalConsistencyScore,
      projectConsistencyScore,
      cpConsistencyScore,
      technologyConsistencyScore,
      overallCoverageScore,
    };
  }
}
