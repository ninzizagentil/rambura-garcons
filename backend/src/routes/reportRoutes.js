import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { asyncHandler } from '../utils/api.js';
import * as report from '../controllers/reportController.js';

const router = Router();
router.use(authenticate);
router.get('/library/summary', requirePermission('library.reports'), asyncHandler(report.librarySummary));
router.get('/library/overdue', requirePermission('library.reports'), asyncHandler(report.overdue));
router.get('/library/circulation', requirePermission('library.reports'), asyncHandler(report.circulation));
router.get('/stock/inventory', requirePermission('stock.reports'), asyncHandler(report.inventory));
router.get('/stock/movement', requirePermission('stock.reports'), asyncHandler(report.movement));
router.get('/stock/low-stock', requirePermission('stock.reports'), asyncHandler(report.lowStock));
router.get('/stock/out-of-stock', requirePermission('stock.reports'), asyncHandler(report.outOfStock));
router.get('/stock/expired', requirePermission('stock.reports'), asyncHandler(report.expired));
router.get('/stock/damaged', requirePermission('stock.reports'), asyncHandler(report.damaged));
router.get('/stock/disposed', requirePermission('stock.reports'), asyncHandler(report.disposed));
router.get('/stock/analytics', requirePermission('stock.reports'), asyncHandler(report.stockAnalytics));
export default router;
