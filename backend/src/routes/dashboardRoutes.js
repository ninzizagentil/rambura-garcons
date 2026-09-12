import { Router } from 'express';
import { authenticate, authorize, requirePermission } from '../middleware/auth.js';
import { asyncHandler } from '../utils/api.js';
import { adminDashboard, managementDashboard, librarySummary } from '../controllers/dashboardController.js';
const router = Router(); router.use(authenticate); router.get('/admin/dashboard', authorize('admin'), asyncHandler(adminDashboard)); router.get('/management/dashboard', requirePermission('applications.view'), asyncHandler(managementDashboard)); router.get('/reports/library/summary', requirePermission('library.reports'), asyncHandler(librarySummary)); export default router;
