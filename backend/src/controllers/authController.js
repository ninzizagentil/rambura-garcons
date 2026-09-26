import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Role from '../models/Role.js';
import { env } from '../config/env.js';
import { fail, ok } from '../utils/api.js';
import { recordAudit } from '../services/auditService.js';
import { sendPasswordResetEmail } from '../services/emailService.js';
import { DEFAULT_ROLE_PERMISSIONS } from '../config/defaultPermissions.js';

// A refresh token is stored as a SHA-256 of the WHOLE token (bcrypt only reads the first 72 bytes,
// which are identical for every token of the same user, so it could not tell tokens apart).
const hashToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');
const MAX_SESSIONS_PER_USER = 5; // one per device/browser; the oldest is dropped
// Used so a wrong username takes as long as a wrong password (no account guessing by timing).
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('not-a-real-password', 12);

function addRefreshToken(user, token) {
  const now = Date.now();
  const active = (user.refreshTokens || []).filter((entry) => entry.expiresAt && entry.expiresAt.getTime() > now);
  active.push({ hash: hashToken(token), createdAt: new Date(now), expiresAt: new Date(jwt.decode(token).exp * 1000) });
  user.refreshTokens = active.slice(-MAX_SESSIONS_PER_USER);
}

function tokens(user) {
  const accessToken = jwt.sign({ sub: user._id.toString(), role: user.role }, env.accessSecret, { expiresIn: env.accessExpires });
  const refreshToken = jwt.sign({ sub: user._id.toString(), jti: crypto.randomUUID() }, env.refreshSecret, { expiresIn: env.refreshExpires });
  return { accessToken, refreshToken };
}

function safeUser(user) {
  const data = user.toObject ? user.toObject() : { ...user };
  data.avatar = data.avatar || data.profileImage?.imageUrl || '';
  delete data.passwordHash;
  delete data.refreshTokenHash;
  delete data.refreshTokens;
  return data;
}

async function safeUserWithPermissions(user) {
  const role = await Role.findOne({ name: user.role }).populate('permissions', 'key');
  const rolePermissions = role
    ? role.permissions.map((permission) => permission.key)
    : (user.permissions?.length ? user.permissions : (DEFAULT_ROLE_PERMISSIONS[user.role] || []));
  const normalizedPermissions = user.role === 'admin'
    ? rolePermissions.filter((permission) => !['library', 'stock', 'equipment', 'events', 'applications', 'reports'].includes(permission.split('.')[0]))
    : rolePermissions;
  user.permissions = Array.isArray(normalizedPermissions) ? normalizedPermissions : [];
  return safeUser(user);
}

export async function login(req, res) {
  const { identifier, password } = req.body;
  if (typeof identifier !== 'string' || typeof password !== 'string') return fail(res, 'Username and password are required', 400);
  const id = identifier.trim().toLowerCase();
  const user = await User.findOne({ $or: [{ username: id }, { email: id }] }).select('+passwordHash +refreshTokens');
  const passwordMatches = await bcrypt.compare(password, user?.passwordHash || DUMMY_PASSWORD_HASH);
  if (!user || !passwordMatches) return fail(res, 'Invalid username or password', 401);
  if (user.status !== 'active') return fail(res, 'This account has been deactivated. Contact the administrator.', 403);
  const { accessToken, refreshToken } = tokens(user);
  user.lastLogin = new Date();
  user.lastActivity = new Date();
  addRefreshToken(user, refreshToken);
  await user.save();
  await recordAudit(req, { action: 'Login', module: 'Auth', description: 'User logged in' });
  return ok(res, { user: await safeUserWithPermissions(user), accessToken, refreshToken }, 'Login successful');
}

