import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../utils/api.js';
import * as report from '../controllers/reportController.js';

const router = Router();
router.use(authenticate, authorize('admin', 'librarian', 'stock_manager', 'management'));
router.get('/library/summary', asyncHandler(report.librarySummary));
router.get('/library/overdue', asyncHandler(report.overdue));
router.get('/library/circulation', asyncHandler(report.circulation));
router.get('/stock/inventory', asyncHandler(report.inventory));
router.get('/stock/movement', asyncHandler(report.movement));
router.get('/stock/low-stock', asyncHandler(report.lowStock));
router.get('/stock/out-of-stock', asyncHandler(report.outOfStock));
router.get('/stock/expired', asyncHandler(report.expired));
router.get('/stock/damaged', asyncHandler(report.damaged));
router.get('/stock/disposed', asyncHandler(report.disposed));
router.get('/stock/analytics', asyncHandler(report.stockAnalytics));
export default router;
