import test from 'node:test';
import assert from 'node:assert/strict';
import { validateBody } from '../src/middleware/validate.js';
import { encryptSecret, decryptSecret } from '../src/utils/secretBox.js';
import { normalizePhone, collectPhoneFixes } from '../src/utils/validators.js';
import StockArchiveRequest from '../src/models/StockArchiveRequest.js';
import Admission from '../src/models/Admission.js';
import { DEFAULT_ROLE_PERMISSIONS } from '../src/config/defaultPermissions.js';

// Runs an Express-style middleware and reports what it did.
function run(middleware, body) {
  const result = { status: null, next: false, payload: null };
  const res = { status(code) { result.status = code; return this; }, json(data) { result.payload = data; return this; } };
  middleware({ body }, res, () => { result.next = true; });
  return result;
}

test('requiredWhen makes a field mandatory only when the condition is true', () => {
  const middleware = validateBody({ batchNumber: { requiredWhen: (body) => body.category === 'Foods', message: 'Batch number is required for Foods' } });
  assert.equal(run(middleware, { category: 'Foods' }).status, 422, 'Foods without batch number must be rejected');
  assert.equal(run(middleware, { category: 'Foods', batchNumber: '   ' }).status, 422);
  assert.equal(run(middleware, { category: 'Foods', batchNumber: 'B-1' }).next, true);
  assert.equal(run(middleware, { category: 'Other School Materials' }).next, true, 'not required for other categories');
});

test('secretBox encrypts and decrypts, and keeps old plain values readable', () => {
  const stored = encryptSecret('my-gmail-app-password');
  assert.ok(stored.startsWith('enc:v1:'));
  assert.ok(!stored.includes('my-gmail-app-password'));
  assert.equal(decryptSecret(stored), 'my-gmail-app-password');
  assert.equal(decryptSecret('plain-old-value'), 'plain-old-value');
  assert.equal(decryptSecret('enc:v1:broken:data:here'), '', 'a damaged value must not crash');
});

test('phone clean-up keeps the 10-12 digit rule and never guesses at odd text', () => {
  assert.deepEqual(normalizePhone('+250 788 123 456'), { value: '+250788123456', valid: true, changed: true });
  assert.equal(normalizePhone('0788123456').changed, false);
  assert.equal(normalizePhone('0788/0799').valid, false);
  const { fixes, manual } = collectPhoneFixes([{ _id: 1, phone: '0788 123 456' }, { _id: 2, phone: 'call me' }], ['phone']);
  assert.equal(fixes.length, 1);
  assert.equal(manual.length, 1);
});

test('stock archive requests need an item, a reason and a requester', async () => {
  await assert.rejects(() => new StockArchiveRequest({}).validate(), (error) => Boolean(error.errors.itemId && error.errors.reason && error.errors.requestedBy));
  const ok = new StockArchiveRequest({ itemId: '000000000000000000000001', itemName: 'Rice', reason: 'Discontinued', requestedBy: '000000000000000000000002' });
  await ok.validate();
  assert.equal(ok.status, 'pending');
});

test('admission reference numbers are random and well formed', async () => {
  const numbers = new Set();
  for (let i = 0; i < 50; i += 1) {
    const admission = new Admission({});
    await admission.validate().catch(() => {}); // other required fields are missing; the reference is still generated
    numbers.add(admission.referenceNumber);
  }
  assert.equal(numbers.size, 50, 'no repeats');
  for (const number of numbers) assert.match(number, /^RG-\d{4}-[A-HJ-NP-Z2-9]{6}$/);
});

test('reconciliation approval is a management permission, not part of stock.adjust', () => {
  assert.ok(DEFAULT_ROLE_PERMISSIONS.management.includes('stock.reconcile.approve'));
  assert.ok(!DEFAULT_ROLE_PERMISSIONS.stock_manager.includes('stock.reconcile.approve'));
});
