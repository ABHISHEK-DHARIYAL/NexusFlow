import { Request, Response } from "express";
import { readDatabase, writeDatabase } from "../utils/dbLocal.js";
import { User, UserProfile } from "../models/types.js";

export const signup = (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({
      error: "Missing required fields"
    });
  }

  const db = readDatabase();
  const exists = db.users.some(u => u.email === email);
  if (exists) {
    return res.status(400).json({ error: "Email already exists" });
  }

  const userId = "user-" + Math.random().toString(36).substring(2, 9);
  
  const now = Date.now();
  const accessToken = "at-mock::" + userId + "::" + (now + 15 * 60 * 1000);
  const refreshToken = "rt-mock::" + userId + "::" + (now + 7 * 24 * 60 * 60 * 1000);

  const newUser: User = {
    id: userId,
    name: username,
    username,
    email,
    passwordHash: password, // Simulated bcrypt
    profilePictureUrl: "",
    role: "USER",
    isActive: true,
    createdAt: now,
    lastLogin: now,
    refreshToken: refreshToken,
    refreshTokenExpiry: now + 7 * 24 * 60 * 60 * 1000
  };

  db.users.push(newUser);

  // Create empty user_profiles row for this user
  const newProfile: UserProfile = {
    userId,
    githubUsername: null,
    leetcodeUsername: null,
    codeforcesUsername: null,
    youtubeChannelId: null,
    instagramUsername: null,
    twitterUsername: null,
    linkedinUsername: null,
    updatedAt: now,
    notificationMorningReport: true,
    notificationWeeklyGithub: true,
    notificationWeeklyLeetcode: true,
    notificationAnalyticsSync: true
  };
  db.userProfiles.push(newProfile);

  // Pre-fill default demo social channels for user convenience
  db.channels.push({
    id: "chan-" + Math.random().toString(36).substring(2, 7),
    userId: newUser.id,
    name: "Dev Quest Threads",
    platform: "YOUTUBE",
    niche: "Coding & Concurrency",
    postingFrequency: "3x weekly",
    description: "Documenting advanced Java systems, thread pool simulations, and CPU internals.",
    createdAt: now,
    isPrimary: true,
    colorTag: "#00FF9C"
  });

  writeDatabase(db);

  return res.json({
    accessToken,
    refreshToken,
    token: accessToken,
    user: {
      id: newUser.id,
      name: newUser.name,
      username: newUser.username,
      email: newUser.email,
      profilePictureUrl: newUser.profilePictureUrl,
      role: newUser.role,
      isActive: newUser.isActive,
      createdAt: newUser.createdAt,
      lastLogin: newUser.lastLogin
    }
  });
};

export const login = (req: Request, res: Response) => {
  const { email, password } = req.body;
  const db = readDatabase();
  const user = db.users.find(u => u.email === email && u.passwordHash === password);
  if (!user) {
    return res.status(400).json({ error: "Invalid email or password credentials" });
  }

  const now = Date.now();
  const accessToken = "at-mock::" + user.id + "::" + (now + 15 * 60 * 1000);
  const refreshToken = "rt-mock::" + user.id + "::" + (now + 7 * 24 * 60 * 60 * 1000);

  user.lastLogin = now;
  user.refreshToken = refreshToken;
  user.refreshTokenExpiry = now + 7 * 24 * 60 * 60 * 1000;

  let profile = db.userProfiles.find(p => p.userId === user.id);
  if (!profile) {
    profile = {
      userId: user.id,
      githubUsername: null,
      leetcodeUsername: null,
      codeforcesUsername: null,
      youtubeChannelId: null,
      instagramUsername: null,
      twitterUsername: null,
      linkedinUsername: null,
      updatedAt: now,
      notificationMorningReport: true,
      notificationWeeklyGithub: true,
      notificationWeeklyLeetcode: true,
      notificationAnalyticsSync: true
    };
    db.userProfiles.push(profile);
  }

  writeDatabase(db);

  return res.json({
    accessToken,
    refreshToken,
    token: accessToken,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      profilePictureUrl: user.profilePictureUrl,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    },
    profile
  });
};

export const refresh = (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: "Refresh token is required" });
  }

  const db = readDatabase();
  const user = db.users.find(u => u.refreshToken === refreshToken);
  if (!user) {
    return res.status(401).json({ error: "Invalid refresh token" });
  }

  if (!user.refreshTokenExpiry || Date.now() > user.refreshTokenExpiry) {
    return res.status(401).json({ error: "Refresh token has expired" });
  }

  const now = Date.now();
  const accessToken = "at-mock::" + user.id + "::" + (now + 15 * 60 * 1000);

  return res.json({ accessToken });
};

// Expects req.user set by authMiddleware
export const logout = (req: any, res: Response) => {
  const db = readDatabase();
  const user = db.users.find(u => u.id === req.user.id);
  if (user) {
    user.refreshToken = null;
    user.refreshTokenExpiry = null;
    writeDatabase(db);
  }
  return res.json({ success: true, message: "Logged out successfully" });
};

export const me = (req: any, res: Response) => {
  const db = readDatabase();
  let profile = db.userProfiles.find(p => p.userId === req.user.id);
  if (!profile) {
    profile = {
      userId: req.user.id,
      githubUsername: null,
      leetcodeUsername: null,
      codeforcesUsername: null,
      youtubeChannelId: null,
      instagramUsername: null,
      twitterUsername: null,
      linkedinUsername: null,
      updatedAt: Date.now(),
      notificationMorningReport: true,
      notificationWeeklyGithub: true,
      notificationWeeklyLeetcode: true,
      notificationAnalyticsSync: true
    };
    db.userProfiles.push(profile);
    writeDatabase(db);
  }

  return res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      username: req.user.username,
      email: req.user.email,
      profilePictureUrl: req.user.profilePictureUrl,
      role: req.user.role,
      isActive: req.user.isActive,
      createdAt: req.user.createdAt,
      lastLogin: req.user.lastLogin
    },
    profile
  });
};
