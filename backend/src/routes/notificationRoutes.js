import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/api.js';
import { createNotification, getNotifications, markRead, markAllRead, remove } from '../controllers/notificationController.js';

const router = Router();
router.use(authenticate);
router.post('/', asyncHandler(createNotification));
router.get('/', asyncHandler(getNotifications));
router.patch('/:id/read', asyncHandler(markRead));
router.patch('/read-all', asyncHandler(markAllRead));
router.delete('/:id', asyncHandler(remove));

export default router;
