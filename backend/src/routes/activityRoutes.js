import { Router } from 'express';
import AuditLog from '../models/AuditLog.js';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { asyncHandler, fail, list, ok } from '../utils/api.js';

const router = Router();
router.use(authenticate);
router.get('/', requirePermission('audit.view'), asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
  const filter = req.query.module ? { module: req.query.module } : {};
  const dateRange = {};
  const parseDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
  };
  if (req.query.fromDate) {
    const fromDate = parseDate(req.query.fromDate);
    if (!fromDate) return fail(res, 'From date must be a valid date', 422);
    dateRange.$gte = fromDate;
  }
  if (req.query.toDate) {
    const toDate = parseDate(req.query.toDate);
    if (!toDate) return fail(res, 'To date must be a valid date', 422);
    toDate.setUTCDate(toDate.getUTCDate() + 1);
    dateRange.$lt = toDate;
  }
  if (dateRange.$gte && dateRange.$lt && dateRange.$gte >= dateRange.$lt) return fail(res, 'From date must not be after To date', 422);
  if (Object.keys(dateRange).length) filter.createdAt = dateRange;

  const [rows, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    AuditLog.countDocuments(filter),
  ]);
  return list(res, rows.map((row) => ({ id: row._id, user: row.userName, action: row.description || row.action, module: row.module, status: row.status, date: row.createdAt })), { page, limit, total, totalPages: Math.ceil(total / limit) });
}));
router.post('/', asyncHandler(async (req, res) => {
  const row = await AuditLog.create({ userId: req.user._id, userName: req.user.fullName, action: req.body.action || 'Activity recorded', module: req.body.module || 'System', description: req.body.description || req.body.action, status: req.body.status || 'success', method: req.method, endpoint: req.originalUrl });
  return ok(res, { id: row._id, user: row.userName, action: row.description, module: row.module, status: row.status, date: row.createdAt }, 'Activity recorded', 201);
}));
export default router;
