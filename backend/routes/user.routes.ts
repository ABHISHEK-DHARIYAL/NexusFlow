import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { asyncHandler } from '../utils/asyncHandler';
import { validateRequest } from '../middleware/validateRequest';
import { createUserSchema, updateUserSchema } from '../validations/user.validation';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();
const userController = new UserController();

// Fix for a confirmed critical bug: this entire route group previously had
// NO authentication at all - anyone could unauthenticated list every user,
// view any user's profile, update any user's fields (including role,
// enabling privilege escalation to ADMIN), or delete any account.
router.use(requireAuth);

router.get('/', requireRole('ADMIN'), asyncHandler(userController.getUsers));
router.get('/:id', asyncHandler(userController.getUserById));
router.post('/', requireRole('ADMIN'), validateRequest(createUserSchema), asyncHandler(userController.createUser));
router.put('/:id', validateRequest(updateUserSchema), asyncHandler(userController.updateUser));
router.delete('/:id', asyncHandler(userController.deleteUser));

export default router;
