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
import { validateBody } from '../middleware/validate.js';
import { rules } from '../utils/validators.js';

const router = Router();
router.use(authenticate);

router.post('/', requirePermission('stock.adjust'), validateBody({ title: rules.alnum('Title') }), asyncHandler(createReconciliation));
router.get('/', requirePermission('stock.view'), asyncHandler(getReconciliations));

router.get('/:id', requirePermission('stock.view'), asyncHandler(getReconciliation));

router.post('/:id/start', requirePermission('stock.adjust'), asyncHandler(startReconciliation));

router.post('/:id/complete', requirePermission('stock.adjust'), asyncHandler(completeReconciliation));

// Approving is a management duty, separate from counting/adjusting (stock.adjust).
router.post('/:id/approve', requirePermission('stock.reconcile.approve'), asyncHandler(approveReconciliation));

router.post('/:id/reject', requirePermission('stock.reconcile.approve'), asyncHandler(rejectReconciliation));

export default router;