export async function requestPasswordReset(req, res) {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const user = await User.findOne({ email }).select('+passwordResetTokenHash +passwordResetExpires');
  if (user) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.passwordResetExpires = new Date(Date.now() + env.passwordResetMinutes * 60000);
    await user.save();
    const resetUrl = `${env.clientUrl}/reset-password?token=${rawToken}`;
    // Never tell the caller whether the account exists or whether the mail was sent (account guessing).
    // A failed send is logged for the administrator instead.
    const delivery = await sendPasswordResetEmail(user.email, user.fullName, resetUrl).catch((error) => ({ success: false, error: error.message }));
    if (!delivery.success) console.error('[auth] Password reset email was NOT sent:', delivery.reason || delivery.error || 'unknown error');
  }
  return ok(res, {}, 'If an account exists for that email, reset instructions have been sent.');
}

export async function resetPassword(req, res) {
  const tokenHash = crypto.createHash('sha256').update(String(req.body.token || '')).digest('hex');
  const user = await User.findOne({ passwordResetTokenHash: tokenHash, passwordResetExpires: { $gt: new Date() } }).select('+passwordHash +refreshTokens +passwordResetTokenHash +passwordResetExpires');
  if (!user) return fail(res, 'This password reset link is invalid or expired.', 400);
  if (!req.body.newPassword || req.body.newPassword.length < 8) return fail(res, 'Password must be at least 8 characters.', 422);
  user.passwordHash = await bcrypt.hash(req.body.newPassword, 12); user.refreshTokens = []; user.passwordResetTokenHash = undefined; user.passwordResetExpires = undefined; await user.save();
  return ok(res, {}, 'Password reset successfully.');
}

export async function me(req, res) { return ok(res, safeUser(req.user)); }

export async function updateAvatar(req, res) {
  const user = await User.findByIdAndUpdate(req.user._id, { profileImage: req.body.profileImage || null }, { new: true, runValidators: true }).select('-passwordHash -refreshTokens');
  return ok(res, safeUser(user), 'Profile image updated');
}

export async function logout(req, res) {
  const user = await User.findById(req.user._id).select('+refreshTokens');
  if (user) {
    // Log out only this device when it sends its refresh token; otherwise every device.
    const current = typeof req.body?.refreshToken === 'string' ? hashToken(req.body.refreshToken) : null;
    user.refreshTokens = current ? (user.refreshTokens || []).filter((entry) => entry.hash !== current) : [];
    await user.save();
  }
  await recordAudit(req, { action: 'Logout', module: 'Auth', description: 'User logged out' });
  return ok(res, {}, 'Logout successful');
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 8) return fail(res, 'Current password and a new password of at least 8 characters are required', 422);
  const user = await User.findById(req.user._id).select('+passwordHash +refreshTokens');
  if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) return fail(res, 'Current password is incorrect', 401);
  user.passwordHash = await bcrypt.hash(newPassword, 12);
  const keep = typeof req.body.refreshToken === 'string' ? hashToken(req.body.refreshToken) : null;
  user.refreshTokens = keep ? (user.refreshTokens || []).filter((entry) => entry.hash === keep) : [];
  await user.save();
  await recordAudit(req, { action: 'Password changed', module: 'Auth', description: 'User changed their password' });
  return ok(res, {}, 'Password changed successfully');
}

export async function refresh(req, res) {
  try {
    if (typeof req.body.refreshToken !== 'string') return fail(res, 'Invalid refresh token', 401);
    const payload = jwt.verify(req.body.refreshToken, env.refreshSecret);
    const user = await User.findById(payload.sub).select('+refreshTokens');
    const tokenHash = hashToken(req.body.refreshToken);
    const session = user?.refreshTokens?.find((entry) => entry.hash === tokenHash && entry.expiresAt > new Date());
    if (!user || user.status !== 'active' || !session) return fail(res, 'Invalid refresh token', 401);
    // A refresh must NOT count as activity, otherwise the idle timeout could never trigger.
    if (user.lastActivity && Date.now() - user.lastActivity.getTime() > env.sessionIdleMinutes * 60 * 1000) {
      return fail(res, 'Your session expired after inactivity. Please sign in again.', 401);
    }
    return ok(res, { accessToken: jwt.sign({ sub: user._id.toString(), role: user.role }, env.accessSecret, { expiresIn: env.accessExpires }) }, 'Token refreshed');
  } catch { return fail(res, 'Invalid refresh token', 401); }
}
