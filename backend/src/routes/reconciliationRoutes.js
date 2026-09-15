import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { asyncHandler } from '../utils/api.js';
import {
  createReconciliation,
  getReconciliations,
  getReconciliation,
  startReconciliation,
  completeReconciliation,
  approveReconciliation,
  rejectReconciliation
} from '../controllers/reconciliationController.js';

const router = Router();
router.use(authenticate);

router.post('/', requirePermission('stock.adjust'), asyncHandler(createReconciliation));
router.get('/', requirePermission('stock.view'), asyncHandler(getReconciliations));

router.get('/:id', requirePermission('stock.view'), asyncHandler(getReconciliation));

router.post('/:id/start', requirePermission('stock.adjust'), asyncHandler(startReconciliation));

router.post('/:id/complete', requirePermission('stock.adjust'), asyncHandler(completeReconciliation));

router.post('/:id/approve', requirePermission('stock.adjust'), asyncHandler(approveReconciliation));

router.post('/:id/reject', requirePermission('stock.adjust'), asyncHandler(rejectReconciliation));

export default router;
