import { Router } from "express";
import { getChannels, createChannel, deleteChannel } from "../controllers/channelController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getChannels);
router.post("/", createChannel);
router.delete("/:id", deleteChannel);

export default router;
