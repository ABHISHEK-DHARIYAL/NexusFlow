import { Router } from "express";
import { submitTask, getTasks, cancelTask } from "../controllers/taskController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authMiddleware);

router.post("/submit", submitTask);
router.get("/", getTasks);
router.post("/:id/cancel", cancelTask);

export default router;
