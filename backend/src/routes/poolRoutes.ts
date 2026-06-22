import { Router } from "express";
import { getPoolStats, updatePoolConfig } from "../controllers/poolController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/stats", getPoolStats);
router.put("/config", updatePoolConfig);

export default router;
