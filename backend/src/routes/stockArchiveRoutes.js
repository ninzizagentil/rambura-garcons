import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { asyncHandler } from '../utils/api.js';
import {
  approveStockArchiveRequest,
  createStockArchiveRequest,
  getMyStockArchiveRequests,
  getStockArchiveRequests,
  rejectStockArchiveRequest,
} from '../controllers/stockArchiveController.js';

const router = Router();
router.use(authenticate);
router.post('/', requirePermission('stock.archive.request'), asyncHandler(createStockArchiveRequest));
router.get('/my', requirePermission('stock.archive.request'), asyncHandler(getMyStockArchiveRequests));
router.get('/', requirePermission('stock.archive.approve'), asyncHandler(getStockArchiveRequests));
router.post('/:id/approve', requirePermission('stock.archive.approve'), asyncHandler(approveStockArchiveRequest));
router.post('/:id/reject', requirePermission('stock.archive.approve'), asyncHandler(rejectStockArchiveRequest));

export default router;
