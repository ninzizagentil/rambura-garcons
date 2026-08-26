import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { fail, list, ok } from '../utils/api.js';
import { recordAudit } from '../services/auditService.js';

const roles = ['admin', 'librarian', 'stock_manager', 'management'];
const publicFields = '-passwordHash -refreshTokenHash';
const safeRegex = (value) => new RegExp(String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

export async function getUsers(req, res) {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.role) filter.role = req.query.role;
  if (req.query.search) filter.$or = [{ fullName: safeRegex(req.query.search) }, { username: safeRegex(req.query.search) }, { email: safeRegex(req.query.search) }];
  const [data, total] = await Promise.all([User.find(filter, publicFields).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit), User.countDocuments(filter)]);
  return list(res, data, { page, limit, total, totalPages: Math.ceil(total / limit) });
}

export async function getUser(req, res) { return ok(res, await User.findById(req.params.id, publicFields)); }

export async function createUser(req, res) {
  const { fullName, username, email, password, role, status = 'active' } = req.body;
  if (!fullName || !username || !email || !password || !roles.includes(role)) return fail(res, 'fullName, username, email, password and a valid role are required', 422);
  const user = await User.create({ fullName, username, email, role, status, passwordHash: await bcrypt.hash(password, 12), lastActivity: new Date() });
  await recordAudit(req, { action: 'User created', module: 'Users', resourceType: 'User', resourceId: user._id, description: `Created user ${user.username}` });
  return ok(res, user.toObject({ transform: (_doc, ret) => { delete ret.passwordHash; delete ret.refreshTokenHash; return ret; } }), 'User created', 201);
}

export async function updateUser(req, res) {
  const allowed = ['fullName', 'username', 'email', 'role', 'profileImage'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  if (updates.role && !roles.includes(updates.role)) return fail(res, 'Invalid role', 422);
  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select(publicFields);
  if (!user) return fail(res, 'User not found', 404);
  await recordAudit(req, { action: 'User updated', module: 'Users', resourceType: 'User', resourceId: user._id, description: `Updated user ${user.username}` });
  return ok(res, user, 'User updated');
}

export async function setStatus(req, res) {
  if (!['active', 'inactive'].includes(req.body.status)) return fail(res, 'Status must be active or inactive', 422);
  const target = await User.findById(req.params.id);
  if (!target) return fail(res, 'User not found', 404);
  if (target.role === 'admin' && target.status === 'active' && req.body.status === 'inactive') {
    const count = await User.countDocuments({ role: 'admin', status: 'active' });
    if (count <= 1) return fail(res, 'Cannot deactivate the last active administrator', 409);
  }
  target.status = req.body.status;
  await target.save();
  await recordAudit(req, { action: `User ${target.status}`, module: 'Users', resourceType: 'User', resourceId: target._id, description: `${target.username} is now ${target.status}` });
  return ok(res, target.toObject({ transform: (_doc, ret) => { delete ret.passwordHash; delete ret.refreshTokenHash; return ret; } }), 'User status updated');
}

export async function deleteUser(req, res) {
  const target = await User.findById(req.params.id);
  if (!target) return fail(res, 'User not found', 404);
  if (target.role === 'admin' && target.status === 'active' && await User.countDocuments({ role: 'admin', status: 'active' }) <= 1) return fail(res, 'Cannot delete the last active administrator', 409);
  await target.deleteOne();
  await recordAudit(req, { action: 'User deleted', module: 'Users', resourceType: 'User', resourceId: target._id, description: `Deleted user ${target.username}`, status: 'warning' });
  return ok(res, {}, 'User deleted');
}

export async function resetPassword(req, res) {
  const { password } = req.body;
  if (!password || password.length < 8) return fail(res, 'Password must be at least 8 characters', 422);
  const user = await User.findById(req.params.id).select('+refreshTokenHash');
  if (!user) return fail(res, 'User not found', 404);
  user.passwordHash = await bcrypt.hash(password, 12);
  user.refreshTokenHash = undefined;
  await user.save();
  await recordAudit(req, { action: 'User password reset', module: 'Users', resourceType: 'User', resourceId: user._id, description: `Reset password for ${user.username}`, status: 'warning' });
  return ok(res, {}, 'Password reset successfully');
}
