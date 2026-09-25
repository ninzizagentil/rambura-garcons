import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../utils/api.js';
import { getRoles, getPermissions, updateRole } from '../controllers/accessController.js';

const router = Router();
router.get('/roles', authenticate, authorize('admin'), asyncHandler(getRoles));
router.get('/permissions', authenticate, authorize('admin'), asyncHandler(getPermissions));
router.put('/roles/:name', authenticate, authorize('admin'), asyncHandler(updateRole));
export default router;
