import { Router } from "express";
import { getAnalytics, getAggregates } from "../controllers/analyticsController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getAnalytics);
router.get("/aggregate", getAggregates);

export default router;
