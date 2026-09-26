[1mdiff --git a/PROGRESS-REPORT.md b/PROGRESS-REPORT.md[m
[1mindex b9a4291..4b488c8 100644[m
[1m--- a/PROGRESS-REPORT.md[m
[1m+++ b/PROGRESS-REPORT.md[m
[36m@@ -53,7 +53,7 @@[m [mUbutumwa buri mu ndimi 3 (en/fr/rw).[m
 [m
 **Guhindura amategeko ya telefoni** (ubu ni 10; ushobora kuyihindura): `PHONE_MIN_DIGITS` muri `src/utils/validators.js` na `backend/src/utils/validators.js`.[m
 [m
[31m-**Ifishi zasuzumwe:** Stock (Item, Supplier, In, Out, Adjustment, Transfer, Damage, Dispose, Reconciliation), Library (Book, Borrow), Admin (User, Settings, Website: contact, developers, staff, programs, departments, news, gallery, hero testimonials), Equipment (register, assign, maintenance), Events, Public (Admissions, Contact), Forgot password.[m
[32m+[m[32m**Ifishi zasuzumwe:** Stock (Item, Supplier, In, Out, Adjustment, Transfer, Damage, Dispose, Reconciliation), Library (Book, Borrow), Admin (User, Settings, Website: contact, developers, staff, programs, departments, news, gallery, hero testimonials), Equipment (register, assign, maintenance), Events, Public (Admissions, Contact), 2FA code, Forgot password.[m
 Ntizihinduwe ku bushake: ijambobanga, ubushakashatsi (search), ibisobanuro/notes/messages (ni inyandiko y'ubuntu), amatariki.[m
 [m
 **Tests:** `npm test` (frontend, 15) na `cd backend && npm test` (19).[m
[1mdiff --git a/backend/src/config/defaultPermissions.js b/backend/src/config/defaultPermissions.js[m
[1mindex a91eb1e..f23ace5 100644[m
[1m--- a/backend/src/config/defaultPermissions.js[m
[1m+++ b/backend/src/config/defaultPermissions.js[m
[36m@@ -1,9 +1,5 @@[m
 export const DEFAULT_ROLE_PERMISSIONS = {[m
[31m-  admin: [[m
[31m-    'users.view', 'users.create', 'users.update', 'users.delete',[m
[31m-    'website.view', 'website.create', 'website.update', 'website.delete',[m
[31m-    'audit.view', 'settings.view', 'settings.update',[m
[31m-  ],[m
[32m+[m[32m  admin: [],[m
   librarian: [[m
     'library.view', 'library.books.create', 'library.books.update',[m
     'library.books.delete', 'library.borrow', 'library.return',[m
[1mdiff --git a/backend/src/controllers/accessController.js b/backend/src/controllers/accessController.js[m
[1mindex ce11e01..4027132 100644[m
[1m--- a/backend/src/controllers/accessController.js[m
[1m+++ b/backend/src/controllers/accessController.js[m
[36m@@ -9,13 +9,10 @@[m [mexport async function getRoles(_req, res) { return ok(res, await Role.find().pop[m
 export async function getPermissions(_req, res) { return ok(res, await Permission.find().sort('module key')); }[m
 export async function updateRole(req, res) {[m
   const existingRole = await Role.findOne({ name: req.params.name }).populate('permissions', 'key');[m
[31m-  const requested = req.body.permissions || [];[m
[31m-  const adminAllowedIds = (await Permission.find({ module: { $nin: ['library', 'stock', 'equipment', 'events', 'applications', 'reports'] } }, '_id')).map((permission) => permission._id.toString());[m
[31m-  const allowedIds = new Set(adminAllowedIds);[m
[31m-  const permissionIds = req.params.name === 'admin'[m
[31m-    ? requested.filter((id) => allowedIds.has(String(id)))[m
[31m-    : requested;[m
[31m-  const role = await Role.findOneAndUpdate({ name: req.params.name }, { permissions: permissionIds }, { new: true, runValidators: true }).populate('permissions');[m
[32m+[m[32m  const permissions = req.params.name === 'admin'[m
[32m+[m[32m    ? (await Permission.find({}, '_id')).map((permission) => permission._id)[m
[32m+[m[32m    : (req.body.permissions || []);[m
[32m+[m[32m  const role = await Role.findOneAndUpdate({ name: req.params.name }, { permissions }, { new: true, runValidators: true }).populate('permissions');[m
   if (role && existingRole) {[m
     const previousKeys = new Set(existingRole.permissions.map((permission) => permission.key));[m
     const currentKeys = new Set(role.permissions.map((permission) => permission.key));[m
[1mdiff --git a/backend/src/controllers/authController.js b/backend/src/controllers/authController.js[m
[1mindex 2ca8b9c..6a9ffbe 100644[m
[1m--- a/backend/src/controllers/authController.js[m
[1m+++ b/backend/src/controllers/authController.js[m
[36m@@ -3,12 +3,59 @@[m [mimport jwt from 'jsonwebtoken';[m
 import crypto from 'crypto';[m
 import User from '../models/User.js';[m
 import Role from '../models/Role.js';[m
[32m+[m[32mimport Permission from '../models/Permission.js';[m
 import { env } from '../config/env.js';[m
 import { fail, ok } from '../utils/api.js';[m
 import { recordAudit } from '../services/auditService.js';[m
 import { sendPasswordResetEmail } from '../services/emailService.js';[m
 import { DEFAULT_ROLE_PERMISSIONS } from '../config/defaultPermissions.js';[m
 [m
[32m+[m[32mconst BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';[m
[32m+[m
[32m+[m[32mfunction base32(value) {[m
[32m+[m[32m  let bits = ''; let output = '';[m
[32m+[m[32m  for (const byte of value) bits += byte.toString(2).padStart(8, '0');[m
[32m+[m[32m  for (let i = 0; i + 5 <= bits.length; i += 5) output += BASE32[parseInt(bits.slice(i, i + 5), 2)];[m
[32m+[m[32m  if (bits.length % 5) output += BASE32[parseInt(bits.slice(-5).padEnd(5, '0'), 2)];[m
[32m+[m[32m  return output;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32mfunction decodeBase32(value) {[m
[32m+[m[32m  const bits = value.toUpperCase().replace(/=+$/, '').split('').map((char) => BASE32.indexOf(char).toString(2).padStart(5, '0')).join('');[m
[32m+[m[32m  const bytes = [];[m
[32m+[m[32m  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));[m
[32m+[m[32m  return Buffer.from(bytes);[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32mfunction totp(secret, timestamp = Date.now()) {[m
[32m+[m[32m  const counter = Math.floor(timestamp / 30000);[m
[32m+[m[32m  const buffer = Buffer.alloc(8); buffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0); buffer.writeUInt32BE(counter >>> 0, 4);[m
[32m+[m[32m  const digest = crypto.createHmac('sha1', decodeBase32(secret)).update(buffer).digest();[m
[32m+[m[32m  const offset = digest[digest.length - 1] & 15;[m
[32m+[m[32m  return String((digest.readUInt32BE(offset) & 0x7fffffff) % 1000000).padStart(6, '0');[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32mfunction verifyTotp(secret, code) {[m
[32m+[m[32m  return [-1, 0, 1].some((offset) => totp(secret, Date.now() + offset * 30000) === String(code || '').trim());[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32masync function verifySecondFactor(user, code) {[m
[32m+[m[32m  if (verifyTotp(user.twoFactorSecret, code)) return true;[m
[32m+[m[32m  const normalized = String(code || '').trim().toUpperCase();[m
[32m+[m[32m  for (const recoveryCode of user.twoFactorRecoveryCodes || []) {[m
[32m+[m[32m    if (!recoveryCode.usedAt && await bcrypt.compare(normalized, recoveryCode.hash)) {[m
[32m+[m[32m      recoveryCode.usedAt = new Date();[m
[32m+[m[32m      await user.save();[m
[32m+[m[32m      return true;[m
[32m+[m[32m    }[m
[32m+[m[32m  }[m
[32m+[m[32m  return false;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32mfunction createRecoveryCodes() {[m
[32m+[m[32m  return Array.from({ length: 8 }, () => `${crypto.randomBytes(4).toString('hex').toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`);[m
[32m+[m[32m}[m
[32m+[m
 // A refresh token is stored as a SHA-256 of the WHOLE token (bcrypt only reads the first 72 bytes,[m
 // which are identical for every token of the same user, so it could not tell tokens apart).[m
 const hashToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');[m
[36m@@ -40,13 +87,11 @@[m [mfunction safeUser(user) {[m
 [m
 async function safeUserWithPermissions(user) {[m
   const role = await Role.findOne({ name: user.role }).populate('permissions', 'key');[m
[31m-  const rolePermissions = role[m
[32m+[m[32m  user.permissions = user.role === 'admin'[m
[32m+[m[32m    ? (await Permission.find({}, 'key')).map((permission) => permission.key)[m
[32m+[m[32m    : role[m
     ? role.permissions.map((permission) => permission.key)[m
     : (user.permissions?.length ? user.permissions : (DEFAULT_ROLE_PERMISSIONS[user.role] || []));[m
[31m-  const normalizedPermissions = user.role === 'admin'[m
[31m-    ? rolePermissions.filter((permission) => !['library', 'stock', 'equipment', 'events', 'applications', 'reports'].includes(permission.split('.')[0]))[m
[31m-    : rolePermissions;[m
[31m-  user.permissions = Array.isArray(normalizedPermissions) ? normalizedPermissions : [];[m
   return safeUser(user);[m
 }[m
 [m
[36m@@ -58,6 +103,10 @@[m [mexport async function login(req, res) {[m
   const passwordMatches = await bcrypt.compare(password, user?.passwordHash || DUMMY_PASSWORD_HASH);[m
   if (!user || !passwordMatches) return fail(res, 'Invalid username or password', 401);[m
   if (user.status !== 'active') return fail(res, 'This account has been deactivated. Contact the administrator.', 403);[m
[32m+[m[32m  if (user.role === 'admin' && user.twoFactorEnabled) {[m
[32m+[m[32m    const challengeToken = jwt.sign({ sub: user._id.toString(), purpose: 'login-2fa' }, env.accessSecret, { expiresIn: '5m' });[m
[32m+[m[32m    return ok(res, { requiresTwoFactor: true, challengeToken }, 'Verification code required');[m
[32m+[m[32m  }[m
   const { accessToken, refreshToken } = tokens(user);[m
   user.lastLogin = new Date();[m
   user.lastActivity = new Date();[m
[36m@@ -67,6 +116,19 @@[m [mexport async function login(req, res) {[m
   return ok(res, { user: await safeUserWithPermissions(user), accessToken, refreshToken }, 'Login successful');[m
 }[m
 [m
[32m+[m[32mexport async function verifyLoginTwoFactor(req, res) {[m
[32m+[m[32m  try {[m
[32m+[m[32m    const payload = jwt.verify(req.body.challengeToken, env.accessSecret);[m
[32m+[m[32m    if (payload.purpose !== 'login-2fa') return fail(res, 'Invalid verification session', 401);[m
[32m+[m[32m    const user = await User.findById(payload.sub).select('+twoFactorSecret +twoFactorRecoveryCodes +refreshTokens');[m
[32m+[m[32m    if (!user || user.role !== 'admin' || !user.twoFactorEnabled || !(await verifySecondFactor(user, req.body.code))) return fail(res, 'Invalid verification code', 401);[m
[32m+[m[32m    const issued = tokens(user);[m
[32m+[m[32m    user.lastLogin = new Date(); user.lastActivity = new Date(); addRefreshToken(user, issued.refreshToken); await user.save();[m
[32m+[m[32m    await recordAudit(req, { userId: user._id, userName: user.fullName, action: 'Login', module: 'Auth', description: 'User logged in with two-factor authentication' });[m
[32m+[m[32m    return ok(res, { user: await safeUserWithPermissions(user), ...issued }, 'Login successful');[m
[32m+[m[32m  } catch { return fail(res, 'Verification session expired. Sign in again.', 401); }[m
[32m+[m[32m}[m
[32m+[m
 export async function requestPasswordReset(req, res) {[m
   const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';[m
   const user = await User.findOne({ email }).select('+passwordResetTokenHash +passwordResetExpires');[m
[36m@@ -93,6 +155,32 @@[m [mexport async function resetPassword(req, res) {[m
   return ok(res, {}, 'Password reset successfully.');[m
 }[m
 [m
[32m+[m[32mexport async function setupTwoFactor(req, res) {[m
[32m+[m[32m  if (req.user.role !== 'admin') return fail(res, 'Administrator access required', 403);[m
[32m+[m[32m  const secret = base32(crypto.randomBytes(20));[m
[32m+[m[32m  const issuer = encodeURIComponent('Rambura Garçons');[m
[32m+[m[32m  const account = encodeURIComponent(req.user.email);[m
[32m+[m[32m  return ok(res, { secret, otpauthUrl: `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}`, recoveryCodes: createRecoveryCodes() }, 'Scan this secret with an authenticator app');[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32mexport async function enableTwoFactor(req, res) {[m
[32m+[m[32m  if (req.user.role !== 'admin') return fail(res, 'Administrator access required', 403);[m
[32m+[m[32m  const secret = String(req.body.secret || '');[m
[32m+[m[32m  if (!secret || !verifyTotp(secret, req.body.code)) return fail(res, 'Invalid authenticator code', 422);[m
[32m+[m[32m  const recoveryCodes = Array.isArray(req.body.recoveryCodes) ? req.body.recoveryCodes.filter((code) => /^[A-F0-9]{8}-[A-F0-9]{8}$/.test(String(code))) : [];[m
[32m+[m[32m  if (recoveryCodes.length < 8) return fail(res, 'Recovery codes are required', 422);[m
[32m+[m[32m  await User.findByIdAndUpdate(req.user._id, { twoFactorSecret: secret, twoFactorEnabled: true, twoFactorRecoveryCodes: await Promise.all(recoveryCodes.map(async (code) => ({ hash: await bcrypt.hash(code, 10) }))) });[m
[32m+[m[32m  return ok(res, { enabled: true }, 'Two-factor authentication enabled');[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32mexport async function disableTwoFactor(req, res) {[m
[32m+[m[32m  if (req.user.role !== 'admin') return fail(res, 'Administrator access required', 403);[m
[32m+[m[32m  const user = await User.findById(req.user._id).select('+passwordHash +twoFactorSecret +twoFactorRecoveryCodes');[m
[32m+[m[32m  if (!user || !(await bcrypt.compare(req.body.password || '', user.passwordHash)) || !(await verifySecondFactor(user, req.body.code))) return fail(res, 'Password and authenticator code are required', 422);[m
[32m+[m[32m  user.twoFactorEnabled = false; user.twoFactorSecret = undefined; await user.save();[m
[32m+[m[32m  return ok(res, { enabled: false }, 'Two-factor authentication disabled');[m
[32m+[m[32m}[m
[32m+[m
 export async function me(req, res) { return ok(res, safeUser(req.user)); }[m
 [m
 export async function updateAvatar(req, res) {[m
[1mdiff --git a/backend/src/controllers/contentController.js b/backend/src/controllers/contentController.js[m
[1mindex 901839a..d76bd95 100644[m
[1m--- a/backend/src/controllers/contentController.js[m
[1m+++ b/backend/src/controllers/contentController.js[m
[36m@@ -6,6 +6,9 @@[m [mimport Gallery from '../models/Gallery.js';[m
 import WebsiteSetting from '../models/WebsiteSetting.js';[m
 import { fail, list, ok } from '../utils/api.js';[m
 import { recordAudit } from '../services/auditService.js';[m
[32m+[m[32mimport SystemSetting from '../models/SystemSetting.js';[m
[32m+[m[32mimport { encryptSecret } from '../utils/secretBox.js';[m
[32m+[m[32mimport { invalidateMailConfig } from '../services/emailService.js';[m
 [m
 const resources = { programs: Program, departments: Department, staff: Staff, news: News, gallery: Gallery };[m
 function slugify(value) { return String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }[m
[36m@@ -35,6 +38,8 @@[m [mexport async function adminDelete(req, res) { const Model = resources[req.params[m
 export async function publishNews(req, res) { const item = await News.findByIdAndUpdate(req.params.id, { published: req.body.published !== false, publishedAt: new Date() }, { new: true }); if (!item) return fail(res, 'News not found', 404); await recordAudit(req, { action: item.published ? 'News published' : 'News unpublished', module: 'Website', resourceId: item._id, description: `${item.published ? 'Published' : 'Unpublished'} "${item.title}"` }); return ok(res, item, item.published ? 'News published' : 'News unpublished'); }[m
 export async function getSettings(_req, res) { return ok(res, await WebsiteSetting.findOne({ key: 'default' }) || {}); }[m
 export async function updateSettings(req, res) { const settings = await WebsiteSetting.findOneAndUpdate({ key: 'default' }, { ...req.body, key: 'default' }, { new: true, upsert: true, runValidators: true }); await recordAudit(req, { action: 'Website settings changed', module: 'Website', resourceId: settings._id, description: 'Updated website settings' }); return ok(res, settings, 'Settings updated'); }[m
[32m+[m[32mexport async function getEmailSettings(_req, res) { const setting = await SystemSetting.findOne({ key: 'email' }); const value = setting?.value || {}; return ok(res, { host: value.host || '', port: value.port || 587, secure: Boolean(value.secure), user: value.user || '', from: value.from || '', configured: Boolean(value.password) }); }[m
[32m+[m[32mexport async function updateEmailSettings(req, res) { const current = await SystemSetting.findOne({ key: 'email' }); const value = { host: req.body.host || '', port: Number(req.body.port || 587), secure: Boolean(req.body.secure), user: req.body.user || '', from: req.body.from || '', password: req.body.password ? encryptSecret(req.body.password) : (current?.value?.password || '') }; const setting = await SystemSetting.findOneAndUpdate({ key: 'email' }, { key: 'email', value }, { new: true, upsert: true }); invalidateMailConfig(); await recordAudit(req, { action: 'Email settings changed', module: 'Settings', resourceId: setting._id, description: 'Updated SMTP delivery settings' }); return ok(res, { host: value.host, port: value.port, secure: value.secure, user: value.user, from: value.from, configured: Boolean(value.password) }, 'Email settings updated'); }[m
 export async function updateDevelopersPageSettings(req, res) { const settings = await WebsiteSetting.findOneAndUpdate({ key: 'default' }, { $set: { developersPage: req.body.developersPage || {} } }, { new: true, upsert: true, runValidators: true }); await recordAudit(req, { action: 'Developers page changed', module: 'Website', resourceId: settings._id, description: 'Updated developers page content' }); return ok(res, settings, 'Developers page updated'); }[m
 export async function getHero(_req, res) { const settings = await WebsiteSetting.findOne({ key: 'default' }); return ok(res, settings?.hero || {}); }[m
 export async function updateHero(req, res) { const settings = await WebsiteSetting.findOneAndUpdate({ key: 'default' }, { $set: { hero: req.body } }, { new: true, upsert: true }); await recordAudit(req, { action: 'Homepage hero changed', module: 'Website', resourceId: settings._id, description: 'Updated homepage hero content' }); return ok(res, settings.hero, 'Hero updated'); }[m
[1mdiff --git a/backend/src/middleware/auth.js b/backend/src/middleware/auth.js[m
[1mindex 7e1318a..9a1c529 100644[m
[1m--- a/backend/src/middleware/auth.js[m
[1m+++ b/backend/src/middleware/auth.js[m
[36m@@ -2,6 +2,7 @@[m [mimport jwt from 'jsonwebtoken';[m
 import { env } from '../config/env.js';[m
 import User from '../models/User.js';[m
 import Role from '../models/Role.js';[m
[32m+[m[32mimport Permission from '../models/Permission.js';[m
 import { fail } from '../utils/api.js';[m
 import { DEFAULT_ROLE_PERMISSIONS } from '../config/defaultPermissions.js';[m
 [m
[36m@@ -21,13 +22,11 @@[m [mexport async function authenticate(req, res, next) {[m
       await User.updateOne({ _id: user._id }, { $set: { lastActivity: new Date() } });[m
     }[m
     const role = await Role.findOne({ name: user.role }).populate('permissions', 'key');[m
[31m-    const rolePermissions = role[m
[32m+[m[32m    user.permissions = user.role === 'admin'[m
[32m+[m[32m      ? (await Permission.find({}, 'key')).map((permission) => permission.key)[m
[32m+[m[32m      : role[m
       ? role.permissions.map((permission) => permission.key)[m
       : (user.permissions?.length ? user.permissions : (DEFAULT_ROLE_PERMISSIONS[user.role] || []));[m
[31m-    const normalizedPermissions = user.role === 'admin'[m
[31m-      ? rolePermissions.filter((permission) => !['library', 'stock', 'equipment', 'events', 'applications', 'reports'].includes(permission.split('.')[0]))[m
[31m-      : rolePermissions;[m
[31m-    user.permissions = Array.isArray(normalizedPermissions) ? normalizedPermissions : [];[m
     req.user = user;[m
     next();[m
   } catch {[m
[36m@@ -48,7 +47,7 @@[m [mexport function requirePermission(permission) {[m
 [m
 export function requireAnyPermission(...permissions) {[m
   return (req, res, next) => {[m
[31m-    if (permissions.some((permission) => req.user?.permissions?.includes(permission))) return next();[m
[32m+[m[32m    if (req.user?.role === 'admin' || permissions.some((permission) => req.user?.permissions?.includes(permission))) return next();[m
     return fail(res, `One of these permissions is required: ${permissions.join(', ')}`, 403);[m
   };[m
 }[m
[1mdiff --git a/backend/src/models/Equipment.js b/backend/src/models/Equipment.js[m
[1mindex 8145c6c..7f40c69 100644[m
[1m--- a/backend/src/models/Equipment.js[m
[1m+++ b/backend/src/models/Equipment.js[m
[36m@@ -22,7 +22,7 @@[m [mconst assignmentSchema = new mongoose.Schema({[m
 const schema = new mongoose.Schema({[m
   assetNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },[m
   name: { type: String, required: true, trim: true, maxlength: 160 },[m
[31m-  type: { type: String, enum: ['laptop', 'desktop', 'printer', 'projector', 'network', 'electrical_material', 'other'], required: true },[m
[32m+[m[32m  type: { type: String, required: true, trim: true, maxlength: 100 },[m
   brand: { type: String, trim: true, maxlength: 100 },[m
   model: { type: String, trim: true, maxlength: 100 },[m
   serialNumber: { type: String, trim: true, maxlength: 120 },[m
[1mdiff --git a/backend/src/models/StockItem.js b/backend/src/models/StockItem.js[m
[1mindex 967fc0b..32bee6b 100644[m
[1m--- a/backend/src/models/StockItem.js[m
[1m+++ b/backend/src/models/StockItem.js[m
[36m@@ -4,13 +4,13 @@[m [mconst schema = new mongoose.Schema([m
   {[m
     code: { type: String, unique: true, required: true },[m
     name: { type: String, required: true },[m
[31m-    category: { type: String, enum: ['Foods', 'Other School Materials'], required: true },[m
[32m+[m[32m    category: { type: String, required: true, trim: true, maxlength: 100 },[m
     unit: { type: String, enum: ['kg', 'litres', 'bags', 'cartons', 'boxes', 'pieces', 'units', 'sets'], required: true },[m
     quantity: { type: Number, min: 0, default: 0 },[m
     minLevel: { type: Number, min: 0, default: 0 },[m
     unitPrice: { type: Number, min: 0, default: 0 },[m
     description: String,[m
[31m-    location: { type: String, enum: ['Main Store', 'Kitchen Store', 'ICT Lab Store', 'Admin Store'] },[m
[32m+[m[32m    location: { type: String, trim: true, maxlength: 160 },[m
     supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },[m
     batchNumber: String,[m
     expiryDate: Date,[m
[1mdiff --git a/backend/src/models/StockReconciliation.js b/backend/src/models/StockReconciliation.js[m
[1mindex 3cf8cac..6c0a498 100644[m
[1m--- a/backend/src/models/StockReconciliation.js[m
[1m+++ b/backend/src/models/StockReconciliation.js[m
[36m@@ -3,7 +3,7 @@[m [mimport mongoose from 'mongoose';[m
 const schema = new mongoose.Schema([m
   {[m
     title: { type: String, required: true },[m
[31m-    location: { type: String, enum: ['Main Store', 'Kitchen Store', 'ICT Lab Store', 'Admin Store'], required: true },[m
[32m+[m[32m    location: { type: String, required: true, trim: true, maxlength: 160 },[m
     status: { type: String, enum: ['planned', 'in-progress', 'completed', 'pending-approval'], default: 'planned' },[m
     scheduledDate: { type: Date, required: true },[m
     startedAt: Date,[m
[1mdiff --git a/backend/src/models/User.js b/backend/src/models/User.js[m
[1mindex 9a19050..e4559a0 100644[m
[1m--- a/backend/src/models/User.js[m
[1m+++ b/backend/src/models/User.js[m
[36m@@ -15,6 +15,9 @@[m [mconst userSchema = new mongoose.Schema({[m
   refreshTokens: { type: [{ hash: String, createdAt: Date, expiresAt: Date, _id: false }], select: false, default: [] },[m
   passwordResetTokenHash: { type: String, select: false },[m
   passwordResetExpires: { type: Date, select: false },[m
[32m+[m[32m  twoFactorSecret: { type: String, select: false },[m
[32m+[m[32m  twoFactorEnabled: { type: Boolean, default: false },[m
[32m+[m[32m  twoFactorRecoveryCodes: { type: [{ hash: String, usedAt: Date }], select: false, default: [] },[m
 }, { timestamps: true });[m
 [m
 export default mongoose.model('User', userSchema);[m
[1mdiff --git a/backend/src/routes/authRoutes.js b/backend/src/routes/authRoutes.js[m
[1mindex 611bcbb..25750c0 100644[m
[1m--- a/backend/src/routes/authRoutes.js[m
[1m+++ b/backend/src/routes/authRoutes.js[m
[36m@@ -1,5 +1,5 @@[m
 import { Router } from 'express';[m
[31m-import { login, logout, me, refresh, changePassword, updateAvatar, requestPasswordReset, resetPassword } from '../controllers/authController.js';[m
[32m+[m[32mimport { login, logout, me, refresh, changePassword, updateAvatar, verifyLoginTwoFactor, requestPasswordReset, resetPassword, setupTwoFactor, enableTwoFactor, disableTwoFactor } from '../controllers/authController.js';[m
 import { authenticate } from '../middleware/auth.js';[m
 import { asyncHandler } from '../utils/api.js';[m
 import rateLimit from 'express-rate-limit';[m
[36m@@ -16,6 +16,7 @@[m [mconst loginValidation = validateBody({ identifier: { required: true, maxLength:[m
 [m
 const router = Router();[m
 router.post('/login', authLimiter, loginValidation, asyncHandler(login));[m
[32m+[m[32mrouter.post('/login/2fa', authLimiter, asyncHandler(verifyLoginTwoFactor));[m
 router.post('/refresh', asyncHandler(refresh));[m
 router.post('/password-reset/request', authLimiter, validateBody({ email: { required: true, email: true } }), asyncHandler(requestPasswordReset));[m
 router.post('/password-reset/confirm', authLimiter, validateBody({ token: { required: true }, newPassword: { required: true, minLength: 8 } }), asyncHandler(resetPassword));[m
[36m@@ -23,4 +24,7 @@[m [mrouter.post('/logout', authenticate, asyncHandler(logout));[m
 router.get('/me', authenticate, asyncHandler(me));[m
 router.post('/change-password', authenticate, asyncHandler(changePassword));[m
 router.patch('/avatar', authenticate, asyncHandler(updateAvatar));[m
[32m+[m[32mrouter.post('/2fa/setup', authenticate, asyncHandler(setupTwoFactor));[m
[32m+[m[32mrouter.post('/2fa/enable', authenticate, asyncHandler(enableTwoFactor));[m
[32m+[m[32mrouter.post('/2fa/disable', authenticate, asyncHandler(disableTwoFactor));[m
 export default router;[m
[1mdiff --git a/backend/src/routes/contentRoutes.js b/backend/src/routes/contentRoutes.js[m
[1mindex e59dd2b..7ab59a5 100644[m
[1m--- a/backend/src/routes/contentRoutes.js[m
[1m+++ b/backend/src/routes/contentRoutes.js[m
[36m@@ -1,7 +1,7 @@[m
 import { Router } from 'express';[m
 import { authenticate, authorize, requireAnyPermission, requirePermission } from '../middleware/auth.js';[m
 import { asyncHandler, fail, ok } from '../utils/api.js';[m
[31m-import { publicList, publicDetail, adminList, adminCreate, adminUpdate, adminDelete, publishNews, getSettings, updateSettings, updateDevelopersPageSettings, getHero, updateHero } from '../controllers/contentController.js';[m
[32m+[m[32mimport { publicList, publicDetail, adminList, adminCreate, adminUpdate, adminDelete, publishNews, getSettings, updateSettings, updateDevelopersPageSettings, getHero, updateHero, getEmailSettings, updateEmailSettings } from '../controllers/contentController.js';[m
 import { submit, getApplications, getApplication, updateStatus, remove, trackApplication, downloadAdminAttachment } from '../controllers/admissionController.js';[m
 import { submitContact } from '../controllers/contactController.js';[m
 import ContactMessage from '../models/ContactMessage.js';[m
[36m@@ -69,6 +69,8 @@[m [madminRouter.get('/settings', requireAnyPermission('settings.view', 'website.view[m
 adminRouter.put('/settings', requireAnyPermission('settings.update', 'website.update'), asyncHandler(updateSettings));[m
 adminRouter.get('/website/hero', requireAnyPermission('website.view'), asyncHandler(getHero));[m
 adminRouter.put('/website/hero', requireAnyPermission('website.update'), asyncHandler(updateHero));[m
[32m+[m[32madminRouter.get('/email-settings', authorize('admin'), asyncHandler(getEmailSettings));[m
[32m+[m[32madminRouter.put('/email-settings', authorize('admin'), asyncHandler(updateEmailSettings));[m
 adminRouter.post('/news/:id/publish', requireAnyPermission('website.update'), asyncHandler((req, res) => publishNews({ ...req, body: { ...req.body, published: true } }, res)));[m
 adminRouter.post('/news/:id/unpublish', requireAnyPermission('website.update'), asyncHandler((req, res) => publishNews({ ...req, body: { ...req.body, published: false } }, res)));[m
 adminRouter.get('/:resource', requireAnyPermission('website.view'), asyncHandler(adminList));[m
[1mdiff --git a/backend/src/routes/equipmentRoutes.js b/backend/src/routes/equipmentRoutes.js[m
[1mindex be9eeb9..a14b53a 100644[m
[1m--- a/backend/src/routes/equipmentRoutes.js[m
[1m+++ b/backend/src/routes/equipmentRoutes.js[m
[36m@@ -8,7 +8,7 @@[m [mimport { rules } from '../utils/validators.js';[m
 const router = Router();[m
 const equipmentValidation = validateBody({[m
   assetNumber: { ...rules.code('Asset number'), maxLength: 120 }, name: { ...rules.alnum('Name'), maxLength: 160 },[m
[31m-  type: { enum: ['laptop', 'desktop', 'printer', 'projector', 'network', 'electrical_material', 'other'] },[m
[32m+[m[32m  type: { ...rules.alnum('Equipment type'), required: true, maxLength: 100 },[m
   brand: { ...rules.alnum('Brand'), maxLength: 100 }, model: { ...rules.alnum('Model'), maxLength: 100 },[m
   serialNumber: { ...rules.code('Serial number'), maxLength: 120 }, location: { ...rules.alnum('Location'), maxLength: 160 },[m
   condition: { enum: ['new', 'good', 'fair', 'damaged', 'under_repair', 'retired'] },[m
[1mdiff --git a/backend/src/routes/stockRoutes.js b/backend/src/routes/stockRoutes.js[m
[1mindex 18dc358..266246e 100644[m
[1m--- a/backend/src/routes/stockRoutes.js[m
[1m+++ b/backend/src/routes/stockRoutes.js[m
[36m@@ -6,11 +6,10 @@[m [mimport { validateBody } from '../middleware/validate.js';[m
 import { rules } from '../utils/validators.js';[m
 const router = Router();[m
 router.use(authenticate);[m
[31m-const STOCK_CATEGORIES = ['Foods', 'Other School Materials'];[m
 const STOCK_UNITS = ['kg', 'litres', 'bags', 'cartons', 'boxes', 'pieces', 'units', 'sets'];[m
 const itemValidation = validateBody({[m
   name: { ...rules.alnum('Item name'), required: true, maxLength: 100 },[m
[31m-  category: { enum: STOCK_CATEGORIES },[m
[32m+[m[32m  category: { ...rules.alnum('Category'), required: true, maxLength: 100 },[m
   unit: { enum: STOCK_UNITS },[m
   quantity: { ...rules.number('Quantity'), required: true },[m
   minLevel: { ...rules.number('Minimum level'), required: true },[m
[1mdiff --git a/backend/src/seed/seed.js b/backend/src/seed/seed.js[m
[1mindex e22aa1f..07f5bb4 100644[m
[1m--- a/backend/src/seed/seed.js[m
[1m+++ b/backend/src/seed/seed.js[m
[36m@@ -259,11 +259,7 @@[m [mawait Event.insertMany([[m
 const permissionKeys = ['users.view', 'users.create', 'users.update', 'users.delete', 'website.view', 'website.create', 'website.update', 'website.delete', 'library.view', 'library.books.create', 'library.books.update', 'library.books.delete', 'library.borrow', 'library.return', 'library.reports', 'stock.view', 'stock.create', 'stock.update', 'stock.in', 'stock.out', 'stock.adjust', 'stock.transfer', 'stock.damage', 'stock.dispose.request', 'stock.dispose.approve', 'stock.archive.request', 'stock.archive.approve', 'stock.reconcile.approve', 'stock.suppliers', 'stock.reports', 'equipment.view', 'equipment.create', 'equipment.update', 'equipment.assign', 'equipment.maintenance', 'equipment.retire.request', 'equipment.retire.approve', 'equipment.archive.request', 'equipment.archive.approve', 'events.view', 'events.manage', 'applications.view', 'applications.update', 'reports.view', 'audit.view', 'settings.view', 'settings.update'];[m
 const permissions = await Permission.insertMany(permissionKeys.map((key) => ({ key, label: key, module: key.split('.')[0] })));[m
 await Role.insertMany([[m
[31m-  {[m
[31m-    name: 'admin',[m
[31m-    label: 'IT / System Administrator',[m
[31m-    permissions: permissions.filter((permission) => !['library', 'stock', 'equipment'].includes(permission.module)).map((permission) => permission._id),[m
[31m-  },[m
[32m+[m[32m  { name: 'admin', label: 'IT / System Administrator', permissions: permissions.map((permission) => permission._id) },[m
   { name: 'librarian', label: 'Librarian', permissions: permissions.filter((permission) => ['library', 'events'].includes(permission.module)).map((permission) => permission._id) },[m
   { name: 'stock_manager', label: 'Stock Manager', permissions: permissions.filter((p) => ['stock'].includes(p.module) && !['stock.dispose.approve','stock.archive.approve','stock.reconcile.approve'].includes(p.key)).map((p) => p._id) },[m
   { name: 'equipment_manager', label: 'Equipment Manager', permissions: permissions.filter((p) => ['equipment'].includes(p.module) && !['equipment.retire.approve','equipment.archive.approve'].includes(p.key)).map((p) => p._id) },[m
[1mdiff --git a/backend/src/services/alertService.js b/backend/src/services/alertService.js[m
[1mindex 2e8eacd..94b8359 100644[m
[1m--- a/backend/src/services/alertService.js[m
[1m+++ b/backend/src/services/alertService.js[m
[36m@@ -20,32 +20,11 @@[m [mimport StockItem from '../models/StockItem.js';[m
 import Admission from '../models/Admission.js';[m
 [m
 const DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000;[m
[31m-const MODULE_PERMISSION_MAP = {[m
[31m-  Library: ['library.view', 'library.books.create', 'library.books.update', 'library.books.delete', 'library.borrow', 'library.return', 'library.reports'],[m
[31m-  Stock: ['stock.view', 'stock.create', 'stock.update', 'stock.in', 'stock.out', 'stock.adjust', 'stock.transfer', 'stock.damage', 'stock.dispose.request', 'stock.dispose.approve', 'stock.archive.request', 'stock.archive.approve', 'stock.suppliers', 'stock.reports'],[m
[31m-  Admissions: ['applications.view', 'applications.update'],[m
[31m-  Website: ['website.view', 'website.create', 'website.update', 'website.delete'],[m
[31m-  Settings: ['settings.view', 'settings.update'],[m
[31m-  Audit: ['audit.view'],[m
[31m-  Users: ['users.view', 'users.create', 'users.update', 'users.delete'],[m
[31m-};[m
[31m-[m
[31m-export function isUserEligibleForAlert(user, { roles = [], module } = {}) {[m
[31m-  if (!user || user.status !== 'active') return false;[m
[31m-[m
[31m-  const permissionHints = MODULE_PERMISSION_MAP[module] || [];[m
[31m-  const roleMatch = roles.includes(user.role);[m
[31m-  const hasModulePermission = (user.permissions || []).some((permission) => permissionHints.includes(permission));[m
[31m-[m
[31m-  return roleMatch || hasModulePermission;[m
[31m-}[m
 [m
 export async function dispatchAlert({ roles, title, message, type = 'warning', module, link, dedupeKey }) {[m
[31m-  const users = await User.find({ status: 'active' }).select('fullName email role permissions');[m
[31m-  const recipients = users.filter((user) => isUserEligibleForAlert(user, { roles, module }));[m
[32m+[m[32m  const users = await User.find({ role: { $in: roles }, status: 'active' }).select('fullName email');[m
   const since = new Date(Date.now() - DEDUPE_WINDOW_MS);[m
[31m-[m
[31m-  await Promise.all(recipients.map(async (user) => {[m
[32m+[m[32m  await Promise.all(users.map(async (user) => {[m
     const exists = dedupeKey && await Notification.exists({ userId: user._id, dedupeKey, createdAt: { $gte: since } });[m
     if (exists) return;[m
     await Notification.create({ userId: user._id, title, message, type, module, link, dedupeKey });[m
[1mdiff --git a/backend/test/adminAccessPermissions.test.js b/backend/test/adminAccessPermissions.test.js[m
[1mdeleted file mode 100644[m
[1mindex 76d7dc9..0000000[m
[1m--- a/backend/test/adminAccessPermissions.test.js[m
[1m+++ /dev/null[m
[36m@@ -1,33 +0,0 @@[m
[31m-import test from 'node:test';[m
[31m-import assert from 'node:assert/strict';[m
[31m-import { requireAnyPermission } from '../src/middleware/auth.js';[m
[31m-[m
[31m-function mockRes() {[m
[31m-  const res = { statusCode: 200, body: null };[m
[31m-  res.status = (code) => { res.statusCode = code; return res; };[m
[31m-  res.json = (body) => { res.body = body; return res; };[m
[31m-  return res;[m
[31m-}[m
[31m-[m
[31m-test('admin role does not bypass permission checks unless explicitly granted', () => {[m
[31m-  const res = mockRes();[m
[31m-  let called = false;[m
[31m-  const next = () => { called = true; };[m
[31m-[m
[31m-  requireAnyPermission('stock.view')({ user: { role: 'admin', permissions: [] } }, res, next);[m
[31m-[m
[31m-  assert.equal(called, false);[m
[31m-  assert.equal(res.statusCode, 403);[m
[31m-  assert.equal(res.body?.error || res.body?.message || '', 'One of these permissions is required: stock.view');[m
[31m-});[m
[31m-[m
[31m-test('explicitly granted permissions still pass', () => {[m
[31m-  const res = mockRes();[m
[31m-  let called = false;[m
[31m-  const next = () => { called = true; };[m
[31m-[m
[31m-  requireAnyPermission('stock.view')({ user: { role: 'admin', permissions: ['stock.view'] } }, res, next);[m
[31m-[m
[31m-  assert.equal(called, true);[m
[31m-  assert.equal(res.statusCode, 200);[m
[31m-});[m
[1mdiff --git a/backend/test/notificationAccess.test.js b/backend/test/notificationAccess.test.js[m
[1mdeleted file mode 100644[m
[1mindex 39bb9df..0000000[m
[1m--- a/backend/test/notificationAccess.test.js[m
[1m+++ /dev/null[m
[36m@@ -1,23 +0,0 @@[m
[31m-import test from 'node:test';[m
[31m-import assert from 'node:assert/strict';[m
[31m-import { isUserEligibleForAlert } from '../src/services/alertService.js';[m
[31m-[m
[31m-test('library alerts reach only users with library access', () => {[m
[31m-  const librarian = { role: 'librarian', permissions: ['library.view'], status: 'active' };[m
[31m-  const stockManager = { role: 'stock_manager', permissions: ['stock.view'], status: 'active' };[m
[31m-  const admin = { role: 'admin', permissions: ['users.view'], status: 'active' };[m
[31m-[m
[31m-  assert.equal(isUserEligibleForAlert(librarian, { roles: ['librarian', 'management'], module: 'Library' }), true);[m
[31m-  assert.equal(isUserEligibleForAlert(stockManager, { roles: ['librarian', 'management'], module: 'Library' }), false);[m
[31m-  assert.equal(isUserEligibleForAlert(admin, { roles: ['librarian', 'management'], module: 'Library' }), false);[m
[31m-});[m
[31m-[m
[31m-test('stock alerts reach only users with stock access', () => {[m
[31m-  const stockManager = { role: 'stock_manager', permissions: ['stock.view', 'stock.reports'], status: 'active' };[m
[31m-  const management = { role: 'management', permissions: ['reports.view'], status: 'active' };[m
[31m-  const librarian = { role: 'librarian', permissions: ['library.view'], status: 'active' };[m
[31m-[m
[31m-  assert.equal(isUserEligibleForAlert(stockManager, { roles: ['stock_manager', 'management'], module: 'Stock' }), true);[m
[31m-  assert.equal(isUserEligibleForAlert(management, { roles: ['stock_manager', 'management'], module: 'Stock' }), true);[m
[31m-  assert.equal(isUserEligibleForAlert(librarian, { roles: ['stock_manager', 'management'], module: 'Stock' }), false);[m
[31m-});[m
[1mdiff --git a/package-lock.json b/package-lock.json[m
[1mindex 6d2d0b0..126f1b4 100644[m
[1m--- a/package-lock.json[m
[1m+++ b/package-lock.json[m
[36m@@ -11,6 +11,7 @@[m
         "@tailwindcss/vite": "^4.3.3",[m
         "framer-motion": "^12.4.7",[m
         "lucide-react": "^1.31.0",[m
[32m+[m[32m        "qrcode": "^1.5.4",[m
         "react": "^19.2.8",[m
         "react-dom": "^19.2.8",[m
         "react-router-dom": "^7.18.2",[m
[36m@@ -911,66 +912,6 @@[m
         "node": ">=14.0.0"[m
       }[m
     },[m
[31m-    "node_modules/@tailwindcss/oxide-wasm32-wasi/node_modules/@emnapi/core": {[m
[31m-      "version": "1.11.1",[m
[31m-      "inBundle": true,[m
[31m-      "license": "MIT",[m
[31m-      "optional": true,[m
[31m-      "dependencies": {[m
[31m-        "@emnapi/wasi-threads": "1.2.2",[m
[31m-        "tslib": "^2.4.0"[m
[31m-      }[m
[31m-    },[m
[31m-    "node_modules/@tailwindcss/oxide-wasm32-wasi/node_modules/@emnapi/runtime": {[m
[31m-      "version": "1.11.1",[m
[31m-      "inBundle": true,[m
[31m-      "license": "MIT",[m
[31m-      "optional": true,[m
[31m-      "dependencies": {[m
[31m-        "tslib": "^2.4.0"[m
[31m-      }[m
[31m-    },[m
[31m-    "node_modules/@tailwindcss/oxide-wasm32-wasi/node_modules/@emnapi/wasi-threads": {[m
[31m-      "version": "1.2.2",[m
[31m-      "inBundle": true,[m
[31m-      "license": "MIT",[m
[31m-      "optional": true,[m
[31m-      "dependencies": {[m
[31m-        "tslib": "^2.4.0"[m
[31m-      }[m
[31m-    },[m
[31m-    "node_modules/@tailwindcss/oxide-wasm32-wasi/node_modules/@napi-rs/wasm-runtime": {[m
[31m-      "version": "1.1.4",[m
[31m-      "inBundle": true,[m
[31m-      "license": "MIT",[m
[31m-      "optional": true,[m
[31m-      "dependencies": {[m
[31m-        "@tybys/wasm-util": "^0.10.1"[m
[31m-      },[m
[31m-      "funding": {[m
[31m-        "type": "github",[m
[31m-        "url": "https://github.com/sponsors/Brooooooklyn"[m
[31m-      },[m
[31m-      "peerDependencies": {[m
[31m-        "@emnapi/core": "^1.7.1",[m
[31m-        "@emnapi/runtime": "^1.7.1"[m
[31m-      }[m
[31m-    },[m
[31m-    "node_modules/@tailwindcss/oxide-wasm32-wasi/node_modules/@tybys/wasm-util": {[m
[31m-      "version": "0.10.2",[m
[31m-      "inBundle": true,[m
[31m-      "license": "MIT",[m
[31m-      "optional": true,[m
[31m-      "dependencies": {[m
[31m-        "tslib": "^2.4.0"[m
[31m-      }[m
[31m-    },[m
[31m-    "node_modules/@tailwindcss/oxide-wasm32-wasi/node_modules/tslib": {[m
[31m-      "version": "2.8.1",[m
[31m-      "inBundle": true,[m
[31m-      "license": "0BSD",[m
[31m-      "optional": true[m
[31m-    },[m
     "node_modules/@tailwindcss/oxide-win32-arm64-msvc": {[m
       "version": "4.3.3",[m
       "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-win32-arm64-msvc/-/oxide-win32-arm64-msvc-4.3.3.tgz",[m
[36m@@ -1108,7 +1049,6 @@[m
     },[m
     "node_modules/ansi-regex": {[m
       "version": "5.0.1",[m
[31m-      "dev": true,[m
       "license": "MIT",[m
       "engines": {[m
         "node": ">=8"[m
[36m@@ -1116,7 +1056,6 @@[m
     },[m
     "node_modules/ansi-styles": {[m
       "version": "4.3.0",[m
[31m-      "dev": true,[m
       "license": "MIT",[m
       "dependencies": {[m
         "color-convert": "^2.0.1"[m
[36m@@ -1128,6 +1067,15 @@[m
         "url": "https://github.com/chalk/ansi-styles?sponsor=1"[m
       }[m
     },[m
[32m+[m[32m    "node_modules/camelcase": {[m
[32m+[m[32m      "version": "5.3.1",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/camelcase/-/camelcase-5.3.1.tgz",[m
[32m+[m[32m      "integrity": "sha512-L28STB170nwWS63UjtlEOE3dldQApaJXZkOI1uMFfzf3rRuPegHaHesyee+YxQ+W6SvRDQV6UrdOdRiR153wJg==",[m
[32m+[m[32m      "license": "MIT",[m
[32m+[m[32m      "engines": {[m
[32m+[m[32m        "node": ">=6"[m
[32m+[m[32m      }[m
[32m+[m[32m    },[m
     "node_modules/chalk": {[m
       "version": "4.1.2",[m
       "dev": true,[m
[36m@@ -1176,7 +1124,6 @@[m
     },[m
     "node_modules/color-convert": {[m
       "version": "2.0.1",[m
[31m-      "dev": true,[m
       "license": "MIT",[m
       "dependencies": {[m
         "color-name": "~1.1.4"[m
[36m@@ -1187,7 +1134,6 @@[m
     },[m
     "node_modules/color-name": {[m
       "version": "1.1.4",[m
[31m-      "dev": true,[m
       "license": "MIT"[m
     },[m
     "node_modules/concurrently": {[m
[36m@@ -1328,6 +1274,15 @@[m
         "node": ">=12"[m
       }[m
     },[m
[32m+[m[32m    "node_modules/decamelize": {[m
[32m+[m[32m      "version": "1.2.0",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/decamelize/-/decamelize-1.2.0.tgz",[m
[32m+[m[32m      "integrity": "sha512-z2S+W9X73hAUUki+N+9Za2lBlun89zigOyGrsax+KUQ6wKW4ZoWpEYBkGhQjwAjjDCkWxhY0VKEhk8wzY7F5cA==",[m
[32m+[m[32m      "license": "MIT",[m
[32m+[m[32m      "engines": {[m
[32m+[m[32m        "node": ">=0.10.0"[m
[32m+[m[32m      }[m
[32m+[m[32m    },[m
     "node_modules/decimal.js-light": {[m
       "version": "2.5.1",[m
       "license": "MIT"[m
[36m@@ -1339,9 +1294,14 @@[m
         "node": ">=8"[m
       }[m
     },[m
[32m+[m[32m    "node_modules/dijkstrajs": {[m
[32m+[m[32m      "version": "1.0.3",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/dijkstrajs/-/dijkstrajs-1.0.3.tgz",[m
[32m+[m[32m      "integrity": "sha512-qiSlmBq9+BCdCA/L46dw8Uy93mloxsPSbwnm5yrKn2vMPiy8KyAskTF6zuV/j5BMsmOGZDPs7KjU+mjb670kfA==",[m
[32m+[m[32m      "license": "MIT"[m
[32m+[m[32m    },[m
     "node_modules/emoji-regex": {[m
       "version": "8.0.0",[m
[31m-      "dev": true,[m
       "license": "MIT"[m
     },[m
     "node_modules/enhanced-resolve": {[m
[36m@@ -1392,6 +1352,19 @@[m
         }[m
       }[m
     },[m
[32m+[m[32m    "node_modules/find-up": {[m
[32m+[m[32m      "version": "4.1.0",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/find-up/-/find-up-4.1.0.tgz",[m
[32m+[m[32m      "integrity": "sha512-PpOwAdQ/YlXQ2vj8a3h8IipDuYRi3wceVQQGYWxNINccq40Anw7BlsEXCMbt1Zt+OLA6Fq9suIpIWD0OsnISlw==",[m
[32m+[m[32m      "license": "MIT",[m
[32m+[m[32m      "dependencies": {[m
[32m+[m[32m        "locate-path": "^5.0.0",[m
[32m+[m[32m        "path-exists": "^4.0.0"[m
[32m+[m[32m      },[m
[32m+[m[32m      "engines": {[m
[32m+[m[32m        "node": ">=8"[m
[32m+[m[32m      }[m
[32m+[m[32m    },[m
     "node_modules/framer-motion": {[m
       "version": "12.43.0",[m
       "license": "MIT",[m
[36m@@ -1433,7 +1406,6 @@[m
     },[m
     "node_modules/get-caller-file": {[m
       "version": "2.0.5",[m
[31m-      "dev": true,[m
       "license": "ISC",[m
       "engines": {[m
         "node": "6.* || 8.* || >= 10.*"[m
[36m@@ -1468,7 +1440,6 @@[m
     },[m
     "node_modules/is-fullwidth-code-point": {[m
       "version": "3.0.0",[m
[31m-      "dev": true,[m
       "license": "MIT",[m
       "engines": {[m
         "node": ">=8"[m
[36m@@ -1730,6 +1701,18 @@[m
         "url": "https://opencollective.com/parcel"[m
       }[m
     },[m
[32m+[m[32m    "node_modules/locate-path": {[m
[32m+[m[32m      "version": "5.0.0",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/locate-path/-/locate-path-5.0.0.tgz",[m
[32m+[m[32m      "integrity": "sha512-t7hw9pI+WvuwNJXwk5zVHpyhIqzg2qTlklJOf0mVxGSbe3Fp2VieZcduNYjaLDoy6p9uGpQEGWG87WpMKlNq8g==",[m
[32m+[m[32m      "license": "MIT",[m
[32m+[m[32m      "dependencies": {[m
[32m+[m[32m        "p-locate": "^4.1.0"[m
[32m+[m[32m      },[m
[32m+[m[32m      "engines": {[m
[32m+[m[32m        "node": ">=8"[m
[32m+[m[32m      }[m
[32m+[m[32m    },[m
     "node_modules/lucide-react": {[m
       "version": "1.34.0",[m
       "license": "ISC",[m
[36m@@ -1818,6 +1801,51 @@[m
         }[m
       }[m
     },[m
[32m+[m[32m    "node_modules/p-limit": {[m
[32m+[m[32m      "version": "2.3.0",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/p-limit/-/p-limit-2.3.0.tgz",[m
[32m+[m[32m      "integrity": "sha512-//88mFWSJx8lxCzwdAABTJL2MyWB12+eIY7MDL2SqLmAkeKU9qxRvWuSyTjm3FUmpBEMuFfckAIqEaVGUDxb6w==",[m
[32m+[m[32m      "license": "MIT",[m
[32m+[m[32m      "dependencies": {[m
[32m+[m[32m        "p-try": "^2.0.0"[m
[32m+[m[32m      },[m
[32m+[m[32m      "engines": {[m
[32m+[m[32m        "node": ">=6"[m
[32m+[m[32m      },[m
[32m+[m[32m      "funding": {[m
[32m+[m[32m        "url": "https://github.com/sponsors/sindresorhus"[m
[32m+[m[32m      }[m
[32m+[m[32m    },[m
[32m+[m[32m    "node_modules/p-locate": {[m
[32m+[m[32m      "version": "4.1.0",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/p-locate/-/p-locate-4.1.0.tgz",[m
[32m+[m[32m      "integrity": "sha512-R79ZZ/0wAxKGu3oYMlz8jy/kbhsNrS7SKZ7PxEHBgJ5+F2mtFW2fK2cOtBh1cHYkQsbzFV7I+EoRKe6Yt0oK7A==",[m
[32m+[m[32m      "license": "MIT",[m
[32m+[m[32m      "dependencies": {[m
[32m+[m[32m        "p-limit": "^2.2.0"[m
[32m+[m[32m      },[m
[32m+[m[32m      "engines": {[m
[32m+[m[32m        "node": ">=8"[m
[32m+[m[32m      }[m
[32m+[m[32m    },[m
[32m+[m[32m    "node_modules/p-try": {[m
[32m+[m[32m      "version": "2.2.0",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/p-try/-/p-try-2.2.0.tgz",[m
[32m+[m[32m      "integrity": "sha512-R4nPAVTAU0B9D35/Gk3uJf/7XYbQcyohSKdvAxIRSNghFl4e71hVoGnBNQz9cWaXxO2I10KTC+3jMdvvoKw6dQ==",[m
[32m+[m[32m      "license": "MIT",[m
[32m+[m[32m      "engines": {[m
[32m+[m[32m        "node": ">=6"[m
[32m+[m[32m      }[m
[32m+[m[32m    },[m
[32m+[m[32m    "node_modules/path-exists": {[m
[32m+[m[32m      "version": "4.0.0",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/path-exists/-/path-exists-4.0.0.tgz",[m
[32m+[m[32m      "integrity": "sha512-ak9Qy5Q7jYb2Wwcey5Fpvg2KoAc/ZIhLSLOSBmRmygPsGwkVVt0fZa0qrtMz+m6tJTAHfZQ8FnmB4MG4LWy7/w==",[m
[32m+[m[32m      "license": "MIT",[m
[32m+[m[32m      "engines": {[m
[32m+[m[32m        "node": ">=8"[m
[32m+[m[32m      }[m
[32m+[m[32m    },[m
     "node_modules/picocolors": {[m
       "version": "1.1.1",[m
       "license": "ISC"[m
[36m@@ -1857,6 +1885,15 @@[m
         "node": ">=20"[m
       }[m
     },[m
[32m+[m[32m    "node_modules/pngjs": {[m
[32m+[m[32m      "version": "5.0.0",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/pngjs/-/pngjs-5.0.0.tgz",[m
[32m+[m[32m      "integrity": "sha512-40QW5YalBNfQo5yRYmiw7Yz6TKKVr3h6970B2YE+3fQpsWcrbj1PzJgxeJ19DRQjhMbKPIuMY8rFaXc8moolVw==",[m
[32m+[m[32m      "license": "MIT",[m
[32m+[m[32m      "engines": {[m
[32m+[m[32m        "node": ">=10.13.0"[m
[32m+[m[32m      }[m
[32m+[m[32m    },[m
     "node_modules/postcss": {[m
       "version": "8.5.26",[m
       "funding": [[m
[36m@@ -1883,6 +1920,89 @@[m
         "node": "^10 || ^12 || >=14"[m
       }[m
     },[m
[32m+[m[32m    "node_modules/qrcode": {[m
[32m+[m[32m      "version": "1.5.4",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/qrcode/-/qrcode-1.5.4.tgz",[m
[32m+[m[32m      "integrity": "sha512-1ca71Zgiu6ORjHqFBDpnSMTR2ReToX4l1Au1VFLyVeBTFavzQnv5JxMFr3ukHVKpSrSA2MCk0lNJSykjUfz7Zg==",[m
[32m+[m[32m      "license": "MIT",[m
[32m+[m[32m      "dependencies": {[m
[32m+[m[32m        "dijkstrajs": "^1.0.1",[m
[32m+[m[32m        "pngjs": "^5.0.0",[m
[32m+[m[32m        "yargs": "^15.3.1"[m
[32m+[m[32m      },[m
[32m+[m[32m      "bin": {[m
[32m+[m[32m        "qrcode": "bin/qrcode"[m
[32m+[m[32m      },[m
[32m+[m[32m      "engines": {[m
[32m+[m[32m        "node": ">=10.13.0"[m
[32m+[m[32m      }[m
[32m+[m[32m    },[m
[32m+[m[32m    "node_modules/qrcode/node_modules/cliui": {[m
[32m+[m[32m      "version": "6.0.0",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/cliui/-/cliui-6.0.0.tgz",[m
[32m+[m[32m      "integrity": "sha512-t6wbgtoCXvAzst7QgXxJYqPt0usEfbgQdftEPbLL/cvv6HPE5VgvqCuAIDR0NgU52ds6rFwqrgakNLrHEjCbrQ==",[m
[32m+[m[32m      "license": "ISC",[m
[32m+[m[32m      "dependencies": {[m
[32m+[m[32m        "string-width": "^4.2.0",[m
[32m+[m[32m        "strip-ansi": "^6.0.0",[m
[32m+[m[32m        "wrap-ansi": "^6.2.0"[m
[32m+[m[32m      }[m
[32m+[m[32m    },[m
[32m+[m[32m    "node_modules/qrcode/node_modules/wrap-ansi": {[m
[32m+[m[32m      "version": "6.2.0",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/wrap-ansi/-/wrap-ansi-6.2.0.tgz",[m
[32m+[m[32m      "integrity": "sha512-r6lPcBGxZXlIcymEu7InxDMhdW0KDxpLgoFLcguasxCaJ/SOIZwINatK9KY/tf+ZrlywOKU0UDj3ATXUBfxJXA==",[m
[32m+[m[32m      "license": "MIT",[m
[32m+[m[32m      "dependencies": {[m
[32m+[m[32m        "ansi-styles": "^4.0.0",[m
[32m+[m[32m        "string-width": "^4.1.0",[m
[32m+[m[32m        "strip-ansi": "^6.0.0"[m
[32m+[m[32m      },[m
[32m+[m[32m      "engines": {[m
[32m+[m[32m        "node": ">=8"[m
[32m+[m[32m      }[m
[32m+[m[32m    },[m
[32m+[m[32m    "node_modules/qrcode/node_modules/y18n": {[m
[32m+[m[32m      "version": "4.0.3",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/y18n/-/y18n-4.0.3.tgz",[m
[32m+[m[32m      "integrity": "sha512-JKhqTOwSrqNA1NY5lSztJ1GrBiUodLMmIZuLiDaMRJ+itFd+ABVE8XBjOvIWL+rSqNDC74LCSFmlb/U4UZ4hJQ==",[m
[32m+[m[32m      "license": "ISC"[m
[32m+[m[32m    },[m
[32m+[m[32m    "node_modules/qrcode/node_modules/yargs": {[m
[32m+[m[32m      "version": "15.4.1",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/yargs/-/yargs-15.4.1.tgz",[m
[32m+[m[32m      "integrity": "sha512-aePbxDmcYW++PaqBsJ+HYUFwCdv4LVvdnhBy78E57PIor8/OVvhMrADFFEDh8DHDFRv/O9i3lPhsENjO7QX0+A==",[m
[32m+[m[32m      "license": "MIT",[m
[32m+[m[32m      "dependencies": {[m
[32m+[m[32m        "cliui": "^6.0.0",[m
[32m+[m[32m        "decamelize": "^1.2.0",[m
[32m+[m[32m        "find-up": "^4.1.0",[m
[32m+[m[32m        "get-caller-file": "^2.0.1",[m
[32m+[m[32m        "require-directory": "^2.1.1",[m
[32m+[m[32m        "require-main-filename": "^2.0.0",[m
[32m+[m[32m        "set-blocking": "^2.0.0",[m
[32m+[m[32m        "string-width": "^4.2.0",[m
[32m+[m[32m        "which-module": "^2.0.0",[m
[32m+[m[32m        "y18n": "^4.0.0",[m
[32m+[m[32m        "yargs-parser": "^18.1.2"[m
[32m+[m[32m      },[m
[32m+[m[32m      "engines": {[m
[32m+[m[32m        "node": ">=8"[m
[32m+[m[32m      }[m
[32m+[m[32m    },[m
[32m+[m[32m    "node_modules/qrcode/node_modules/yargs-parser": {[m
[32m+[m[32m      "version": "18.1.3",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/yargs-parser/-/yargs-parser-18.1.3.tgz",[m
[32m+[m[32m      "integrity": "sha512-o50j0JeToy/4K6OZcaQmW6lyXXKhq7csREXcDwk2omFPJEwUNOVtJKvmDr9EI1fAJZUyZcRF7kxGBWmRXudrCQ==",[m
[32m+[m[32m      "license": "ISC",[m
[32m+[m[32m      "dependencies": {[m
[32m+[m[32m        "camelcase": "^5.0.0",[m
[32m+[m[32m        "decamelize": "^1.2.0"[m
[32m+[m[32m      },[m
[32m+[m[32m      "engines": {[m
[32m+[m[32m        "node": ">=6"[m
[32m+[m[32m      }[m
[32m+[m[32m    },[m
     "node_modules/react": {[m
       "version": "19.2.8",[m
       "license": "MIT",[m
[36m@@ -2001,12 +2121,17 @@[m
     },[m
     "node_modules/require-directory": {[m
       "version": "2.1.1",[m
[31m-      "dev": true,[m
       "license": "MIT",[m
       "engines": {[m
         "node": ">=0.10.0"[m
       }[m
     },[m
[32m+[m[32m    "node_modules/require-main-filename": {[m
[32m+[m[32m      "version": "2.0.0",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/require-main-filename/-/require-main-filename-2.0.0.tgz",[m
[32m+[m[32m      "integrity": "sha512-NKN5kMDylKuldxYLSUfrbo5Tuzh4hd+2E8NPPX02mZtn1VuREQToYe/ZdlJy+J3uCpfaiGF05e7B8W0iXbQHmg==",[m
[32m+[m[32m      "license": "ISC"[m
[32m+[m[32m    },[m
     "node_modules/reselect": {[m
       "version": "5.2.0",[m
       "license": "MIT"[m
[36m@@ -2054,6 +2179,12 @@[m
       "version": "0.27.0",[m
       "license": "MIT"[m
     },[m
[32m+[m[32m    "node_modules/set-blocking": {[m
[32m+[m[32m      "version": "2.0.0",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/set-blocking/-/set-blocking-2.0.0.tgz",[m
[32m+[m[32m      "integrity": "sha512-KiKBS8AnWGEyLzofFfmvKwpdPzqiy16LvQfK3yv/fVH7Bj13/wl3JSR1J+rfgRE9q7xUJK4qvgS8raSOeLUehw==",[m
[32m+[m[32m      "license": "ISC"[m
[32m+[m[32m    },[m
     "node_modules/set-cookie-parser": {[m
       "version": "2.7.2",[m
       "license": "MIT"[m
[36m@@ -2078,7 +2209,6 @@[m
     },[m
     "node_modules/string-width": {[m
       "version": "4.2.3",[m
[31m-      "dev": true,[m
       "license": "MIT",[m
       "dependencies": {[m
         "emoji-regex": "^8.0.0",[m
[36m@@ -2091,7 +2221,6 @@[m
     },[m
     "node_modules/strip-ansi": {[m
       "version": "6.0.1",[m
[31m-      "dev": true,[m
       "license": "MIT",[m
       "dependencies": {[m
         "ansi-regex": "^5.0.1"[m
[36m@@ -2506,6 +2635,12 @@[m
         "url": "https://opencollective.com/parcel"[m
       }[m
     },[m
[32m+[m[32m    "node_modules/which-module": {[m
[32m+[m[32m      "version": "2.0.1",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/which-module/-/which-module-2.0.1.tgz",[m
[32m+[m[32m      "integrity": "sha512-iBdZ57RDvnOR9AGBhML2vFZf7h8vmBjhoaZqODJBFWHVtKkDmKuHai3cx5PgVMrX5YDNp27AofYbAwctSS+vhQ==",[m
[32m+[m[32m      "license": "ISC"[m
[32m+[m[32m    },[m
     "node_modules/wrap-ansi": {[m
       "version": "7.0.0",[m
       "dev": true,[m
[1mdiff --git a/package.json b/package.json[m
[1mindex 7e149f0..bf9016f 100644[m
[1m--- a/package.json[m
[1m+++ b/package.json[m
[36m@@ -6,7 +6,7 @@[m
   "scripts": {[m
     "test": "node --test \"src/**/*.test.js\"",[m
     "dev": "npm run --silent dev:all",[m
[31m-    "dev:frontend": "node scripts/wait-for-backend.mjs && node --max-old-space-size=4096 node_modules/vite/bin/vite.js",[m
[32m+[m[32m    "dev:frontend": "vite",[m
     "dev:backend": "npm --prefix backend run --silent dev",[m
     "dev:all": "concurrently -n FRONTEND,BACKEND -c blue,green \"npm run --silent dev:frontend\" \"npm run --silent dev:backend\"",[m
     "seed": "npm --prefix backend run seed",[m
[36m@@ -19,6 +19,7 @@[m
     "@tailwindcss/vite": "^4.3.3",[m
     "framer-motion": "^12.4.7",[m
     "lucide-react": "^1.31.0",[m
[32m+[m[32m    "qrcode": "^1.5.4",[m
     "react": "^19.2.8",[m
     "react-dom": "^19.2.8",[m
     "react-router-dom": "^7.18.2",[m
[1mdiff --git a/src/App.jsx b/src/App.jsx[m
[1mindex 9d52235..bbc7263 100644[m
[1m--- a/src/App.jsx[m
[1m+++ b/src/App.jsx[m
[36m@@ -114,30 +114,10 @@[m [mexport default function App() {[m
       <Route element={<RoleProtectedRoute allow={[ROLES.ADMIN]} />}>[m
         <Route element={<DashboardLayout />}>[m
           <Route path="/admin" element={<AdminDashboard />} />[m
[32m+[m[32m          <Route path="/admin/website" element={<WebsiteManagement />} />[m
           <Route path="/admin/reports" element={<Navigate to="/management/insights" replace />} />[m
[31m-        </Route>[m
[31m-      </Route>[m
[31m-[m
[31m-      <Route element={<PermissionProtectedRoute permissions={['users.view']} />}>[m
[31m-        <Route element={<DashboardLayout />}>[m
           <Route path="/admin/users" element={<Users />} />[m
[31m-        </Route>[m
[31m-      </Route>[m
[31m-[m
[31m-      <Route element={<PermissionProtectedRoute permissions={['users.update']} />}>[m
[31m-        <Route element={<DashboardLayout />}>[m
           <Route path="/admin/roles" element={<RolesPermissions />} />[m
[31m-        </Route>[m
[31m-      </Route>[m
[31m-[m
[31m-      <Route element={<PermissionProtectedRoute permissions={['website.view']} />}>[m
[31m-        <Route element={<DashboardLayout />}>[m
[31m-          <Route path="/admin/website" element={<WebsiteManagement />} />[m
[31m-        </Route>[m
[31m-      </Route>[m
[31m-[m
[31m-      <Route element={<PermissionProtectedRoute permissions={['settings.view']} />}>[m
[31m-        <Route element={<DashboardLayout />}>[m
           <Route path="/admin/settings" element={<Settings />} />[m
         </Route>[m
       </Route>[m
[1mdiff --git a/src/components/forms/CreatableSelect.jsx b/src/components/forms/CreatableSelect.jsx[m
[1mnew file mode 100644[m
[1mindex 0000000..1f324f4[m
[1m--- /dev/null[m
[1m+++ b/src/components/forms/CreatableSelect.jsx[m
[36m@@ -0,0 +1,75 @@[m
[32m+[m[32mimport { useState } from 'react';[m
[32m+[m[32mimport { Check, X } from 'lucide-react';[m
[32m+[m[32mimport { Input, Select } from './FormField';[m
[32m+[m
[32m+[m[32mconst ADD_OPTION = '__add_option__';[m
[32m+[m
[32m+[m[32mexport default function CreatableSelect({ label, value, onChange, options = [], error, required = false, placeholder, addLabel = '+ Other' }) {[m
[32m+[m[32m  const [adding, setAdding] = useState(false);[m
[32m+[m[32m  const [newValue, setNewValue] = useState('');[m
[32m+[m[32m  const [addError, setAddError] = useState('');[m
[32m+[m
[32m+[m[32m  const beginAdding = () => {[m
[32m+[m[32m    setAdding(true);[m
[32m+[m[32m    setNewValue('');[m
[32m+[m[32m    setAddError('');[m
[32m+[m[32m  };[m
[32m+[m
[32m+[m[32m  const cancelAdding = () => {[m
[32m+[m[32m    setAdding(false);[m
[32m+[m[32m    setNewValue('');[m
[32m+[m[32m    setAddError('');[m
[32m+[m[32m  };[m
[32m+[m
[32m+[m[32m  const saveOption = () => {[m
[32m+[m[32m    const trimmed = newValue.trim();[m
[32m+[m[32m    if (!trimmed) {[m
[32m+[m[32m      setAddError('Please enter a value.');[m
[32m+[m[32m      return;[m
[32m+[m[32m    }[m
[32m+[m[32m    if (options.some((option) => option.value.toLowerCase() === trimmed.toLowerCase())) {[m
[32m+[m[32m      setAddError(`"${trimmed}" already exists.`);[m
[32m+[m[32m      return;[m
[32m+[m[32m    }[m
[32m+[m[32m    onChange({ target: { value: trimmed } });[m
[32m+[m[32m    cancelAdding();[m
[32m+[m[32m  };[m
[32m+[m
[32m+[m[32m  return adding ? ([m
[32m+[m[32m    <div className="flex items-end gap-2">[m
[32m+[m[32m      <div className="min-w-0 flex-1">[m
[32m+[m[32m        <Input[m
[32m+[m[32m          label={label}[m
[32m+[m[32m          value={newValue}[m
[32m+[m[32m          onChange={(event) => { setNewValue(event.target.value); setAddError(''); }}[m
[32m+[m[32m          onKeyDown={(event) => {[m
[32m+[m[32m            if (event.key === 'Enter') { event.preventDefault(); saveOption(); }[m
[32m+[m[32m            if (event.key === 'Escape') cancelAdding();[m
[32m+[m[32m          }}[m
[32m+[m[32m          error={addError || error}[m
[32m+[m[32m          required={required}[m
[32m+[m[32m          placeholder={addLabel}[m
[32m+[m[32m          autoFocus[m
[32m+[m[32m          trailing={([m
[32m+[m[32m            <button type="button" onClick={cancelAdding} aria-label="Cancel adding option" title="Cancel" className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--color-mid-gray)] hover:bg-[var(--color-soft-gray)] hover:text-[var(--color-dark-gray)]">[m
[32m+[m[32m              <X className="h-4 w-4" aria-hidden="true" />[m
[32m+[m[32m            </button>[m
[32m+[m[32m          )}[m
[32m+[m[32m        />[m
[32m+[m[32m      </div>[m
[32m+[m[32m      <button type="button" onClick={saveOption} aria-label="Save option" title="Save" className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-medium-green)] text-white hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[var(--color-medium-green)] focus:ring-offset-2">[m
[32m+[m[32m        <Check className="h-4 w-4" aria-hidden="true" />[m
[32m+[m[32m      </button>[m
[32m+[m[32m    </div>[m
[32m+[m[32m  ) : ([m
[32m+[m[32m    <Select[m
[32m+[m[32m      label={label}[m
[32m+[m[32m      value={value}[m
[32m+[m[32m      onChange={(event) => event.target.value === ADD_OPTION ? beginAdding() : onChange(event)}[m
[32m+[m[32m      options={[...options, { value: ADD_OPTION, label: addLabel }]}[m
[32m+[m[32m      error={error}[m
[32m+[m[32m      required={required}[m
[32m+[m[32m      placeholder={placeholder}[m
[32m+[m[32m    />[m
[32m+[m[32m  );[m
[32m+[m[32m}[m
\ No newline at end of file[m
[1mdiff --git a/src/components/navigation/NotificationBell.jsx b/src/components/navigation/NotificationBell.jsx[m
[1mindex 9e09935..ed77c84 100644[m
[1m--- a/src/components/navigation/NotificationBell.jsx[m
[1m+++ b/src/components/navigation/NotificationBell.jsx[m
[36m@@ -5,71 +5,42 @@[m [mimport { useNotifications } from '../../context/NotificationContext';[m
 import { useApp } from '../../context/AppContext';[m
 import { EmptyState } from '../feedback/States';[m
 [m
[31m-const ICONS = { overdue: AlertTriangle, 'low-stock': TrendingDown, stock: Package, borrow: BookMarked, system: Info, website: Info, info: Info };[m
[31m-[m
[31m-const TYPE_META = {[m
[31m-  overdue: { label: 'Overdue', tone: 'bg-amber-50 text-amber-700 ring-amber-200' },[m
[31m-  'low-stock': { label: 'Low stock', tone: 'bg-orange-50 text-orange-700 ring-orange-200' },[m
[31m-  stock: { label: 'Stock', tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },[m
[31m-  borrow: { label: 'Library', tone: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },[m
[31m-  system: { label: 'System', tone: 'bg-sky-50 text-sky-700 ring-sky-200' },[m
[31m-  website: { label: 'Website', tone: 'bg-violet-50 text-violet-700 ring-violet-200' },[m
[31m-  info: { label: 'Info', tone: 'bg-slate-100 text-slate-700 ring-slate-200' },[m
[31m-};[m
[31m-[m
[31m-function formatNotificationDate(value) {[m
[31m-  const date = new Date(value);[m
[31m-  if (Number.isNaN(date.getTime())) return 'Recently';[m
[31m-  return date.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });[m
[31m-}[m
[32m+[m[32mconst ICONS = { overdue: AlertTriangle, 'low-stock': TrendingDown, stock: Package, borrow: BookMarked, system: Info };[m
 [m
 export function NotificationItem({ notification, onClick, onDelete }) {[m
   const { t } = useApp();[m
   const Icon = ICONS[notification.type] || Info;[m
[31m-  const meta = TYPE_META[notification.type] || TYPE_META.info;[m
[31m-[m
   return ([m
[31m-    <div className={`w-full border-b border-[var(--color-border-gray)] p-3 transition-colors ${notification.read ? 'bg-white' : 'bg-[var(--color-gold-100)]/35 hover:bg-[var(--color-gold-100)]/50'}`}>[m
[31m-      <div className="flex items-start gap-3">[m
[32m+[m[32m    <div className="w-full flex items-start gap-3 px-4 py-3 hover:bg-[var(--color-off-white)]">[m
[32m+[m[32m      <button[m
[32m+[m[32m        type="button"[m
[32m+[m[32m        onClick={() => onClick(notification)}[m
[32m+[m[32m        className="flex-1 flex items-start gap-3 text-left"[m
[32m+[m[32m      >[m
[32m+[m[32m        <span className="mt-0.5 w-7 h-7 rounded-full bg-[var(--color-gold-100)] text-[var(--color-gold)] flex items-center justify-center flex-shrink-0">[m
[32m+[m[32m          <Icon className="w-3.5 h-3.5" aria-hidden="true" />[m
[32m+[m[32m        </span>[m
[32m+[m[32m        <span className="flex-1">[m
[32m+[m[32m          <span className={`block text-sm ${notification.read ? 'text-[var(--color-mid-gray)]' : 'text-[var(--color-dark-gray)] font-medium'}`}>[m
[32m+[m[32m            {notification.message}[m
[32m+[m[32m          </span>[m
[32m+[m[32m          <span className="block text-xs text-[var(--color-mid-gray)] mt-0.5">[m
[32m+[m[32m            {new Date(notification.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}[m
[32m+[m[32m          </span>[m
[32m+[m[32m        </span>[m
[32m+[m[32m        {!notification.read && <span className="w-2 h-2 rounded-full bg-[var(--color-gold)] mt-1.5 flex-shrink-0" aria-hidden="true" />}[m
[32m+[m[32m      </button>[m
[32m+[m[32m      {onDelete && ([m
         <button[m
           type="button"[m
[31m-          onClick={() => onClick(notification)}[m
[31m-          className="flex flex-1 items-start gap-3 text-left"[m
[32m+[m[32m          aria-label={t('deleteNotification')}[m
[32m+[m[32m          title={t('deleteNotification')}[m
[32m+[m[32m          onClick={(e) => { e.stopPropagation(); onDelete(notification); }}[m
[32m+[m[32m          className="p-1 rounded-md text-[var(--color-mid-gray)] hover:bg-[var(--color-soft-gray)] hover:text-[var(--color-status-red)]"[m
         >[m
[31m-          <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--color-soft-gray)] text-[var(--color-heading)] ring-1 ring-inset ring-[var(--color-border-gray)]">[m
[31m-            <Icon className="h-4 w-4" aria-hidden="true" />[m
[31m-          </span>[m
[31m-[m
[31m-          <span className="min-w-0 flex-1">[m
[31m-            <span className="flex items-center gap-2">[m
[31m-              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${meta.tone}`}>[m
[31m-                {meta.label}[m
[31m-              </span>[m
[31m-              {!notification.read && <span className="h-2 w-2 rounded-full bg-[var(--color-gold)]" aria-label="Unread notification" />}[m
[31m-            </span>[m
[31m-[m
[31m-            <span className={`mt-1 block text-sm leading-5 ${notification.read ? 'text-[var(--color-mid-gray)]' : 'text-[var(--color-dark-gray)] font-medium'}`}>[m
[31m-              {notification.message}[m
[31m-            </span>[m
[31m-[m
[31m-            <span className="mt-1 block text-[11px] text-[var(--color-mid-gray)]">[m
[31m-              {formatNotificationDate(notification.date)}[m
[31m-            </span>[m
[31m-          </span>[m
[32m+[m[32m          <Trash2 className="w-4 h-4" aria-hidden="true" />[m
         </button>[m
[31m-[m
[31m-        {onDelete && ([m
[31m-          <button[m
[31m-            type="button"[m
[31m-            aria-label={t('deleteNotification')}[m
[31m-            title={t('deleteNotification')}[m
[31m-            onClick={(e) => { e.stopPropagation(); onDelete(notification); }}[m
[31m-            className="mt-1 rounded-md p-1.5 text-[var(--color-mid-gray)] transition-colors hover:bg-[var(--color-soft-gray)] hover:text-[var(--color-status-red)]"[m
[31m-          >[m
[31m-            <Trash2 className="h-4 w-4" aria-hidden="true" />[m
[31m-          </button>[m
[31m-        )}[m
[31m-      </div>[m
[32m+[m[32m      )}[m
     </div>[m
   );[m
 }[m
[36m@@ -78,7 +49,6 @@[m [mexport default function NotificationBell() {[m
   const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, soundEnabled, toggleSound } = useNotifications();[m
   const { t } = useApp();[m
   const [open, setOpen] = useState(false);[m
[31m-  const [filter, setFilter] = useState('all');[m
   const ref = useRef(null);[m
   const navigate = useNavigate();[m
 [m
[36m@@ -88,12 +58,6 @@[m [mexport default function NotificationBell() {[m
     return () => document.removeEventListener('mousedown', handler);[m
   }, []);[m
 [m
[31m-  const visibleNotifications = notifications.filter((n) => {[m
[31m-    if (filter === 'unread') return !n.read;[m
[31m-    if (filter === 'alerts') return !n.read || ['overdue', 'low-stock', 'stock', 'borrow'].includes(n.type);[m
[31m-    return true;[m
[31m-  });[m
[31m-[m
   const handleClick = (n) => {[m
     markAsRead(n.id);[m
     setOpen(false);[m
[36m@@ -106,60 +70,40 @@[m [mexport default function NotificationBell() {[m
         type="button"[m
         onClick={() => setOpen((v) => !v)}[m
         aria-label={t('notificationsUnread', { count: unreadCount })}[m
[31m-        className="relative rounded-full p-2 text-[var(--color-mid-gray)] transition-colors hover:bg-[var(--color-soft-gray)]"[m
[32m+[m[32m        className="relative p-2 rounded-full hover:bg-[var(--color-soft-gray)] text-[var(--color-mid-gray)]"[m
       >[m
[31m-        <Bell className="h-5 w-5" aria-hidden="true" />[m
[32m+[m[32m        <Bell className="w-5 h-5" aria-hidden="true" />[m
         {unreadCount > 0 && ([m
[31m-          <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-[var(--color-status-red)] ring-2 ring-[var(--color-white)]" aria-hidden="true" />[m
[32m+[m[32m          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--color-status-red)]" aria-hidden="true" />[m
         )}[m
       </button>[m
 [m
       {open && ([m
[31m-        <div className="absolute right-0 mt-2 flex max-h-[75vh] w-[360px] flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border-gray)] bg-[var(--sidebar-bg)] shadow-card-hover z-30">[m
[31m-          <div className="border-b border-[var(--color-border-gray)] px-4 py-3">[m
[31m-            <div className="flex items-center justify-between gap-3">[m
[31m-              <p className="font-semibold text-sm text-[var(--color-dark-gray)]">{t('notifications')}</p>[m
[31m-              <div className="flex items-center gap-2">[m
[31m-                <button[m
[31m-                  type="button"[m
[31m-                  onClick={toggleSound}[m
[31m-                  aria-label={soundEnabled ? t('muteNotificationSound') : t('unmuteNotificationSound')}[m
[31m-                  title={soundEnabled ? t('notificationSoundOn') : t('notificationSoundOff')}[m
[31m-                  className="rounded-md p-1.5 text-[var(--color-mid-gray)] transition-colors hover:bg-[var(--color-off-white)] hover:text-[var(--color-dark-gray)]"[m
[31m-                >[m
[31m-                  {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}[m
[32m+[m[32m        <div className="absolute right-0 mt-2 w-80 bg-[var(--sidebar-bg)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] shadow-card-hover z-30 max-h-[70vh] flex flex-col">[m
[32m+[m[32m          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-gray)]">[m
[32m+[m[32m            <p className="font-semibold text-sm text-[var(--color-dark-gray)]">{t('notifications')}</p>[m
[32m+[m[32m            <div className="flex items-center gap-3">[m
[32m+[m[32m              <button[m
[32m+[m[32m                type="button"[m
[32m+[m[32m                onClick={toggleSound}[m
[32m+[m[32m                aria-label={soundEnabled ? t('muteNotificationSound') : t('unmuteNotificationSound')}[m
[32m+[m[32m                title={soundEnabled ? t('notificationSoundOn') : t('notificationSoundOff')}[m
[32m+[m[32m                className="p-1 rounded-md text-[var(--color-mid-gray)] hover:bg-[var(--color-off-white)] hover:text-[var(--color-dark-gray)]"[m
[32m+[m[32m              >[m
[32m+[m[32m                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}[m
[32m+[m[32m              </button>[m
[32m+[m[32m              {unreadCount > 0 && ([m
[32m+[m[32m                <button type="button" onClick={markAllAsRead} className="text-xs font-medium text-[var(--color-gold)] hover:underline">[m
[32m+[m[32m                  {t('markAllAsRead')}[m
                 </button>[m
[31m-                {unreadCount > 0 && ([m
[31m-                  <button type="button" onClick={markAllAsRead} className="text-[11px] font-medium text-[var(--color-gold)] hover:underline">[m
[31m-                    {t('markAllAsRead')}[m
[31m-                  </button>[m
[31m-                )}[m
[31m-              </div>[m
[31m-            </div>[m
[31m-[m
[31m-            <div className="mt-3 flex items-center gap-2">[m
[31m-              {['all', 'unread', 'alerts'].map((option) => ([m
[31m-                <button[m
[31m-                  key={option}[m
[31m-                  type="button"[m
[31m-                  onClick={() => setFilter(option)}[m
[31m-                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${filter === option ? 'bg-[var(--color-gold-100)] text-[var(--color-heading)]' : 'bg-[var(--color-soft-gray)] text-[var(--color-mid-gray)] hover:text-[var(--color-dark-gray)]'}`}[m
[31m-                >[m
[31m-                  {option === 'all' ? 'All' : option === 'unread' ? 'Unread' : 'Alerts'}[m
[31m-                </button>[m
[31m-              ))}[m
[32m+[m[32m              )}[m
             </div>[m
           </div>[m
[31m-[m
[31m-          <div className="overflow-y-auto bg-white">[m
[31m-            {visibleNotifications.length === 0 ? ([m
[31m-              <div className="p-4">[m
[31m-                <EmptyState title={t('noNotifications')} message={t('allCaughtUp')} />[m
[31m-              </div>[m
[32m+[m[32m          <div className="overflow-y-auto divide-y divide-[var(--color-border-gray)]">[m
[32m+[m[32m            {notifications.length === 0 ? ([m
[32m+[m[32m              <EmptyState title={t('noNotifications')} message={t('allCaughtUp')} />[m
             ) : ([m
[31m-              visibleNotifications.map((n) => ([m
[31m-                <NotificationItem key={n.id} notification={n} onClick={handleClick} onDelete={(item) => deleteNotification(item.id)} />[m
[31m-              ))[m
[32m+[m[32m              notifications.map((n) => <NotificationItem key={n.id} notification={n} onClick={handleClick} onDelete={(item) => deleteNotification(item.id)} />)[m
             )}[m
           </div>[m
         </div>[m
[1mdiff --git a/src/context/AppContext.jsx b/src/context/AppContext.jsx[m
[1mindex 6602036..6a3c34c 100644[m
[1m--- a/src/context/AppContext.jsx[m
[1m+++ b/src/context/AppContext.jsx[m
[36m@@ -426,9 +426,26 @@[m [mconst DICTIONARY = {[m
     defaultLoanPeriod: 'Default Loan Period',[m
     stockSettings: 'Stock Settings',[m
     defaultMinimumStock: 'Default Minimum Stock Level',[m
[32m+[m[32m    administratorSecurity: 'Administrator Security',[m
[32m+[m[32m    administratorSecurityDescription: 'Protect administrator sign-ins with an authenticator app.',[m
[32m+[m[32m    twoFactorAuthentication: 'Two-factor authentication',[m
[32m+[m[32m    enabled: 'Enabled',[m
[32m+[m[32m    notEnabled: 'Not enabled',[m
[32m+[m[32m    generateSetupSecret: 'Generate setup secret',[m
[32m+[m[32m    authenticatorCode: 'Authenticator code',[m
[32m+[m[32m    enable2fa: 'Enable 2FA',[m
[32m+[m[32m    currentPassword: 'Current password',[m
[32m+[m[32m    disable2fa: 'Disable 2FA',[m
     saveSettings: 'Save Settings',[m
[32m+[m[32m    setupSecretGenerated: 'Setup secret generated. Add it to your authenticator app.',[m
[32m+[m[32m    twoFactorEnabled: 'Two-factor authentication enabled.',[m
[32m+[m[32m    twoFactorDisabled: 'Two-factor authentication disabled.',[m
     settingsSaved: 'Settings saved successfully.',[m
     couldNotSaveSettings: 'Could not save settings. Please try again.',[m
[32m+[m[32m    emailDelivery: 'Email delivery', emailDeliveryDescription: 'Configure the sender used for admission status emails.',[m
[32m+[m[32m    smtpHost: 'SMTP host', smtpPort: 'SMTP port', smtpUsername: 'SMTP username', senderEmail: 'Sender email', smtpAppPassword: 'SMTP app password',[m
[32m+[m[32m    useSecureSmtp: 'Use secure SMTP (usually port 465)', smtpPasswordConfigured: 'SMTP password is configured.', smtpNotConfigured: 'SMTP is not configured yet.',[m
[32m+[m[32m    saveEmailSettings: 'Save email settings', emailSettingsSaved: 'Email settings saved.', emailSettingsRequired: 'SMTP host and sender email are required.', scanQrCode: 'Scan this QR code with your authenticator app.', recoveryCodes: 'Recovery codes', saveRecoveryCodes: 'Save these codes somewhere secure. Each code works once if you lose your phone.', authenticatorOrRecoveryCode: '6-digit code or recovery code',[m
     validationLetters: 'Use letters only — numbers and symbols are not allowed.',[m
     validationAlnum: 'Use letters and numbers only (no special symbols).',[m
     validationCode: 'Use letters, numbers and - . _ / only (no spaces).',[m
[36m@@ -1177,9 +1194,26 @@[m [mconst DICTIONARY = {[m
     defaultLoanPeriod: 'Durée de prêt par défaut',[m
     stockSettings: 'Paramètres du stock',[m
     defaultMinimumStock: 'Niveau minimum de stock par défaut',[m
[32m+[m[32m    administratorSecurity: 'Sécurité administrateur',[m
[32m+[m[32m    administratorSecurityDescription: 'Protégez les connexions administrateur avec une application d’authentification.',[m
[32m+[m[32m    twoFactorAuthentication: 'Authentification à deux facteurs',[m
[32m+[m[32m    enabled: 'Activée',[m
[32m+[m[32m    notEnabled: 'Non activée',[m
[32m+[m[32m    generateSetupSecret: 'Générer le secret de configuration',[m
[32m+[m[32m    authenticatorCode: 'Code d’authentification',[m
[32m+[m[32m    enable2fa: 'Activer la 2FA',[m
[32m+[m[32m    currentPassword: 'Mot de passe actuel',[m
[32m+[m[32m    disable2fa: 'Désactiver la 2FA',[m
     saveSettings: 'Enregistrer les paramètres',[m
[32m+[m[32m    setupSecretGenerated: 'Secret généré. Ajoutez-le à votre application d’authentification.',[m
[32m+[m[32m    twoFactorEnabled: 'Authentification à deux facteurs activée.',[m
[32m+[m[32m    twoFactorDisabled: 'Authentification à deux facteurs désactivée.',[m
     settingsSaved: 'Paramètres enregistrés avec succès.',[m
     couldNotSaveSettings: 'Impossible d’enregistrer les paramètres. Veuillez réessayer.',[m
[32m+[m[32m    emailDelivery: 'Envoi des e-mails', emailDeliveryDescription: 'Configurez l’expéditeur utilisé pour les e-mails de statut des admissions.',[m
[32m+[m[32m    smtpHost: 'Hôte SMTP', smtpPort: 'Port SMTP', smtpUsername: 'Nom d’utilisateur SMTP', senderEmail: 'E-mail de l’expéditeur', smtpAppPassword: 'Mot de passe d’application SMTP',[m
[32m+[m[32m    useSecureSmtp: 'Utiliser SMTP sécurisé (généralement le port 465)', smtpPasswordConfigured: 'Le mot de passe SMTP est configuré.', smtpNotConfigured: 'SMTP n’est pas encore configuré.',[m
[32m+[m[32m    saveEmailSettings: 'Enregistrer les paramètres e-mail', emailSettingsSaved: 'Paramètres e-mail enregistrés.', emailSettingsRequired: 'L’hôte SMTP et l’e-mail de l’expéditeur sont obligatoires.', scanQrCode: 'Scannez ce code QR avec votre application d’authentification.', recoveryCodes: 'Codes de récupération', saveRecoveryCodes: 'Conservez ces codes en lieu sûr. Chaque code ne fonctionne qu’une fois si vous perdez votre téléphone.', authenticatorOrRecoveryCode: 'Code à 6 chiffres ou code de récupération',[m
     validationLetters: 'Utilisez uniquement des lettres — les chiffres et symboles ne sont pas autorisés.',[m
     validationAlnum: 'Utilisez uniquement des lettres et des chiffres (pas de symboles spéciaux).',[m
     validationCode: 'Utilisez uniquement des lettres, chiffres et - . _ / (sans espaces).',[m
[36m@@ -1929,9 +1963,26 @@[m [mconst DICTIONARY = {[m
     defaultLoanPeriod: 'Igihe gisanzwe cyo gufata igitabo',[m
     stockSettings: 'Igenamiterere rya stock',[m
     defaultMinimumStock: 'Umubare muto wa stock usanzwe',[m
[32m+[m[32m    administratorSecurity: 'Umutekano wa admin',[m
[32m+[m[32m    administratorSecurityDescription: 'Rinda login za admin ukoresheje application y’igenzura.',[m
[32m+[m[32m    twoFactorAuthentication: 'Umutekano w’ibyiciro bibiri',[m
[32m+[m[32m    enabled: 'Birakora',[m
[32m+[m[32m    notEnabled: 'Ntabwo bikora',[m
[32m+[m[32m    generateSetupSecret: 'Kora secret yo gutangira',[m
[32m+[m[32m    authenticatorCode: 'Code y’igenzura',[m
[32m+[m[32m    enable2fa: 'Koresha 2FA',[m
[32m+[m[32m    currentPassword: 'Ijambo ry’ibanga risanzwe',[m
[32m+[m[32m    disable2fa: 'Hagarika 2FA',[m
     saveSettings: 'Bika igenamiterere',[m
[32m+[m[32m    setupSecretGenerated: 'Secret yakozwe. Yongerere kuri application y’igenzura.',[m
[32m+[m[32m    twoFactorEnabled: 'Umutekano w’ibyiciro bibiri wakoreshejwe.',[m
[32m+[m[32m    twoFactorDisabled: 'Umutekano w’ibyiciro bibiri wahagaritswe.',[m
     settingsSaved: 'Igenamiterere ryabitswe neza.',[m
     couldNotSaveSettings: 'Ntibishobotse kubika igenamiterere. Ongera ugerageze.',[m
[32m+[m[32m    emailDelivery: 'Kohereza imeyili', emailDeliveryDescription: 'Shyiraho uwandika imeyili zimenyesha uko ubusabe bwo kwinjira buhagaze.',[m
[32m+[m[32m    smtpHost: 'Seriveri ya SMTP', smtpPort: 'Port ya SMTP', smtpUsername: 'Izina rya SMTP', senderEmail: 'Imeyili y’uwitanga', smtpAppPassword: 'Ijambo ry’ibanga rya SMTP',[m
[32m+[m[32m    useSecureSmtp: 'Koresha SMTP irinzwe (akenshi port 465)', smtpPasswordConfigured: 'Ijambo ry’ibanga rya SMTP ryashyizweho.', smtpNotConfigured: 'SMTP ntirashyirwaho.',[m
[32m+[m[32m    saveEmailSettings: 'Bika igenamiterere rya imeyili', emailSettingsSaved: 'Igenamiterere rya imeyili ryabitswe.', emailSettingsRequired: 'Seriveri ya SMTP na imeyili y’uwitanga birakenewe.', scanQrCode: 'Sikana iyi QR code ukoresheje application y’authenticator.', recoveryCodes: 'Codes zo gusubirana', saveRecoveryCodes: 'Bika izi codes ahantu hizewe. Buri code ikoreshwa rimwe gusa igihe watakaje telefone.', authenticatorOrRecoveryCode: 'Code y’imibare 6 cyangwa code yo gusubirana',[m
     validationLetters: 'Koresha inyuguti gusa — imibare n\'ibimenyetso ntibyemewe.',[m
     validationAlnum: 'Koresha inyuguti n\'imibare gusa (nta bimenyetso bidasanzwe).',[m
     validationCode: 'Koresha inyuguti, imibare na - . _ / gusa (nta myanya).',[m
[1mdiff --git a/src/context/NotificationContext.jsx b/src/context/NotificationContext.jsx[m
[1mindex 46a7f95..495820a 100644[m
[1m--- a/src/context/NotificationContext.jsx[m
[1m+++ b/src/context/NotificationContext.jsx[m
[36m@@ -1,25 +1,9 @@[m
[31m-import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';[m
[32m+[m[32mimport { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';[m
 import { api } from '../services/api';[m
 import { getNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification as removeNotification } from '../services/notificationService';[m
[31m-import { useAuth } from './AuthContext';[m
 [m
 const NotificationContext = createContext(null);[m
 const SOUND_KEY = 'rg_notification_sound_enabled';[m
[31m-const MODULE_PERMISSION_MAP = {[m
[31m-  Library: ['library.view', 'library.books.create', 'library.books.update', 'library.books.delete', 'library.borrow', 'library.return', 'library.reports'],[m
[31m-  Stock: ['stock.view', 'stock.create', 'stock.update', 'stock.in', 'stock.out', 'stock.adjust', 'stock.transfer', 'stock.damage', 'stock.dispose.request', 'stock.dispose.approve', 'stock.archive.request', 'stock.archive.approve', 'stock.suppliers', 'stock.reports'],[m
[31m-  Admissions: ['applications.view', 'applications.update'],[m
[31m-};[m
[31m-[m
[31m-function isRelevantToUser(notification, user) {[m
[31m-  if (!notification?.module || !user) return true;[m
[31m-  const permissionHints = MODULE_PERMISSION_MAP[notification.module] || [];[m
[31m-  if (!permissionHints.length) return true;[m
[31m-[m
[31m-  const userPermissions = Array.isArray(user.permissions) ? user.permissions : [];[m
[31m-  const hasMatchingPermission = permissionHints.some((permission) => userPermissions.includes(permission));[m
[31m-  return hasMatchingPermission || (notification.module === 'Library' && user.role === 'librarian') || (notification.module === 'Stock' && user.role === 'stock_manager') || (notification.module === 'Admissions' && user.role === 'management');[m
[31m-}[m
 [m
 function normalizeNotification(notification) {[m
   return { ...notification, id: notification.id || notification._id, to: notification.to || notification.link, date: notification.date || notification.createdAt };[m
[36m@@ -56,7 +40,6 @@[m [mfunction playChime() {[m
 }[m
 [m
 export function NotificationProvider({ children }) {[m
[31m-  const { user } = useAuth();[m
   const [notifications, setNotifications] = useState([]);[m
   const [soundEnabled, setSoundEnabled] = useState(() => {[m
     try {[m
[36m@@ -67,7 +50,6 @@[m [mexport function NotificationProvider({ children }) {[m
     }[m
   });[m
   const hydrated = useRef(false);[m
[31m-  const relevantNotifications = useMemo(() => notifications.filter((notification) => isRelevantToUser(notification, user)), [notifications, user]);[m
 [m
   const addNotification = useCallback(({ type = 'system', message, to }) => {[m
     const notification = {[m
[36m@@ -148,11 +130,11 @@[m [mexport function NotificationProvider({ children }) {[m
     }[m
   }, []);[m
 [m
[31m-  const unreadCount = relevantNotifications.filter((n) => !n.read).length;[m
[32m+[m[32m  const unreadCount = notifications.filter((n) => !n.read).length;[m
 [m
   return ([m
     <NotificationContext.Provider[m
[31m-      value={{ notifications: relevantNotifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, addNotification, soundEnabled, toggleSound }}[m
[32m+[m[32m      value={{ notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, addNotification, soundEnabled, toggleSound }}[m
     >[m
       {children}[m
     </NotificationContext.Provider>[m
[1mdiff --git a/src/data/roles.js b/src/data/roles.js[m
[1mindex 2377aa7..6154d0e 100644[m
[1m--- a/src/data/roles.js[m
[1m+++ b/src/data/roles.js[m
[36m@@ -32,46 +32,62 @@[m [mexport const ROLE_HOME = {[m
 };[m
 [m
 /**[m
[31m- * The IT / System Administrator keeps the administration area focused on system[m
[31m- * controls and does not inherit module-level access to Equipment, Library MIS,[m
[31m- * or Stock MIS by default.[m
[32m+[m[32m * The IT / System Administrator always sees the full menu.[m
[32m+[m[32m * Every other user gets a menu built from the permissions they currently hold[m
[32m+[m[32m * (see MASTER_NAV + getNavForUser below), NOT from their role name.[m
  */[m
 export const ADMIN_NAV = [[m
[31m-  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },[m
[31m-  {[m
[31m-    label: 'Users & Access',[m
[31m-    to: '/admin/users',[m
[31m-    icon: ShieldCheck,[m
[31m-    children: [[m
[31m-      { label: 'Users & Roles', to: '/admin/users', icon: Users, permission: 'users.view' },[m
[31m-      { label: 'Roles & Permissions', to: '/admin/roles', icon: ShieldCheck, permission: 'users.update' },[m
[31m-    ],[m
[31m-  },[m
[31m-  {[m
[31m-    label: 'Website',[m
[31m-    to: '/admin/website',[m
[31m-    icon: Globe,[m
[31m-    children: [[m
[31m-      { label: 'Website Management', to: '/admin/website', icon: Globe, permission: 'website.view' },[m
[31m-    ],[m
[31m-  },[m
[31m-  {[m
[31m-    label: 'Oversight',[m
[31m-    to: '/admin/activity',[m
[31m-    icon: Activity,[m
[31m-    children: [[m
[31m-      { label: 'Activity / Audit', to: '/admin/activity', icon: Activity, permission: 'audit.view' },[m
[31m-    ],[m
[31m-  },[m
[31m-  {[m
[31m-    label: 'System',[m
[31m-    to: '/admin/settings',[m
[31m-    icon: Settings,[m
[31m-    children: [[m
[31m-      { label: 'Settings', to: '/admin/settings', icon: Settings, permission: 'settings.view' },[m
[31m-    ],[m
[31m-  },[m
[31m-];[m
[32m+[m[32m    { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },[m
[32m+[m[32m    {[m
[32m+[m[32m      label: 'School Modules',[m
[32m+[m[32m      to: '/admin',[m
[32m+[m[32m      icon: LayoutList,[m
[32m+[m[32m      children: [[m
[32m+[m[32m        { label: 'Website Management', to: '/admin/website', icon: Globe },[m
[32m+[m[32m        { label: 'Equipment MIS', to: '/equipment', icon: Laptop, permission: 'equipment.view' },[m
[32m+[m[32m        { label: 'Equipment Reports', to: '/equipment/reports', icon: FileBarChart, permission: 'equipment.view' },[m
[32m+[m[32m      ],[m
[32m+[m[32m    },[m
[32m+[m[32m    {[m
[32m+[m[32m      label: 'Stock MIS',[m
[32m+[m[32m      to: '/stock',[m
[32m+[m[32m      icon: Package,[m
[32m+[m[32m      children: [[m
[32m+[m[32m        { label: 'Items', to: '/stock/items', icon: Boxes, permission: 'stock.view' },[m
[32m+[m[32m        { label: 'Alerts', to: '/stock/alerts', icon: AlertTriangle, permission: 'stock.view' },[m
[32m+[m[32m        { label: 'Receive Stock', to: '/stock/stock-in', icon: PackagePlus, permission: 'stock.in' },[m
[32m+[m[32m        { label: 'Issue Stock', to: '/stock/stock-out', icon: PackageMinus, permission: 'stock.out' },[m
[32m+[m[32m        { label: 'Transfer Stock', to: '/stock/transfer', icon: ArrowLeftRight, permission: 'stock.transfer' },[m
[32m+[m[32m        { label: 'Adjust Stock', to: '/stock/adjustment', icon: ClipboardEdit, permission: 'stock.adjust' },[m
[32m+[m[32m        { label: 'Stock Reports', to: '/stock/reports', icon: FileBarChart, permission: 'stock.reports' },[m
[32m+[m[32m      ],[m
[32m+[m[32m    },[m
[32m+[m[32m    {[m
[32m+[m[32m      label: 'Library MIS',[m
[32m+[m[32m      to: '/library',[m
[32m+[m[32m      icon: BookOpen,[m
[32m+[m[32m      permission: 'library.view',[m
[32m+[m[32m      children: [[m
[32m+[m[32m        { label: 'Books', to: '/library/books', icon: BookOpen, permission: 'library.view' },[m
[32m+[m[32m        { label: 'Borrowed Books', to: '/library/borrowed', icon: BookMarked, permission: 'library.view' },[m
[32m+[m[32m        { label: 'Overdue Books', to: '/library/overdue', icon: AlertTriangle, permission: 'library.view' },[m
[32m+[m[32m        { label: 'Returns', to: '/library/returns', icon: RotateCcw, permission: 'library.return' },[m
[32m+[m[32m        { label: 'Borrowing History', to: '/library/history', icon: HistoryIcon, permission: 'library.reports' },[m
[32m+[m[32m        { label: 'Library Reports', to: '/library/reports', icon: FileBarChart, permission: 'library.reports' },[m
[32m+[m[32m      ],[m
[32m+[m[32m    },[m
[32m+[m[32m    {[m
[32m+[m[32m      label: 'Administration',[m
[32m+[m[32m      to: '/admin/users',[m
[32m+[m[32m      icon: ShieldCheck,[m
[32m+[m[32m      children: [[m
[32m+[m[32m        { label: 'Users & Roles',       to: '/admin/users',    icon: Users },[m
[32m+[m[32m        { label: 'Roles & Permissions', to: '/admin/roles',    icon: ShieldCheck },[m
[32m+[m[32m        { label: 'Activity / Audit',    to: '/admin/activity', icon: Activity },[m
[32m+[m[32m        { label: 'Settings',            to: '/admin/settings', icon: Settings },[m
[32m+[m[32m      ],[m
[32m+[m[32m    },[m
[32m+[m[32m  ];[m
 [m
 /**[m
  * Menu shown to non-admin users. Each entry is shown only when the user holds[m
[36m@@ -104,7 +120,6 @@[m [mexport const MASTER_NAV = [[m
     ],[m
   },[m
   { label: 'Management Dashboard', to: '/management', icon: LayoutDashboard, anyPermission: ['applications.view', 'reports.view'], dashboard: true },[m
[31m-  { label: 'Website Management', to: '/admin/website', icon: Globe, permission: 'website.view' },[m
 [m
   {[m
     label: 'Library Catalogue',[m
[36m@@ -199,6 +214,7 @@[m [mexport function canSeeNavItem(item, hasPermission, role) {[m
 }[m
 [m
 export function filterNavItems(items, role, hasPermission) {[m
[32m+[m[32m  if (role === ROLES.ADMIN) return items;[m
   return items[m
     .map((item) => {[m
       if (!canSeeNavItem(item, hasPermission, role)) return null;[m
[36m@@ -218,9 +234,7 @@[m [mexport function filterNavItems(items, role, hasPermission) {[m
  */[m
 export function getNavForUser(user, hasPermission) {[m
   if (!user) return [];[m
[31m-  if (user.role === ROLES.ADMIN) {[m
[31m-    return filterNavItems(ADMIN_NAV, user.role, hasPermission);[m
[31m-  }[m
[32m+[m[32m  if (user.role === ROLES.ADMIN) return ADMIN_NAV;[m
   const items = filterNavItems(MASTER_NAV, user.role, hasPermission);[m
   if (user.role === ROLES.MANAGEMENT) {[m
     const dashboardOrder = {[m
[1mdiff --git a/src/data/roles.test.js b/src/data/roles.test.js[m
[1mdeleted file mode 100644[m
[1mindex 1d2ad0b..0000000[m
[1m--- a/src/data/roles.test.js[m
[1m+++ /dev/null[m
[36m@@ -1,31 +0,0 @@[m
[31m-import test from 'node:test';[m
[31m-import assert from 'node:assert/strict';[m
[31m-[m
[31m-import { ADMIN_NAV, getNavForUser } from './roles.js';[m
[31m-[m
[31m-function hasPermission(permission) {[m
[31m-  return permission === 'users.view';[m
[31m-}[m
[31m-[m
[31m-test('admin menu hides items the system administrator does not have permission to open', () => {[m
[31m-  const nav = getNavForUser({ role: 'admin', permissions: ['users.view'] }, hasPermission);[m
[31m-  const labels = nav.flatMap((item) => [item.label, ...(item.children || []).map((child) => child.label)]);[m
[31m-[m
[31m-  assert.ok(labels.includes('Users & Roles'));[m
[31m-  assert.ok(!labels.includes('Website Management'));[m
[31m-  assert.ok(!labels.includes('Events'));[m
[31m-  assert.ok(!labels.includes('Admissions'));[m
[31m-  assert.ok(!labels.includes('Reports'));[m
[31m-  assert.ok(!labels.includes('Activity / Audit'));[m
[31m-  assert.ok(!labels.includes('Settings'));[m
[31m-});[m
[31m-[m
[31m-test('admin navigation items still respect the permission filter', () => {[m
[31m-  const visible = ADMIN_NAV.flatMap((item) => item.children || []).filter((child) => child.permission)[m
[31m-    .map((child) => child.label)[m
[31m-    .filter((label) => label === 'Users & Roles' || label === 'Roles & Permissions' || label === 'Website Management');[m
[31m-[m
[31m-  assert.deepEqual(visible, ['Users & Roles', 'Roles & Permissions', 'Website Management']);[m
[31m-  const websiteGroup = ADMIN_NAV.find((item) => item.label === 'Website');[m
[31m-  assert.equal(websiteGroup.children.filter((child) => child.permission === 'website.view').length, 1);[m
[31m-});[m
[1mdiff --git a/src/hooks/useModuleAccess.js b/src/hooks/useModuleAccess.js[m
[1mindex bb83f93..4080a1d 100644[m
[1m--- a/src/hooks/useModuleAccess.js[m
[1m+++ b/src/hooks/useModuleAccess.js[m
[36m@@ -24,6 +24,6 @@[m [mexport function useModuleAccess(moduleRole, permissionPrefix, actionPermissions)[m
   const prefix = permissionPrefix[m
     || (moduleRole === ROLES.STOCK_MANAGER ? 'stock' : moduleRole === ROLES.LIBRARIAN ? 'library' : null);[m
   const relevant = actionPermissions || MODULE_MUTATIONS[prefix] || [];[m
[31m-  const viewOnly = !relevant.some((permission) => can(permission));[m
[32m+[m[32m  const viewOnly = role === ROLES.ADMIN ? false : !relevant.some((permission) => can(permission));[m
   return { viewOnly, can };[m
 }[m
[1mdiff --git a/src/pages/admin/AdminDashboard.jsx b/src/pages/admin/AdminDashboard.jsx[m
[1mindex 1607038..7c03479 100644[m
[1m--- a/src/pages/admin/AdminDashboard.jsx[m
[1m+++ b/src/pages/admin/AdminDashboard.jsx[m
[36m@@ -18,14 +18,9 @@[m [mimport { getNews, refreshContent } from '../../services/contentService';[m
 [m
 export default function AdminDashboard() {[m
   const navigate = useNavigate();[m
[31m-  const { user, hasPermission } = useAuth();[m
[32m+[m[32m  const { user } = useAuth();[m
   const { t } = useApp();[m
 [m
[31m-  const canViewLibrary = hasPermission('library.view');[m
[31m-  const canViewStock = hasPermission('stock.view');[m
[31m-  const canViewEquipment = hasPermission('equipment.view');[m
[31m-  const canViewWebsite = hasPermission('website.view');[m
[31m-[m
   const [users, setUsers] = useState([]);[m
   const [equipment, setEquipment] = useState([]);[m
   const [loadError, setLoadError] = useState(null);[m
[36m@@ -33,70 +28,35 @@[m [mexport default function AdminDashboard() {[m
 [m
   useEffect(() => {[m
     let cancelled = false;[m
[31m-    const tasks = [[m
[32m+[m[32m    Promise.all([[m
       getUsers().then((data) => { if (!cancelled) setUsers(data || []); }),[m
[32m+[m[32m      refreshLibrary().catch(() => {}),[m
[32m+[m[32m      refreshStock().catch(() => {}),[m
       refreshActivity().catch(() => {}),[m
[31m-      ...(canViewWebsite ? [refreshContent().catch(() => {})] : []),[m
[31m-      ...(canViewLibrary ? [refreshLibrary().catch(() => {})] : []),[m
[31m-      ...(canViewStock ? [refreshStock().catch(() => {})] : []),[m
[31m-      ...(canViewEquipment ? [refreshEquipment().then((data) => { if (!cancelled) setEquipment(data || getEquipment()); }).catch(() => {})] : []),[m
[31m-    ];[m
[31m-[m
[31m-    Promise.all(tasks)[m
[31m-      .then(() => { if (!cancelled) setRefreshTick((tick) => tick + 1); })[m
[32m+[m[32m      refreshEquipment().then((data) => { if (!cancelled) setEquipment(data || getEquipment()); }).catch(() => {}),[m
[32m+[m[32m      refreshContent().catch(() => {}),[m
[32m+[m[32m    ])[m
[32m+[m[32m      .then(() => { if (!cancelled) setRefreshTick((t) => t + 1); })[m
       .catch((err) => { if (!cancelled) setLoadError(err.message || t('failedLoadDashboard')); });[m
     return () => { cancelled = true; };[m
[31m-  }, [canViewEquipment, canViewLibrary, canViewStock, canViewWebsite, t]);[m
[31m-[m
[31m-  const loans = useMemo(() => {[m
[31m-    if (!canViewLibrary) return [];[m
[31m-    void refreshTick;[m
[31m-    return getLoans();[m
[31m-  }, [canViewLibrary, refreshTick]);[m
[31m-[m
[31m-  const transactions = useMemo(() => {[m
[31m-    if (!canViewStock) return [];[m
[31m-    void refreshTick;[m
[31m-    return getTransactions();[m
[31m-  }, [canViewStock, refreshTick]);[m
[31m-[m
[31m-  const lowStock = useMemo(() => {[m
[31m-    if (!canViewStock) return [];[m
[31m-    void refreshTick;[m
[31m-    return getLowStockItems();[m
[31m-  }, [canViewStock, refreshTick]);[m
[32m+[m[32m  }, [t]);[m
 [m
[31m-  const news = useMemo(() => {[m
[31m-    if (!canViewWebsite) return [];[m
[31m-    void refreshTick;[m
[31m-    return getNews();[m
[31m-  }, [canViewWebsite, refreshTick]);[m
[32m+[m[32m  const loans = useMemo(() => { void refreshTick; return getLoans(); }, [refreshTick]);[m
[32m+[m[32m  const transactions = useMemo(() => { void refreshTick; return getTransactions(); }, [refreshTick]);[m
[32m+[m[32m  const lowStock = useMemo(() => { void refreshTick; return getLowStockItems(); }, [refreshTick]);[m
[32m+[m[32m  const news = useMemo(() => { void refreshTick; return getNews(); }, [refreshTick]);[m
 [m
   const activeUsers = users.filter((u) => u.status === 'active').length;[m
   const lowStockPreview = useMemo(() => lowStock.slice(0, 3), [lowStock]);[m
 [m
[31m-  const adminQuickActions = [[m
[31m-    { label: t('addUser'), to: '/admin/users', icon: UserPlus, permission: 'users.view' },[m
[31m-    { label: t('manageWebsite'), to: '/admin/website', icon: Globe2, permission: 'website.view' },[m
[31m-    { label: t('viewReports'), to: '/management/insights', icon: ArrowRight, permission: 'reports.view' },[m
[31m-  ].filter((action) => !action.permission || hasPermission(action.permission));[m
[31m-[m
   const systemStatus = [[m
     { label: t('serverStatus'), description: t('allSystemsOperational'), icon: CheckCircle2 },[m
     { label: t('database'), description: t('databaseConnectionHealthy'), icon: CheckCircle2 },[m
[31m-    ...(hasPermission('website.view') ? [{ label: t('website'), description: t('websiteRunningSmoothly'), icon: Globe }] : []),[m
[31m-    ...(hasPermission('library.view') ? [{ label: t('libraryMis'), description: t('librarySystemOperational'), icon: BookOpen }] : []),[m
[31m-    ...(hasPermission('stock.view') ? [{ label: t('stockMis'), description: t('stockSystemOperational'), icon: Package }] : []),[m
[32m+[m[32m    { label: t('website'), description: t('websiteRunningSmoothly'), icon: Globe },[m
[32m+[m[32m    { label: t('libraryMis'), description: t('librarySystemOperational'), icon: BookOpen },[m
[32m+[m[32m    { label: t('stockMis'), description: t('stockSystemOperational'), icon: Package },[m
   ];[m
 [m
[31m-  const adminCards = [[m
[31m-    { label: t('usersRoles'), description: t('manageStaffAccounts'), icon: ShieldCheck, to: '/admin/users', permission: 'users.view' },[m
[31m-    { label: t('rolesPermissions'), description: t('controlRoleAccess'), icon: ShieldCheck, to: '/admin/roles', permission: 'users.update' },[m
[31m-    { label: t('reports'), description: t('crossModuleActivityOverview'), icon: ArrowRight, to: '/management/insights', permission: 'reports.view' },[m
[31m-    { label: t('activityAudit'), description: t('activityAuditDescription'), icon: Activity, to: '/admin/activity', permission: 'audit.view' },[m
[31m-    { label: t('settings'), description: t('settings'), icon: Settings, to: '/admin/settings', permission: 'settings.view' },[m
[31m-  ].filter((card) => !card.permission || hasPermission(card.permission));[m
[31m-[m
   return ([m
     <div className="space-y-6">[m
       {loadError && ([m
[36m@@ -114,61 +74,44 @@[m [mexport default function AdminDashboard() {[m
         ]}[m
         actions={[m
           <div className="flex flex-wrap items-center gap-2">[m
[31m-            <QuickActions actions={adminQuickActions} />[m
[32m+[m[32m            <QuickActions actions={[[m
[32m+[m[32m              { label: t('addUser'), to: '/admin/users', icon: UserPlus },[m
[32m+[m[32m              { label: t('manageWebsite'), to: '/admin/website', icon: Globe2 },[m
[32m+[m[32m              { label: t('viewReports'), to: '/management/insights', icon: ArrowRight },[m
[32m+[m[32m            ]} />[m
           </div>[m
         }[m
       />[m
 [m
 [m
[31m-      <section className="mb-2">[m
[31m-        <div className="mb-3 flex items-center justify-between gap-3">[m
[31m-          <div>[m
[31m-            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-mid-gray)]">Overview</p>[m
[31m-            <h3 className="mt-1 font-display text-lg font-semibold text-[var(--color-dark-gray)]">System snapshot</h3>[m
[31m-          </div>[m
[31m-        </div>[m
[31m-[m
[31m-        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">[m
[31m-          <StatCard[m
[31m-            label={t('totalUsers')}[m
[31m-            value={users.length}[m
[31m-            icon={Users}[m
[31m-            onClick={() => navigate('/admin/users')}[m
[31m-          />[m
[31m-          <StatCard[m
[31m-            label={t('activeUsers')}[m
[31m-            value={activeUsers}[m
[31m-            icon={Users}[m
[31m-            tone="gold"[m
[31m-            onClick={() => navigate('/admin/users')}[m
[31m-          />[m
[31m-          {canViewWebsite && ([m
[31m-            <StatCard[m
[31m-              label={t('websitePosts')}[m
[31m-              value={news.length}[m
[31m-              icon={Globe}[m
[31m-              onClick={() => navigate('/admin/website')}[m
[31m-            />[m
[31m-          )}[m
[31m-          {canViewLibrary && ([m
[31m-            <StatCard[m
[31m-              label={t('libraryLoans')}[m
[31m-              value={loans.length}[m
[31m-              icon={BookOpen}[m
[31m-              onClick={() => navigate('/library/reports')}[m
[31m-            />[m
[31m-          )}[m
[31m-          {canViewStock && ([m
[31m-            <StatCard[m
[31m-              label={t('stockAlerts')}[m
[31m-              value={lowStock.length}[m
[31m-              icon={AlertTriangle}[m
[31m-              tone="amber"[m
[31m-              trend={lowStock.length > 0 ? { label: t('needsRestocking'), positive: false } : { label: t('allClear'), positive: true }}[m
[31m-              onClick={() => navigate('/management/stock-reports')}[m
[31m-            />[m
[31m-          )}[m
[31m-        </div>[m
[32m+[m[32m      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">[m
[32m+[m[32m        <StatCard[m
[32m+[m[32m          label={t('totalUsers')}[m
[32m+[m[32m          value={users.length}[m
[32m+[m[32m          icon={Users}[m
[32m+[m[32m          onClick={() => navigate('/admin/users')}[m
[32m+[m[32m        />[m
[32m+[m[32m        <StatCard[m
[32m+[m[32m          label={t('activeUsers')}[m
[32m+[m[32m          value={activeUsers}[m
[32m+[m[32m          icon={Users}[m
[32m+[m[32m          tone="gold"[m
[32m+[m[32m          onClick={() => navigate('/admin/users')}[m
[32m+[m[32m        />[m
[32m+[m[32m        <StatCard[m
[32m+[m[32m          label={t('libraryLoans')}[m
[32m+[m[32m          value={loans.length}[m
[32m+[m[32m          icon={BookOpen}[m
[32m+[m[32m          onClick={() => navigate('/library/reports')}[m
[32m+[m[32m        />[m
[32m+[m[32m        <StatCard[m
[32m+[m[32m          label={t('stockAlerts')}[m
[32m+[m[32m          value={lowStock.length}[m
[32m+[m[32m          icon={AlertTriangle}[m
[32m+[m[32m          tone="amber"[m
[32m+[m[32m          trend={lowStock.length > 0 ? { label: t('needsRestocking'), positive: false } : { label: t('allClear'), positive: true }}[m
[32m+[m[32m          onClick={() => navigate('/management/stock-reports')}[m
[32m+[m[32m        />[m
       </section>[m
 [m
       <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_0.85fr]">[m
[36m@@ -238,6 +181,27 @@[m [mexport default function AdminDashboard() {[m
         </div>[m
       </section>[m
 [m
[32m+[m[32m      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">[m
[32m+[m[32m        <StatCard[m
[32m+[m[32m          label={t('websitePosts')}[m
[32m+[m[32m          value={news.length}[m
[32m+[m[32m          icon={Globe}[m
[32m+[m[32m          onClick={() => navigate('/admin/website')}[m
[32m+[m[32m        />[m
[32m+[m[32m        <StatCard[m
[32m+[m[32m          label={t('transactions')}[m
[32m+[m[32m          value={transactions.length}[m
[32m+[m[32m          icon={Package}[m
[32m+[m[32m          onClick={() => navigate('/management/insights')}[m
[32m+[m[32m        />[m
[32m+[m[32m        <StatCard[m
[32m+[m[32m          label={t('equipmentRecords')}[m
[32m+[m[32m          value={equipment.length}[m
[32m+[m[32m          icon={Laptop}[m
[32m+[m[32m          onClick={() => navigate('/equipment/items')}[m
[32m+[m[32m        />[m
[32m+[m[32m      </section>[m
[32m+[m
       <section className="rounded-[var(--radius-card)] border border-[var(--color-border-gray)] bg-[var(--color-white)] p-5 shadow-card">[m
         <div className="mb-4 flex items-center justify-between gap-3">[m
           <div>[m
[36m@@ -247,7 +211,13 @@[m [mexport default function AdminDashboard() {[m
           <ShieldCheck className="h-5 w-5 text-[var(--color-heading)]" aria-hidden="true" />[m
         </div>[m
         <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">[m
[31m-          {adminCards.map(({ label, description, icon: Icon, to }) => ([m
[32m+[m[32m          {[[m
[32m+[m[32m            { label: t('usersRoles'), description: t('manageStaffAccounts'), icon: ShieldCheck, to: '/admin/users' },[m
[32m+[m[32m            { label: t('rolesPermissions'), description: t('controlRoleAccess'), icon: ShieldCheck, to: '/admin/roles' },[m
[32m+[m[32m            { label: t('reports'), description: t('crossModuleActivityOverview'), icon: ArrowRight, to: '/management/insights' },[m
[32m+[m[32m            { label: t('activityAudit'), description: t('activityAuditDescription'), icon: Activity, to: '/admin/activity' },[m
[32m+[m[32m            { label: t('settings'), description: t('settings'), icon: Settings, to: '/admin/settings' },[m
[32m+[m[32m          ].map(({ label, description, icon: Icon, to }) => ([m
             <button key={to} type="button" onClick={() => navigate(to)} className="group rounded-xl border border-[var(--color-border-gray)] bg-[var(--color-soft-gray)] p-4 text-left transition hover:-translate-y-0.5 hover:border-[var(--color-gold)] hover:bg-[var(--color-light-green-100)]">[m
               <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-white)] text-[var(--color-heading)] shadow-sm"><Icon className="h-4 w-4" aria-hidden="true" /></span>[m
               <span className="mt-3 block text-sm font-semibold text-[var(--color-dark-gray)]">{label}</span>[m
[1mdiff --git a/src/pages/admin/RolesPermissions.jsx b/src/pages/admin/RolesPermissions.jsx[m
[1mindex 7d2c647..7d6a3ea 100644[m
[1m--- a/src/pages/admin/RolesPermissions.jsx[m
[1m+++ b/src/pages/admin/RolesPermissions.jsx[m
[36m@@ -25,7 +25,7 @@[m [mexport default function RolesPermissions() {[m
   const { showToast } = useToast();[m
   const { t } = useApp();[m
   const { role: currentRole, syncPermissions, updatePermissions } = useAuth();[m
[31m-  const [activeRole, setActiveRole] = useState('admin');[m
[32m+[m[32m  const [activeRole, setActiveRole] = useState('librarian');[m
   const [permissions, setPermissions] = useState([]);[m
   // roleName -> Set of permission ids currently checked for that role (pending save)[m
   const [selections, setSelections] = useState({});[m
[36m@@ -36,17 +36,8 @@[m [mexport default function RolesPermissions() {[m
     (async () => {[m
       try {[m
         const [rolesData, permissionsData] = await Promise.all([getRoles(), getPermissions()]);[m
[31m-        const adminAllowedIds = permissionsData[m
[31m-          .filter((permission) => !['library', 'stock', 'equipment', 'events', 'applications', 'reports'].includes(permission.module))[m
[31m-          .map((permission) => permission._id);[m
         setPermissions(permissionsData);[m
[31m-        setSelections(Object.fromEntries(rolesData.map((role) => {[m
[31m-          const permissionIds = (role.permissions || []).map((p) => p._id || p);[m
[31m-          const selectedIds = role.name === 'admin'[m
[31m-            ? permissionIds.filter((id) => adminAllowedIds.includes(id))[m
[31m-            : permissionIds;[m
[31m-          return [role.name, new Set(selectedIds)];[m
[31m-        })));[m
[32m+[m[32m        setSelections(Object.fromEntries(rolesData.map((role) => [role.name, new Set(role.permissions.map((p) => p._id || p))])));[m
       } catch {[m
         showToast(t('couldNotLoadRoles'), 'error');[m
       } finally {[m
[36m@@ -62,18 +53,13 @@[m [mexport default function RolesPermissions() {[m
       if (!byModule[permission.module]) byModule[permission.module] = [];[m
       byModule[permission.module].push(permission);[m
     }[m
[31m-    if (activeRole === 'admin') {[m
[31m-      const adminModules = new Set(['users', 'website', 'audit', 'settings']);[m
[31m-      Object.keys(byModule).forEach((module) => {[m
[31m-        if (!adminModules.has(module)) delete byModule[module];[m
[31m-      });[m
[31m-    }[m
     return byModule;[m
[31m-  }, [permissions, activeRole]);[m
[32m+[m[32m  }, [permissions]);[m
 [m
   const activeSelection = selections[activeRole] || new Set();[m
 [m
   const toggleModule = (module) => {[m
[32m+[m[32m    if (activeRole === 'admin') return;[m
     const modulePermissionIds = (modules[module] || []).map((p) => p._id);[m
     const allSelected = modulePermissionIds.every((id) => activeSelection.has(id));[m
     setSelections((prev) => {[m
[36m@@ -84,6 +70,7 @@[m [mexport default function RolesPermissions() {[m
   };[m
 [m
   const togglePermission = (permissionId) => {[m
[32m+[m[32m    if (activeRole === 'admin') return;[m
     setSelections((prev) => {[m
       const next = new Set(prev[activeRole] || []);[m
       if (next.has(permissionId)) next.delete(permissionId);[m
[36m@@ -93,14 +80,9 @@[m [mexport default function RolesPermissions() {[m
   };[m
 [m
   const handleSave = async () => {[m
[32m+[m[32m    if (activeRole === 'admin') return;[m
     setSaving(true);[m
[31m-    const adminAllowedIds = permissions[m
[31m-      .filter((permission) => !['library', 'stock', 'equipment', 'events', 'applications', 'reports'].includes(permission.module))[m
[31m-      .map((permission) => permission._id);[m
[31m-    const payload = activeRole === 'admin'[m
[31m-      ? Array.from(activeSelection).filter((id) => adminAllowedIds.includes(id))[m
[31m-      : Array.from(activeSelection);[m
[31m-    const result = await updateRolePermissions(activeRole, payload);[m
[32m+[m[32m    const result = await updateRolePermissions(activeRole, Array.from(activeSelection));[m
     setSaving(false);[m
     if (!result.success) { showToast(result.error || t('couldNotSavePermissions'), 'error'); return; }[m
     if (result.role?.name === currentRole) {[m
[36m@@ -157,7 +139,9 @@[m [mexport default function RolesPermissions() {[m
                     </span>[m
                     <div className="min-w-0">[m
                       <div className="text-sm font-semibold">{label}</div>[m
[31m-                      <div className="text-[11px] opacity-75">{t('customAccess')}</div>[m
[32m+[m[32m                      <div className="text-[11px] opacity-75">[m
[32m+[m[32m                        {value === 'admin' ? t('fullAccess') : t('customAccess')}[m
[32m+[m[32m                      </div>[m
                     </div>[m
                   </div>[m
                 </button>[m
[36m@@ -176,15 +160,17 @@[m [mexport default function RolesPermissions() {[m
             </div>[m
             <div className="flex flex-wrap items-center gap-2">[m
               <span className="inline-flex items-center rounded-full border border-[var(--color-border-gray)] bg-[var(--color-off-white)] px-3 py-1.5 text-xs font-medium text-[var(--color-mid-gray)]">[m
[31m-                {t('permissionsCount', { count: activeSelection.size })}[m
[32m+[m[32m                {activeRole === 'admin' ? t('fullSystemAccess') : t('permissionsCount', { count: activeSelection.size })}[m
               </span>[m
               <span className="inline-flex items-center rounded-full bg-[var(--color-gold-100)] px-3 py-1.5 text-xs font-medium text-[var(--color-heading)]">[m
[31m-                {t('editable')}[m
[32m+[m[32m                {activeRole === 'admin' ? t('protected') : t('editable')}[m
               </span>[m
             </div>[m
           </div>[m
 [m
[31m-          <p className="mt-5 text-sm text-[var(--color-mid-gray)]">{t('choosePermissionGroups')}</p>[m
[32m+[m[32m          <p className="mt-5 text-sm text-[var(--color-mid-gray)]">[m
[32m+[m[32m            {activeRole === 'admin' ? t('administratorsUnrestricted') : t('choosePermissionGroups')}[m
[32m+[m[32m          </p>[m
 [m
           <div className="mt-6 space-y-4">[m
             {Object.keys(modules).length === 0 && ([m
[36m@@ -195,7 +181,7 @@[m [mexport default function RolesPermissions() {[m
 [m
             {Object.entries(modules).map(([module, modulePermissions]) => {[m
               const moduleIds = modulePermissions.map((p) => p._id);[m
[31m-              const isOn = moduleIds.every((id) => activeSelection.has(id));[m
[32m+[m[32m              const isOn = activeRole === 'admin' || moduleIds.every((id) => activeSelection.has(id));[m
 [m
               return ([m
                 <div key={module} className="rounded-2xl border border-[var(--color-border-gray)] bg-[var(--color-off-white)] p-4">[m
[36m@@ -212,7 +198,8 @@[m [mexport default function RolesPermissions() {[m
                       role="switch"[m
                       aria-checked={isOn}[m
                       onClick={() => toggleModule(module)}[m
[31m-                      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${[m
[32m+[m[32m                      disabled={activeRole === 'admin'}[m
[32m+[m[32m                      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors disabled:opacity-60 ${[m
                         isOn ? 'bg-[var(--color-medium-green)]' : 'bg-[var(--color-border-gray)]'[m
                       }`}[m
                     >[m
[36m@@ -226,7 +213,7 @@[m [mexport default function RolesPermissions() {[m
 [m
                   <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">[m
                     {modulePermissions.map((permission) => {[m
[31m-                      const checked = activeSelection.has(permission._id);[m
[32m+[m[32m                      const checked = activeRole === 'admin' || activeSelection.has(permission._id);[m
                       const keyName = permission.key.split('.').pop();[m
                       const label = t(PERMISSION_LABELS[keyName] || keyName);[m
 [m
[36m@@ -235,6 +222,7 @@[m [mexport default function RolesPermissions() {[m
                           type="button"[m
                           key={permission._id}[m
                           onClick={() => togglePermission(permission._id)}[m
[32m+[m[32m                          disabled={activeRole === 'admin'}[m
                           aria-pressed={checked}[m
                           className={`flex items-center justify-between rounded-xl border px-3 py-2.5 ${[m
                             checked[m
[36m@@ -256,7 +244,7 @@[m [mexport default function RolesPermissions() {[m
           </div>[m
 [m
           <div className="mt-6 flex justify-end">[m
[31m-            <Button variant="primary" onClick={handleSave} loading={saving}>[m
[32m+[m[32m            <Button variant="primary" onClick={handleSave} loading={saving} disabled={activeRole === 'admin'}>[m
               {t('savePermissions')}[m
             </Button>[m
           </div>[m
[1mdiff --git a/src/pages/admin/Settings.jsx b/src/pages/admin/Settings.jsx[m
[1mindex f11b406..2481560 100644[m
[1m--- a/src/pages/admin/Settings.jsx[m
[1m+++ b/src/pages/admin/Settings.jsx[m
[36m@@ -8,8 +8,10 @@[m [mimport { useToast } from '../../context/ToastContext';[m
 import { useAuth } from '../../context/AuthContext';[m
 import { useApp } from '../../context/AppContext';[m
 import { getBranding, updateSiteLogo, resetSiteLogo } from '../../services/brandingService';[m
[31m-import { getSystemSettings, refreshContent, updateSystemSettings } from '../../services/contentService';[m
[32m+[m[32mimport { disableTwoFactor, enableTwoFactor, setupTwoFactor } from '../../services/authService';[m
[32m+[m[32mimport { getSystemSettings, refreshContent, updateSystemSettings, getEmailSettings, updateEmailSettings } from '../../services/contentService';[m
 import { applyKindErrors } from '../../utils/validators';[m
[32m+[m[32mimport QRCode from 'qrcode';[m
 [m
 // What each settings field may contain — see utils/validators.js[m
 const SETTINGS_KINDS = { schoolName: 'alnum', district: 'name', contactEmail: 'email', lowStockDefault: 'integer' };[m
[36m@@ -22,15 +24,53 @@[m [mexport default function Settings() {[m
   const [loading, setLoading] = useState(true);[m
   const [saving, setSaving] = useState(false);[m
   const [logoUrl, setLogoUrl] = useState(() => getBranding().logoUrl);[m
[32m+[m[32m  const [twoFactorSecret, setTwoFactorSecret] = useState('');[m
[32m+[m[32m  const [twoFactorQrCode, setTwoFactorQrCode] = useState('');[m
[32m+[m[32m  const [recoveryCodes, setRecoveryCodes] = useState([]);[m
[32m+[m[32m  const [twoFactorCode, setTwoFactorCode] = useState('');[m
[32m+[m[32m  const [disablePassword, setDisablePassword] = useState('');[m
[32m+[m[32m  const [twoFactorEnabled, setTwoFactorEnabled] = useState(Boolean(user?.twoFactorEnabled));[m
[32m+[m[32m  const [emailSettings, setEmailSettings] = useState({ host: '', port: 587, secure: false, user: '', from: '', password: '', configured: false });[m
[32m+[m[32m  const [emailSaving, setEmailSaving] = useState(false);[m
 [m
   const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));[m
 [m
   useEffect(() => {[m
[31m-    refreshContent().then(() => {[m
[32m+[m[32m    const emailRequest = user?.role === 'admin' ? getEmailSettings() : Promise.resolve(null);[m
[32m+[m[32m    Promise.all([refreshContent(), emailRequest]).then(([, email]) => {[m
       setForm(getSystemSettings());[m
[32m+[m[32m      if (email) setEmailSettings({ ...email, password: '' });[m
       setLoading(false);[m
     }).catch((error) => { showToast(error.message, 'error'); setLoading(false); });[m
[31m-  }, [showToast]);[m
[32m+[m[32m  }, [user?.role, showToast]);[m
[32m+[m
[32m+[m[32m  const startTwoFactorSetup = async () => {[m
[32m+[m[32m    try {[m
[32m+[m[32m      const result = await setupTwoFactor();[m
[32m+[m[32m      setTwoFactorSecret(result.secret);[m
[32m+[m[32m      setRecoveryCodes(result.recoveryCodes || []);[m
[32m+[m[32m      setTwoFactorQrCode(await QRCode.toDataURL(result.otpauthUrl));[m
[32m+[m[32m      showToast(t('setupSecretGenerated'), 'info');[m
[32m+[m[32m    } catch (error) { showToast(error.message, 'error'); }[m
[32m+[m[32m  };[m
[32m+[m
[32m+[m[32m  const confirmTwoFactor = async () => {[m
[32m+[m[32m    try {[m
[32m+[m[32m      await enableTwoFactor(twoFactorSecret, twoFactorCode, recoveryCodes);[m
[32m+[m[32m      showToast(t('twoFactorEnabled'), 'success');[m
[32m+[m[32m      setTwoFactorEnabled(true);[m
[32m+[m[32m      setTwoFactorSecret(''); setTwoFactorCode(''); setTwoFactorQrCode(''); setRecoveryCodes([]);[m
[32m+[m[32m    } catch (error) { showToast(error.message, 'error'); }[m
[32m+[m[32m  };[m
[32m+[m
[32m+[m[32m  const turnOffTwoFactor = async () => {[m
[32m+[m[32m    try {[m
[32m+[m[32m      await disableTwoFactor(disablePassword, twoFactorCode);[m
[32m+[m[32m      showToast(t('twoFactorDisabled'), 'success');[m
[32m+[m[32m      setTwoFactorEnabled(false);[m
[32m+[m[32m      setDisablePassword(''); setTwoFactorCode('');[m
[32m+[m[32m    } catch (error) { showToast(error.message, 'error'); }[m
[32m+[m[32m  };[m
 [m
   const handleSave = async (e) => {[m
     e.preventDefault();[m
[36m@@ -46,6 +86,20 @@[m [mexport default function Settings() {[m
     showToast(t('settingsSaved'), 'success');[m
   };[m
 [m
[32m+[m[32m  const saveEmailSettings = async (e) => {[m
[32m+[m[32m    e.preventDefault();[m
[32m+[m[32m    if (!emailSettings.host.trim() || !emailSettings.from.trim()) {[m
[32m+[m[32m      showToast(t('emailSettingsRequired'), 'error');[m
[32m+[m[32m      return;[m
[32m+[m[32m    }[m
[32m+[m[32m    setEmailSaving(true);[m
[32m+[m[32m    const result = await updateEmailSettings(emailSettings);[m
[32m+[m[32m    setEmailSaving(false);[m
[32m+[m[32m    if (!result.success) { showToast(result.error || t('couldNotSaveSettings'), 'error'); return; }[m
[32m+[m[32m    setEmailSettings((current) => ({ ...current, ...result.settings, password: '' }));[m
[32m+[m[32m    showToast(t('emailSettingsSaved'), 'success');[m
[32m+[m[32m  };[m
[32m+[m
   // The logo saves the moment a file is chosen — unlike the rest of this[m
   // form, it isn't tied to the "Save Settings" button, so it takes effect[m
   // everywhere (sidebar, login page, public site, footer) right away.[m
[36m@@ -101,6 +155,44 @@[m [mexport default function Settings() {[m
           <Input kind="integer" label={t('defaultMinimumStock')} type="number" value={form.lowStockDefault} onChange={update('lowStockDefault')} />[m
         </FormSection>[m
 [m
[32m+[m[32m        {user?.role === 'admin' && ([m
[32m+[m[32m          <FormSection title={t('emailDelivery')} description={t('emailDeliveryDescription')}>[m
[32m+[m[32m            <Input label={t('smtpHost')} value={emailSettings.host} onChange={(event) => setEmailSettings((current) => ({ ...current, host: event.target.value }))} />[m
[32m+[m[32m            <Input kind="integer" label={t('smtpPort')} type="number" value={emailSettings.port} onChange={(event) => setEmailSettings((current) => ({ ...current, port: event.target.value }))} />[m
[32m+[m[32m            <Input label={t('smtpUsername')} type="email" value={emailSettings.user} onChange={(event) => setEmailSettings((current) => ({ ...current, user: event.target.value }))} />[m
[32m+[m[32m            <Input label={t('senderEmail')} type="email" value={emailSettings.from} onChange={(event) => setEmailSettings((current) => ({ ...current, from: event.target.value }))} />[m
[32m+[m[32m            <Input label={t('smtpAppPassword')} type="password" value={emailSettings.password} onChange={(event) => setEmailSettings((current) => ({ ...current, password: event.target.value }))} />[m
[32m+[m[32m            <label className="flex items-center gap-2 text-sm text-[var(--color-dark-gray)]"><input type="checkbox" checked={emailSettings.secure} onChange={(event) => setEmailSettings((current) => ({ ...current, secure: event.target.checked }))} /> {t('useSecureSmtp')}</label>[m
[32m+[m[32m            <div className="sm:col-span-2 flex items-center justify-between gap-3"><span className="text-xs text-[var(--color-mid-gray)]">{emailSettings.configured ? t('smtpPasswordConfigured') : t('smtpNotConfigured')}</span><Button type="button" variant="secondary" loading={emailSaving} onClick={saveEmailSettings}>{t('saveEmailSettings')}</Button></div>[m
[32m+[m[32m          </FormSection>[m
[32m+[m[32m        )}[m
[32m+[m
[32m+[m[32m        {user?.role === 'admin' && ([m
[32m+[m[32m          <FormSection title={t('administratorSecurity')} description={t('administratorSecurityDescription')}>[m
[32m+[m[32m            <div className="sm:col-span-2 rounded-xl border border-[var(--color-border-gray)] bg-[var(--color-soft-gray)] p-4">[m
[32m+[m[32m              <p className="text-sm font-semibold text-[var(--color-dark-gray)]">{t('twoFactorAuthentication')}: {twoFactorEnabled ? t('enabled') : t('notEnabled')}</p>[m
[32m+[m[32m              {!twoFactorEnabled ? ([m
[32m+[m[32m                <div className="mt-3 space-y-3">[m
[32m+[m[32m                  <Button type="button" variant="secondary" onClick={startTwoFactorSetup}>{t('generateSetupSecret')}</Button>[m
[32m+[m[32m                  {twoFactorSecret && <>[m
[32m+[m[32m                    {twoFactorQrCode && <img src={twoFactorQrCode} alt={t('scanQrCode')} className="h-44 w-44 rounded-lg bg-white p-2" />}[m
[32m+[m[32m                    <p className="break-all rounded-lg bg-[var(--color-white)] p-3 font-mono text-xs text-[var(--color-dark-gray)]">{twoFactorSecret}</p>[m
[32m+[m[32m                    <div className="rounded-lg bg-[var(--color-white)] p-3 text-xs text-[var(--color-dark-gray)]"><p className="font-semibold">{t('recoveryCodes')}</p><p className="mt-1">{t('saveRecoveryCodes')}</p><div className="mt-2 grid grid-cols-2 gap-1 font-mono">{recoveryCodes.map((code) => <span key={code}>{code}</span>)}</div></div>[m
[32m+[m[32m                    <Input kind="digits" label={t('authenticatorCode')} value={twoFactorCode} onChange={(event) => setTwoFactorCode(event.target.value)} inputMode="numeric" maxLength={6} />[m
[32m+[m[32m                    <Button type="button" onClick={confirmTwoFactor}>{t('enable2fa')}</Button>[m
[32m+[m[32m                  </>}[m
[32m+[m[32m                </div>[m
[32m+[m[32m              ) : ([m
[32m+[m[32m                <div className="mt-3 space-y-3">[m
[32m+[m[32m                  <Input label={t('currentPassword')} type="password" value={disablePassword} onChange={(event) => setDisablePassword(event.target.value)} />[m
[32m+[m[32m                  <Input label={t('authenticatorCode')} value={twoFactorCode} onChange={(event) => setTwoFactorCode(event.target.value.toUpperCase())} placeholder={t('authenticatorOrRecoveryCode')} />[m
[32m+[m[32m                  <Button type="button" variant="danger" onClick={turnOffTwoFactor}>{t('disable2fa')}</Button>[m
[32m+[m[32m                </div>[m
[32m+[m[32m              )}[m
[32m+[m[32m            </div>[m
[32m+[m[32m          </FormSection>[m
[32m+[m[32m        )}[m
[32m+[m
         <Button type="submit" variant="primary" loading={saving} disabled={loading}>{t('saveSettings')}</Button>[m
       </form>[m
     </div>[m
[1mdiff --git a/src/pages/auth/Login.jsx b/src/pages/auth/Login.jsx[m
[1mindex d065064..392cf29 100644[m
[1m--- a/src/pages/auth/Login.jsx[m
[1m+++ b/src/pages/auth/Login.jsx[m
[36m@@ -4,13 +4,14 @@[m [mimport { motion, AnimatePresence } from 'framer-motion';[m
 import {[m
   Eye, EyeOff, GraduationCap, LogIn, ArrowLeft, AlertCircle, User, Lock,[m
   BookOpen, Package, Laptop, CalendarDays, ShieldCheck, Moon, Sun, HelpCircle, X,[m
[31m-  ChevronDown, MessageCircle,[m
[32m+[m[32m  ChevronDown, MessageCircle, KeyRound,[m
 } from 'lucide-react';[m
 import { Input } from '../../components/forms/FormField';[m
 import Button from '../../components/common/Button';[m
 import HillRidgeDivider from '../../components/common/HillRidgeDivider';[m
 import BrandMark from '../../components/common/BrandMark';[m
 import { useAuth } from '../../context/AuthContext';[m
[32m+[m[32mimport { verifyLoginTwoFactor } from '../../services/authService';[m
 import { useTheme } from '../../context/ThemeContext';[m
 import { useToast } from '../../context/ToastContext';[m
 import { getHomePath } from '../../data/roles';[m
[36m@@ -63,9 +64,12 @@[m [mexport default function Login() {[m
   const [showPassword, setShowPassword] = useState(false);[m
   const [rememberMe, setRememberMe] = useState(() => !!readRememberedIdentifier());[m
   const [error, setError] = useState('');[m
[31m-  const [fieldErrors, setFieldErrors] = useState({ identifier: '', password: '' });[m
[32m+[m[32m  const [fieldErrors, setFieldErrors] = useState({ identifier: '', password: '', verificationCode: '' });[m
   const [loading, setLoading] = useState(false);[m
   const [adminLoading, setAdminLoading] = useState(false);[m
[32m+[m[32m  const [twoFactorRequired, setTwoFactorRequired] = useState(false);[m
[32m+[m[32m  const [challengeToken, setChallengeToken] = useState('');[m
[32m+[m[32m  const [verificationCode, setVerificationCode] = useState('');[m
   const [isLeaving, setIsLeaving] = useState(false);[m
   const [showHelp, setShowHelp] = useState(false);[m
   const [openFaq, setOpenFaq] = useState('getting-started');[m
[36m@@ -94,26 +98,49 @@[m [mexport default function Login() {[m
   const handleSubmit = async (e) => {[m
     e.preventDefault();[m
     setError('');[m
[31m-    const nextFieldErrors = { identifier: '', password: '' };[m
[31m-    const trimmedIdentifier = identifier.trim();[m
[31m-    const identifierIsEmail = trimmedIdentifier.includes('@');[m
[31m-    const validIdentifier = identifierIsEmail[m
[31m-      ? LOGIN_EMAIL_PATTERN.test(trimmedIdentifier)[m
[31m-      : LOGIN_USERNAME_PATTERN.test(trimmedIdentifier);[m
[31m-    if (!trimmedIdentifier) nextFieldErrors.identifier = 'Enter your username or email.';[m
[31m-    else if (!validIdentifier) nextFieldErrors.identifier = 'Enter a valid username or email address.';[m
[31m-    if (!password) nextFieldErrors.password = 'Enter your password.';[m
[31m-    else if (password.length < 8) nextFieldErrors.password = 'Password must be at least 8 characters.';[m
[31m-    if (identifier.length > 120) nextFieldErrors.identifier = 'Username or email must be 120 characters or fewer.';[m
[31m-    if (password.length > 200) nextFieldErrors.password = 'Password must be 200 characters or fewer.';[m
[32m+[m[32m    const nextFieldErrors = { identifier: '', password: '', verificationCode: '' };[m
[32m+[m[32m    if (twoFactorRequired && !/^\d{6}$/.test(verificationCode) && !/^[A-Fa-f0-9]{8}-[A-Fa-f0-9]{8}$/.test(verificationCode)) {[m
[32m+[m[32m      nextFieldErrors.verificationCode = 'Enter a 6-digit authenticator code or a recovery code.';[m
[32m+[m[32m    } else {[m
[32m+[m[32m      const trimmedIdentifier = identifier.trim();[m
[32m+[m[32m      const identifierIsEmail = trimmedIdentifier.includes('@');[m
[32m+[m[32m      const validIdentifier = identifierIsEmail[m
[32m+[m[32m        ? LOGIN_EMAIL_PATTERN.test(trimmedIdentifier)[m
[32m+[m[32m        : LOGIN_USERNAME_PATTERN.test(trimmedIdentifier);[m
[32m+[m[32m      if (!trimmedIdentifier) nextFieldErrors.identifier = 'Enter your username or email.';[m
[32m+[m[32m      else if (!validIdentifier) nextFieldErrors.identifier = 'Enter a valid username or email address.';[m
[32m+[m[32m      if (!password) nextFieldErrors.password = 'Enter your password.';[m
[32m+[m[32m      else if (password.length < 8) nextFieldErrors.password = 'Password must be at least 8 characters.';[m
[32m+[m[32m      if (identifier.length > 120) nextFieldErrors.identifier = 'Username or email must be 120 characters or fewer.';[m
[32m+[m[32m      if (password.length > 200) nextFieldErrors.password = 'Password must be 200 characters or fewer.';[m
[32m+[m[32m    }[m
     setFieldErrors(nextFieldErrors);[m
     if (Object.values(nextFieldErrors).some(Boolean)) {[m
[31m-      setError('Please enter your username or email and your password.');[m
[32m+[m[32m      setError(twoFactorRequired ? 'Check the verification code and try again.' : 'Please enter your username or email and your password.');[m
       return;[m
     }[m
     setLoading(true);[m
[31m-    const result = await login({ identifier: trimmedIdentifier, password });[m
[32m+[m[32m    if (twoFactorRequired) {[m
[32m+[m[32m      setLoading(true);[m
[32m+[m[32m      const result = await verifyLoginTwoFactor(challengeToken, verificationCode);[m
[32m+[m[32m      setLoading(false);[m
[32m+[m[32m      if (!result.success) {[m
[32m+[m[32m        setFieldErrors((current) => ({ ...current, verificationCode: result.error }));[m
[32m+[m[32m        setError(result.error);[m
[32m+[m[32m        return;[m
[32m+[m[32m      }[m
[32m+[m[32m      showToast('Welcome back, Administrator!', 'success');[m
[32m+[m[32m      redirectAfterLogin(result.user);[m
[32m+[m[32m      return;[m
[32m+[m[32m    }[m
[32m+[m[32m    const result = await login({ identifier: identifier.trim(), password });[m
     setLoading(false);[m
[32m+[m[32m    if (result.requiresTwoFactor) {[m
[32m+[m[32m      setChallengeToken(result.challengeToken);[m
[32m+[m[32m      setTwoFactorRequired(true);[m
[32m+[m[32m      setError('Enter the 6-digit code from your authenticator app or use a recovery code.');[m
[32m+[m[32m      return;[m
[32m+[m[32m    }[m
     if (!result.success) {[m
       if (result.errors?.length) {[m
         setFieldErrors((current) => result.errors.reduce((next, item) => ({ ...next, [item.field]: item.message }), current));[m
[36m@@ -134,6 +161,12 @@[m [mexport default function Login() {[m
     setAdminLoading(true);[m
     const result = await login({ identifier: ADMIN_ACCOUNT.identifier, password: ADMIN_ACCOUNT.password });[m
     setAdminLoading(false);[m
[32m+[m[32m    if (result.requiresTwoFactor) {[m
[32m+[m[32m      setChallengeToken(result.challengeToken);[m
[32m+[m[32m      setTwoFactorRequired(true);[m
[32m+[m[32m      setError('Enter the 6-digit code from your authenticator app or use a recovery code.');[m
[32m+[m[32m      return;[m
[32m+[m[32m    }[m
     if (!result.success) {[m
       setError(result.error);[m
       showToast(result.error || 'Administrator sign in failed.', 'error');[m
[36m@@ -336,6 +369,7 @@[m [mexport default function Login() {[m
                               </motion.div>[m
                             )}[m
 [m
[32m+[m[32m                            {!twoFactorRequired && <>[m
                             <div>[m
                               <label className="block text-xs font-bold text-[var(--color-dark-gray)] uppercase tracking-wider mb-2.5 dark:text-[#F3F7F4]">[m
                                 Username or Email[m
[36m@@ -403,6 +437,27 @@[m [mexport default function Login() {[m
                                 Forgot password?[m
                               </Link>[m
                             </div>[m
[32m+[m[32m                            </>}[m
[32m+[m
[32m+[m[32m                            {twoFactorRequired && ([m
[32m+[m[32m                              <div>[m
[32m+[m[32m                                <label className="block text-xs font-bold text-[var(--color-dark-gray)] uppercase tracking-wider mb-2.5 dark:text-[#F3F7F4]">Authenticator code</label>[m
[32m+[m[32m                                <Input[m
[32m+[m[32m                                  icon={ShieldCheck}[m
[32m+[m[32m                                  inputMode="numeric"[m
[32m+[m[32m                                  autoComplete="one-time-code"[m
[32m+[m[32m                                  maxLength={6}[m
[32m+[m[32m                                  required[m
[32m+[m[32m                                  autoFocus[m
[32m+[m[32m                                  value={verificationCode}[m
[32m+[m[32m                                  onChange={(e) => { setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setFieldErrors((current) => ({ ...current, verificationCode: '' })); }}[m
[32m+[m[32m                                  error={fieldErrors.verificationCode}[m
[32m+[m[32m                                  placeholder="123456"[m
[32m+[m[32m                                  className="!bg-[var(--color-off-white)] !border-[var(--color-border-gray)]"[m
[32m+[m[32m                                />[m
[32m+[m[32m                                <button type="button" onClick={() => { setTwoFactorRequired(false); setChallengeToken(''); setVerificationCode(''); setError(''); }} className="mt-2 text-xs font-semibold text-[var(--color-medium-green)] hover:underline">Back to password sign in</button>[m
[32m+[m[32m                              </div>[m
[32m+[m[32m                            )}[m
 [m
                             {/* Login Button */}[m
                             <Button[m
[36m@@ -413,7 +468,7 @@[m [mexport default function Login() {[m
                               loading={loading}[m
                               icon={LogIn}[m
                             >[m
[31m-                              {loading ? 'Signing in...' : 'Sign In'}[m
[32m+[m[32m                              {loading ? 'Signing in...' : twoFactorRequired ? 'Verify code' : 'Sign In'}[m
                             </Button>[m
                           </div>[m
                         </form>[m
[1mdiff --git a/src/pages/equipment/Equipment.jsx b/src/pages/equipment/Equipment.jsx[m
[1mindex ec9b9a0..23be0b2 100644[m
[1m--- a/src/pages/equipment/Equipment.jsx[m
[1m+++ b/src/pages/equipment/Equipment.jsx[m
[36m@@ -3,6 +3,7 @@[m [mimport { useSearchParams } from 'react-router-dom';[m
 import { Download, FileBarChart, Laptop, Plus, Pencil, Printer, Trash2, UserCheck, UserMinus, Wrench } from 'lucide-react';[m
 import PageHeader from '../../components/layout/PageHeader';[m
 import Button from '../../components/common/Button';[m
[32m+[m[32mimport CreatableSelect from '../../components/forms/CreatableSelect';[m
 import DataTable from '../../components/tables/DataTable';[m
 import RowActionMenu from '../../components/tables/RowActionMenu';[m
 import { StatusBadge } from '../../components/common/Badge';[m
[36m@@ -93,6 +94,10 @@[m [mexport default function Equipment() {[m
     { key: 'status', header: t('status') },[m
     { key: 'assignedTo', header: t('assignedTo'), value: (item) => item.currentAssignee?.userName || t('unassigned') },[m
   ];[m
[32m+[m[32m  const equipmentTypeOptions = [...new Set([...types, ...items.map((item) => item.type), form.type].filter(Boolean))][m
[32m+[m[32m    .map((type) => ({ value: type, label: type.replaceAll('_', ' ') }));[m
[32m+[m[32m  const equipmentLocationOptions = [...new Set([...items.map((item) => item.location), form.location].filter(Boolean))][m
[32m+[m[32m    .map((location) => ({ value: location, label: location }));[m
   const handleExport = () => {[m
     exportToCSV('equipment-records', reportColumns, filteredItems);[m
     showToast(t('exportCsv'), 'success');[m
[36m@@ -130,7 +135,7 @@[m [mexport default function Equipment() {[m
   </div>} />[m
     <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[[t('total'), stats.total], [t('available'), stats.available], [t('assigned'), stats.assigned], [t('maintenance'), stats.maintenance]].map(([label, value]) => <div key={label} className="rounded-xl border border-[var(--color-border-gray)] bg-[var(--color-white)] p-4"><p className="text-xs uppercase tracking-[0.12em] text-[var(--color-mid-gray)]">{label}</p><p className="mt-2 text-2xl font-bold text-[var(--color-dark-gray)]">{value}</p></div>)}</div>[m
     <div className="rounded-xl border border-[var(--color-border-gray)] bg-[var(--color-white)] p-4"><div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-mid-gray)]">{t('assetRegister')}</p><h3 className="mt-1 text-lg font-bold text-[var(--color-dark-gray)]">{t('equipmentList')}</h3></div>{activeFilter && <button type="button" onClick={clearFilter} className="flex items-center gap-1.5 rounded-full border border-[var(--color-border-gray)] bg-[var(--color-soft-gray)] px-3 py-1 text-xs font-semibold text-[var(--color-dark-gray)]">{t('filtered')}: {activeFilter.value.replace('_', ' ')} <span aria-hidden="true">×</span></button>}</div><DataTable columns={columns} data={filteredItems} emptyState={<div className="p-8 text-center text-sm text-[var(--color-mid-gray)]"><Laptop className="mx-auto mb-2 h-8 w-8" />{activeFilter ? t('noEquipmentWithStatus', { status: activeFilter.value.replace('_', ' ') }) : t('noEquipmentRegistered')}</div>} /></div>[m
[31m-    {openForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><form onSubmit={submit} className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-[var(--color-white)] p-6"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-bold">{editing ? t('editEquipment') : t('registerEquipment')}</h2><button type="button" onClick={closeForm} aria-label={t('closeModal')}>X</button></div><div className="grid gap-4 sm:grid-cols-2">{[[t('assetNumber'),'assetNumber','code', true, 120],[t('name'),'name','alnum', true, 160],[t('brand'),'brand','alnum', false, 100],[t('model'),'model','alnum', false, 100],[t('serialNumber'),'serialNumber','code', false, 120],[t('location'),'location','alnum', true, 160]].map(([label, key, kind, required, maxLength]) => <Field key={key} kind={kind} required={required} maxLength={maxLength} label={label} value={form[key]} onChange={(value) => setForm({ ...form, [key]: value })} />)}<Field label={t('type')} required value={form.type} options={types} onChange={(value) => setForm({ ...form, type: value })} /><Field label={t('condition')} value={form.condition} options={conditions} onChange={(value) => setForm({ ...form, condition: value })} /><Field label={t('purchaseDate')} type="date" value={form.purchaseDate} onChange={(value) => setForm({ ...form, purchaseDate: value })} /><Field label={t('warrantyExpiry')} type="date" value={form.warrantyExpiry} onChange={(value) => setForm({ ...form, warrantyExpiry: value })} /></div><label className="mt-4 block text-sm font-medium">{t('notes')}<textarea maxLength={2000} className={`${inputClass} mt-1`} rows="3" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label><div className="mt-5 flex justify-end gap-2"><Button type="button" variant="secondary" onClick={closeForm}>{t('cancel')}</Button><Button type="submit">{t('saveEquipment')}</Button></div></form></div>}[m
[32m+[m[32m    {openForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><form onSubmit={submit} className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-[var(--color-white)] p-6"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-bold">{editing ? t('editEquipment') : t('registerEquipment')}</h2><button type="button" onClick={closeForm} aria-label={t('closeModal')}>X</button></div><div className="grid gap-4 sm:grid-cols-2">{[[t('assetNumber'),'assetNumber','code', true, 120],[t('name'),'name','alnum', true, 160],[t('brand'),'brand','alnum', false, 100],[t('model'),'model','alnum', false, 100],[t('serialNumber'),'serialNumber','code', false, 120]].map(([label, key, kind, required, maxLength]) => <Field key={key} kind={kind} required={required} maxLength={maxLength} label={label} value={form[key]} onChange={(value) => setForm({ ...form, [key]: value })} />)}<CreatableSelect label={t('location')} required value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} options={equipmentLocationOptions} addLabel="+ Other" /><CreatableSelect label={t('type')} required value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} options={equipmentTypeOptions} addLabel="+ Other" /><Field label={t('condition')} value={form.condition} options={conditions} onChange={(value) => setForm({ ...form, condition: value })} /><Field label={t('purchaseDate')} type="date" value={form.purchaseDate} onChange={(value) => setForm({ ...form, purchaseDate: value })} /><Field label={t('warrantyExpiry')} type="date" value={form.warrantyExpiry} onChange={(value) => setForm({ ...form, warrantyExpiry: value })} /></div><label className="mt-4 block text-sm font-medium">{t('notes')}<textarea maxLength={2000} className={`${inputClass} mt-1`} rows="3" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label><div className="mt-5 flex justify-end gap-2"><Button type="button" variant="secondary" onClick={closeForm}>{t('cancel')}</Button><Button type="submit">{t('saveEquipment')}</Button></div></form></div>}[m
     {actionItem && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><form onSubmit={runAction} className="w-full max-w-lg rounded-xl bg-[var(--color-white)] p-6"><h2 className="mb-4 text-lg font-bold">{action === 'assign' ? t('assignEquipment') : action === 'return' ? t('returnEquipment') : t('recordMaintenance')}</h2>{action === 'assign' && <Field label={t('assignedUser')} kind="name" value={assignee} onChange={setAssignee} />}{action === 'maintenance' && <div className="space-y-3"><Field label={t('type')} value={maintenance.type} options={['inspection', 'repair', 'service', 'upgrade']} onChange={(value) => setMaintenance({ ...maintenance, type: value })} /><Field label={t('description')} value={maintenance.description} onChange={(value) => setMaintenance({ ...maintenance, description: value })} /><Field label={t('performedBy')} kind="name" value={maintenance.performedBy} onChange={(value) => setMaintenance({ ...maintenance, performedBy: value })} /><Field label={t('cost')} kind="decimal" value={maintenance.cost} onChange={(value) => setMaintenance({ ...maintenance, cost: value })} /></div>}<div className="mt-5 flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setActionItem(null)}>{t('cancel')}</Button><Button type="submit">{t('confirm')}</Button></div></form></div>}[m
   </div>;[m
 }[m
[1mdiff --git a/src/pages/library/BookFormModal.jsx b/src/pages/library/BookFormModal.jsx[m
[1mindex 593720c..a017bce 100644[m
[1m--- a/src/pages/library/BookFormModal.jsx[m
[1m+++ b/src/pages/library/BookFormModal.jsx[m
[36m@@ -1,13 +1,14 @@[m
 import { useState } from 'react';[m
 import Modal from '../../components/modals/Modal';[m
 import { Input, Textarea } from '../../components/forms/FormField';[m
[32m+[m[32mimport CreatableSelect from '../../components/forms/CreatableSelect';[m
 import ImageField from '../../components/forms/ImageField';[m
 import Button from '../../components/common/Button';[m
 import Alert from '../../components/feedback/Alert';[m
 import { useToast } from '../../context/ToastContext';[m
 import { useNotifications } from '../../context/NotificationContext';[m
 import { useApp } from '../../context/AppContext';[m
[31m-import { createBook, updateBook } from '../../services/bookService';[m
[32m+[m[32mimport { createBook, updateBook, getBooks } from '../../services/bookService';[m
 import { applyKindErrors } from '../../utils/validators';[m
 [m
 const EMPTY_FORM = { title: '', author: '', category: '', bookCode: '', description: '', totalCopies: '', coverImage: '' };[m
[36m@@ -46,6 +47,8 @@[m [mexport default function BookFormModal({ open, onClose, book, onSaved }) {[m
   }[m
 [m
   const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));[m
[32m+[m[32m  const categoryOptions = [...new Set([...getBooks().map((entry) => entry.category), form.category].filter(Boolean))][m
[32m+[m[32m    .map((category) => ({ value: category, label: category }));[m
 [m
   const validate = () => {[m
     const next = {};[m
[36m@@ -106,14 +109,14 @@[m [mexport default function BookFormModal({ open, onClose, book, onSaved }) {[m
         <Input kind="alnum" label={t('title')} required value={form.title} onChange={update('title')} error={errors.title} />[m
         <div className="grid sm:grid-cols-2 gap-4">[m
           <Input kind="name" label={t('author')} required value={form.author} onChange={update('author')} error={errors.author} />[m
[31m-          <Input[m
[31m-            kind="alnum"[m
[32m+[m[32m          <CreatableSelect[m
             label={t('category')}[m
             required[m
             value={form.category}[m
             onChange={update('category')}[m
             error={errors.category}[m
[31m-            placeholder={t('enterBookCategory')}[m
[32m+[m[32m            options={categoryOptions}[m
[32m+[m[32m            addLabel="+ Other"[m
           />[m
         </div>[m
         <div className="grid sm:grid-cols-2 gap-4">[m
[1mdiff --git a/src/pages/library/BorrowModal.jsx b/src/pages/library/BorrowModal.jsx[m
[1mindex 077077e..49220b7 100644[m
[1m--- a/src/pages/library/BorrowModal.jsx[m
[1m+++ b/src/pages/library/BorrowModal.jsx[m
[36m@@ -1,9 +1,10 @@[m
 import { useState } from 'react';[m
 import { Input, Select } from '../../components/forms/FormField';[m
[32m+[m[32mimport CreatableSelect from '../../components/forms/CreatableSelect';[m
 import Modal from '../../components/modals/Modal';[m
 import Button from '../../components/common/Button';[m
 import Alert from '../../components/feedback/Alert';[m
[31m-import { borrowBook } from '../../services/bookService';[m
[32m+[m[32mimport { borrowBook, getLoans } from '../../services/bookService';[m
 import { useToast } from '../../context/ToastContext';[m
 import { useNotifications } from '../../context/NotificationContext';[m
 import { useApp } from '../../context/AppContext';[m
[36m@@ -63,6 +64,8 @@[m [mexport default function BorrowModal({ open, onClose, book, onBorrowed }) {[m
   };[m
 [m
   const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));[m
[32m+[m[32m  const classOptions = [...new Set([...getLoans().map((loan) => loan.studentClassYear), form.studentClassYear].filter(Boolean))][m
[32m+[m[32m    .map((classLevel) => ({ value: classLevel, label: classLevel }));[m
 [m
   const validate = () => {[m
     const next = {};[m
[36m@@ -131,14 +134,14 @@[m [mexport default function BorrowModal({ open, onClose, book, onBorrowed }) {[m
             options={[{ value: 'Student', label: t('student') }, { value: 'Staff', label: t('staff') }]}[m
           />[m
           {form.borrowerType === 'Student' && ([m
[31m-            <Input[m
[31m-              kind="alnum"[m
[32m+[m[32m            <CreatableSelect[m
               label={t('classLevel')}[m
               required[m
               value={form.studentClassYear}[m
               onChange={update('studentClassYear')}[m
               error={errors.studentClassYear}[m
[31m-              placeholder="e.g. S4 or L5"[m
[32m+[m[32m              options={classOptions}[m
[32m+[m[32m              addLabel="+ Other"[m
             />[m
           )}[m
           <div className="grid sm:grid-cols-2 gap-4">[m
[1mdiff --git a/src/pages/shared/Notifications.jsx b/src/pages/shared/Notifications.jsx[m
[1mindex 1cd8ca4..22fcfbf 100644[m
[1m--- a/src/pages/shared/Notifications.jsx[m
[1m+++ b/src/pages/shared/Notifications.jsx[m
[36m@@ -1,4 +1,3 @@[m
[31m-import { useMemo, useState } from 'react';[m
 import { useNavigate } from 'react-router-dom';[m
 import { Volume2, VolumeX } from 'lucide-react';[m
 import PageHeader from '../../components/layout/PageHeader';[m
[36m@@ -14,13 +13,6 @@[m [mexport default function Notifications() {[m
   const navigate = useNavigate();[m
   const { showToast } = useToast();[m
   const { t } = useApp();[m
[31m-  const [filter, setFilter] = useState('all');[m
[31m-[m
[31m-  const visibleNotifications = useMemo(() => {[m
[31m-    if (filter === 'unread') return notifications.filter((n) => !n.read);[m
[31m-    if (filter === 'alerts') return notifications.filter((n) => !n.read || ['overdue', 'low-stock', 'stock', 'borrow'].includes(n.type));[m
[31m-    return notifications;[m
[31m-  }, [filter, notifications]);[m
 [m
   const handleClick = (n) => {[m
     markAsRead(n.id);[m
[36m@@ -48,9 +40,9 @@[m [mexport default function Notifications() {[m
               onClick={toggleSound}[m
               aria-label={soundEnabled ? t('muteNotificationSound') : t('unmuteNotificationSound')}[m
               title={soundEnabled ? t('notificationSoundOn') : t('notificationSoundOff')}[m
[31m-              className="rounded-md p-2 text-[var(--color-mid-gray)] transition-colors hover:bg-[var(--color-off-white)] hover:text-[var(--color-dark-gray)]"[m
[32m+[m[32m              className="p-2 rounded-md text-[var(--color-mid-gray)] hover:bg-[var(--color-off-white)] hover:text-[var(--color-dark-gray)] transition-colors"[m
             >[m
[31m-              {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}[m
[32m+[m[32m              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}[m
             </button>[m
             {unreadCount > 0 && ([m
               <Button variant="secondary" size="sm" onClick={handleMarkAll}>[m
[36m@@ -60,38 +52,12 @@[m [mexport default function Notifications() {[m
           </div>[m
         }[m
       />[m
[31m-[m
[31m-      <div className="rounded-[var(--radius-card)] border border-[var(--color-border-gray)] bg-[var(--color-white)] p-4 shadow-card">[m
[31m-        <div className="mb-4 flex flex-wrap items-center gap-2">[m
[31m-          {['all', 'unread', 'alerts'].map((option) => ([m
[31m-            <button[m
[31m-              key={option}[m
[31m-              type="button"[m
[31m-              onClick={() => setFilter(option)}[m
[31m-              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${filter === option ? 'bg-[var(--color-gold-100)] text-[var(--color-heading)]' : 'bg-[var(--color-soft-gray)] text-[var(--color-mid-gray)] hover:text-[var(--color-dark-gray)]'}`}[m
[31m-            >[m
[31m-              {option === 'all' ? 'All' : option === 'unread' ? 'Unread' : 'Alerts'}[m
[31m-            </button>[m
[31m-          ))}[m
[31m-        </div>[m
[31m-[m
[31m-        <div className="divide-y divide-[var(--color-border-gray)] overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border-gray)]">[m
[31m-          {visibleNotifications.length === 0 ? ([m
[31m-            <EmptyState title={t('noNotifications')} message={t('notificationsCaughtUp')} />[m
[31m-          ) : ([m
[31m-            visibleNotifications.map((n) => ([m
[31m-              <NotificationItem[m
[31m-                key={n.id}[m
[31m-                notification={n}[m
[31m-                onClick={handleClick}[m
[31m-                onDelete={async (item) => {[m
[31m-                  const result = await deleteNotification(item.id);[m
[31m-                  showToast(result.success ? t('notificationDeleted') : t('couldNotUpdateNotifications'), result.success ? 'success' : 'error');[m
[31m-                }}[m
[31m-              />[m
[31m-            ))[m
[31m-          )}[m
[31m-        </div>[m
[32m+[m[32m      <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] divide-y divide-[var(--color-border-gray)]">[m
[32m+[m[32m        {notifications.length === 0 ? ([m
[32m+[m[32m          <EmptyState title={t('noNotifications')} message={t('notificationsCaughtUp')} />[m
[32m+[m[32m        ) : ([m
[32m+[m[32m          notifications.map((n) => <NotificationItem key={n.id} notification={n} onClick={handleClick} onDelete={async (item) => { const result = await deleteNotification(item.id); showToast(result.success ? t('notificationDeleted') : t('couldNotUpdateNotifications'), result.success ? 'success' : 'error'); }} />)[m
[32m+[m[32m        )}[m
       </div>[m
     </div>[m
   );[m
[1mdiff --git a/src/pages/stock/DamageDisposal.jsx b/src/pages/stock/DamageDisposal.jsx[m
[1mindex 46a67bf..11e1f88 100644[m
[1m--- a/src/pages/stock/DamageDisposal.jsx[m
[1m+++ b/src/pages/stock/DamageDisposal.jsx[m
[36m@@ -598,7 +598,7 @@[m [mfunction ReconciliationTab({ viewOnly, showToast, user }) {[m
                 placeholder={t('reconciliation')} required />[m
               <Select label={t('location')} value={form.location}[m
                 onChange={(e) => setForm({ ...form, location: e.target.value })}[m
[31m-                options={LOCATIONS.map((l) => ({ value: l, label: t(`stockLocation.${l}`) }))} required />[m
[32m+[m[32m                options={[...new Set([...LOCATIONS, ...getItems().map((item) => item.location)])].filter(Boolean).map((location) => ({ value: location, label: LOCATIONS.includes(location) ? t(`stockLocation.${location}`) : location }))} required />[m
               <Input label={t('date')} type="date" value={form.scheduledDate}[m
                 onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} required />[m
             </div>[m
[1mdiff --git a/src/pages/stock/StockItemFormModal.jsx b/src/pages/stock/StockItemFormModal.jsx[m
[1mindex 8345303..f38ee8a 100644[m
[1m--- a/src/pages/stock/StockItemFormModal.jsx[m
[1m+++ b/src/pages/stock/StockItemFormModal.jsx[m
[36m@@ -1,13 +1,14 @@[m
 import { useState } from 'react';[m
 import Modal from '../../components/modals/Modal';[m
 import { Input, Select, Textarea } from '../../components/forms/FormField';[m
[32m+[m[32mimport CreatableSelect from '../../components/forms/CreatableSelect';[m
 import Button from '../../components/common/Button';[m
 import Alert from '../../components/feedback/Alert';[m
 import { useToast } from '../../context/ToastContext';[m
 import { useNotifications } from '../../context/NotificationContext';[m
 import { useAuth } from '../../context/AuthContext';[m
[31m-import { STOCK_CATEGORIES, STOCK_UNITS } from '../../data/stock';[m
[31m-import { createItem, updateItem, getSuppliers } from '../../services/stockService';[m
[32m+[m[32mimport { STOCK_CATEGORIES, STOCK_LOCATIONS, STOCK_UNITS } from '../../data/stock';[m
[32m+[m[32mimport { createItem, updateItem, getItems, getSuppliers } from '../../services/stockService';[m
 import { logActivity } from '../../services/activityService';[m
 import { useApp } from '../../context/AppContext';[m
 import { applyKindErrors } from '../../utils/validators';[m
[36m@@ -55,12 +56,14 @@[m [mexport default function StockItemFormModal({ open, onClose, item, onSaved }) {[m
   }[m
 [m
   const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));[m
[32m+[m[32m  const categoryOptions = [...new Set([...STOCK_CATEGORIES, ...getItems().map((entry) => entry.category), form.category].filter(Boolean))];[m
[32m+[m[32m  const locationOptions = [...new Set([...STOCK_LOCATIONS, ...getItems().map((entry) => entry.location), form.location].filter(Boolean))];[m
 [m
   const validate = () => {[m
     const next = {};[m
     if (!form.name?.trim()) next.name = t('itemNameRequired');[m
     else if (form.name.trim().length > 100) next.name = t('itemNameTooLong');[m
[31m-    if (!STOCK_CATEGORIES.includes(form.category)) next.category = t('categoryRequired');[m
[32m+[m[32m    if (!form.category?.trim()) next.category = t('categoryRequired');[m
     if (!STOCK_UNITS.includes(form.unit)) next.unit = t('unitRequired');[m
     const qty = Number(form.quantity);[m
     if (form.quantity === '' || Number.isNaN(qty) || qty < 0) next.quantity = t('validQuantityRequired');[m
[36m@@ -68,13 +71,8 @@[m [mexport default function StockItemFormModal({ open, onClose, item, onSaved }) {[m
     if (form.minLevel === '' || Number.isNaN(min) || min < 0) next.minLevel = t('validMinimumLevelRequired');[m
     const price = Number(form.unitPrice);[m
     if (form.unitPrice === '' || Number.isNaN(price) || price < 0) next.unitPrice = t('validUnitValueRequired');[m
[31m-    // NEW: Validate batch number for Foods[m
[31m-    if (form.category === 'Foods' && !form.batchNumber?.trim()) {[m
[31m-      next.batchNumber = t('batchNumberRequired');[m
[31m-    }[m
[31m-    if (form.expiryDate && Number.isNaN(new Date(form.expiryDate).getTime())) {[m
[31m-      next.expiryDate = t('validExpiryDateRequired');[m
[31m-    }[m
[32m+[m[32m    if (form.category === 'Foods' && !form.batchNumber?.trim()) next.batchNumber = t('batchNumberRequired');[m
[32m+[m[32m    if (form.expiryDate && Number.isNaN(new Date(form.expiryDate).getTime())) next.expiryDate = t('validExpiryDateRequired');[m
     applyKindErrors(next, form, FIELD_KINDS, t);[m
     setErrors(next);[m
     return Object.keys(next).length === 0;[m
[36m@@ -139,14 +137,15 @@[m [mexport default function StockItemFormModal({ open, onClose, item, onSaved }) {[m
         {serverError && <Alert type="error">{serverError}</Alert>}[m
         <Input kind="itemName" label={t('itemName')} required maxLength={100} value={form.name} onChange={update('name')} error={errors.name} />[m
         <div className="grid sm:grid-cols-2 gap-4">[m
[31m-          <Select[m
[32m+[m[32m          <CreatableSelect[m
             label={t('category')}[m
             required[m
             value={form.category}[m
             onChange={update('category')}[m
             error={errors.category}[m
             hint={t('stockCategoryHint')}[m
[31m-            options={STOCK_CATEGORIES.map((c) => ({ value: c, label: t(`stockCategory.${c}`) }))}[m
[32m+[m[32m            options={categoryOptions.map((category) => ({ value: category, label: STOCK_CATEGORIES.includes(category) ? t(`stockCategory.${category}`) : category }))}[m
[32m+[m[32m            addLabel="+ Other"[m
           />[m
           <Select[m
             label={t('unit')}[m
[36m@@ -223,14 +222,13 @@[m [mexport default function StockItemFormModal({ open, onClose, item, onSaved }) {[m
               ...suppliers.map((s) => ({ value: s.id, label: s.name })),[m
             ]}[m
           />[m
[31m-          <Select[m
[32m+[m[32m          <CreatableSelect[m
             label={t('location')}[m
             value={form.location}[m
             onChange={update('location')}[m
[31m-            options={[[m
[31m-              { value: '', label: `— ${t('selectAnOption')} —` },[m
[31m-              ...['Main Store', 'Kitchen Store', 'ICT Lab Store', 'Admin Store'].map((location) => ({ value: location, label: t(`stockLocation.${location}`) })),[m
[31m-            ]}[m
[32m+[m[32m            placeholder={`— ${t('selectAnOption')} —`}[m
[32m+[m[32m            options={locationOptions.map((location) => ({ value: location, label: STOCK_LOCATIONS.includes(location) ? t(`stockLocation.${location}`) : location }))}[m
[32m+[m[32m            addLabel="+ Other"[m
           />[m
         </div>[m
       </form>[m
[1mdiff --git a/src/pages/stock/StockItems.jsx b/src/pages/stock/StockItems.jsx[m
[1mindex 0cbfd4f..960afb8 100644[m
[1m--- a/src/pages/stock/StockItems.jsx[m
[1m+++ b/src/pages/stock/StockItems.jsx[m
[36m@@ -330,7 +330,7 @@[m [mexport default function StockItems() {[m
                 label={t('allCategories')}[m
                 value={categoryFilter}[m
                 onChange={setCategoryFilter}[m
[31m-                options={STOCK_CATEGORIES.map((c) => ({ value: c, label: t(`stockCategory.${c}`) }))}[m
[32m+[m[32m                options={[...new Set([...STOCK_CATEGORIES, ...items.map((item) => item.category)])].map((category) => ({ value: category, label: STOCK_CATEGORIES.includes(category) ? t(`stockCategory.${category}`) : category }))}[m
               />[m
               <FilterDropdown[m
                 label={t('allUnits')}[m
[1mdiff --git a/src/pages/stock/StockTransfer.jsx b/src/pages/stock/StockTransfer.jsx[m
[1mindex 0b7f2cf..5f7c363 100644[m
[1m--- a/src/pages/stock/StockTransfer.jsx[m
[1m+++ b/src/pages/stock/StockTransfer.jsx[m
[36m@@ -56,6 +56,7 @@[m [mexport default function StockTransfer() {[m
   const [saving, setSaving] = useState(false);[m
 [m
   const selectedItem = items.find((i) => i.id === form.itemId) || null;[m
[32m+[m[32m  const locationOptions = [...new Set([...STOCK_LOCATIONS, ...items.map((item) => item.location)].filter(Boolean))];[m
   const update = (field) => (e) => {[m
     const value = e.target.value;[m
     setForm((f) => {[m
[36m@@ -174,8 +175,8 @@[m [mexport default function StockTransfer() {[m
             {selectedItem && <p className="text-xs text-[var(--color-mid-gray)] -mt-2">{t('currentlyStoredAt', { location: selectedItem.location })}</p>}[m
             <Input kind="decimal" label={t('quantity')} type="number" min="1" required value={form.quantity} onChange={update('quantity')} error={errors.quantity} />[m
             <div className="grid sm:grid-cols-2 gap-4">[m
[31m-              <Select label={t('fromLocation')} required value={form.fromLocation} onChange={update('fromLocation')} error={errors.fromLocation} options={STOCK_LOCATIONS.map((l) => ({ value: l, label: t(`stockLocation.${l}`) }))} />[m
[31m-              <Select label={t('toLocation')} required value={form.toLocation} onChange={update('toLocation')} error={errors.toLocation} options={STOCK_LOCATIONS.map((l) => ({ value: l, label: t(`stockLocation.${l}`) }))} />[m
[32m+[m[32m              <Select label={t('fromLocation')} required value={form.fromLocation} onChange={update('fromLocation')} error={errors.fromLocation} options={locationOptions.map((location) => ({ value: location, label: STOCK_LOCATIONS.includes(location) ? t(`stockLocation.${location}`) : location }))} />[m
[32m+[m[32m              <Select label={t('toLocation')} required value={form.toLocation} onChange={update('toLocation')} error={errors.toLocation} options={locationOptions.map((location) => ({ value: location, label: STOCK_LOCATIONS.includes(location) ? t(`stockLocation.${location}`) : location }))} />[m
             </div>[m
             <div className="grid sm:grid-cols-2 gap-4">[m
               <Select label={t('reason')} value={form.reason} onChange={update('reason')} options={TRANSFER_REASONS.map((r) => ({ value: r, label: t(`transferReason.${r}`) }))} />[m
[1mdiff --git a/src/routes/ProtectedRoute.jsx b/src/routes/ProtectedRoute.jsx[m
[1mindex 979f6d8..30623be 100644[m
[1m--- a/src/routes/ProtectedRoute.jsx[m
[1m+++ b/src/routes/ProtectedRoute.jsx[m
[36m@@ -28,16 +28,16 @@[m [mexport function RoleProtectedRoute({ allow }) {[m
  * granting or removing one in Roles & Permissions takes effect straight away.[m
  */[m
 export function PermissionProtectedRoute({ permissions = [], mode = 'any' }) {[m
[31m-  const { isAuthenticated, initializing, hasPermission } = useAuth();[m
[32m+[m[32m  const { role, isAuthenticated, initializing, hasPermission } = useAuth();[m
   const location = useLocation();[m
 [m
   if (initializing) return <LoadingState label="Checking your session…" className="min-h-screen" />;[m
   if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;[m
[31m-[m
[31m-  const allowed = mode === 'all'[m
[31m-    ? permissions.every((permission) => hasPermission(permission))[m
[31m-    : permissions.some((permission) => hasPermission(permission));[m
[31m-[m
[31m-  if (!allowed) return <Navigate to="/access-restricted" replace />;[m
[32m+[m[32m  if (role !== 'admin') {[m
[32m+[m[32m    const allowed = mode === 'all'[m
[32m+[m[32m      ? permissions.every((permission) => hasPermission(permission))[m
[32m+[m[32m      : permissions.some((permission) => hasPermission(permission));[m
[32m+[m[32m    if (!allowed) return <Navigate to="/access-restricted" replace />;[m
[32m+[m[32m  }[m
   return <Outlet />;[m
 }[m
[1mdiff --git a/src/services/activityService.js b/src/services/activityService.js[m
[1mindex 8ca697b..cfaea1f 100644[m
[1m--- a/src/services/activityService.js[m
[1m+++ b/src/services/activityService.js[m
[36m@@ -9,7 +9,7 @@[m [mlet loading;[m
 function canReadActivity() {[m
   try {[m
     const user = JSON.parse(localStorage.getItem('rg_auth_session') || 'null');[m
[31m-    return !!user && !!user.permissions?.includes('audit.view');[m
[32m+[m[32m    return !!user && (user.role === 'admin' || !!user.permissions?.includes('audit.view'));[m
   } catch {[m
     return false;[m
   }[m
[1mdiff --git a/src/services/authService.js b/src/services/authService.js[m
[1mindex 39402e2..17fc41b 100644[m
[1m--- a/src/services/authService.js[m
[1m+++ b/src/services/authService.js[m
[36m@@ -20,6 +20,9 @@[m [mfunction loginErrorMessage(error) {[m
 export async function login({ identifier, password }) {[m
   try {[m
     const result = await api.post('/auth/login', { identifier, password });[m
[32m+[m[32m    if (result.data.requiresTwoFactor) {[m
[32m+[m[32m      return { success: false, requiresTwoFactor: true, challengeToken: result.data.challengeToken };[m
[32m+[m[32m    }[m
     setTokens(result.data);[m
     persistSession(result.data.user);[m
     window.dispatchEvent(new Event('rg:authenticated'));[m
[36m@@ -29,6 +32,18 @@[m [mexport async function login({ identifier, password }) {[m
   }[m
 }[m
 [m
[32m+[m[32mexport async function verifyLoginTwoFactor(challengeToken, code) {[m
[32m+[m[32m  try {[m
[32m+[m[32m    const result = await api.post('/auth/login/2fa', { challengeToken, code });[m
[32m+[m[32m    setTokens(result.data);[m
[32m+[m[32m    persistSession(result.data.user);[m
[32m+[m[32m    window.dispatchEvent(new Event('rg:authenticated'));[m
[32m+[m[32m    return { success: true, user: result.data.user };[m
[32m+[m[32m  } catch (error) {[m
[32m+[m[32m    return { success: false, error: error?.message || 'Invalid verification code.' };[m
[32m+[m[32m  }[m
[32m+[m[32m}[m
[32m+[m
 export async function requestPasswordReset(email) {[m
   const result = await api.post('/auth/password-reset/request', { email });[m
   return result.data;[m
[36m@@ -39,6 +54,10 @@[m [mexport async function resetPassword(token, newPassword) {[m
   return result.data;[m
 }[m
 [m
[32m+[m[32mexport async function setupTwoFactor() { return (await api.post('/auth/2fa/setup', {})).data; }[m
[32m+[m[32mexport async function enableTwoFactor(secret, code, recoveryCodes) { return (await api.post('/auth/2fa/enable', { secret, code, recoveryCodes })).data; }[m
[32m+[m[32mexport async function disableTwoFactor(password, code) { return (await api.post('/auth/2fa/disable', { password, code })).data; }[m
[32m+[m
 export async function logout() {[m
   // Send this device's refresh token so only THIS device is signed out (other devices stay signed in).[m
   try { await api.post('/auth/logout', { refreshToken: localStorage.getItem('rg_refresh_token') || undefined }); } catch { /* session may already be expired */ }[m
[36m@@ -77,5 +96,5 @@[m [mexport function persistSession(user) {[m
  * without changing the call sites that use hasPermission().[m
  */[m
 export function hasPermission(user, permission) {[m
[31m-  return !!user && !!permission && user.permissions?.includes(permission);[m
[32m+[m[32m  return !!user && (user.role === 'admin' || user.permissions?.includes(permission));[m
 }[m
[1mdiff --git a/src/services/contentService.js b/src/services/contentService.js[m
[1mindex 067af9b..02aeed0 100644[m
[1m--- a/src/services/contentService.js[m
[1m+++ b/src/services/contentService.js[m
[36m@@ -348,6 +348,18 @@[m [mexport function updateSystemSettings(data) {[m
     aboutText: data.aboutText,[m
   });[m
 }[m
[32m+[m[32mexport async function getEmailSettings() {[m
[32m+[m[32m  const result = await api.get('/admin/email-settings');[m
[32m+[m[32m  return result.data || {};[m
[32m+[m[32m}[m
[32m+[m[32mexport async function updateEmailSettings(data) {[m
[32m+[m[32m  try {[m
[32m+[m[32m    const result = await api.put('/admin/email-settings', data);[m
[32m+[m[32m    return { success: true, settings: result.data };[m
[32m+[m[32m  } catch (error) {[m
[32m+[m[32m    return { success: false, error: error.message };[m
[32m+[m[32m  }[m
[32m+[m[32m}[m
 export async function updateDevelopersPage(data) {[m
   try {[m
     const developers = await Promise.all((data.developers || []).map(async (developer) => ({[m
[1mdiff --git a/src/services/stockService.js b/src/services/stockService.js[m
[1mindex 53a74fe..eea218a 100644[m
[1m--- a/src/services/stockService.js[m
[1m+++ b/src/services/stockService.js[m
[36m@@ -94,7 +94,7 @@[m [mexport function getOutOfStockItems() { return items.filter((item) => item.quanti[m
 export function getExpiredItems() { return items.filter((item) => getExpiryStatus(item.expiryDate)?.status === 'expired'); }[m
 export function getExpiringSoonItems() { return items.filter((item) => getExpiryStatus(item.expiryDate)?.status === 'expiring-soon'); }[m
 export function getTotalStockValue() { return items.reduce((sum, item) => sum + item.quantity * (item.unitPrice || 0), 0); }[m
[31m-export function getStockValueByCategory() { return STOCK_CATEGORIES.map((category) => ({ category, value: items.filter((item) => item.category === category).reduce((sum, item) => sum + item.quantity * (item.unitPrice || 0), 0), count: items.filter((item) => item.category === category).length })); }[m
[32m+[m[32mexport function getStockValueByCategory() { return [...new Set([...STOCK_CATEGORIES, ...items.map((item) => item.category)])].map((category) => ({ category, value: items.filter((item) => item.category === category).reduce((sum, item) => sum + item.quantity * (item.unitPrice || 0), 0), count: items.filter((item) => item.category === category).length })); }[m
 export function getDamagedItems() { return damaged.filter((record) => record.status === 'reported'); }[m
 export function getRemovedItems() { return removed; }[m
 export function getUsageByItem() {[m
[36m@@ -118,7 +118,7 @@[m [masync function mutate(method, path, data, key) {[m
     return { success: false, error: detail ? `${error.message}: ${detail}` : error.message };[m
   }[m
 }[m
[31m-export function createItem(data) { if (!STOCK_CATEGORIES.includes(data.category)) return Promise.resolve({ success: false, error: 'Select a valid stock category.' }); return mutate('post', '/stock/items', data, 'item'); }[m
[32m+[m[32mexport function createItem(data) { if (!data.category?.trim()) return Promise.resolve({ success: false, error: 'Select a valid stock category.' }); return mutate('post', '/stock/items', data, 'item'); }[m
 export function updateItem(id, data) { return mutate('put', `/stock/items/${id}`, data, 'item'); }[m
 export function deleteItem(id) { return mutate('delete', `/stock/items/${id}`, {}, 'item'); }[m
 export function stockIn(data) { return mutate('post', '/stock/transactions/in', data, 'transaction'); }[m
