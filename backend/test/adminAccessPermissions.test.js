import test from 'node:test';
import assert from 'node:assert/strict';
import { requireAnyPermission } from '../src/middleware/auth.js';

function mockRes() {
  const res = { statusCode: 200, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (body) => { res.body = body; return res; };
  return res;
}

test('admin role does not bypass permission checks unless explicitly granted', () => {
  const res = mockRes();
  let called = false;
  const next = () => { called = true; };

  requireAnyPermission('stock.view')({ user: { role: 'admin', permissions: [] } }, res, next);

  assert.equal(called, false);
  assert.equal(res.statusCode, 403);
  assert.equal(res.body?.error || res.body?.message || '', 'One of these permissions is required: stock.view');
});

test('explicitly granted permissions still pass', () => {
  const res = mockRes();
  let called = false;
  const next = () => { called = true; };

  requireAnyPermission('stock.view')({ user: { role: 'admin', permissions: ['stock.view'] } }, res, next);

  assert.equal(called, true);
  assert.equal(res.statusCode, 200);
});
