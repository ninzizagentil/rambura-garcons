import { Router } from 'express';
import { authenticate, authorize, requireAnyPermission, requirePermission } from '../middleware/auth.js';
import { asyncHandler } from '../utils/api.js';
import { adminDashboard, managementDashboard, librarySummary } from '../controllers/dashboardController.js';
const router = Router();
// authenticate is applied per route (not router.use) because this router is mounted on /api
// and must not intercept public routes such as /api/public/*.
router.get('/admin/dashboard', authenticate, authorize('admin'), asyncHandler(adminDashboard));
router.get('/management/dashboard', authenticate, requireAnyPermission('applications.view', 'reports.view'), asyncHandler(managementDashboard));
router.get('/reports/library/summary', authenticate, requirePermission('library.reports'), asyncHandler(librarySummary));
export default router;
