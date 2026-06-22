import fs from "fs";
import path from "path";
import { DatabaseSchema, User, UserProfile, Channel, AnalyticsSnapshot, AutomationJob, AutomationHistory, TaskEntity, TaskStatus, TaskType, PoolSnapshot } from "../models/types.js";

// Make sure the data directory exists
const DATA_DIR = "/data"; // Using the persistent absolute path in container
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.warn("Could not create absolute /data dir, falling back to local: ", err);
  }
}

const DB_FILE = fs.existsSync(DATA_DIR) 
  ? path.join(DATA_DIR, "sqlite_emulator.json") 
  : path.join(process.cwd(), "sqlite_emulator.json");

export function readDatabase(): DatabaseSchema {
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(data);
    } catch (e) {
      console.error("Failed to parse database file, resetting:", e);
    }
  }

  const now = Date.now();
  const users: User[] = [
    {
      id: "user-demo",
      name: "Demo Operator",
      username: "demo",
      email: "demo@threadforge.co",
      passwordHash: "demo123",
      profilePictureUrl: "",
      role: "USER" as const,
      isActive: true,
      createdAt: now - 30 * 24 * 3600 * 1000,
      lastLogin: now,
      refreshToken: null,
      refreshTokenExpiry: null
    }
  ];

  const userProfiles: UserProfile[] = [
    {
      userId: "user-demo",
      githubUsername: "octocat",
      leetcodeUsername: "demouser",
      codeforcesUsername: "codeforces-demo",
      youtubeChannelId: "UCxxxxxx",
      instagramUsername: "@demo_insta",
      twitterUsername: "@demo_x",
      linkedinUsername: "demo-link",
      updatedAt: now,
      notificationMorningReport: true,
      notificationWeeklyGithub: true,
      notificationWeeklyLeetcode: true,
      notificationAnalyticsSync: true
    }
  ];

  const channels: Channel[] = [
    {
      id: "chan-1",
      userId: "user-demo",
      name: "Weekend Lore",
      platform: "YOUTUBE",
      niche: "History & Mythic Lore",
      postingFrequency: "2x weekly",
      description: "Exploring historical mysteries, ancient artifacts, and forgotten lore.",
      createdAt: now - 15 * 24 * 3600 * 1000,
      isPrimary: true,
      colorTag: "#00FF9C"
    },
    {
      id: "chan-2",
      userId: "user-demo",
      name: "Weekend Payoff",
      platform: "YOUTUBE",
      niche: "Finance & Dev Productivity",
      postingFrequency: "Daily shorts",
      description: "High-density career advice, passive income breakdowns, and software metrics.",
      createdAt: now - 10 * 24 * 3600 * 1000,
      isPrimary: false,
      colorTag: "#f59e0b"
    }
  ];

  // Seed analytics snapshots
  const analyticsSnapshots: AnalyticsSnapshot[] = [];
  const channelsList = ["chan-1", "chan-2"];
  
  channelsList.forEach((chanId) => {
    let viewsAcc = chanId === "chan-1" ? 12000 : 8000;
    let subAcc = chanId === "chan-1" ? 350 : 220;
    let revAcc = chanId === "chan-1" ? 150 : 80;
    let watchAcc = chanId === "chan-1" ? 450 : 310;

    for (let d = 30; d >= 1; d--) {
      const recordedAt = now - d * 24 * 3600 * 1000;
      viewsAcc += Math.floor(Math.random() * 800 + 400);
      subAcc += Math.floor(Math.random() * 15 + 4);
      revAcc += parseFloat((Math.random() * 12 + 2).toFixed(2));
      watchAcc += Math.floor(Math.random() * 25 + 10);

      analyticsSnapshots.push({
        id: `anal-day-${chanId}-${d}`,
        channelId: chanId,
        recordedAt,
        views: viewsAcc,
        likes: Math.floor(viewsAcc * 0.08),
        comments: Math.floor(viewsAcc * 0.015),
        subscribers: subAcc,
        revenueUsd: parseFloat(revAcc.toFixed(2)),
        watchTimeHours: watchAcc,
        period: "DAILY"
      });
    }

    for (let w = 12; w >= 1; w--) {
      const recordedAt = now - w * 7 * 24 * 3600 * 1000;
      analyticsSnapshots.push({
        id: `anal-week-${chanId}-${w}`,
        channelId: chanId,
        recordedAt,
        views: viewsAcc - (12 - w) * 3500 + Math.floor(Math.random() * 500),
        likes: Math.floor((viewsAcc - (12 - w) * 3500) * 0.08),
        comments: Math.floor((viewsAcc - (12 - w) * 3500) * 0.012),
        subscribers: subAcc - (12 - w) * 60 + Math.floor(Math.random() * 5),
        revenueUsd: parseFloat((revAcc - (12 - w) * 45).toFixed(2)),
        watchTimeHours: watchAcc - (12 - w) * 110,
        period: "WEEKLY"
      });
    }

    for (let m = 6; m >= 1; m--) {
      const recordedAt = now - m * 30 * 24 * 3600 * 1000;
      analyticsSnapshots.push({
        id: `anal-month-${chanId}-${m}`,
        channelId: chanId,
        recordedAt,
        views: viewsAcc - (6 - m) * 12000 + Math.floor(Math.random() * 1000),
        likes: Math.floor((viewsAcc - (6 - m) * 12000) * 0.085),
        comments: Math.floor((viewsAcc - (6 - m) * 12000) * 0.015),
        subscribers: subAcc - (6 - m) * 240 + Math.floor(Math.random() * 20),
        revenueUsd: parseFloat((revAcc - (6 - m) * 180).toFixed(2)),
        watchTimeHours: watchAcc - (6 - m) * 420,
        period: "MONTHLY"
      });
    }
  });

  const automationJobs: AutomationJob[] = [
    {
      id: "job-1",
      userId: "user-demo",
      name: "Daily Developer Stats Sync",
      jobType: "GITHUB_DAILY_REPORT" as const,
      scheduleCron: "0 0 8 * * *",
      configJson: JSON.stringify({
        githubUsername: "octocat",
        leetcodeUsername: "demouser",
        topic: "Java and Concurrency Practices"
      }),
      isActive: true,
      lastRunAt: now - 18 * 3600 * 1000,
      nextRunAt: now + 6 * 3600 * 1000,
      createdAt: now - 5 * 24 * 3600 * 1000
    },
    {
      id: "job-2",
      userId: "user-demo",
      name: "Weekly Analytics Summary Generator",
      jobType: "ANALYTICS_SYNC" as const,
      scheduleCron: "0 0 0 * * 0",
      configJson: JSON.stringify({
        channelId: "chan-1"
      }),
      isActive: true,
      lastRunAt: now - 3 * 24 * 3600 * 1000,
      nextRunAt: now + 4 * 24 * 3600 * 1000,
      createdAt: now - 10 * 24 * 3600 * 1000
    }
  ];

  const automationHistory: AutomationHistory[] = [
    {
      id: "hist-1",
      jobId: "job-1",
      executedAt: now - 18 * 3600 * 1000,
      status: "SUCCESS" as const,
      resultSummary: "Fetched GITHUB_DEV logs for octocat. Repo count: 8, Followers: 4324, Commits: 52.",
      executionTimeMs: 1450
    }
  ];

  // Seed tasks
  const tasks: TaskEntity[] = [];
  const poolSnapshots: PoolSnapshot[] = [];

  const types = [TaskType.SIMPLE, TaskType.PRIORITY, TaskType.SCHEDULED, TaskType.RETRY, TaskType.CANCELLABLE];
  for (let i = 0; i < 60; i++) {
    const hoursAgo = Math.random() * 24;
    const submittedTime = now - hoursAgo * 3600 * 1000;
    const waitTime = Math.random() * 200 + 30;
    const startedTime = submittedTime + waitTime;
    const execTime = Math.random() * 1200 + 400;
    const completedTime = startedTime + execTime;
    const status = Math.random() < 0.96 ? TaskStatus.COMPLETED : TaskStatus.FAILED;

    tasks.push({
      id: `task-seed-${i}`,
      type: types[Math.floor(Math.random() * types.length)],
      priority: Math.floor(Math.random() * 10) + 1,
      delayMs: 0,
      status,
      submittedAt: submittedTime,
      startedAt: startedTime,
      completedAt: completedTime,
      waitTimeMs: waitTime,
      execTimeMs: execTime,
      threadId: String(Math.floor(Math.random() * 8) + 1),
      retryCount: status === TaskStatus.FAILED ? 2 : 0,
      maxRetries: 2,
      errorMessage: status === TaskStatus.FAILED ? "Simulated CPU starvation check" : "",
      workDurationMs: execTime,
      failureProbability: 0.1
    });
  }

  for (let h = 48; h >= 0; h--) {
    const snapshotTime = now - h * 3600 * 1000;
    const hr = new Date(snapshotTime).getHours();
    const loadFactor = (hr >= 9 && hr <= 17) ? 0.8 : 0.3;
    const activeThreads = Math.min(8, Math.floor(loadFactor * 8 + Math.random() * 2));
    const completedTotal = (48 - h) * 45 + Math.floor(Math.random() * 10);

    poolSnapshots.push({
      id: `snap-seed-${h}`,
      timestamp: snapshotTime,
      activeThreads,
      queueSize: Math.floor(loadFactor * 4 * Math.random()),
      completedTotal,
      failedTotal: Math.floor(completedTotal * 0.03),
      throughputPerMin: Math.floor(loadFactor * 15 + Math.random() * 8),
      threadUtilization: Math.floor(loadFactor * 100)
    });
  }

  const db: DatabaseSchema = {
    users,
    userProfiles,
    channels,
    workflows: [],
    workflowTasks: [],
    tasks,
    analyticsSnapshots,
    automationJobs,
    automationHistory,
    poolSnapshots
  };

  writeDatabase(db);
  return db;
}

export function writeDatabase(db: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error("Could not write local emulator database:", err);
  }
}
