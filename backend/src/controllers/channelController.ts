import { Response } from "express";
import { readDatabase, writeDatabase } from "../utils/dbLocal.js";
import { Channel } from "../models/types.js";

export const getChannels = (req: any, res: Response) => {
  const db = readDatabase();
  const userChannels = db.channels.filter(c => c.userId === req.user.id);
  return res.json(userChannels);
};

export const createChannel = (req: any, res: Response) => {
  const { name, platform, niche, postingFrequency, description, isPrimary, colorTag } = req.body;
  if (!name || !platform || !niche) {
    return res.status(400).json({ error: "Name, platform and niche are required" });
  }

  const db = readDatabase();
  const primaryStatus = isPrimary === true || String(isPrimary) === "true";

  if (primaryStatus) {
    db.channels.forEach(c => {
      if (c.userId === req.user.id) {
        c.isPrimary = false;
      }
    });
  }

  const newChannel: Channel = {
    id: "chan-" + Math.random().toString(36).substring(2, 9),
    userId: req.user.id,
    name,
    platform,
    niche,
    postingFrequency: postingFrequency || "Flexible",
    description: description || "",
    createdAt: Date.now(),
    isPrimary: primaryStatus,
    colorTag: colorTag || "#00FF9C"
  };

  db.channels.push(newChannel);

  // Add random static history to populate metrics charts
  for (let d = 20; d >= 1; d--) {
    db.analyticsSnapshots.push({
      id: "anal-seeded-" + newChannel.id + "-" + d,
      channelId: newChannel.id,
      recordedAt: Date.now() - d * 24 * 3600 * 1000,
      views: d * 180 + Math.floor(Math.random() * 100),
      likes: d * 15,
      comments: d * 25,
      subscribers: d * 2 + 5,
      revenueUsd: d * 0.45,
      watchTimeHours: d * 1.5,
      period: "DAILY"
    });
  }

  writeDatabase(db);
  return res.json(newChannel);
};

export const deleteChannel = (req: any, res: Response) => {
  const db = readDatabase();
  db.channels = db.channels.filter(c => c.id !== req.params.id || c.userId !== req.user.id);
  writeDatabase(db);
  return res.json({ success: true });
};
