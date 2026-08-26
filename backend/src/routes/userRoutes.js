import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../utils/api.js';
import { getUsers, getUser, createUser, updateUser, setStatus, deleteUser, resetPassword } from '../controllers/userController.js';

const router = Router();
router.use(authenticate, authorize('admin'));
router.get('/', asyncHandler(getUsers));
router.get('/:id', asyncHandler(getUser));
router.post('/', asyncHandler(createUser));
router.put('/:id', asyncHandler(updateUser));
router.patch('/:id/status', asyncHandler(setStatus));
router.delete('/:id', asyncHandler(deleteUser));
router.post('/:id/reset-password', asyncHandler(resetPassword));
export default router;
