import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.js';
import Role from '../models/Role.js';
import { fail } from '../utils/api.js';
import { DEFAULT_ROLE_PERMISSIONS } from '../config/defaultPermissions.js';

export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return fail(res, 'Authentication required', 401);
    const payload = jwt.verify(token, env.accessSecret);
    const user = await User.findById(payload.sub).select('-passwordHash -refreshTokenHash');
    if (!user || user.status !== 'active') return fail(res, 'Your session is no longer active', 401);
    if (user.lastActivity && Date.now() - user.lastActivity.getTime() > env.sessionIdleMinutes * 60 * 1000) {
      return fail(res, 'Your session expired after inactivity. Please sign in again.', 401);
    }
    user.lastActivity = new Date();
    await user.save();
    const role = await Role.findOne({ name: user.role }).populate('permissions', 'key');
    user.permissions = role
      ? role.permissions.map((permission) => permission.key)
      : (user.permissions?.length ? user.permissions : (DEFAULT_ROLE_PERMISSIONS[user.role] || []));
    req.user = user;
    next();
  } catch {
    return fail(res, 'Invalid or expired access token', 401);
  }
}

export function authorize(...roles) {
  return (req, res, next) => roles.includes(req.user?.role) ? next() : fail(res, 'You do not have permission to perform this action', 403);
}

export function requirePermission(permission) {
  return (req, res, next) => {
    if (req.user?.role === 'admin' || req.user?.permissions?.includes(permission)) return next();
    return fail(res, `Permission required: ${permission}`, 403);
  };
}
