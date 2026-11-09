// NexusFlow Shared TypeScript Definitions

export type UserRole = 'USER' | 'ADMIN';
export type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type RepositoryVisibility = 'PUBLIC' | 'PRIVATE';
export type SyncStatus = 'NOT_IMPORTED' | 'IMPORTING' | 'SYNCING' | 'SYNCED' | 'FAILED';
export type TaskType = 'REPO_ANALYSIS' | 'SECURITY_AUDIT' | 'CODE_QUALITY_CHECK' | 'ARCHITECTURE_REVIEW' | 'FULL_SCAN' | 'REPOSITORY_SYNC' | 'AI_ANALYSIS' | 'LEETCODE_SYNC' | 'LEETCODE_ANALYSIS' | 'CODEFORCES_SYNC' | 'CODEFORCES_ANALYSIS' | 'PORTFOLIO_CRAWL' | 'PORTFOLIO_ANALYSIS' | 'RESUME_PARSE' | 'RESUME_ANALYSIS' | 'RESUME_GITHUB_VERIFICATION' | 'CROSS_PLATFORM_VERIFICATION' | 'JOB_ANALYSIS' | 'JOB_READINESS_ANALYSIS' | 'COMPANY_PREPARATION';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TaskStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'RETRYING' | 'SCHEDULED';
export type WorkerStatus = 'IDLE' | 'BUSY' | 'STOPPING' | 'STOPPED' | 'UNHEALTHY';
export type FindingCategory = 'SECURITY' | 'PERFORMANCE' | 'ARCHITECTURE' | 'MAINTAINABILITY' | 'CODE_STYLE' | 'BUG_RISK' | 'DOCUMENTATION';
export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
export type LogLevel = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
export type NotificationType = 'TASK_COMPLETED' | 'TASK_FAILED' | 'SYSTEM_ALERT' | 'ANALYSIS_READY' | 'SECURITY_WARNING';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  avatarUrl: string;
  githubId: string;
  role: UserRole;
  status: AccountStatus;
  createdAt: string;
  lastLoginAt: string;
}

export interface GitHubAccount {
  id: string;
  userId: string;
  githubUserId: string;
  githubUsername: string;
  profileUrl: string;
  avatarUrl: string;
  updatedAt: string;
}

export interface Repository {
  id: string;
  userId: string;
  githubRepoId: number;
  owner: string;
  name: string;
  fullName: string;
  description: string;
  defaultBranch: string;
  visibility: RepositoryVisibility;
  syncStatus?: SyncStatus;
  language: string;
  starsCount: number;
  forksCount: number;
  openIssues: number;
  githubUrl: string;
  cloneUrl: string;
  lastSyncedAt: string;
  createdAt: string;
  healthScore?: number;
  lastAnalyzedAt?: string;
  latestReportId?: string;
}

export interface RepositoryBranch {
  id: string;
  repositoryId: string;
  name: string;
  isProtected: boolean;
  commitSha?: string;
  commitDate?: string;
}

export interface RepositoryCommit {
  id: string;
  repositoryId: string;
  sha: string;
  message: string;
  authorName?: string;
  authorEmail?: string;
  authorAvatarUrl?: string;
  commitDate: string;
  githubUrl?: string;
}

export interface RepositoryContributor {
  id: string;
  repositoryId: string;
  username: string;
  avatarUrl?: string;
  contributions: number;
  profileUrl?: string;
}

export interface RepositoryIssue {
  id: string;
  repositoryId: string;
  issueNumber: number;
  title: string;
  state: 'open' | 'closed' | string;
  authorUsername?: string;
  authorAvatarUrl?: string;
  labels?: string;
  githubUrl?: string;
  githubCreatedAt?: string;
  githubUpdatedAt?: string;
}

export interface RepositoryPullRequest {
  id: string;
  repositoryId: string;
  prNumber: number;
  title: string;
  state: 'open' | 'closed' | string;
  authorUsername?: string;
  authorAvatarUrl?: string;
  isMerged: boolean;
  githubUrl?: string;
  githubCreatedAt?: string;
  githubUpdatedAt?: string;
}

export interface RepositoryLanguage {
  id: string;
  repositoryId: string;
  name: string;
  bytes: number | string;
  percentage: number;
}

export interface GithubRepositoryItem {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  private: boolean;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  updated_at: string;
}

export interface RepositoryMetadata {
  id: string;
  repositoryId: string;
  license?: string;
  isFork: boolean;
  isArchived: boolean;
  topics: string[];
  defaultBranchSha?: string;
}

export interface RepositoryStatistics {
  id: string;
  repositoryId: string;
  linesOfCode: number;
  commitCount: number;
  branchCount: number;
  pullRequestCount: number;
  contributorCount: number;
  totalSizeBytes: number;
  healthScore: number;
  lastAnalyzedAt?: string;
}

