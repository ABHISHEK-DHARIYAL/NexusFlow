import { Request, Response } from "express";
import { globalPool } from "../services/threadPoolService.js";

export const getPoolStats = (req: Request, res: Response) => {
  const stats = globalPool.getStats();
  return res.json(stats);
};

export const updatePoolConfig = (req: Request, res: Response) => {
  const { coreThreads, maxThreads } = req.body;
  if (!coreThreads || !maxThreads) {
    return res.status(400).json({ error: "coreThreads and maxThreads must be set" });
  }
  
  globalPool.setPoolSizes(Number(coreThreads), Number(maxThreads));
  return res.json({ success: true, coreThreads, maxThreads });
};
