import { Router } from 'express';
import AuditLog from '../models/AuditLog.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler, list, ok } from '../utils/api.js';

const router = Router();
router.use(authenticate);
router.get('/', asyncHandler(async (req, res) => {
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
  const filter = req.query.module ? { module: req.query.module } : {};
  const rows = await AuditLog.find(filter).sort({ createdAt: -1 }).limit(limit);
  return list(res, rows.map((row) => ({ id: row._id, user: row.userName, action: row.description || row.action, module: row.module, status: row.status, date: row.createdAt })), { page: 1, limit, total: rows.length, totalPages: 1 });
}));
router.post('/', asyncHandler(async (req, res) => {
  const row = await AuditLog.create({ userId: req.user._id, userName: req.user.fullName, action: req.body.action || 'Activity recorded', module: req.body.module || 'System', description: req.body.description || req.body.action, status: req.body.status || 'success', method: req.method, endpoint: req.originalUrl });
  return ok(res, { id: row._id, user: row.userName, action: row.description, module: row.module, status: row.status, date: row.createdAt }, 'Activity recorded', 201);
}));
export default router;
