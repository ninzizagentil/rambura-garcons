import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { asyncHandler } from '../utils/api.js';
import {
  approveBookArchiveRequest,
  createBookArchiveRequest,
  getBookArchiveRequests,
  rejectBookArchiveRequest,
} from '../controllers/bookArchiveController.js';

const router = Router();
router.use(authenticate);
router.post('/', requirePermission('library.books.archive.request'), asyncHandler(createBookArchiveRequest));
router.get('/', requirePermission('library.books.archive.approve'), asyncHandler(getBookArchiveRequests));
router.post('/:id/approve', requirePermission('library.books.archive.approve'), asyncHandler(approveBookArchiveRequest));
router.post('/:id/reject', requirePermission('library.books.archive.approve'), asyncHandler(rejectBookArchiveRequest));

export default router;