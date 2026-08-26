import { Router } from 'express';
import AuditLog from '../models/AuditLog.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler, list, ok } from '../utils/api.js';

const router = Router();
router.use(authenticate, authorize('admin'));
router.get('/', asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
  const filter = {};
  if (req.query.module) filter.module = req.query.module;
  if (req.query.user) filter.userId = req.query.user;
  const [data, total] = await Promise.all([AuditLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit), AuditLog.countDocuments(filter)]);
  return list(res, data, { page, limit, total, totalPages: Math.ceil(total / limit) });
}));
router.get('/:id', asyncHandler(async (req, res) => ok(res, await AuditLog.findById(req.params.id))));
export default router;
