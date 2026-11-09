-- NexusFlow initial database schema
-- Generated from prisma/schema.prisma (mechanically, see scripts/generate_migration.py)
-- Provider: mysql

CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `username` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `avatarUrl` VARCHAR(191) NULL,
    `githubId` VARCHAR(191) NOT NULL,
    `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `lastLoginAt` DATETIME(3) NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `github_accounts` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `githubUserId` VARCHAR(191) NOT NULL,
    `githubUsername` VARCHAR(191) NOT NULL,
    `accessToken` TEXT NOT NULL,
    `refreshToken` TEXT NULL,
    `tokenExpiresAt` DATETIME(3) NULL,
    `profileUrl` VARCHAR(191) NULL,
    `avatarUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `repositories` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `githubRepoId` BIGINT NOT NULL,
    `owner` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `defaultBranch` VARCHAR(191) NOT NULL DEFAULT 'main',
    `visibility` ENUM('PUBLIC', 'PRIVATE') NOT NULL DEFAULT 'PUBLIC',
    `syncStatus` ENUM('NOT_IMPORTED', 'IMPORTING', 'SYNCING', 'SYNCED', 'FAILED') NOT NULL DEFAULT 'NOT_IMPORTED',
    `language` VARCHAR(191) NULL,
    `starsCount` INT NOT NULL DEFAULT 0,
    `forksCount` INT NOT NULL DEFAULT 0,
    `openIssues` INT NOT NULL DEFAULT 0,
    `githubUrl` VARCHAR(191) NOT NULL,
    `cloneUrl` VARCHAR(191) NOT NULL,
    `lastSyncedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `repository_metadata` (
    `id` VARCHAR(191) NOT NULL,
    `repositoryId` VARCHAR(191) NOT NULL,
    `license` VARCHAR(191) NULL,
    `isFork` BOOLEAN NOT NULL DEFAULT false,
    `isArchived` BOOLEAN NOT NULL DEFAULT false,
    `hasTopics` TEXT NULL,
    `defaultBranchSha` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `repository_statistics` (
    `id` VARCHAR(191) NOT NULL,
    `repositoryId` VARCHAR(191) NOT NULL,
    `linesOfCode` BIGINT NOT NULL DEFAULT 0,
    `commitCount` INT NOT NULL DEFAULT 0,
    `branchCount` INT NOT NULL DEFAULT 0,
    `pullRequestCount` INT NOT NULL DEFAULT 0,
    `contributorCount` INT NOT NULL DEFAULT 0,
    `totalSizeBytes` BIGINT NOT NULL DEFAULT 0,
    `healthScore` DOUBLE NOT NULL DEFAULT 0.0,
    `lastAnalyzedAt` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `repository_branches` (
    `id` VARCHAR(191) NOT NULL,
    `repositoryId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `isProtected` BOOLEAN NOT NULL DEFAULT false,
    `commitSha` VARCHAR(191) NULL,
    `commitDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `repository_commits` (
    `id` VARCHAR(191) NOT NULL,
    `repositoryId` VARCHAR(191) NOT NULL,
    `sha` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `authorName` VARCHAR(191) NULL,
    `authorEmail` VARCHAR(191) NULL,
    `authorAvatarUrl` VARCHAR(191) NULL,
    `commitDate` DATETIME(3) NOT NULL,
    `githubUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `repository_contributors` (
    `id` VARCHAR(191) NOT NULL,
    `repositoryId` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `avatarUrl` VARCHAR(191) NULL,
    `contributions` INT NOT NULL DEFAULT 0,
    `profileUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `repository_issues` (
    `id` VARCHAR(191) NOT NULL,
    `repositoryId` VARCHAR(191) NOT NULL,
    `issueNumber` INT NOT NULL,
    `title` TEXT NOT NULL,
    `state` VARCHAR(191) NOT NULL DEFAULT 'open',
    `authorUsername` VARCHAR(191) NULL,
    `authorAvatarUrl` VARCHAR(191) NULL,
    `labels` TEXT NULL,
    `githubUrl` VARCHAR(191) NULL,
    `githubCreatedAt` DATETIME(3) NULL,
    `githubUpdatedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `repository_pull_requests` (
    `id` VARCHAR(191) NOT NULL,
    `repositoryId` VARCHAR(191) NOT NULL,
    `prNumber` INT NOT NULL,
    `title` TEXT NOT NULL,
    `state` VARCHAR(191) NOT NULL DEFAULT 'open',
    `authorUsername` VARCHAR(191) NULL,
    `authorAvatarUrl` VARCHAR(191) NULL,
    `isMerged` BOOLEAN NOT NULL DEFAULT false,
    `githubUrl` VARCHAR(191) NULL,
    `githubCreatedAt` DATETIME(3) NULL,
    `githubUpdatedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `repository_languages` (
    `id` VARCHAR(191) NOT NULL,
    `repositoryId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `bytes` BIGINT NOT NULL DEFAULT 0,
    `percentage` DOUBLE NOT NULL DEFAULT 0.0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `repository_syncs` (
    `id` VARCHAR(191) NOT NULL,
    `repositoryId` VARCHAR(191) NOT NULL,
    `taskId` VARCHAR(191) NULL,
    `status` ENUM('NOT_IMPORTED', 'IMPORTING', 'SYNCING', 'SYNCED', 'FAILED') NOT NULL DEFAULT 'SYNCING',
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `error` TEXT NULL,
    `fileCount` INT NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `repository_files` (
    `id` VARCHAR(191) NOT NULL,
    `repositoryId` VARCHAR(191) NOT NULL,
    `path` VARCHAR(191) NOT NULL,
    `sha` VARCHAR(191) NOT NULL,
    `size` BIGINT NOT NULL DEFAULT 0,
    `fileType` VARCHAR(191) NOT NULL DEFAULT 'file',
    `language` VARCHAR(191) NULL,
    `lastModified` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `tasks` (
    `id` VARCHAR(191) NOT NULL,
    `repositoryId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NOT NULL,
    `taskType` ENUM('REPO_ANALYSIS', 'SECURITY_AUDIT', 'CODE_QUALITY_CHECK', 'ARCHITECTURE_REVIEW', 'FULL_SCAN', 'REPOSITORY_SYNC', 'AI_ANALYSIS', 'LEETCODE_SYNC', 'LEETCODE_ANALYSIS', 'CODEFORCES_SYNC', 'CODEFORCES_ANALYSIS', 'PORTFOLIO_CRAWL', 'PORTFOLIO_ANALYSIS', 'RESUME_PARSE', 'RESUME_ANALYSIS', 'RESUME_GITHUB_VERIFICATION', 'CROSS_PLATFORM_VERIFICATION', 'JOB_ANALYSIS', 'JOB_READINESS_ANALYSIS', 'COMPANY_PREPARATION') NOT NULL DEFAULT 'REPO_ANALYSIS',
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
    `status` ENUM('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'RETRYING', 'SCHEDULED') NOT NULL DEFAULT 'QUEUED',
    `progress` INT NOT NULL DEFAULT 0,
    `retryCount` INT NOT NULL DEFAULT 0,
    `maxRetries` INT NOT NULL DEFAULT 3,
    `scheduledAt` DATETIME(3) NULL,
    `startedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `failureReason` TEXT NULL,
    `workerId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `task_queue_items` (
    `id` VARCHAR(191) NOT NULL,
    `taskId` VARCHAR(191) NOT NULL,
    `priorityWeight` INT NOT NULL DEFAULT 100,
    `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lockedAt` DATETIME(3) NULL,
    `lockedByWorker` VARCHAR(191) NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `workers` (
    `id` VARCHAR(191) NOT NULL,
    `workerId` VARCHAR(191) NOT NULL,
    `hostIdentifier` VARCHAR(191) NOT NULL,
    `status` ENUM('IDLE', 'BUSY', 'STOPPING', 'STOPPED', 'UNHEALTHY') NOT NULL DEFAULT 'IDLE',
    `currentTaskId` VARCHAR(191) NULL,
    `activeThreads` INT NOT NULL DEFAULT 0,
    `maxThreads` INT NOT NULL DEFAULT 10,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastHeartbeat` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `tasksCompleted` INT NOT NULL DEFAULT 0,
    `tasksFailed` INT NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `worker_metrics` (
    `id` VARCHAR(191) NOT NULL,
    `workerId` VARCHAR(191) NOT NULL,
    `cpuUsagePercent` DOUBLE NOT NULL,
    `memoryUsageMB` DOUBLE NOT NULL,
    `memoryUsagePercent` DOUBLE NOT NULL,
    `activeThreads` INT NOT NULL,
    `queueDepth` INT NOT NULL,
    `tasksCompleted` INT NOT NULL,
    `tasksFailed` INT NOT NULL,
    `avgExecutionTimeMs` DOUBLE NOT NULL,
    `throughputPerMin` DOUBLE NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `task_execution_logs` (
    `id` VARCHAR(191) NOT NULL,
    `taskId` VARCHAR(191) NOT NULL,
    `workerId` VARCHAR(191) NULL,
    `level` ENUM('TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL') NOT NULL DEFAULT 'INFO',
    `message` TEXT NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ai_analysis_reports` (
    `id` VARCHAR(191) NOT NULL,
    `repositoryId` VARCHAR(191) NOT NULL,
    `taskId` VARCHAR(191) NOT NULL,
    `overallScore` DOUBLE NOT NULL DEFAULT 0.0,
    `securityScore` DOUBLE NOT NULL DEFAULT 0.0,
    `performanceScore` DOUBLE NOT NULL DEFAULT 0.0,
    `architectureScore` DOUBLE NOT NULL DEFAULT 0.0,
    `maintainabilityScore` DOUBLE NOT NULL DEFAULT 0.0,
    `documentationScore` DOUBLE NOT NULL DEFAULT 0.0,
    `summary` TEXT NOT NULL,
    `recommendations` JSON NULL,
    `modelName` VARCHAR(191) NOT NULL DEFAULT 'gemini-3.6-flash',
    `modelVersion` VARCHAR(191) NOT NULL DEFAULT '1.0',
    `analyzedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ai_findings` (
    `id` VARCHAR(191) NOT NULL,
    `reportId` VARCHAR(191) NOT NULL,
    `category` ENUM('SECURITY', 'PERFORMANCE', 'ARCHITECTURE', 'MAINTAINABILITY', 'CODE_STYLE', 'BUG_RISK', 'DOCUMENTATION') NOT NULL DEFAULT 'MAINTAINABILITY',
    `severity` ENUM('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO') NOT NULL DEFAULT 'MEDIUM',
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `filePath` VARCHAR(191) NULL,
    `lineNumber` INT NULL,
    `snippet` TEXT NULL,
    `recommendation` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('TASK_COMPLETED', 'TASK_FAILED', 'SYSTEM_ALERT', 'ANALYSIS_READY', 'SECURITY_WARNING') NOT NULL DEFAULT 'ANALYSIS_READY',
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `relatedTaskId` VARCHAR(191) NULL,
    `relatedRepositoryId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `refresh_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `familyId` VARCHAR(191) NOT NULL,
    `isRevoked` BOOLEAN NOT NULL DEFAULT false,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `sessions` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `sessionToken` VARCHAR(191) NOT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_settings` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `theme` VARCHAR(191) NOT NULL DEFAULT 'system',
    `defaultAnalysisPriority` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
    `emailNotifications` BOOLEAN NOT NULL DEFAULT true,
    `webhookUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `leetcode_profiles` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `profileUrl` VARCHAR(191) NOT NULL,
    `realName` VARCHAR(191) NULL,
    `ranking` INT NULL,
    `reputation` INT NULL,
    `totalSolved` INT NOT NULL DEFAULT 0,
    `easySolved` INT NOT NULL DEFAULT 0,
    `mediumSolved` INT NOT NULL DEFAULT 0,
    `hardSolved` INT NOT NULL DEFAULT 0,
    `acceptanceRate` DOUBLE NOT NULL DEFAULT 0.0,
    `streak` INT NOT NULL DEFAULT 0,
    `dsaScore` DOUBLE NOT NULL DEFAULT 0.0,
    `contestRating` DOUBLE NOT NULL DEFAULT 0.0,
    `maxRating` DOUBLE NOT NULL DEFAULT 0.0,
    `globalRanking` INT NULL,
    `lastSyncedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `leetcode_contests` (
    `id` VARCHAR(191) NOT NULL,
    `profileId` VARCHAR(191) NOT NULL,
    `contestName` VARCHAR(191) NOT NULL,
    `contestDate` DATETIME(3) NOT NULL,
    `rating` DOUBLE NOT NULL DEFAULT 0.0,
    `ranking` INT NOT NULL DEFAULT 0,
    `problemsSolved` INT NOT NULL DEFAULT 0,
    `totalProblems` INT NOT NULL DEFAULT 4,
    `score` DOUBLE NOT NULL DEFAULT 0.0,
    `ratingChange` DOUBLE NOT NULL DEFAULT 0.0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `leetcode_topic_stats` (
    `id` VARCHAR(191) NOT NULL,
    `profileId` VARCHAR(191) NOT NULL,
    `topicName` VARCHAR(191) NOT NULL,
    `solvedCount` INT NOT NULL DEFAULT 0,
    `easyCount` INT NOT NULL DEFAULT 0,
    `mediumCount` INT NOT NULL DEFAULT 0,
    `hardCount` INT NOT NULL DEFAULT 0,
    `strengthLevel` VARCHAR(191) NOT NULL DEFAULT 'MODERATE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `leetcode_analyses` (
    `id` VARCHAR(191) NOT NULL,
    `profileId` VARCHAR(191) NOT NULL,
    `taskId` VARCHAR(191) NULL,
    `dsaScore` DOUBLE NOT NULL DEFAULT 0.0,
    `summary` TEXT NOT NULL,
    `strengths` JSON NOT NULL,
    `weaknesses` JSON NOT NULL,
    `recommendations` JSON NOT NULL,
    `learningRoadmap` JSON NOT NULL,
    `contestStrategy` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `codeforces_profiles` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `handle` VARCHAR(191) NOT NULL,
    `profileUrl` VARCHAR(191) NOT NULL,
    `rating` INT NULL,
    `maxRating` INT NULL,
    `rank` VARCHAR(191) NULL,
    `maxRank` VARCHAR(191) NULL,
    `contribution` INT NOT NULL DEFAULT 0,
    `friendOfCount` INT NOT NULL DEFAULT 0,
    `titlePhoto` VARCHAR(191) NULL,
    `organization` VARCHAR(191) NULL,
    `cpScore` DOUBLE NOT NULL DEFAULT 0.0,
    `lastSyncedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `codeforces_contests` (
    `id` VARCHAR(191) NOT NULL,
    `profileId` VARCHAR(191) NOT NULL,
    `contestId` INT NOT NULL,
    `contestName` VARCHAR(191) NOT NULL,
    `contestDate` DATETIME(3) NOT NULL,
    `rank` INT NOT NULL DEFAULT 0,
    `ratingBefore` INT NOT NULL DEFAULT 0,
    `ratingAfter` INT NOT NULL DEFAULT 0,
    `ratingChange` INT NOT NULL DEFAULT 0,
    `problemsSolved` INT NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `codeforces_tag_stats` (
    `id` VARCHAR(191) NOT NULL,
    `profileId` VARCHAR(191) NOT NULL,
    `tagName` VARCHAR(191) NOT NULL,
    `solvedCount` INT NOT NULL DEFAULT 0,
    `avgDifficulty` DOUBLE NOT NULL DEFAULT 0.0,
    `strengthLevel` VARCHAR(191) NOT NULL DEFAULT 'MODERATE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `codeforces_analyses` (
    `id` VARCHAR(191) NOT NULL,
    `profileId` VARCHAR(191) NOT NULL,
    `taskId` VARCHAR(191) NULL,
    `cpScore` DOUBLE NOT NULL DEFAULT 0.0,
    `summary` TEXT NOT NULL,
    `strengths` JSON NOT NULL,
    `weaknesses` JSON NOT NULL,
    `recommendations` JSON NOT NULL,
    `learningRoadmap` JSON NOT NULL,
    `contestStrategy` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `portfolios` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `url` TEXT NOT NULL,
    `domain` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `crawlStatus` VARCHAR(191) NOT NULL DEFAULT 'NOT_STARTED',
    `lastCrawledAt` DATETIME(3) NULL,
    `robotsAllowed` BOOLEAN NOT NULL DEFAULT true,
    `pageCount` INT NOT NULL DEFAULT 0,
    `error` TEXT NULL,
    `qualityScore` DOUBLE NOT NULL DEFAULT 0.0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `portfolio_pages` (
    `id` VARCHAR(191) NOT NULL,
    `portfolioId` VARCHAR(191) NOT NULL,
    `url` TEXT NOT NULL,
    `path` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NULL,
    `metaDescription` TEXT NULL,
    `canonical` VARCHAR(191) NULL,
    `depth` INT NOT NULL DEFAULT 0,
    `statusCode` INT NOT NULL DEFAULT 200,
    `contentType` VARCHAR(191) NOT NULL DEFAULT 'text/html',
    `wordCount` INT NOT NULL DEFAULT 0,
    `headings` JSON NOT NULL,
    `crawledAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `portfolio_projects` (
    `id` VARCHAR(191) NOT NULL,
    `portfolioId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `technologies` JSON NOT NULL,
    `githubUrl` VARCHAR(191) NULL,
    `liveDemoUrl` VARCHAR(191) NULL,
    `documentationUrl` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(191) NULL,
    `sourcePageUrl` VARCHAR(191) NULL,
    `presentationScore` DOUBLE NOT NULL DEFAULT 0.0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `portfolio_links` (
    `id` VARCHAR(191) NOT NULL,
    `portfolioId` VARCHAR(191) NOT NULL,
    `sourceUrl` TEXT NOT NULL,
    `targetUrl` TEXT NOT NULL,
    `linkType` VARCHAR(191) NOT NULL DEFAULT 'INTERNAL',
    `anchorText` VARCHAR(191) NULL,
    `isBroken` BOOLEAN NOT NULL DEFAULT false,
    `statusCode` INT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `portfolio_analyses` (
    `id` VARCHAR(191) NOT NULL,
    `portfolioId` VARCHAR(191) NOT NULL,
    `taskId` VARCHAR(191) NULL,
    `portfolioQualityScore` DOUBLE NOT NULL DEFAULT 0.0,
    `seoScore` DOUBLE NOT NULL DEFAULT 0.0,
    `accessibilityScore` DOUBLE NOT NULL DEFAULT 0.0,
    `navigationScore` DOUBLE NOT NULL DEFAULT 0.0,
    `projectPresentationScore` DOUBLE NOT NULL DEFAULT 0.0,
    `recruiterReadinessScore` DOUBLE NOT NULL DEFAULT 0.0,
    `summary` TEXT NOT NULL,
    `strengths` JSON NOT NULL,
    `weaknesses` JSON NOT NULL,
    `recruiterPerspective` TEXT NOT NULL,
    `seoRecommendations` JSON NOT NULL,
    `accessibilityRecommendations` JSON NOT NULL,
    `designContentRecommendations` JSON NOT NULL,
    `improvementRoadmap` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `resumes` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL DEFAULT 'My Resume',
    `fileUrl` VARCHAR(191) NULL,
    `rawText` TEXT NOT NULL,
    `contactInfo` JSON NOT NULL,
    `workExperience` JSON NOT NULL,
    `education` JSON NOT NULL,
    `skills` JSON NOT NULL,
    `projects` JSON NOT NULL,
    `certifications` JSON NOT NULL,
    `atsScore` DOUBLE NOT NULL DEFAULT 0.0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `resume_analyses` (
    `id` VARCHAR(191) NOT NULL,
    `resumeId` VARCHAR(191) NOT NULL,
    `taskId` VARCHAR(191) NULL,
    `atsScore` DOUBLE NOT NULL DEFAULT 0.0,
    `formattingScore` DOUBLE NOT NULL DEFAULT 0.0,
    `contentImpactScore` DOUBLE NOT NULL DEFAULT 0.0,
    `skillsMatchScore` DOUBLE NOT NULL DEFAULT 0.0,
    `completenessScore` DOUBLE NOT NULL DEFAULT 0.0,
    `summary` TEXT NOT NULL,
    `actionableSuggestions` JSON NOT NULL,
    `bulletEvaluations` JSON NOT NULL,
    `missingKeywords` JSON NOT NULL,
    `formattingIssues` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `resume_github_verifications` (
    `id` VARCHAR(191) NOT NULL,
    `resumeId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `taskId` VARCHAR(191) NULL,
    `overallCoverageScore` DOUBLE NOT NULL DEFAULT 0.0,
    `verifiedClaimsCount` INT NOT NULL DEFAULT 0,
    `partialClaimsCount` INT NOT NULL DEFAULT 0,
    `notFoundClaimsCount` INT NOT NULL DEFAULT 0,
    `unverifiableClaimsCount` INT NOT NULL DEFAULT 0,
    `summary` TEXT NOT NULL,
    `claims` JSON NOT NULL,
    `projectMatches` JSON NOT NULL,
    `strongProjects` JSON NOT NULL,
    `recommendations` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cross_platform_verifications` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `taskId` VARCHAR(191) NULL,
    `technicalConsistencyScore` DOUBLE NOT NULL DEFAULT 0.0,
    `projectConsistencyScore` DOUBLE NOT NULL DEFAULT 0.0,
    `cpConsistencyScore` DOUBLE NOT NULL DEFAULT 0.0,
    `technologyConsistencyScore` DOUBLE NOT NULL DEFAULT 0.0,
    `overallCoverageScore` DOUBLE NOT NULL DEFAULT 0.0,
    `verifiedClaimsCount` INT NOT NULL DEFAULT 0,
    `partialClaimsCount` INT NOT NULL DEFAULT 0,
    `notFoundClaimsCount` INT NOT NULL DEFAULT 0,
    `unverifiableClaimsCount` INT NOT NULL DEFAULT 0,
    `discrepancyCount` INT NOT NULL DEFAULT 0,
    `summary` TEXT NOT NULL,
    `claims` JSON NOT NULL,
    `discrepancies` JSON NOT NULL,
    `projectCrossVerifications` JSON NOT NULL,
    `competitiveProgrammingVerifications` JSON NOT NULL,
    `technologyMatrix` JSON NOT NULL,
    `strongProfileSignals` JSON NOT NULL,
    `missingEvidenceRecommendations` JSON NOT NULL,
    `recommendations` JSON NOT NULL,
    `sourcesUsed` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `job_descriptions` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `company` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NULL,
    `employmentType` VARCHAR(191) NULL,
    `sourceUrl` VARCHAR(191) NULL,
    `rawDescription` TEXT NOT NULL,
    `normalizedText` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `job_matches` (
    `id` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `taskId` VARCHAR(191) NULL,
    `overallMatchScore` DOUBLE NOT NULL DEFAULT 0.0,
    `matchLabel` VARCHAR(191) NOT NULL DEFAULT 'Strong Alignment',
    `requiredSkillCoverage` DOUBLE NOT NULL DEFAULT 0.0,
    `preferredSkillCoverage` DOUBLE NOT NULL DEFAULT 0.0,
    `projectRelevanceScore` DOUBLE NOT NULL DEFAULT 0.0,
    `experienceMatchStatus` VARCHAR(191) NOT NULL DEFAULT 'MATCHED',
    `educationMatchStatus` VARCHAR(191) NOT NULL DEFAULT 'MATCHED',
    `cpRelevanceStatus` VARCHAR(191) NOT NULL DEFAULT 'NOT_APPLICABLE',
    `summary` TEXT NOT NULL,
    `extractedRequirements` JSON NOT NULL,
    `skillMatches` JSON NOT NULL,
    `projectRelevance` JSON NOT NULL,
    `missingSkills` JSON NOT NULL,
    `keywordAlignment` JSON NOT NULL,
    `recommendations` JSON NOT NULL,
    `interviewPriorities` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `job_readinesses` (
    `id` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `taskId` VARCHAR(191) NULL,
    `score` DOUBLE NOT NULL DEFAULT 0.0,
    `level` VARCHAR(191) NOT NULL DEFAULT 'DEVELOPING',
    `confidence` VARCHAR(191) NOT NULL DEFAULT 'MEDIUM',
    `interviewReadinessScore` DOUBLE NOT NULL DEFAULT 0.0,
    `dsaRelevance` VARCHAR(191) NOT NULL DEFAULT 'NOT_REQUIRED',
    `dimensions` JSON NOT NULL,
    `criticalGaps` JSON NOT NULL,
    `readinessBlockers` JSON NOT NULL,
    `strongSignals` JSON NOT NULL,
    `weakSignals` JSON NOT NULL,
    `interviewPrep` JSON NOT NULL,
    `preparationPriorities` JSON NOT NULL,
    `projectLeverage` JSON NOT NULL,
    `whatIfSimulation` JSON NOT NULL,
    `executiveSummary` TEXT NOT NULL,
    `dataFreshness` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `company_preparations` (
    `id` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `taskId` VARCHAR(191) NULL,
    `companyName` VARCHAR(191) NOT NULL,
    `jobTitle` VARCHAR(191) NOT NULL,
    `jobMatchScore` DOUBLE NOT NULL DEFAULT 0.0,
    `jobReadinessScore` DOUBLE NOT NULL DEFAULT 0.0,
    `preparationCoverageScore` DOUBLE NOT NULL DEFAULT 0.0,
    `topPriorityTopic` VARCHAR(191) NOT NULL DEFAULT '',
    `companyProfile` JSON NOT NULL,
    `coverageFormulaBreakdown` JSON NOT NULL,
    `priorityEngineFormulaDoc` TEXT NOT NULL,
    `priorityItems` JSON NOT NULL,
    `dsaPreparation` JSON NOT NULL,
    `technicalAndSystemDesignPrep` JSON NOT NULL,
    `projectPreparations` JSON NOT NULL,
    `behavioralPreparations` JSON NOT NULL,
    `companyResearch` JSON NOT NULL,
    `resumePositioning` JSON NOT NULL,
    `profileGaps` JSON NOT NULL,
    `skillTransfers` JSON NOT NULL,
    `roadmap` JSON NOT NULL,
    `executiveSummary` TEXT NOT NULL,
    `noFabricationDisclaimer` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `career_chats` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `mode` VARCHAR(191) NOT NULL DEFAULT 'GENERAL_CAREER_CHAT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `career_chat_messages` (
    `id` VARCHAR(191) NOT NULL,
    `chatId` VARCHAR(191) NOT NULL,
    `sender` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `mode` VARCHAR(191) NULL,
    `sourcesUsed` JSON NULL,
    `evidence` JSON NULL,
    `recommendations` JSON NULL,
    `score` DOUBLE NULL,
    `evaluation` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `interview_sessions` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NULL,
    `interviewType` VARCHAR(191) NOT NULL DEFAULT 'Technical',
    `difficulty` VARCHAR(191) NOT NULL DEFAULT 'Medium',
    `status` VARCHAR(191) NOT NULL DEFAULT 'IN_PROGRESS',
    `overallScore` DOUBLE NULL DEFAULT 0.0,
    `scoreBreakdown` JSON NULL,
    `finalFeedback` TEXT NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `interview_questions` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `questionIndex` INT NOT NULL,
    `questionText` TEXT NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `difficulty` VARCHAR(191) NOT NULL,
    `expectedKeyPoints` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `interview_answers` (
    `id` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `userResponse` TEXT NOT NULL,
    `score` DOUBLE NOT NULL DEFAULT 0.0,
    `strengths` JSON NOT NULL,
    `weaknesses` JSON NOT NULL,
    `missingPoints` JSON NOT NULL,
    `improvedAnswer` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `applications` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NULL,
    `companyName` VARCHAR(191) NOT NULL,
    `jobTitle` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NULL,
    `jobUrl` VARCHAR(191) NULL,
    `applicationDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` VARCHAR(191) NOT NULL DEFAULT 'SAVED',
    `priority` VARCHAR(191) NOT NULL DEFAULT 'MEDIUM',
    `notes` TEXT NULL,
    `salaryRange` VARCHAR(191) NULL,
    `source` VARCHAR(191) NULL DEFAULT 'OTHER',
    `deadline` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `application_events` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `eventDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `application_follow_ups` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `followUpDate` DATETIME(3) NOT NULL,
    `followUpNote` TEXT NULL,
    `completed` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `career_reports` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `summary` TEXT NOT NULL,
    `scores` JSON NULL,
    `strengths` JSON NULL,
    `gaps` JSON NULL,
    `recommendations` JSON NULL,
    `evidence` JSON NULL,
    `sourcesUsed` JSON NULL,
    `freshnessStatus` VARCHAR(191) NOT NULL DEFAULT 'FRESH',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `scheduled_jobs` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `jobType` VARCHAR(191) NOT NULL,
    `schedule` VARCHAR(191) NOT NULL,
    `frequency` VARCHAR(191) NOT NULL DEFAULT 'DAILY',
    `time` VARCHAR(191) NULL DEFAULT '09:00',
    `timezone` VARCHAR(191) NOT NULL DEFAULT 'UTC',
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `resourceId` VARCHAR(191) NULL,
    `lastRunAt` DATETIME(3) NULL,
    `nextRunAt` DATETIME(3) NULL,
    `lastStatus` VARCHAR(191) NULL,
    `lastError` TEXT NULL,
    `consecutiveFailures` INT NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `scheduled_job_executions` (
    `id` VARCHAR(191) NOT NULL,
    `scheduledJobId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `taskId` VARCHAR(191) NULL,
    `scheduledOccurrence` DATETIME(3) NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'QUEUED',
    `error` TEXT NULL,
    `durationMs` INT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `users_username_key` ON `users`(`username`);
CREATE UNIQUE INDEX `users_email_key` ON `users`(`email`);
CREATE UNIQUE INDEX `users_githubId_key` ON `users`(`githubId`);
CREATE UNIQUE INDEX `github_accounts_userId_key` ON `github_accounts`(`userId`);
CREATE UNIQUE INDEX `github_accounts_githubUserId_key` ON `github_accounts`(`githubUserId`);
CREATE UNIQUE INDEX `repositories_githubRepoId_key` ON `repositories`(`githubRepoId`);
CREATE UNIQUE INDEX `repositories_fullName_key` ON `repositories`(`fullName`);
CREATE UNIQUE INDEX `repository_metadata_repositoryId_key` ON `repository_metadata`(`repositoryId`);
CREATE UNIQUE INDEX `repository_statistics_repositoryId_key` ON `repository_statistics`(`repositoryId`);
CREATE UNIQUE INDEX `repository_branches_repositoryId_name_key` ON `repository_branches`(`repositoryId`, `name`);
CREATE UNIQUE INDEX `repository_commits_repositoryId_sha_key` ON `repository_commits`(`repositoryId`, `sha`);
CREATE UNIQUE INDEX `repository_contributors_repositoryId_username_key` ON `repository_contributors`(`repositoryId`, `username`);
CREATE UNIQUE INDEX `repository_issues_repositoryId_issueNumber_key` ON `repository_issues`(`repositoryId`, `issueNumber`);
CREATE UNIQUE INDEX `repository_pull_requests_repositoryId_prNumber_key` ON `repository_pull_requests`(`repositoryId`, `prNumber`);
CREATE UNIQUE INDEX `repository_languages_repositoryId_name_key` ON `repository_languages`(`repositoryId`, `name`);
CREATE UNIQUE INDEX `repository_syncs_taskId_key` ON `repository_syncs`(`taskId`);
CREATE UNIQUE INDEX `repository_files_repositoryId_path_key` ON `repository_files`(`repositoryId`, `path`);
CREATE UNIQUE INDEX `task_queue_items_taskId_key` ON `task_queue_items`(`taskId`);
CREATE UNIQUE INDEX `workers_workerId_key` ON `workers`(`workerId`);
CREATE UNIQUE INDEX `ai_analysis_reports_taskId_key` ON `ai_analysis_reports`(`taskId`);
CREATE UNIQUE INDEX `refresh_tokens_tokenHash_key` ON `refresh_tokens`(`tokenHash`);
CREATE UNIQUE INDEX `sessions_sessionToken_key` ON `sessions`(`sessionToken`);
CREATE UNIQUE INDEX `user_settings_userId_key` ON `user_settings`(`userId`);
CREATE UNIQUE INDEX `leetcode_profiles_userId_key` ON `leetcode_profiles`(`userId`);
CREATE UNIQUE INDEX `leetcode_topic_stats_profileId_topicName_key` ON `leetcode_topic_stats`(`profileId`, `topicName`);
CREATE UNIQUE INDEX `leetcode_analyses_taskId_key` ON `leetcode_analyses`(`taskId`);
CREATE UNIQUE INDEX `codeforces_profiles_userId_key` ON `codeforces_profiles`(`userId`);
CREATE UNIQUE INDEX `codeforces_tag_stats_profileId_tagName_key` ON `codeforces_tag_stats`(`profileId`, `tagName`);
CREATE UNIQUE INDEX `codeforces_analyses_taskId_key` ON `codeforces_analyses`(`taskId`);
CREATE UNIQUE INDEX `portfolios_userId_key` ON `portfolios`(`userId`);
CREATE UNIQUE INDEX `portfolio_analyses_taskId_key` ON `portfolio_analyses`(`taskId`);
CREATE UNIQUE INDEX `resume_analyses_taskId_key` ON `resume_analyses`(`taskId`);
CREATE UNIQUE INDEX `resume_github_verifications_taskId_key` ON `resume_github_verifications`(`taskId`);
CREATE UNIQUE INDEX `cross_platform_verifications_taskId_key` ON `cross_platform_verifications`(`taskId`);
CREATE UNIQUE INDEX `job_matches_taskId_key` ON `job_matches`(`taskId`);
CREATE UNIQUE INDEX `job_readinesses_taskId_key` ON `job_readinesses`(`taskId`);
CREATE UNIQUE INDEX `company_preparations_taskId_key` ON `company_preparations`(`taskId`);
CREATE UNIQUE INDEX `interview_answers_questionId_key` ON `interview_answers`(`questionId`);

CREATE INDEX `users_githubId_idx` ON `users`(`githubId`);
CREATE INDEX `users_email_idx` ON `users`(`email`);
CREATE INDEX `users_role_status_idx` ON `users`(`role`, `status`);
CREATE INDEX `github_accounts_githubUserId_idx` ON `github_accounts`(`githubUserId`);
CREATE INDEX `repositories_userId_idx` ON `repositories`(`userId`);
CREATE INDEX `repositories_owner_name_idx` ON `repositories`(`owner`, `name`);
CREATE INDEX `repositories_language_idx` ON `repositories`(`language`);
CREATE INDEX `repositories_githubRepoId_idx` ON `repositories`(`githubRepoId`);
CREATE INDEX `repository_branches_repositoryId_idx` ON `repository_branches`(`repositoryId`);
CREATE INDEX `repository_commits_repositoryId_commitDate_idx` ON `repository_commits`(`repositoryId`, `commitDate`);
CREATE INDEX `repository_contributors_repositoryId_idx` ON `repository_contributors`(`repositoryId`);
CREATE INDEX `repository_issues_repositoryId_state_idx` ON `repository_issues`(`repositoryId`, `state`);
CREATE INDEX `repository_pull_requests_repositoryId_state_idx` ON `repository_pull_requests`(`repositoryId`, `state`);
CREATE INDEX `repository_languages_repositoryId_idx` ON `repository_languages`(`repositoryId`);
CREATE INDEX `repository_syncs_repositoryId_createdAt_idx` ON `repository_syncs`(`repositoryId`, `createdAt`);
CREATE INDEX `repository_files_repositoryId_path_idx` ON `repository_files`(`repositoryId`, `path`);
CREATE INDEX `tasks_status_priority_createdAt_idx` ON `tasks`(`status`, `priority`, `createdAt`);
CREATE INDEX `tasks_userId_idx` ON `tasks`(`userId`);
CREATE INDEX `tasks_repositoryId_idx` ON `tasks`(`repositoryId`);
CREATE INDEX `tasks_workerId_idx` ON `tasks`(`workerId`);
CREATE INDEX `tasks_status_idx` ON `tasks`(`status`);
CREATE INDEX `task_queue_items_priorityWeight_addedAt_idx` ON `task_queue_items`(`priorityWeight`, `addedAt`);
CREATE INDEX `workers_status_lastHeartbeat_idx` ON `workers`(`status`, `lastHeartbeat`);
CREATE INDEX `workers_workerId_idx` ON `workers`(`workerId`);
CREATE INDEX `worker_metrics_workerId_timestamp_idx` ON `worker_metrics`(`workerId`, `timestamp`);
CREATE INDEX `worker_metrics_timestamp_idx` ON `worker_metrics`(`timestamp`);
CREATE INDEX `task_execution_logs_taskId_timestamp_idx` ON `task_execution_logs`(`taskId`, `timestamp`);
CREATE INDEX `task_execution_logs_workerId_idx` ON `task_execution_logs`(`workerId`);
CREATE INDEX `task_execution_logs_level_idx` ON `task_execution_logs`(`level`);
CREATE INDEX `ai_analysis_reports_repositoryId_createdAt_idx` ON `ai_analysis_reports`(`repositoryId`, `createdAt`);
CREATE INDEX `ai_analysis_reports_taskId_idx` ON `ai_analysis_reports`(`taskId`);
CREATE INDEX `ai_findings_reportId_severity_idx` ON `ai_findings`(`reportId`, `severity`);
CREATE INDEX `ai_findings_category_idx` ON `ai_findings`(`category`);
CREATE INDEX `notifications_userId_isRead_createdAt_idx` ON `notifications`(`userId`, `isRead`, `createdAt`);
CREATE INDEX `refresh_tokens_userId_idx` ON `refresh_tokens`(`userId`);
CREATE INDEX `refresh_tokens_tokenHash_idx` ON `refresh_tokens`(`tokenHash`);
CREATE INDEX `sessions_userId_idx` ON `sessions`(`userId`);
CREATE INDEX `sessions_sessionToken_idx` ON `sessions`(`sessionToken`);
CREATE INDEX `leetcode_profiles_userId_idx` ON `leetcode_profiles`(`userId`);
CREATE INDEX `leetcode_profiles_username_idx` ON `leetcode_profiles`(`username`);
CREATE INDEX `leetcode_contests_profileId_contestDate_idx` ON `leetcode_contests`(`profileId`, `contestDate`);
CREATE INDEX `leetcode_topic_stats_profileId_idx` ON `leetcode_topic_stats`(`profileId`);
CREATE INDEX `leetcode_analyses_profileId_createdAt_idx` ON `leetcode_analyses`(`profileId`, `createdAt`);
CREATE INDEX `codeforces_profiles_userId_idx` ON `codeforces_profiles`(`userId`);
CREATE INDEX `codeforces_profiles_handle_idx` ON `codeforces_profiles`(`handle`);
CREATE INDEX `codeforces_contests_profileId_contestDate_idx` ON `codeforces_contests`(`profileId`, `contestDate`);
CREATE INDEX `codeforces_tag_stats_profileId_idx` ON `codeforces_tag_stats`(`profileId`);
CREATE INDEX `codeforces_analyses_profileId_createdAt_idx` ON `codeforces_analyses`(`profileId`, `createdAt`);
CREATE INDEX `portfolios_userId_idx` ON `portfolios`(`userId`);
CREATE INDEX `portfolios_domain_idx` ON `portfolios`(`domain`);
CREATE INDEX `portfolio_pages_portfolioId_idx` ON `portfolio_pages`(`portfolioId`);
CREATE INDEX `portfolio_pages_portfolioId_path_idx` ON `portfolio_pages`(`portfolioId`, `path`);
CREATE INDEX `portfolio_projects_portfolioId_idx` ON `portfolio_projects`(`portfolioId`);
CREATE INDEX `portfolio_links_portfolioId_idx` ON `portfolio_links`(`portfolioId`);
CREATE INDEX `portfolio_links_portfolioId_linkType_idx` ON `portfolio_links`(`portfolioId`, `linkType`);
CREATE INDEX `portfolio_analyses_portfolioId_createdAt_idx` ON `portfolio_analyses`(`portfolioId`, `createdAt`);
CREATE INDEX `resumes_userId_createdAt_idx` ON `resumes`(`userId`, `createdAt`);
CREATE INDEX `resume_analyses_resumeId_createdAt_idx` ON `resume_analyses`(`resumeId`, `createdAt`);
CREATE INDEX `resume_github_verifications_resumeId_createdAt_idx` ON `resume_github_verifications`(`resumeId`, `createdAt`);
CREATE INDEX `resume_github_verifications_userId_idx` ON `resume_github_verifications`(`userId`);
CREATE INDEX `cross_platform_verifications_userId_createdAt_idx` ON `cross_platform_verifications`(`userId`, `createdAt`);
CREATE INDEX `job_descriptions_userId_createdAt_idx` ON `job_descriptions`(`userId`, `createdAt`);
CREATE INDEX `job_matches_jobId_createdAt_idx` ON `job_matches`(`jobId`, `createdAt`);
CREATE INDEX `job_matches_userId_createdAt_idx` ON `job_matches`(`userId`, `createdAt`);
CREATE INDEX `job_readinesses_jobId_createdAt_idx` ON `job_readinesses`(`jobId`, `createdAt`);
CREATE INDEX `job_readinesses_userId_createdAt_idx` ON `job_readinesses`(`userId`, `createdAt`);
CREATE INDEX `company_preparations_jobId_createdAt_idx` ON `company_preparations`(`jobId`, `createdAt`);
CREATE INDEX `company_preparations_userId_createdAt_idx` ON `company_preparations`(`userId`, `createdAt`);
CREATE INDEX `career_chats_userId_createdAt_idx` ON `career_chats`(`userId`, `createdAt`);
CREATE INDEX `career_chat_messages_chatId_createdAt_idx` ON `career_chat_messages`(`chatId`, `createdAt`);
CREATE INDEX `interview_sessions_userId_createdAt_idx` ON `interview_sessions`(`userId`, `createdAt`);
CREATE INDEX `interview_questions_sessionId_questionIndex_idx` ON `interview_questions`(`sessionId`, `questionIndex`);
CREATE INDEX `applications_userId_createdAt_idx` ON `applications`(`userId`, `createdAt`);
CREATE INDEX `applications_userId_status_idx` ON `applications`(`userId`, `status`);
CREATE INDEX `applications_jobId_idx` ON `applications`(`jobId`);
CREATE INDEX `application_events_applicationId_eventDate_idx` ON `application_events`(`applicationId`, `eventDate`);
CREATE INDEX `application_follow_ups_applicationId_followUpDate_idx` ON `application_follow_ups`(`applicationId`, `followUpDate`);
CREATE INDEX `career_reports_userId_createdAt_idx` ON `career_reports`(`userId`, `createdAt`);
CREATE INDEX `career_reports_userId_type_idx` ON `career_reports`(`userId`, `type`);
CREATE INDEX `scheduled_jobs_userId_status_idx` ON `scheduled_jobs`(`userId`, `status`);
CREATE INDEX `scheduled_jobs_enabled_status_nextRunAt_idx` ON `scheduled_jobs`(`enabled`, `status`, `nextRunAt`);
CREATE INDEX `scheduled_job_executions_scheduledJobId_createdAt_idx` ON `scheduled_job_executions`(`scheduledJobId`, `createdAt`);
CREATE INDEX `scheduled_job_executions_userId_idx` ON `scheduled_job_executions`(`userId`);
CREATE INDEX `scheduled_job_executions_scheduledJobId_scheduledOccurrence_idx` ON `scheduled_job_executions`(`scheduledJobId`, `scheduledOccurrence`);

ALTER TABLE `github_accounts` ADD CONSTRAINT `github_accounts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `repositories` ADD CONSTRAINT `repositories_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `repository_metadata` ADD CONSTRAINT `repository_metadata_repositoryId_fkey` FOREIGN KEY (`repositoryId`) REFERENCES `repositories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `repository_statistics` ADD CONSTRAINT `repository_statistics_repositoryId_fkey` FOREIGN KEY (`repositoryId`) REFERENCES `repositories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `repository_branches` ADD CONSTRAINT `repository_branches_repositoryId_fkey` FOREIGN KEY (`repositoryId`) REFERENCES `repositories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `repository_commits` ADD CONSTRAINT `repository_commits_repositoryId_fkey` FOREIGN KEY (`repositoryId`) REFERENCES `repositories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `repository_contributors` ADD CONSTRAINT `repository_contributors_repositoryId_fkey` FOREIGN KEY (`repositoryId`) REFERENCES `repositories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `repository_issues` ADD CONSTRAINT `repository_issues_repositoryId_fkey` FOREIGN KEY (`repositoryId`) REFERENCES `repositories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `repository_pull_requests` ADD CONSTRAINT `repository_pull_requests_repositoryId_fkey` FOREIGN KEY (`repositoryId`) REFERENCES `repositories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `repository_languages` ADD CONSTRAINT `repository_languages_repositoryId_fkey` FOREIGN KEY (`repositoryId`) REFERENCES `repositories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `repository_syncs` ADD CONSTRAINT `repository_syncs_repositoryId_fkey` FOREIGN KEY (`repositoryId`) REFERENCES `repositories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `repository_files` ADD CONSTRAINT `repository_files_repositoryId_fkey` FOREIGN KEY (`repositoryId`) REFERENCES `repositories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_repositoryId_fkey` FOREIGN KEY (`repositoryId`) REFERENCES `repositories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_workerId_fkey` FOREIGN KEY (`workerId`) REFERENCES `workers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `task_queue_items` ADD CONSTRAINT `task_queue_items_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `worker_metrics` ADD CONSTRAINT `worker_metrics_workerId_fkey` FOREIGN KEY (`workerId`) REFERENCES `workers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `task_execution_logs` ADD CONSTRAINT `task_execution_logs_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `task_execution_logs` ADD CONSTRAINT `task_execution_logs_workerId_fkey` FOREIGN KEY (`workerId`) REFERENCES `workers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `ai_analysis_reports` ADD CONSTRAINT `ai_analysis_reports_repositoryId_fkey` FOREIGN KEY (`repositoryId`) REFERENCES `repositories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ai_analysis_reports` ADD CONSTRAINT `ai_analysis_reports_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ai_findings` ADD CONSTRAINT `ai_findings_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `ai_analysis_reports`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_relatedTaskId_fkey` FOREIGN KEY (`relatedTaskId`) REFERENCES `tasks`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_relatedRepositoryId_fkey` FOREIGN KEY (`relatedRepositoryId`) REFERENCES `repositories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `user_settings` ADD CONSTRAINT `user_settings_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `leetcode_profiles` ADD CONSTRAINT `leetcode_profiles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `leetcode_contests` ADD CONSTRAINT `leetcode_contests_profileId_fkey` FOREIGN KEY (`profileId`) REFERENCES `leetcode_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `leetcode_topic_stats` ADD CONSTRAINT `leetcode_topic_stats_profileId_fkey` FOREIGN KEY (`profileId`) REFERENCES `leetcode_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `leetcode_analyses` ADD CONSTRAINT `leetcode_analyses_profileId_fkey` FOREIGN KEY (`profileId`) REFERENCES `leetcode_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `leetcode_analyses` ADD CONSTRAINT `leetcode_analyses_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `codeforces_profiles` ADD CONSTRAINT `codeforces_profiles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `codeforces_contests` ADD CONSTRAINT `codeforces_contests_profileId_fkey` FOREIGN KEY (`profileId`) REFERENCES `codeforces_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `codeforces_tag_stats` ADD CONSTRAINT `codeforces_tag_stats_profileId_fkey` FOREIGN KEY (`profileId`) REFERENCES `codeforces_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `codeforces_analyses` ADD CONSTRAINT `codeforces_analyses_profileId_fkey` FOREIGN KEY (`profileId`) REFERENCES `codeforces_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `codeforces_analyses` ADD CONSTRAINT `codeforces_analyses_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `portfolios` ADD CONSTRAINT `portfolios_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `portfolio_pages` ADD CONSTRAINT `portfolio_pages_portfolioId_fkey` FOREIGN KEY (`portfolioId`) REFERENCES `portfolios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `portfolio_projects` ADD CONSTRAINT `portfolio_projects_portfolioId_fkey` FOREIGN KEY (`portfolioId`) REFERENCES `portfolios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `portfolio_links` ADD CONSTRAINT `portfolio_links_portfolioId_fkey` FOREIGN KEY (`portfolioId`) REFERENCES `portfolios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `portfolio_analyses` ADD CONSTRAINT `portfolio_analyses_portfolioId_fkey` FOREIGN KEY (`portfolioId`) REFERENCES `portfolios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `portfolio_analyses` ADD CONSTRAINT `portfolio_analyses_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `resumes` ADD CONSTRAINT `resumes_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `resume_analyses` ADD CONSTRAINT `resume_analyses_resumeId_fkey` FOREIGN KEY (`resumeId`) REFERENCES `resumes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `resume_analyses` ADD CONSTRAINT `resume_analyses_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `resume_github_verifications` ADD CONSTRAINT `resume_github_verifications_resumeId_fkey` FOREIGN KEY (`resumeId`) REFERENCES `resumes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `resume_github_verifications` ADD CONSTRAINT `resume_github_verifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `resume_github_verifications` ADD CONSTRAINT `resume_github_verifications_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `cross_platform_verifications` ADD CONSTRAINT `cross_platform_verifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `cross_platform_verifications` ADD CONSTRAINT `cross_platform_verifications_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `job_descriptions` ADD CONSTRAINT `job_descriptions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `job_matches` ADD CONSTRAINT `job_matches_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `job_descriptions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `job_matches` ADD CONSTRAINT `job_matches_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `job_matches` ADD CONSTRAINT `job_matches_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `job_readinesses` ADD CONSTRAINT `job_readinesses_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `job_descriptions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `job_readinesses` ADD CONSTRAINT `job_readinesses_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `job_readinesses` ADD CONSTRAINT `job_readinesses_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `company_preparations` ADD CONSTRAINT `company_preparations_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `job_descriptions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `company_preparations` ADD CONSTRAINT `company_preparations_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `company_preparations` ADD CONSTRAINT `company_preparations_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `career_chats` ADD CONSTRAINT `career_chats_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `career_chats` ADD CONSTRAINT `career_chats_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `job_descriptions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `career_chat_messages` ADD CONSTRAINT `career_chat_messages_chatId_fkey` FOREIGN KEY (`chatId`) REFERENCES `career_chats`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `interview_sessions` ADD CONSTRAINT `interview_sessions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `interview_sessions` ADD CONSTRAINT `interview_sessions_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `job_descriptions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `interview_questions` ADD CONSTRAINT `interview_questions_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `interview_sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `interview_answers` ADD CONSTRAINT `interview_answers_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `interview_questions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `applications` ADD CONSTRAINT `applications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `applications` ADD CONSTRAINT `applications_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `job_descriptions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `application_events` ADD CONSTRAINT `application_events_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `application_follow_ups` ADD CONSTRAINT `application_follow_ups_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `career_reports` ADD CONSTRAINT `career_reports_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `scheduled_jobs` ADD CONSTRAINT `scheduled_jobs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `scheduled_job_executions` ADD CONSTRAINT `scheduled_job_executions_scheduledJobId_fkey` FOREIGN KEY (`scheduledJobId`) REFERENCES `scheduled_jobs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;