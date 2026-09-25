import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { asyncHandler } from '../utils/api.js';
import {
  approveRetirementRequest,
  createRetirementRequest,
  getMyRetirementRequests,
  getRetirementRequests,
  rejectRetirementRequest,
} from '../controllers/equipmentRetirementController.js';

const router = Router();
router.use(authenticate);
router.post('/', requirePermission('equipment.retire.request'), asyncHandler(createRetirementRequest));
router.get('/my', requirePermission('equipment.retire.request'), asyncHandler(getMyRetirementRequests));
router.get('/', requirePermission('equipment.retire.approve'), asyncHandler(getRetirementRequests));
router.post('/:id/approve', requirePermission('equipment.retire.approve'), asyncHandler(approveRetirementRequest));
router.post('/:id/reject', requirePermission('equipment.retire.approve'), asyncHandler(rejectRetirementRequest));

export default router;
