import test from 'node:test';
import assert from 'node:assert/strict';
import StockItem from '../src/models/StockItem.js';
import StockTransaction from '../src/models/StockTransaction.js';
import DisposedStock from '../src/models/DisposedStock.js';
import DamagedStock from '../src/models/DamagedStock.js';
import AuditLog from '../src/models/AuditLog.js';
import User from '../src/models/User.js';
import Notification from '../src/models/Notification.js';
import { approveDisposal, rejectDisposal, requestDisposal, transfer } from '../src/controllers/stockController.js';

const ID = '507f1f77bcf86cd799439011';
const USER = '507f1f77bcf86cd799439012';

function mockRes() {
  const res = { statusCode: 200, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (body) => { res.body = body; return res; };
  return res;
}
const req = (over = {}) => ({ params: { id: ID }, body: {}, user: { _id: USER }, ip: '127.0.0.1', headers: {}, ...over });

// Replace model statics for one test and restore them afterwards.
function stub(t, target, name, fn) {
  const original = target[name];
  target[name] = fn;
  t.after(() => { target[name] = original; });
}
function stubAudit(t) {
  stub(t, AuditLog, 'create', async () => ({ _id: ID }));
  stub(t, User, 'find', () => ({ select: async () => [] }));
  stub(t, Notification, 'insertMany', async () => []);
}

const pendingDoc = { _id: ID, itemId: ID, itemName: 'Rice', quantityRemoved: 5, reason: 'Expired', status: 'pending' };

test('approve: a failure BEFORE the stock was deducted never adds stock back', async (t) => {
  stubAudit(t);
  const incs = [];
  stub(t, DisposedStock, 'findById', async () => pendingDoc);
  stub(t, DisposedStock, 'findOneAndUpdate', async (filter) => (filter.status === 'pending' ? { ...pendingDoc, status: 'approved' } : null));
  stub(t, DisposedStock, 'findByIdAndUpdate', () => ({ catch: async () => null }));
  stub(t, StockItem, 'findOneAndUpdate', async (filter, update) => {
    if (update.$inc?.quantity < 0) throw new Error('db down');
    incs.push(update);
    return null;
  });
  const res = mockRes();
  await approveDisposal(req(), res);
  assert.equal(res.statusCode, 500);
  assert.equal(incs.length, 0, 'stock must not be incremented when nothing was deducted');
});

test('approve: failure AFTER the deduction restores exactly the deducted quantity and releases the claim', async (t) => {
  stubAudit(t);
  const stockCalls = [];
  let released = false;
  stub(t, DisposedStock, 'findById', async () => pendingDoc);
  stub(t, DisposedStock, 'findOneAndUpdate', async () => ({ ...pendingDoc, status: 'approved' }));
  stub(t, DisposedStock, 'findByIdAndUpdate', () => { released = true; return { catch: async () => null }; });
  stub(t, StockItem, 'findOneAndUpdate', async (filter, update) => {
    stockCalls.push(update.$inc.quantity);
    return { _id: ID, quantity: 10, unit: 'kg', name: 'Rice' };
  });
  stub(t, StockTransaction, 'create', async () => { throw new Error('write failed'); });
  const res = mockRes();
  await approveDisposal(req(), res);
  assert.equal(res.statusCode, 500);
  assert.deepEqual(stockCalls, [-5, 5]);
  assert.equal(released, true);
});

test('approve: a second approver loses the atomic claim and no stock is touched', async (t) => {
  let touched = false;
  stub(t, DisposedStock, 'findById', async () => pendingDoc);
  stub(t, DisposedStock, 'findOneAndUpdate', async () => null); // someone else already claimed it
  stub(t, StockItem, 'findOneAndUpdate', async () => { touched = true; return null; });
  const res = mockRes();
  await approveDisposal(req(), res);
  assert.equal(res.statusCode, 409);
  assert.equal(touched, false);
});

test('approve: insufficient stock returns 409 and releases the claim', async (t) => {
  let released = false;
  stub(t, DisposedStock, 'findById', async () => pendingDoc);
  stub(t, DisposedStock, 'findOneAndUpdate', async () => ({ ...pendingDoc, status: 'approved' }));
  stub(t, DisposedStock, 'findByIdAndUpdate', () => { released = true; return { catch: async () => null }; });
  stub(t, StockItem, 'findOneAndUpdate', async () => null);
  const res = mockRes();
  await approveDisposal(req(), res);
  assert.equal(res.statusCode, 409);
  assert.equal(released, true);
});

test('reject: only a still-pending request can be rejected', async (t) => {
  stub(t, DisposedStock, 'findById', async () => pendingDoc);
  stub(t, DisposedStock, 'findOneAndUpdate', async () => null);
  const res = mockRes();
  await rejectDisposal(req({ body: { rejectionReason: 'no' } }), res);
  assert.equal(res.statusCode, 409);
});

test('requestDisposal refuses more than the available stock', async (t) => {
  stub(t, StockItem, 'findById', async () => ({ _id: ID, active: true, quantity: 3, unit: 'kg', name: 'Rice' }));
  const res = mockRes();
  await requestDisposal(req({ body: { itemId: ID, quantity: 4, reason: 'Expired' } }), res);
  assert.equal(res.statusCode, 409);
});

test('transfer must start from the location the item is really in', async (t) => {
  stub(t, StockItem, 'findOne', async () => ({ _id: ID, quantity: 5, location: 'Main Store' }));
  const res = mockRes();
  await transfer(req({ body: { itemId: ID, quantity: 5, fromLocation: 'Kitchen', toLocation: 'Workshop' } }), res);
  assert.equal(res.statusCode, 409);
});

test('directly-disposed / damaged-disposed records are valid with a free-text approver and are never left pending', async () => {
  const doc = new DisposedStock({ itemId: ID, quantityRemoved: 2, remainingQuantity: 1, reason: 'Expired', approvedByName: 'Jane Doe', status: 'approved', responsibleUser: USER });
  await doc.validate();
  assert.equal(doc.status, 'approved');
  // The old code path put the free-text name into the ObjectId field; that must still be a cast error.
  await assert.rejects(() => new DisposedStock({ itemId: ID, quantityRemoved: 2, remainingQuantity: 1, reason: 'Expired', approvedBy: 'Jane Doe' }).validate(), (e) => Boolean(e.errors.approvedBy));
  await new DamagedStock({ itemId: ID, quantity: 1, reason: 'Broken', reportedBy: USER }).validate();
});
