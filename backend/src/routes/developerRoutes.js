import { Router } from 'express';
import AuditLog from '../models/AuditLog.js';
import Role from '../models/Role.js';
import User from '../models/User.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler, fail, ok } from '../utils/api.js';
import { getDeveloperDiagnostics, getDeveloperOverview, isMaintenanceMode, setMaintenanceMode } from '../services/developerService.js';
import { backupDatabase, listBackups, restoreDatabaseBackup } from '../services/backupService.js';
import { recordAudit } from '../services/auditService.js';
import { backupDirectory } from '../services/backupService.js';

const router = Router();
router.use(authenticate);
router.use(authorize('developer'));

router.get('/overview', asyncHandler(async (_req, res) => ok(res, await getDeveloperOverview())));
router.get('/diagnostics', asyncHandler(async (_req, res) => ok(res, await getDeveloperDiagnostics())));
router.get('/maintenance', asyncHandler(async (_req, res) => ok(res, { enabled: await isMaintenanceMode() })));
router.patch('/maintenance', asyncHandler(async (req, res) => {
  const enabled = !!req.body?.enabled;
  const result = await setMaintenanceMode(enabled, req.user?.fullName || 'developer');
  await recordAudit(req, { action: enabled ? 'Maintenance mode enabled' : 'Maintenance mode disabled', module: 'System', resourceType: 'SystemSetting', description: `Maintenance mode ${enabled ? 'enabled' : 'disabled'} by ${req.user?.fullName || 'developer'}` });
  return ok(res, { enabled: result }, enabled ? 'Maintenance mode enabled' : 'Maintenance mode disabled');
}));

router.get('/users', asyncHandler(async (_req, res) => {
  const users = await User.find({}, '-passwordHash -refreshTokens').sort({ createdAt: -1 }).lean();
  return ok(res, users);
}));

router.get('/roles', asyncHandler(async (_req, res) => {
  const roles = await Role.find().populate('permissions').lean();
  return ok(res, roles);
}));

router.get('/access-troubleshooter', asyncHandler(async (req, res) => {
  const userId = req.query.userId;
  const module = req.query.module || 'stock';
  const action = req.query.action || 'view';
  if (!userId) return fail(res, 'A user is required for troubleshooting.', 422);

  const user = await User.findById(userId).lean();
  if (!user) return fail(res, 'User not found', 404);

  const role = await Role.findOne({ name: user.role }).populate('permissions', 'key');
  const rolePermissions = new Set((role?.permissions || []).map((permission) => permission.key));
  const requiredPermission = `${module}.${action}`;
  const hasPermission = rolePermissions.has(requiredPermission) || user.permissions?.includes(requiredPermission);
  const result = {
    user: user.fullName || user.username,
    account: user.status === 'active' ? 'Active' : 'Inactive',
    role: user.role,
    requiredPermission,
    rolePermission: hasPermission ? 'Present' : 'Missing',
    frontendAccess: 'Allowed',
    backendAuthorization: hasPermission ? 'Allowed' : 'Denied',
    result: hasPermission ? 'ACCESS SHOULD BE ALLOWED' : 'ACCESS DENIED',
  };
  return ok(res, result);
}));

router.get('/backups', asyncHandler(async (_req, res) => {
  const files = await listBackups(backupDirectory());
  return ok(res, files.map((name) => ({ name, path: `${backupDirectory()}/${name}` })));
}));

router.post('/backups', asyncHandler(async (req, res) => {
  const filePath = await backupDatabase();
  await recordAudit(req, { action: 'Backup created', module: 'System', resourceType: 'Backup', description: `Created backup ${filePath}` });
  return ok(res, { path: filePath }, 'Backup created successfully');
}));

router.post('/backups/:name/restore', asyncHandler(async (req, res) => {
  if (req.body?.confirm !== true) return fail(res, 'Restore requires explicit confirmation.', 400);
  const fileName = decodeURIComponent(req.params.name);
  const filePath = await restoreDatabaseBackup(fileName);
  await recordAudit(req, { action: 'Backup restored', module: 'System', resourceType: 'Backup', description: `Restored backup ${fileName}`, status: 'warning' });
  return ok(res, { path: filePath }, 'Backup restored successfully');
}));

router.get('/activity', asyncHandler(async (_req, res) => {
  const rows = await AuditLog.find({}).sort({ createdAt: -1 }).limit(25).lean();
  return ok(res, rows);
}));

export default router;
