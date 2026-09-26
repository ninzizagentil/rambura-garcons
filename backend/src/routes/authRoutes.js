import { Router } from 'express';
import { login, logout, me, refresh, changePassword, updateAvatar, requestPasswordReset, resetPassword } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/api.js';
import rateLimit from 'express-rate-limit';
import { validateBody } from '../middleware/validate.js';

const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 10,
	skipSuccessfulRequests: true,
	standardHeaders: 'draft-8',
	message: { success: false, message: 'Too many authentication attempts. Try again later.' },
});
const loginValidation = validateBody({ identifier: { required: true, maxLength: 120 }, password: { required: true, maxLength: 200 } });

const router = Router();
router.post('/login', authLimiter, loginValidation, asyncHandler(login));
router.post('/refresh', asyncHandler(refresh));
router.post('/password-reset/request', authLimiter, validateBody({ email: { required: true, email: true } }), asyncHandler(requestPasswordReset));
router.post('/password-reset/confirm', authLimiter, validateBody({ token: { required: true }, newPassword: { required: true, minLength: 8 } }), asyncHandler(resetPassword));
router.post('/logout', authenticate, asyncHandler(logout));
router.get('/me', authenticate, asyncHandler(me));
router.post('/change-password', authenticate, asyncHandler(changePassword));
router.patch('/avatar', authenticate, asyncHandler(updateAvatar));
export default router;
