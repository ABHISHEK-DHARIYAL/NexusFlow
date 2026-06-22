import { Response } from "express";
import { readDatabase, writeDatabase } from "../utils/dbLocal.js";

export const getProfile = (req: any, res: Response) => {
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

  return res.json(profile);
};

export const updateProfile = (req: any, res: Response) => {
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
  }

  // Bind requested updates
  const fields = [
    "githubUsername", "leetcodeUsername", "codeforcesUsername",
    "youtubeChannelId", "instagramUsername", "twitterUsername", "linkedinUsername",
    "notificationMorningReport", "notificationWeeklyGithub", 
    "notificationWeeklyLeetcode", "notificationAnalyticsSync"
  ];

  fields.forEach(field => {
    if (req.body[field] !== undefined) {
      (profile as any)[field] = req.body[field];
    }
  });

  profile.updatedAt = Date.now();
  writeDatabase(db);

  return res.json(profile);
};

export const updateGeneral = (req: any, res: Response) => {
  const { name, profilePictureUrl } = req.body;
  const db = readDatabase();
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (name) user.name = name;
  if (profilePictureUrl !== undefined) user.profilePictureUrl = profilePictureUrl;
  
  writeDatabase(db);
  return res.json({ success: true, user: { name: user.name, profilePictureUrl: user.profilePictureUrl } });
};

export const updateDeveloper = (req: any, res: Response) => {
  const { githubUsername, leetcodeUsername, codeforcesUsername } = req.body;
  const db = readDatabase();
  let profile = db.userProfiles.find(p => p.userId === req.user.id);
  if (!profile) {
    return res.status(404).json({ error: "Profile not found" });
  }

  if (githubUsername !== undefined) profile.githubUsername = githubUsername;
  if (leetcodeUsername !== undefined) profile.leetcodeUsername = leetcodeUsername;
  if (codeforcesUsername !== undefined) profile.codeforcesUsername = codeforcesUsername;

  profile.updatedAt = Date.now();
  writeDatabase(db);
  return res.json(profile);
};

export const updateCreator = (req: any, res: Response) => {
  const { youtubeChannelId, instagramUsername, twitterUsername, linkedinUsername } = req.body;
  const db = readDatabase();
  let profile = db.userProfiles.find(p => p.userId === req.user.id);
  if (!profile) {
    return res.status(404).json({ error: "Profile not found" });
  }

  if (youtubeChannelId !== undefined) profile.youtubeChannelId = youtubeChannelId;
  if (instagramUsername !== undefined) profile.instagramUsername = instagramUsername;
  if (twitterUsername !== undefined) profile.twitterUsername = twitterUsername;
  if (linkedinUsername !== undefined) profile.linkedinUsername = linkedinUsername;

  profile.updatedAt = Date.now();
  writeDatabase(db);
  return res.json(profile);
};

export const updatePassword = (req: any, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const db = readDatabase();
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (user.passwordHash !== currentPassword) {
    return res.status(400).json({ error: "Incorrect current password" });
  }

  user.passwordHash = newPassword;
  writeDatabase(db);
  return res.json({ success: true, message: "Password updated successfully" });
};

export const updateNotifications = (req: any, res: Response) => {
  const { notificationMorningReport, notificationWeeklyGithub, notificationWeeklyLeetcode, notificationAnalyticsSync } = req.body;
  const db = readDatabase();
  let profile = db.userProfiles.find(p => p.userId === req.user.id);
  if (!profile) {
    return res.status(404).json({ error: "Profile not found" });
  }

  if (notificationMorningReport !== undefined) profile.notificationMorningReport = !!notificationMorningReport;
  if (notificationWeeklyGithub !== undefined) profile.notificationWeeklyGithub = !!notificationWeeklyGithub;
  if (notificationWeeklyLeetcode !== undefined) profile.notificationWeeklyLeetcode = !!notificationWeeklyLeetcode;
  if (notificationAnalyticsSync !== undefined) profile.notificationAnalyticsSync = !!notificationAnalyticsSync;

  profile.updatedAt = Date.now();
  writeDatabase(db);
  return res.json(profile);
};

export const getConnectedAccounts = (req: any, res: Response) => {
  const db = readDatabase();
  const profile = db.userProfiles.find(p => p.userId === req.user.id);
  return res.json({
    github: !!(profile && profile.githubUsername),
    leetcode: !!(profile && profile.leetcodeUsername),
    youtube: !!(profile && profile.youtubeChannelId),
    instagram: !!(profile && profile.instagramUsername),
    twitter: !!(profile && profile.twitterUsername),
    linkedin: !!(profile && profile.linkedinUsername)
  });
};

