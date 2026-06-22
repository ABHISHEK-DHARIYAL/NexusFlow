import { Router } from "express";
import { 
  getProfile, 
  updateProfile, 
  updateGeneral, 
  updateDeveloper, 
  updateCreator, 
  updatePassword, 
  updateNotifications, 
  getConnectedAccounts 
} from "../controllers/profileController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getProfile);
router.put("/", updateProfile);
router.put("/general", updateGeneral);
router.put("/developer", updateDeveloper);
router.put("/creator", updateCreator);
router.put("/password", updatePassword);
router.put("/notifications", updateNotifications);
router.get("/connected-accounts", getConnectedAccounts);

export default router;

