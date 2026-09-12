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

// Create and list reconciliations
router.post('/', requirePermission('stock.adjust'), asyncHandler(createReconciliation));
router.get('/', requirePermission('stock.view'), asyncHandler(getReconciliations));

// Get specific reconciliation
router.get('/:id', requirePermission('stock.view'), asyncHandler(getReconciliation));

// Start reconciliation
router.post('/:id/start', requirePermission('stock.adjust'), asyncHandler(startReconciliation));

// Complete reconciliation (submit for approval)
router.post('/:id/complete', requirePermission('stock.adjust'), asyncHandler(completeReconciliation));

// Approve reconciliation (admin only)
router.post('/:id/approve', requirePermission('stock.adjust'), asyncHandler(approveReconciliation));

// Reject reconciliation (admin only)
router.post('/:id/reject', requirePermission('stock.adjust'), asyncHandler(rejectReconciliation));

export default router;
