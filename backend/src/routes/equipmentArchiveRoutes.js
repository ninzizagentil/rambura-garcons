import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { asyncHandler } from '../utils/api.js';
import {
  approveArchiveRequest,
  createArchiveRequest,
  getArchiveRequests,
  getMyArchiveRequests,
  rejectArchiveRequest,
} from '../controllers/equipmentArchiveController.js';

const router = Router();
router.use(authenticate);
router.post('/', requirePermission('equipment.archive.request'), asyncHandler(createArchiveRequest));
router.get('/my', requirePermission('equipment.archive.request'), asyncHandler(getMyArchiveRequests));
router.get('/', requirePermission('equipment.archive.approve'), asyncHandler(getArchiveRequests));
router.post('/:id/approve', requirePermission('equipment.archive.approve'), asyncHandler(approveArchiveRequest));
router.post('/:id/reject', requirePermission('equipment.archive.approve'), asyncHandler(rejectArchiveRequest));

export default router;
