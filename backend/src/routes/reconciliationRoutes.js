import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
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
router.post('/', authorize('admin', 'stock_manager'), asyncHandler(createReconciliation));
router.get('/', asyncHandler(getReconciliations));

// Get specific reconciliation
router.get('/:id', asyncHandler(getReconciliation));

// Start reconciliation
router.post('/:id/start', authorize('admin', 'stock_manager'), asyncHandler(startReconciliation));

// Complete reconciliation (submit for approval)
router.post('/:id/complete', authorize('admin', 'stock_manager'), asyncHandler(completeReconciliation));

// Approve reconciliation (admin only)
router.post('/:id/approve', authorize('admin'), asyncHandler(approveReconciliation));

// Reject reconciliation (admin only)
router.post('/:id/reject', authorize('admin'), asyncHandler(rejectReconciliation));

export default router;
