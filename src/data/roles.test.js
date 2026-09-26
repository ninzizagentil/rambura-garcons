import test from 'node:test';
import assert from 'node:assert/strict';

import { ADMIN_NAV, getNavForUser } from './roles.js';

function hasPermission(permission) {
  return permission === 'users.view';
}

test('admin menu hides items the system administrator does not have permission to open', () => {
  const nav = getNavForUser({ role: 'admin', permissions: ['users.view'] }, hasPermission);
  const labels = nav.flatMap((item) => [item.label, ...(item.children || []).map((child) => child.label)]);

  assert.ok(labels.includes('Users & Roles'));
  assert.ok(!labels.includes('Website Management'));
  assert.ok(!labels.includes('Events'));
  assert.ok(!labels.includes('Admissions'));
  assert.ok(!labels.includes('Reports'));
  assert.ok(!labels.includes('Activity / Audit'));
  assert.ok(!labels.includes('Settings'));
});

test('admin navigation items still respect the permission filter', () => {
  const visible = ADMIN_NAV.flatMap((item) => item.children || []).filter((child) => child.permission)
    .map((child) => child.label)
    .filter((label) => label === 'Users & Roles' || label === 'Roles & Permissions' || label === 'Website Management');

  assert.deepEqual(visible, ['Users & Roles', 'Roles & Permissions', 'Website Management']);
  const websiteGroup = ADMIN_NAV.find((item) => item.label === 'Website');
  assert.equal(websiteGroup.children.filter((child) => child.permission === 'website.view').length, 1);
});
