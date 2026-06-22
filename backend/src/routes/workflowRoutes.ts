import { Router } from "express";
import { getWorkflows, createWorkflow, executeWorkflow } from "../controllers/workflowController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getWorkflows);
router.post("/", createWorkflow);
router.post("/:id/execute", executeWorkflow);

export default router;
