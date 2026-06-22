import { Response } from "express";
import { readDatabase } from "../utils/dbLocal.js";

export const getAnalytics = (req: any, res: Response) => {
  const { channelId, period } = req.query;
  const db = readDatabase();

  let snapshots = db.analyticsSnapshots;

  if (channelId) {
    snapshots = snapshots.filter(s => s.channelId === channelId);
  } else {
    // If no channel filter, find user channels and merge
    const userChanIds = new Set(db.channels.filter(c => c.userId === req.user.id).map(c => c.id));
    snapshots = snapshots.filter(s => userChanIds.has(s.channelId));
  }

  if (period) {
    snapshots = snapshots.filter(s => s.period === String(period).toUpperCase());
  } else {
    snapshots = snapshots.filter(s => s.period === "DAILY");
  }

  snapshots.sort((a, b) => a.recordedAt - b.recordedAt);
  return res.json(snapshots);
};

export const getAggregates = (req: any, res: Response) => {
  const db = readDatabase();
  const userChanIds = new Set(db.channels.filter(c => c.userId === req.user.id).map(c => c.id));

  const userSnapshots = db.analyticsSnapshots.filter(s => userChanIds.has(s.channelId) && s.period === "DAILY");
  
  // Aggregate primary stats
  let totalViews = 0;
  let totalLikes = 0;
  let totalComments = 0;
  let totalSubscribers = 0;
  let totalRevenue = 0;

  userChanIds.forEach(chanId => {
    const singleChanSnaps = userSnapshots.filter(s => s.channelId === chanId);
    if (singleChanSnaps.length > 0) {
      // Find latest record for subscriber metrics
      singleChanSnaps.sort((a, b) => b.recordedAt - a.recordedAt);
      const latest = singleChanSnaps[0];
      totalSubscribers += latest.subscribers;
      
      // Sum other dynamic snapshots
      singleChanSnaps.forEach(s => {
        totalViews += s.views;
        totalLikes += s.likes;
        totalComments += s.comments;
        totalRevenue += s.revenueUsd;
      });
    }
  });

  return res.json({
    totalViews,
    totalLikes,
    totalComments,
    totalSubscribers,
    totalRevenue: parseFloat(totalRevenue.toFixed(2))
  });
};
