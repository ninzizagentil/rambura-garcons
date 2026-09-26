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
    const user = await User.findById(payload.sub).select('-passwordHash -refreshTokens');
    if (!user || user.status !== 'active') return fail(res, 'Your session is no longer active', 401);
    if (user.lastActivity && Date.now() - user.lastActivity.getTime() > env.sessionIdleMinutes * 60 * 1000) {
      return fail(res, 'Your session expired after inactivity. Please sign in again.', 401);
    }
    // Record activity at most once a minute (this runs on every request, incl. the 10 s notification poll).
    if (!user.lastActivity || Date.now() - user.lastActivity.getTime() > 60 * 1000) {
      await User.updateOne({ _id: user._id }, { $set: { lastActivity: new Date() } });
    }
    const role = await Role.findOne({ name: user.role }).populate('permissions', 'key');
    const rolePermissions = role
      ? role.permissions.map((permission) => permission.key)
      : (user.permissions?.length ? user.permissions : (DEFAULT_ROLE_PERMISSIONS[user.role] || []));
    const normalizedPermissions = user.role === 'admin'
      ? rolePermissions.filter((permission) => !['library', 'stock', 'equipment', 'events', 'applications', 'reports'].includes(permission.split('.')[0]))
      : rolePermissions;
    user.permissions = Array.isArray(normalizedPermissions) ? normalizedPermissions : [];
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
    if (req.user?.permissions?.includes(permission)) return next();
    return fail(res, `Permission required: ${permission}`, 403);
  };
}

export function requireAnyPermission(...permissions) {
  return (req, res, next) => {
    if (permissions.some((permission) => req.user?.permissions?.includes(permission))) return next();
    return fail(res, `One of these permissions is required: ${permissions.join(', ')}`, 403);
  };
}
