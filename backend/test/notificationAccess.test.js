import test from 'node:test';
import assert from 'node:assert/strict';
import { isUserEligibleForAlert } from '../src/services/alertService.js';

test('library alerts reach only users with library access', () => {
  const librarian = { role: 'librarian', permissions: ['library.view'], status: 'active' };
  const stockManager = { role: 'stock_manager', permissions: ['stock.view'], status: 'active' };
  const admin = { role: 'admin', permissions: ['users.view'], status: 'active' };

  assert.equal(isUserEligibleForAlert(librarian, { roles: ['librarian', 'management'], module: 'Library' }), true);
  assert.equal(isUserEligibleForAlert(stockManager, { roles: ['librarian', 'management'], module: 'Library' }), false);
  assert.equal(isUserEligibleForAlert(admin, { roles: ['librarian', 'management'], module: 'Library' }), false);
});

test('stock alerts reach only users with stock access', () => {
  const stockManager = { role: 'stock_manager', permissions: ['stock.view', 'stock.reports'], status: 'active' };
  const management = { role: 'management', permissions: ['reports.view'], status: 'active' };
  const librarian = { role: 'librarian', permissions: ['library.view'], status: 'active' };

  assert.equal(isUserEligibleForAlert(stockManager, { roles: ['stock_manager', 'management'], module: 'Stock' }), true);
  assert.equal(isUserEligibleForAlert(management, { roles: ['stock_manager', 'management'], module: 'Stock' }), true);
  assert.equal(isUserEligibleForAlert(librarian, { roles: ['stock_manager', 'management'], module: 'Stock' }), false);
});
