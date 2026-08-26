import { Router } from 'express';
import { login, logout, me, refresh, changePassword, updateAvatar } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/api.js';

const router = Router();
router.post('/login', asyncHandler(login));
router.post('/refresh', asyncHandler(refresh));
router.post('/logout', authenticate, asyncHandler(logout));
router.get('/me', authenticate, asyncHandler(me));
router.post('/change-password', authenticate, asyncHandler(changePassword));
router.patch('/avatar', authenticate, asyncHandler(updateAvatar));
export default router;
