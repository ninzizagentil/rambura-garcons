import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { env } from '../config/env.js';
import { fail, ok } from '../utils/api.js';
import { recordAudit } from '../services/auditService.js';

function tokens(user) {
  const accessToken = jwt.sign({ sub: user._id.toString(), role: user.role }, env.accessSecret, { expiresIn: env.accessExpires });
  const refreshToken = jwt.sign({ sub: user._id.toString() }, env.refreshSecret, { expiresIn: env.refreshExpires });
  return { accessToken, refreshToken };
}

function safeUser(user) {
  const data = user.toObject ? user.toObject() : { ...user };
  data.avatar = data.avatar || data.profileImage?.imageUrl || '';
  delete data.passwordHash;
  delete data.refreshTokenHash;
  return data;
}

export async function login(req, res) {
  const { identifier, password } = req.body;
  const user = await User.findOne({ $or: [{ username: identifier?.toLowerCase() }, { email: identifier?.toLowerCase() }] }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(password || '', user.passwordHash))) return fail(res, 'Invalid username or password', 401);
  if (user.status !== 'active') return fail(res, 'This account has been deactivated. Contact the administrator.', 403);
  const { accessToken, refreshToken } = tokens(user);
  user.lastLogin = new Date();
  user.lastActivity = new Date();
  user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  await user.save();
  await recordAudit(req, { action: 'Login', module: 'Auth', description: 'User logged in' });
  return ok(res, { user: safeUser(user), accessToken, refreshToken }, 'Login successful');
}

export async function me(req, res) { return ok(res, safeUser(req.user)); }

export async function updateAvatar(req, res) {
  const user = await User.findByIdAndUpdate(req.user._id, { profileImage: req.body.profileImage || null }, { new: true, runValidators: true }).select('-passwordHash -refreshTokenHash');
  return ok(res, safeUser(user), 'Profile image updated');
}

export async function logout(req, res) {
  const user = await User.findById(req.user._id).select('+refreshTokenHash');
  if (user) {
    user.refreshTokenHash = undefined;
    await user.save();
  }
  await recordAudit(req, { action: 'Logout', module: 'Auth', description: 'User logged out' });
  return ok(res, {}, 'Logout successful');
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 8) return fail(res, 'Current password and a new password of at least 8 characters are required', 422);
  const user = await User.findById(req.user._id).select('+passwordHash +refreshTokenHash');
  if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) return fail(res, 'Current password is incorrect', 401);
  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.refreshTokenHash = undefined;
  await user.save();
  await recordAudit(req, { action: 'Password changed', module: 'Auth', description: 'User changed their password' });
  return ok(res, {}, 'Password changed successfully');
}

export async function refresh(req, res) {
  try {
    const payload = jwt.verify(req.body.refreshToken, env.refreshSecret);
    const user = await User.findById(payload.sub).select('+refreshTokenHash');
    if (!user?.refreshTokenHash || !(await bcrypt.compare(req.body.refreshToken, user.refreshTokenHash))) return fail(res, 'Invalid refresh token', 401);
    return ok(res, { accessToken: jwt.sign({ sub: user._id.toString(), role: user.role }, env.accessSecret, { expiresIn: env.accessExpires }) }, 'Token refreshed');
  } catch { return fail(res, 'Invalid refresh token', 401); }
}
