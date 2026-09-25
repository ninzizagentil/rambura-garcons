import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Role from '../models/Role.js';
import Permission from '../models/Permission.js';
import { env } from '../config/env.js';
import { fail, ok } from '../utils/api.js';
import { recordAudit } from '../services/auditService.js';
import { sendPasswordResetEmail } from '../services/emailService.js';
import { DEFAULT_ROLE_PERMISSIONS } from '../config/defaultPermissions.js';

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32(value) {
  let bits = ''; let output = '';
  for (const byte of value) bits += byte.toString(2).padStart(8, '0');
  for (let i = 0; i + 5 <= bits.length; i += 5) output += BASE32[parseInt(bits.slice(i, i + 5), 2)];
  if (bits.length % 5) output += BASE32[parseInt(bits.slice(-5).padEnd(5, '0'), 2)];
  return output;
}

function decodeBase32(value) {
  const bits = value.toUpperCase().replace(/=+$/, '').split('').map((char) => BASE32.indexOf(char).toString(2).padStart(5, '0')).join('');
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

function totp(secret, timestamp = Date.now()) {
  const counter = Math.floor(timestamp / 30000);
  const buffer = Buffer.alloc(8); buffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0); buffer.writeUInt32BE(counter >>> 0, 4);
  const digest = crypto.createHmac('sha1', decodeBase32(secret)).update(buffer).digest();
  const offset = digest[digest.length - 1] & 15;
  return String((digest.readUInt32BE(offset) & 0x7fffffff) % 1000000).padStart(6, '0');
}

function verifyTotp(secret, code) {
  return [-1, 0, 1].some((offset) => totp(secret, Date.now() + offset * 30000) === String(code || '').trim());
}

async function verifySecondFactor(user, code) {
  if (verifyTotp(user.twoFactorSecret, code)) return true;
  const normalized = String(code || '').trim().toUpperCase();
  for (const recoveryCode of user.twoFactorRecoveryCodes || []) {
    if (!recoveryCode.usedAt && await bcrypt.compare(normalized, recoveryCode.hash)) {
      recoveryCode.usedAt = new Date();
      await user.save();
      return true;
    }
  }
  return false;
}

function createRecoveryCodes() {
  return Array.from({ length: 8 }, () => `${crypto.randomBytes(4).toString('hex').toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`);
}

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
  user.permissions = user.role === 'admin'
    ? (await Permission.find({}, 'key')).map((permission) => permission.key)
    : role
    ? role.permissions.map((permission) => permission.key)
    : (user.permissions?.length ? user.permissions : (DEFAULT_ROLE_PERMISSIONS[user.role] || []));
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
  if (user.role === 'admin' && user.twoFactorEnabled) {
    const challengeToken = jwt.sign({ sub: user._id.toString(), purpose: 'login-2fa' }, env.accessSecret, { expiresIn: '5m' });
    return ok(res, { requiresTwoFactor: true, challengeToken }, 'Verification code required');
  }
  const { accessToken, refreshToken } = tokens(user);
  user.lastLogin = new Date();
  user.lastActivity = new Date();
  addRefreshToken(user, refreshToken);
  await user.save();
  await recordAudit(req, { action: 'Login', module: 'Auth', description: 'User logged in' });
  return ok(res, { user: await safeUserWithPermissions(user), accessToken, refreshToken }, 'Login successful');
}

export async function verifyLoginTwoFactor(req, res) {
  try {
    const payload = jwt.verify(req.body.challengeToken, env.accessSecret);
    if (payload.purpose !== 'login-2fa') return fail(res, 'Invalid verification session', 401);
    const user = await User.findById(payload.sub).select('+twoFactorSecret +twoFactorRecoveryCodes +refreshTokens');
    if (!user || user.role !== 'admin' || !user.twoFactorEnabled || !(await verifySecondFactor(user, req.body.code))) return fail(res, 'Invalid verification code', 401);
    const issued = tokens(user);
    user.lastLogin = new Date(); user.lastActivity = new Date(); addRefreshToken(user, issued.refreshToken); await user.save();
    await recordAudit(req, { userId: user._id, userName: user.fullName, action: 'Login', module: 'Auth', description: 'User logged in with two-factor authentication' });
    return ok(res, { user: await safeUserWithPermissions(user), ...issued }, 'Login successful');
  } catch { return fail(res, 'Verification session expired. Sign in again.', 401); }
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

export async function setupTwoFactor(req, res) {
  if (req.user.role !== 'admin') return fail(res, 'Administrator access required', 403);
  const secret = base32(crypto.randomBytes(20));
  const issuer = encodeURIComponent('Rambura Garçons');
  const account = encodeURIComponent(req.user.email);
  return ok(res, { secret, otpauthUrl: `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}`, recoveryCodes: createRecoveryCodes() }, 'Scan this secret with an authenticator app');
}

export async function enableTwoFactor(req, res) {
  if (req.user.role !== 'admin') return fail(res, 'Administrator access required', 403);
  const secret = String(req.body.secret || '');
  if (!secret || !verifyTotp(secret, req.body.code)) return fail(res, 'Invalid authenticator code', 422);
  const recoveryCodes = Array.isArray(req.body.recoveryCodes) ? req.body.recoveryCodes.filter((code) => /^[A-F0-9]{8}-[A-F0-9]{8}$/.test(String(code))) : [];
  if (recoveryCodes.length < 8) return fail(res, 'Recovery codes are required', 422);
  await User.findByIdAndUpdate(req.user._id, { twoFactorSecret: secret, twoFactorEnabled: true, twoFactorRecoveryCodes: await Promise.all(recoveryCodes.map(async (code) => ({ hash: await bcrypt.hash(code, 10) }))) });
  return ok(res, { enabled: true }, 'Two-factor authentication enabled');
}

export async function disableTwoFactor(req, res) {
  if (req.user.role !== 'admin') return fail(res, 'Administrator access required', 403);
  const user = await User.findById(req.user._id).select('+passwordHash +twoFactorSecret +twoFactorRecoveryCodes');
  if (!user || !(await bcrypt.compare(req.body.password || '', user.passwordHash)) || !(await verifySecondFactor(user, req.body.code))) return fail(res, 'Password and authenticator code are required', 422);
  user.twoFactorEnabled = false; user.twoFactorSecret = undefined; await user.save();
  return ok(res, { enabled: false }, 'Two-factor authentication disabled');
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