export interface Task {
  id: string;
  repositoryId: string;
  repositoryName: string;
  userId: string;
  taskType: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  progress: number;
  retryCount: number;
  maxRetries: number;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  failureReason?: string;
  workerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Worker {
  id: string;
  workerId: string;
  hostIdentifier: string;
  status: WorkerStatus;
  currentTaskId?: string;
  currentTaskName?: string;
  activeThreads: number;
  maxThreads: number;
  startedAt: string;
  lastHeartbeat: string;
  tasksCompleted: number;
  tasksFailed: number;
  cpuUsagePercent?: number;
  memoryUsageMB?: number;
  memoryUsagePercent?: number;
}

export interface WorkerMetrics {
  id: string;
  workerId: string;
  cpuUsagePercent: number;
  memoryUsageMB: number;
  memoryUsagePercent: number;
  activeThreads: number;
  queueDepth: number;
  tasksCompleted: number;
  tasksFailed: number;
  avgExecutionTimeMs: number;
  throughputPerMin: number;
  timestamp: string;
}

export interface TaskExecutionLog {
  id: string;
  taskId: string;
  workerId?: string;
  level: LogLevel;
  message: string;
  timestamp: string;
}

export interface AIFinding {
  id: string;
  reportId: string;
  category: FindingCategory;
  severity: SeverityLevel;
  title: string;
  description: string;
  filePath?: string;
  lineNumber?: number;
  snippet?: string;
  recommendation?: string;
  createdAt: string;
}

export interface AIAnalysisReport {
  id: string;
  repositoryId: string;
  taskId: string;
  overallScore: number;
  securityScore: number;
  performanceScore: number;
  architectureScore: number;
  maintainabilityScore: number;
  documentationScore: number;
  summary: string;
  recommendations: string[];
  modelName: string;
  modelVersion: string;
  analyzedAt: string;
  findings: AIFinding[];
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedTaskId?: string;
  relatedRepositoryId?: string;
  createdAt: string;
}

export interface DashboardSummary {
  totalRepositories: number;
  activeTasks: number;
  queuedTasks: number;
  completedTasks24h: number;
  activeWorkers: number;
  avgHealthScore: number;
  criticalSecurityIssues: number;
  totalThroughputPerMin: number;
}

export type Theme = 'dark' | 'light' | 'system';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface LeetCodeProfile {
  id: string;
  userId: string;
  username: string;
  profileUrl: string;
  realName?: string | null;
  ranking?: number | null;
  reputation?: number | null;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  acceptanceRate: number;
  streak: number;
  dsaScore: number;
  contestRating: number;
  maxRating: number;
  globalRanking?: number | null;
  lastSyncedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeetCodeContest {
  id: string;
  profileId: string;
  contestName: string;
  contestDate: string;
  rating: number;
  ranking: number;
  problemsSolved: number;
  totalProblems: number;
  score: number;
  ratingChange: number;
  createdAt: string;
}

export interface LeetCodeTopicStats {
  id: string;
  profileId: string;
  topicName: string;
  solvedCount: number;
  easyCount: number;
  mediumCount: number;
  hardCount: number;
  strengthLevel: 'STRONG' | 'MODERATE' | 'WEAK';
  createdAt: string;
  updatedAt: string;
}

export interface LeetCodeAnalysis {
  id: string;
  profileId: string;
  taskId?: string | null;
  dsaScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  learningRoadmap: { phase: string; focus: string; milestones: string[] }[];
  contestStrategy: string[];
  createdAt: string;
}

export interface LeetCodeDeterministicMetrics {
  dsaScore: number;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  contestRating: number;
  maxRating: number;
  globalRanking?: number | null;
  ratingTrend: 'IMPROVING' | 'DECREASING' | 'STABLE' | 'VOLATILE' | 'NO_DATA';
  streak: number;
  strongTopics: string[];
  weakTopics: string[];
  consistencyScore: number;
  recommendationSignals: string[];
}

export interface CodeforcesProfile {
  id: string;
  userId: string;
  handle: string;
  profileUrl: string;
  rating?: number | null;
  maxRating?: number | null;
  rank?: string | null;
  maxRank?: string | null;
  contribution: number;
  friendOfCount: number;
  titlePhoto?: string | null;
  organization?: string | null;
  cpScore: number;
  lastSyncedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CodeforcesContest {
  id: string;
  profileId: string;
  contestId: number;
  contestName: string;
  contestDate: string;
  rank: number;
  ratingBefore: number;
  ratingAfter: number;
  ratingChange: number;
  problemsSolved: number;
  createdAt: string;
}

export interface CodeforcesTagStats {
  id: string;
  profileId: string;
  tagName: string;
  solvedCount: number;
  avgDifficulty: number;
  strengthLevel: 'STRONG' | 'MODERATE' | 'WEAK';
  createdAt: string;
  updatedAt: string;
}

export interface CodeforcesAnalysis {
  id: string;
  profileId: string;
  taskId?: string | null;
  cpScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  learningRoadmap: { phase: string; focus: string; milestones: string[] }[];
  contestStrategy: string[];
  createdAt: string;
}

export interface CodeforcesDeterministicMetrics {
  cpScore: number;
  currentRating: number;
  maxRating: number;
  currentRank: string;
  maxRank: string;
  ratingTrend: 'IMPROVING' | 'DECLINING' | 'STABLE' | 'VOLATILE' | 'NO_DATA';
  contestCount: number;
  totalProblemsSolved: number;
  strongTags: string[];
  weakTags: string[];
  difficultyDistribution: Record<string, number>;
  consistencyScore: number;
  recommendationSignals: string[];
}

export interface Portfolio {
  id: string;
  userId: string;
  url: string;
  domain: string;
  title?: string | null;
  description?: string | null;
  crawlStatus: 'NOT_STARTED' | 'QUEUED' | 'CRAWLING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  lastCrawledAt?: string | null;
  robotsAllowed: boolean;
  pageCount: number;
  error?: string | null;
  qualityScore: number;
  createdAt: string;
  updatedAt: string;
  pages?: PortfolioPage[];
  projects?: PortfolioProject[];
  links?: PortfolioLink[];
}

export interface PortfolioPage {
  id: string;
  portfolioId: string;
  url: string;
  path: string;
  title?: string | null;
  metaDescription?: string | null;
  canonical?: string | null;
  depth: number;
  statusCode: number;
  contentType: string;
  wordCount: number;
  headings: { level: string; text: string }[];
  crawledAt: string;
}

export interface PortfolioProject {
  id: string;
  portfolioId: string;
  name: string;
  description?: string | null;
  technologies: string[];
  githubUrl?: string | null;
  liveDemoUrl?: string | null;
  documentationUrl?: string | null;
  imageUrl?: string | null;
  sourcePageUrl?: string | null;
  presentationScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioLink {
  id: string;
  portfolioId: string;
  sourceUrl: string;
  targetUrl: string;
  linkType: 'INTERNAL' | 'EXTERNAL' | 'GITHUB' | 'RESUME' | 'SOCIAL' | 'BROKEN';
  anchorText?: string | null;
  isBroken: boolean;
  statusCode?: number | null;
  createdAt: string;
}

export interface PortfolioAnalysis {
  id: string;
  portfolioId: string;
  taskId?: string | null;
  portfolioQualityScore: number;
  seoScore: number;
  accessibilityScore: number;
  navigationScore: number;
  projectPresentationScore: number;
  recruiterReadinessScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recruiterPerspective: string;
  seoRecommendations: string[];
  accessibilityRecommendations: string[];
  designContentRecommendations: string[];
  improvementRoadmap: { phase: string; focus: string; milestones: string[] }[];
  createdAt: string;
}

export interface PortfolioDeterministicMetrics {
  portfolioQualityScore: number;
  seoScore: number;
  accessibilityScore: number;
  navigationScore: number;
  projectPresentationScore: number;
  recruiterReadinessScore: number;
  pageCount: number;
  projectCount: number;
  githubLinkCount: number;
  liveDemoCount: number;
  hasResumeLink: boolean;
  hasContactInfo: boolean;
  brokenLinkCount: number;
  detectedTechnologies: string[];
  recommendationSignals: string[];
}

export interface ResumeContactInfo {
  name?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  location?: string;
}

export interface ResumeWorkExperience {
  company: string;
  title: string;
  dateRange: string;
  location?: string;
  highlights: string[];
  metrics?: string[];
  skills?: string[];
}

export interface ResumeEducation {
  institution: string;
  degree: string;
  field?: string;
  gradYear?: string;
  gpa?: string;
}

export interface ResumeSkills {
  technical: string[];
  soft: string[];
  tools: string[];
  languages: string[];
}

export interface ResumeProject {
  title: string;
  description: string;
  techStack: string[];
  links?: string[];
}

export interface ResumeCertification {
  name: string;
  issuer?: string;
  date?: string;
}

export interface Resume {
  id: string;
  userId: string;
  title: string;
  fileUrl?: string | null;
  rawText: string;
  contactInfo: ResumeContactInfo;
  workExperience: ResumeWorkExperience[];
  education: ResumeEducation[];
  skills: ResumeSkills;
  projects: ResumeProject[];
  certifications: ResumeCertification[];
  atsScore: number;
  createdAt: string;
  updatedAt: string;
  analyses?: ResumeAnalysis[];
}

export interface ResumeActionableSuggestion {
  category: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  suggestion: string;
  impact: string;
}

export interface ResumeBulletEvaluation {
  original: string;
  impactScore: number;
  feedback: string;
  improvedVersion: string;
  actionVerbUsed: boolean;
  hasQuantifiableMetric: boolean;
}

export interface ResumeAnalysis {
  id: string;
  resumeId: string;
  taskId?: string | null;
  atsScore: number;
  formattingScore: number;
  contentImpactScore: number;
  skillsMatchScore: number;
  completenessScore: number;
  summary: string;
  actionableSuggestions: ResumeActionableSuggestion[];
  bulletEvaluations: ResumeBulletEvaluation[];
  missingKeywords: string[];
  formattingIssues: string[];
  createdAt: string;
}

// Part 15: Resume ↔ GitHub Verification Types
export type VerificationStatus = 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'NOT_FOUND' | 'UNVERIFIABLE';
export type EvidenceLevel = 'DIRECT' | 'STRONG' | 'PARTIAL' | 'WEAK' | 'NONE';
export type ClaimType =
  | 'PROJECT'
  | 'TECHNOLOGY'
  | 'PROGRAMMING_LANGUAGE'
  | 'FRAMEWORK'
  | 'DATABASE'
  | 'ARCHITECTURE'
  | 'FEATURE'
  | 'CONCURRENCY'
  | 'AI'
  | 'API'
  | 'AUTHENTICATION'
  | 'DEPLOYMENT'
  | 'PERFORMANCE'
  | 'QUANTITATIVE_IMPACT'
  | 'COMPETITIVE_PROGRAMMING'
  | 'ROLE'
  | 'CONTRIBUTION';

export interface ResumeClaim {
  claimId: string;
  claimType: ClaimType;
  claimText: string;
  sourceSection: string;
  projectName?: string;
  status: VerificationStatus;
  confidence: number; // 0.0 to 1.0
  evidenceLevel: EvidenceLevel;
  repositoryId?: string;
  repositoryName?: string;
  evidencePaths: string[];
  evidenceSnippets: string[];
  reason: string;
  limitations?: string;
}

export interface ProjectVerificationMatch {
  projectName: string;
  matchedRepoId?: string;
  matchedRepoName?: string;
  matchScore: number; // 0 - 100
  explicitUrlFound: boolean;
  technologiesClaimed: string[];
  technologiesVerified: string[];
  technologiesUnverifiable: string[];
  architectureClaims: { claim: string; verified: boolean; evidence?: string }[];
}

export interface StrongProjectSuggestion {
  repositoryId: string;
  repositoryName: string;
  description: string;
  language: string;
  starsCount: number;
  relevanceReason: string;
  suggestedTitle: string;
  suggestedHighlights: string[];
}

export interface ResumeGitHubVerification {
  id: string;
  resumeId: string;
  userId: string;
  taskId?: string | null;
  overallCoverageScore: number;
  verifiedClaimsCount: number;
  partialClaimsCount: number;
  notFoundClaimsCount: number;
  unverifiableClaimsCount: number;
  summary: string;
  claims: ResumeClaim[];
  projectMatches: ProjectVerificationMatch[];
  strongProjects: StrongProjectSuggestion[];
  recommendations: string[];
  createdAt: string;
  updatedAt: string;
}

// Part 16: Cross-Platform Developer Verification Types
export type CrossPlatformPlatform = 'RESUME' | 'GITHUB' | 'LEETCODE' | 'CODEFORCES' | 'PORTFOLIO';

export type CrossPlatformClaimCategory =
  | 'PROJECT'
  | 'TECHNOLOGY'
  | 'PROGRAMMING_LANGUAGE'
  | 'FRAMEWORK'
  | 'DATABASE'
  | 'CLOUD'
  | 'ARCHITECTURE'
  | 'CONCURRENCY'
  | 'AI'
  | 'AUTHENTICATION'
  | 'PROBLEMS_SOLVED'
  | 'CONTEST_RATING'
  | 'CONTEST_COUNT'
  | 'COMPETITIVE_PROGRAMMING'
  | 'STREAK'
  | 'PROJECT_COUNT'
  | 'REPOSITORY_COUNT'
  | 'CERTIFICATION'
  | 'ACHIEVEMENT'
  | 'EXPERIENCE'
  | 'PORTFOLIO_PROJECT'
  | 'PERFORMANCE_METRIC';

export type DiscrepancyCategory =
  | 'COUNT_MISMATCH'
  | 'RATING_MISMATCH'
  | 'PROJECT_MISMATCH'
  | 'TECHNOLOGY_MISMATCH'
  | 'LINK_MISMATCH'
  | 'ACHIEVEMENT_MISMATCH'
  | 'DATE_MISMATCH'
  | 'MISSING_EVIDENCE'
  | 'STALE_DATA';

export type DiscrepancySeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH';

export interface NormalizedEvidence {
  source: CrossPlatformPlatform;
  metric: string;
  value: string | number | boolean;
  claimText?: string;
  collectedAt: string;
  confidence: number;
  details?: Record<string, any>;
}

export interface CrossPlatformDiscrepancy {
  id: string;
  category: DiscrepancyCategory;
  sourceA: CrossPlatformPlatform;
  sourceB: CrossPlatformPlatform;
  claim: string;
  observedValueA: string | number;
  observedValueB: string | number;
  severity: DiscrepancySeverity;
  explanation: string;
  recommendedAction?: string;
  timestamp: string;
}

export interface CrossPlatformClaimResult {
  claimId: string;
  category: CrossPlatformClaimCategory;
  claimText: string;
  status: VerificationStatus;
  primarySource: CrossPlatformPlatform;
  evidence: {
    source: CrossPlatformPlatform;
    metric: string;
    value: string | number;
    details?: string;
  }[];
  severity?: DiscrepancySeverity;
  reason: string;
  confidence: number;
}

export interface ProjectCrossVerification {
  projectName: string;
  resumePresent: boolean;
  githubRepoName?: string;
  portfolioProjectName?: string;
  matchScore: number; // 0 - 100
  technologyConsistency: number; // 0 - 100
  evidenceStrength: EvidenceLevel;
  technologies: string[];
}

export interface CompetitiveProgrammingVerification {
  platform: 'LEETCODE' | 'CODEFORCES';
  metric: string;
  resumeValue?: string | number;
  actualValue?: string | number;
  status: VerificationStatus;
  lastUpdated: string;
  notes?: string;
}

export interface TechnologyMatrixItem {
  technology: string;
  resumePresent: boolean;
  githubPresent: boolean;
  portfolioPresent: boolean;
  status: VerificationStatus;
}

export interface SourceUsageInfo {
  source: CrossPlatformPlatform;
  connected: boolean;
  lastSyncedAt?: string;
  label: string;
}

export interface CrossPlatformVerificationReport {
  id: string;
  userId: string;
  taskId?: string | null;
  technicalConsistencyScore: number; // 0 - 100
  projectConsistencyScore: number; // 0 - 100
  cpConsistencyScore: number; // 0 - 100
  technologyConsistencyScore: number; // 0 - 100
  overallCoverageScore: number; // 0 - 100
  verifiedClaimsCount: number;
  partialClaimsCount: number;
  notFoundClaimsCount: number;
  unverifiableClaimsCount: number;
  discrepancyCount: number;
  summary: string;
  claims: CrossPlatformClaimResult[];
  discrepancies: CrossPlatformDiscrepancy[];
  projectCrossVerifications: ProjectCrossVerification[];
  competitiveProgrammingVerifications: CompetitiveProgrammingVerification[];
  technologyMatrix: TechnologyMatrixItem[];
  strongProfileSignals: string[];
  missingEvidenceRecommendations: string[];
  recommendations: string[];
  sourcesUsed: SourceUsageInfo[];
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// PART 17: JOB DESCRIPTION INTELLIGENCE & MATCHING
// ==========================================

export type JobMatchingState = 'MATCHED' | 'PARTIALLY_MATCHED' | 'MISSING' | 'UNVERIFIABLE' | 'NOT_APPLICABLE';

export type SkillCategory =
  | 'Programming Languages'
  | 'Frameworks'
  | 'Libraries'
  | 'Databases'
  | 'Cloud'
  | 'DevOps'
  | 'Testing'
  | 'Security'
  | 'Architecture'
  | 'Data Structures & Algorithms'
  | 'AI/ML'
  | 'Tools'
  | 'Operating Systems'
  | 'Networking'
  | 'System Design'
  | 'Other';

export interface JobRequirementItem {
  name: string;
  category: SkillCategory;
  isRequired: boolean; // REQUIRED vs PREFERRED
  importance: 'CRITICAL' | 'IMPORTANT' | 'NICE_TO_HAVE';
  extractedFrom?: string;
}

export interface ExtractedJobRequirements {
  roleTitle?: string;
  companyName?: string;
  requiredSkills: JobRequirementItem[];
  preferredSkills: JobRequirementItem[];
  programmingLanguages: string[];
  frameworks: string[];
  databases: string[];
  cloudAndDevops: string[];
  responsibilities: string[];
  educationRequirements: string[];
  experienceYears?: number;
  experienceRequirements: string[];
  keywords: string[];
  cpExpectations?: string;
}

export interface JobSkillMatchResult {
  requirementName: string;
  category: SkillCategory;
  isRequired: boolean;
  state: JobMatchingState;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  evidenceSources: string[];
  evidenceLevel: 'DIRECT' | 'STRONG' | 'PARTIAL' | 'UNVERIFIABLE';
  reasoning: string;
}

export interface JobProjectMatchResult {
  projectName: string;
  relevanceScore: number; // 0 - 100
  technologyOverlap: string[];
  architecturalOverlap: string[];
  reasoning: string;
}

export interface JobMissingSkillItem {
  skill: string;
  category: SkillCategory;
  importance: 'CRITICAL' | 'IMPORTANT' | 'NICE_TO_HAVE';
  transferrableSkills: string[];
  learningSuggestion: string;
}

export interface KeywordAlignmentItem {
  keyword: string;
  status: 'MATCHED' | 'MISSING_FROM_RESUME' | 'MISSING_FROM_PROFILE' | 'PARTIAL';
  source: string;
}

export interface JobMatchReport {
  id: string;
  jobId: string;
  userId: string;
  taskId?: string | null;
  overallMatchScore: number; // 0 - 100
  matchLabel: string; // Excellent, Strong, Moderate, Developing, Low
  requiredSkillCoverage: number; // 0 - 100
  preferredSkillCoverage: number; // 0 - 100
  projectRelevanceScore: number; // 0 - 100
  experienceMatchStatus: JobMatchingState;
  educationMatchStatus: JobMatchingState;
  cpRelevanceStatus: JobMatchingState;
  summary: string;
  extractedRequirements: ExtractedJobRequirements;
  skillMatches: JobSkillMatchResult[];
  projectRelevance: JobProjectMatchResult[];
  missingSkills: JobMissingSkillItem[];
  keywordAlignment: KeywordAlignmentItem[];
  recommendations: string[];
  interviewPriorities: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface JobDescriptionInput {
  title?: string;
  company?: string;
  location?: string;
  employmentType?: string;
  sourceUrl?: string;
  rawDescription: string;
}

export interface JobDescriptionRecord {
  id: string;
  userId: string;
  title?: string;
  company?: string;
  location?: string;
  employmentType?: string;
  sourceUrl?: string;
  rawDescription: string;
  createdAt: string;
  matches?: JobMatchReport[];
  readinessReports?: JobReadinessReport[];
}

// ==========================================
// PART 18 — JOB READINESS TYPES
// ==========================================

export type JobReadinessLevel =
  | 'EARLY_PREPARATION'
  | 'DEVELOPING'
  | 'MODERATELY_READY'
  | 'STRONGLY_READY'
  | 'HIGHLY_READY';

export type JobDSARelevance = 'LOW' | 'MEDIUM' | 'HIGH';

export interface JobReadinessDimensionScore {
  score: number; // 0-100
  weight: number; // percentage weight e.g. 25
  label: string;
  rationale: string;
}

export interface JobReadinessDimensions {
  technicalReadiness: JobReadinessDimensionScore;
  requiredSkillReadiness: JobReadinessDimensionScore;
  projectReadiness: JobReadinessDimensionScore;
  experienceReadiness: JobReadinessDimensionScore;
  dsaReadiness: JobReadinessDimensionScore;
  resumeReadiness: JobReadinessDimensionScore;
  evidenceReadiness: JobReadinessDimensionScore;
  responsibilityReadiness: JobReadinessDimensionScore;
}

export interface JobReadinessGap {
  gapId: string;
  skillOrRequirement: string;
  category: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  isBlocker: boolean;
  whyRequired: string;
  currentEvidence: string;
  whatIsMissing: string;
  suggestedAction: string;
  estimatedDifficulty: 'EASY' | 'MODERATE' | 'HARD';
}

export interface JobReadinessSignal {
  type: 'STRONG' | 'WEAK';
  title: string;
  description: string;
  source: string;
}

export interface JobReadinessInterviewPrep {
  interviewReadinessScore: number; // 0-100
  technicalInterviewAreas: {
    category: string;
    focus: string;
    importance: 'HIGH' | 'MEDIUM' | 'LOW';
  }[];
  behavioralFocusAreas: {
    topic: string;
    guidance: string;
  }[];
}

export interface JobReadinessPreparationPriority {
  rank: number;
  title: string;
  category: string;
  description: string;
  actionItem: string;
  targetGapId?: string;
  estimatedEffort: string;
}

export interface JobReadinessProjectLeverage {
  projectName: string;
  existingTech: string[];
  missingSkillToExtend: string;
  recommendation: string;
}

export interface JobReadinessWhatIfScenario {
  scenarioId: string;
  name: string;
  actions: string[];
  currentScore: number;
  estimatedNewScore: number;
  estimatedDelta: number;
  affectedDimensions: string[];
  remainingGaps: string[];
  disclaimer: string;
}

export interface JobReadinessDataFreshness {
  github?: { status: string; lastSyncedAt?: string; isStale: boolean };
  leetcode?: { status: string; lastSyncedAt?: string; isStale: boolean };
  codeforces?: { status: string; lastSyncedAt?: string; isStale: boolean };
  portfolio?: { status: string; lastSyncedAt?: string; isStale: boolean };
  resume?: { status: string; lastSyncedAt?: string; isStale: boolean };
  overallNote?: string;
}

export interface JobReadinessReport {
  id: string;
  jobId: string;
  userId: string;
  taskId?: string | null;
  score: number; // 0-100
  level: JobReadinessLevel;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  interviewReadinessScore: number;
  dsaRelevance: JobDSARelevance;
  dimensions: JobReadinessDimensions;
  criticalGaps: JobReadinessGap[];
  readinessBlockers: JobReadinessGap[];
  strongSignals: JobReadinessSignal[];
  weakSignals: JobReadinessSignal[];
  interviewPrep: JobReadinessInterviewPrep;
  preparationPriorities: JobReadinessPreparationPriority[];
  projectLeverage: JobReadinessProjectLeverage[];
  whatIfSimulation?: JobReadinessWhatIfScenario[];
  executiveSummary: string;
  dataFreshness: JobReadinessDataFreshness;
  createdAt: string;
  updatedAt?: string;
}

// ==========================================
// PART 19 — COMPANY-SPECIFIC PREPARATION TYPES
// ==========================================

export interface CompanyProfile {
  companyName: string;
  industry?: string;
  website?: string;
  technologies: string[];
  productDomain?: string;
  engineeringAreas: string[];
  publicDescription?: string;
  source?: string;
  lastUpdated?: string;
}

export interface PreparationPriorityItem {
  topic: string;
  category: string; // 'DSA' | 'Backend' | 'System Design' | 'Frontend' | 'Database' | 'Cloud' | 'DevOps' | 'Security' | 'Behavioral' | 'Projects'
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
  currentReadiness: string;
  gap: string;
  evidence: string;
  recommendedAction: string;
}

export interface DSAPreparationCard {
  isDSARequired: boolean;
  roleRelevance: 'HIGH' | 'MEDIUM' | 'LOW';
  currentDSAProfile: {
    leetCodeSolved?: number;
    codeforcesRating?: number;
    strongTopics: string[];
    weakTopics: string[];
    practiceConsistency?: string;
  };
  topicPlans: {
    topic: string;
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    reason: string;
    recommendedAction: string;
  }[];
}

export interface ProjectPreparationItem {
  projectName: string;
  relevance: 'HIGH' | 'MEDIUM' | 'LOW';
  whyRelevant: string;
  technologies: string[];
  architectureOverview: string;
  potentialDiscussionAreas: string[];
  evidenceSource: string;
  storyGuide: {
    problem: string;
    architecture: string;
    technicalDecisions: string;
    tradeoffs: string;
    challenges: string;
    performance: string;
    security: string;
    testing: string;
    failureHandling: string;
    lessonsLearned: string;
  };
}

export interface BehavioralPreparationItem {
  theme: string; // 'Ownership' | 'Leadership' | 'Conflict' | 'Failure' | 'Learning' | 'Problem Solving' | 'Teamwork' | 'Technical Decision'
  context: string;
  preparationGuidance: string;
}

export interface CompanyResearchChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  category: string;
}

export interface CompanyResearchChecklist {
  companyOverview: string;
  productDomainAwareness: string;
  engineeringAreas: string[];
  questionsToResearch: string[];
  checklistItems: CompanyResearchChecklistItem[];
  verificationNote: string;
}

export interface ResumePositioningItem {
  projectsToEmphasize: string[];
  verifiedSkillsToEmphasize: string[];
  relevantAchievements: string[];
  supportedKeywords: string[];
  evidenceToHighlight: string[];
}

export interface SkillTransferRecommendation {
  existingSkill: string;
  targetSkill: string;
  transferStrategy: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface PreparationRoadmapPhase {
  phaseNumber: number;
  phaseTitle: string;
  goals: string[];
  actionItems: string[];
  estimatedTimeline?: string;
}

export interface CompanyPreparationReport {
  id: string;
  jobId: string;
  userId: string;
  taskId?: string | null;
  companyName: string;
  jobTitle: string;
  jobMatchScore: number;
  jobReadinessScore: number;
  preparationCoverageScore: number;
  coverageFormulaBreakdown: {
    totalAreas: number;
    coveredAreas: number;
    details: string;
  };
  topPriorityTopic: string;
  priorityEngineFormulaDoc: string;
  companyProfile: CompanyProfile;
  priorityItems: PreparationPriorityItem[];
  dsaPreparation: DSAPreparationCard;
  technicalAndSystemDesignPrep: {
    isSystemDesignRequired: boolean;
    systemDesignTopics: string[];
    technicalTopics: string[];
    existingFoundation: string[];
  };
  projectPreparations: ProjectPreparationItem[];
  behavioralPreparations: BehavioralPreparationItem[];
  companyResearch: CompanyResearchChecklist;
  resumePositioning: ResumePositioningItem;
  profileGaps: {
    criticalGaps: string[];
    highGaps: string[];
    mediumGaps: string[];
    lowGaps: string[];
  };
  skillTransfers: SkillTransferRecommendation[];
  roadmap: PreparationRoadmapPhase[];
  executiveSummary: string;
  noFabricationDisclaimer: string;
  createdAt: string;
  updatedAt?: string;
}

// Part 20 — AI Career + Interview Coach Types

export type CareerCoachMode =
  | 'GENERAL_CAREER_CHAT'
  | 'CAREER_MENTOR'
  | 'JOB_COACH'
  | 'RESUME_REVIEWER'
  | 'GITHUB_REVIEWER'
  | 'LEARNING_COACH'
  | 'PLACEMENT_COACH'
  | 'INTERVIEW_COACH'
  | 'MOCK_INTERVIEW';

export type CareerChatMessageSender = 'USER' | 'ASSISTANT' | 'SYSTEM' | 'INTERVIEWER' | 'EVALUATOR';

export interface CareerChatMessage {
  id: string;
  chatId: string;
  sender: CareerChatMessageSender;
  content: string;
  mode?: CareerCoachMode;
  sourcesUsed?: string[];
  evidence?: string[];
  recommendations?: string[];
  score?: number;
  evaluation?: InterviewAnswerEvaluation;
  createdAt: string;
}

export interface CareerChat {
  id: string;
  userId: string;
  jobId?: string | null;
  title: string;
  mode: CareerCoachMode;
  createdAt: string;
  updatedAt: string;
  messages?: CareerChatMessage[];
}

export type InterviewType = 'Technical' | 'DSA' | 'Project' | 'Behavioral' | 'System Design' | 'Mixed';
export type InterviewDifficulty = 'Easy' | 'Medium' | 'Hard';
export type InterviewSessionStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface InterviewAnswerEvaluation {
  score: number; // 0 - 100
  strengths: string[];
  weaknesses: string[];
  missingPoints: string[];
  improvedAnswer: string;
}

export interface InterviewAnswer {
  id: string;
  questionId: string;
  userResponse: string;
  score: number;
  strengths: string[];
  weaknesses: string[];
  missingPoints: string[];
  improvedAnswer: string;
  createdAt: string;
}

export interface InterviewQuestion {
  id: string;
  sessionId: string;
  questionIndex: number;
  questionText: string;
  category: string;
  difficulty: InterviewDifficulty;
  expectedKeyPoints?: string[];
  createdAt: string;
  answer?: InterviewAnswer | null;
}

export interface InterviewScoreBreakdown {
  technicalCorrectness: number;
  communication: number;
  depth: number;
  problemSolving: number;
  completeness: number;
  roleRelevance: number;
}

export interface InterviewSession {
  id: string;
  userId: string;
  jobId?: string | null;
  interviewType: InterviewType;
  difficulty: InterviewDifficulty;
  status: InterviewSessionStatus;
  overallScore?: number;
  scoreBreakdown?: InterviewScoreBreakdown;
  finalFeedback?: string;
  startedAt: string;
  completedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  questions?: InterviewQuestion[];
}

export interface CareerDashboardMetrics {
  careerStrengthScore: number;
  jobReadinessScore: number;
  topSkillGap: string;
  strongestProject: string;
  dsaStrengthScore: number;
  interviewReadinessScore: number;
  nextRecommendedAction: string;
  sourcesUsed: string[];
}

// ==========================================
// JOB / APPLICATION TRACKER TYPES (PART 21)
// ==========================================

export type ApplicationStatus =
  | 'SAVED'
  | 'APPLYING'
  | 'APPLIED'
  | 'SCREENING'
  | 'ASSESSMENT'
  | 'INTERVIEW'
  | 'FINAL_ROUND'
  | 'OFFER'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'ON_HOLD';

export type ApplicationPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export type ApplicationEventType =
  | 'APPLICATION_SUBMITTED'
  | 'RECRUITER_CONTACT'
  | 'SCREENING'
  | 'ASSESSMENT'
  | 'INTERVIEW'
  | 'FINAL_INTERVIEW'
  | 'OFFER'
  | 'REJECTION'
  | 'WITHDRAWAL'
  | 'FOLLOW_UP'
  | 'CUSTOM';

export type ApplicationSource =
  | 'LINKEDIN'
  | 'COMPANY_WEBSITE'
  | 'REFERRAL'
  | 'COLLEGE_PORTAL'
  | 'HIRING_PLATFORM'
  | 'DIRECT_OUTREACH'
  | 'OTHER';

export type ApplicationHealth =
  | 'ACTIVE'
  | 'NEEDS_ACTION'
  | 'UPCOMING'
  | 'STALLED'
  | 'COMPLETED';

export interface ApplicationEvent {
  id: string;
  applicationId: string;
  type: ApplicationEventType;
  title: string;
  description?: string | null;
  eventDate: string;
  createdAt: string;
}

export interface ApplicationFollowUp {
  id: string;
  applicationId: string;
  title: string;
  followUpDate: string;
  followUpNote?: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt?: string;
  reminderStatus?: 'UPCOMING' | 'DUE' | 'DUE_TODAY' | 'OVERDUE' | 'COMPLETED';
}

export interface CreateApplicationInput {
  companyName: string;
  jobTitle: string;
  location?: string;
  jobUrl?: string;
  applicationDate?: string;
  status?: ApplicationStatus;
  priority?: ApplicationPriority;
  notes?: string;
  salaryRange?: string;
  source?: string;
  deadline?: string;
  jobId?: string;
}

export interface FollowUpDraft {
  subject: string;
  body: string;
}

export interface Application {
  id: string;
  userId: string;
  jobId?: string | null;
  companyName: string;
  jobTitle: string;
  location?: string | null;
  jobUrl?: string | null;
  applicationDate: string;
  status: ApplicationStatus;
  priority: ApplicationPriority;
  notes?: string | null;
  salaryRange?: string | null;
  source?: ApplicationSource | string | null;
  deadline?: string | null;
  createdAt: string;
  updatedAt?: string;
  events?: ApplicationEvent[];
  followUps?: ApplicationFollowUp[];
  jobMatch?: {
    overallMatchScore: number;
    matchLabel: string;
    requiredSkillCoverage: number;
    skillMatches?: any;
    keywordAlignment?: any;
    missingSkills?: string[];
    keyMatchHighlights?: string[];
    projectRelevance?: any;
  } | null;
  jobReadiness?: {
    score: number;
    level: string;
    topSkillGaps?: string[];
    keyStrengths?: string[];
    criticalGaps?: any;
    preparationPriorities?: any;
    executiveSummary?: string;
  } | null;
  companyPreparation?: {
    preparationCoverageScore: number;
    topPriorityTopic: string;
    primaryTechStack?: string[];
    interviewFocusAreas?: string[];
    priorityItems?: any;
    roadmap?: any;
  } | null;
  interviewHistory?: {
    latestScore?: number;
    sessionCount: number;
    lastSessionDate?: string;
    strengths?: string[];
    weaknesses?: string[];
  } | null;
  health?: ApplicationHealth;
  stalledDays?: number;
  nextAction?: string;
}

export interface ApplicationStats {
  total: number;
  active: number;
  interviews: number;
  offers: number;
  rejected: number;
  withdrawn: number;
  saved: number;
  stalled: number;
  needsAction: number;
  funnel: {
    applied: number;
    screening: number;
    assessment: number;
    interview: number;
    finalRound: number;
    offer: number;
    conversionRates: {
      screeningFromApplied: number;
      assessmentFromScreening: number;
      interviewFromAssessment: number;
      finalFromInterview: number;
      offerFromFinal: number;
      overallConversion: number;
    };
    hasSufficientData: boolean;
  };
}

export type ScheduleStatus = 'ACTIVE' | 'PAUSED' | 'FAILED' | 'NEEDS_ATTENTION' | 'DISABLED';
export type ScheduleExecutionStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED' | 'CANCELLED';
export type ScheduleFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM_CRON' | 'INTERVAL';

export type ScheduledJobType =
  | 'GITHUB_SYNC'
  | 'LEETCODE_SYNC'
  | 'CODEFORCES_SYNC'
  | 'PORTFOLIO_REFRESH'
  | 'RESUME_ANALYSIS'
  | 'PROFILE_REFRESH'
  | 'JOB_READINESS_REFRESH'
  | 'CAREER_REPORT'
  | 'APPLICATION_FOLLOWUP_CHECK'
  | 'CAREER_INSIGHT';

export interface ScheduledJob {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  jobType: ScheduledJobType | string;
  schedule: string;
  frequency: ScheduleFrequency | string;
  time?: string | null;
  timezone: string;
  enabled: boolean;
  status: ScheduleStatus;
  resourceId?: string | null;
  lastRunAt?: string | null;
  nextRunAt?: string | null;
  lastStatus?: string | null;
  lastError?: string | null;
  consecutiveFailures?: number;
  createdAt: string;
  updatedAt: string;
  executions?: ScheduledJobExecution[];
}

export interface ScheduledJobExecution {
  id: string;
  scheduledJobId: string;
  userId: string;
  taskId?: string | null;
  scheduledOccurrence?: string | null;
  startedAt: string;
  completedAt?: string | null;
  status: ScheduleExecutionStatus;
  error?: string | null;
  durationMs?: number | null;
  createdAt: string;
}

export interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  jobType: ScheduledJobType;
  frequency: ScheduleFrequency;
  time: string;
  timezone: string;
  recommended: boolean;
}

export interface AutomationSummary {
  totalCount: number;
  activeCount: number;
  pausedCount: number;
  failedCount: number;
  needsAttentionCount: number;
  completedTodayCount: number;
  nextScheduledRun?: {
    id: string;
    name: string;
    jobType: string;
    nextRunAt: string;
  } | null;
}









