import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_ROLE_PERMISSIONS } from '../src/config/defaultPermissions.js';
import { authorize, requireAnyPermissionOrRole, requireMaintenanceAccess } from '../src/middleware/auth.js';
import Role from '../src/models/Role.js';
import User from '../src/models/User.js';
import { UPLOAD_ROLES } from '../src/routes/uploadRoutes.js';
import { getDeveloperOverview, isMaintenanceMode, setMaintenanceMode } from '../src/services/developerService.js';

function mockRes() {
  const res = { statusCode: 200, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (body) => { res.body = body; return res; };
  return res;
}

test('developer role is configured in the default permission map', () => {
  assert.ok(DEFAULT_ROLE_PERMISSIONS.developer);
  assert.ok(Array.isArray(DEFAULT_ROLE_PERMISSIONS.developer));
  assert.ok(DEFAULT_ROLE_PERMISSIONS.developer.includes('audit.view'));
  assert.ok(DEFAULT_ROLE_PERMISSIONS.developer.includes('website.update'));
});

test('developer authorization blocks non-developer users', () => {
  const res = mockRes();
  let called = false;
  const next = () => { called = true; };

  authorize('developer')({ user: { role: 'admin' } }, res, next);

  assert.equal(called, false);
  assert.equal(res.statusCode, 403);
  assert.match(String(res.body?.message || res.body?.error || ''), /permission/i);
});

test('developer role is accepted by the user and role schemas', () => {
  assert.ok(Role.schema.path('name').enumValues.includes('developer'));
  assert.ok(User.schema.path('role').enumValues.includes('developer'));
});

test('developer role is allowed to upload profile images', () => {
  const res = mockRes();
  let called = false;

  authorize(...UPLOAD_ROLES)({ user: { role: 'developer' } }, res, () => { called = true; });

  assert.equal(called, true);
  assert.equal(res.statusCode, 200);
});

test('developer authorization allows the developer role', () => {
  const res = mockRes();
  let called = false;
  const next = () => { called = true; };

  authorize('developer')({ user: { role: 'developer' } }, res, next);

  assert.equal(called, true);
  assert.equal(res.statusCode, 200);
});

test('developer role can save developer page without a stale permission assignment', () => {
  const res = mockRes();
  let called = false;
  const next = () => { called = true; };

  requireAnyPermissionOrRole(['developer'], 'website.update', 'applications.update')({ user: { role: 'developer', permissions: [] } }, res, next);

  assert.equal(called, true);
  assert.equal(res.statusCode, 200);
});

test('developer page update still requires permissions for non-developer roles', () => {
  const res = mockRes();
  let called = false;

  requireAnyPermissionOrRole(['developer'], 'website.update', 'applications.update')({ user: { role: 'management', permissions: [] } }, res, () => { called = true; });

  assert.equal(called, false);
  assert.equal(res.statusCode, 403);
});

test('maintenance mode blocks non-developer access', async () => {
  const res = mockRes();
  let called = false;
  const next = () => { called = true; };

  await setMaintenanceMode(true, 'developer');
  await requireMaintenanceAccess({ user: { role: 'admin', fullName: 'Admin User' }, path: '/api/users' }, res, next);

  assert.equal(called, false);
  assert.equal(res.statusCode, 503);
  assert.match(String(res.body?.message || ''), /maintenance/i);

  await setMaintenanceMode(false, 'developer');
});

test('developer system service exposes overview and maintenance toggles', async () => {
  assert.equal(typeof getDeveloperOverview, 'function');
  assert.equal(typeof isMaintenanceMode, 'function');
  assert.equal(typeof setMaintenanceMode, 'function');

  const overview = await getDeveloperOverview();
  assert.ok(overview && typeof overview === 'object');
  assert.ok('system' in overview || 'database' in overview || 'notifications' in overview || 'backups' in overview);

  const current = await isMaintenanceMode();
  assert.equal(typeof current, 'boolean');
  const toggled = await setMaintenanceMode(!current);
  assert.equal(typeof toggled, 'boolean');
  await setMaintenanceMode(current);
});
