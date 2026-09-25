import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeEquipmentItem } from './equipmentService.js';

test('normalizeEquipmentItem converts Mongo-like ids to stable string keys', () => {
  const item = { _id: { toString: () => '64f1a3b0e2a5c0f0d1234567' }, assetNumber: 'LAP-001', name: 'Laptop' };
  const normalized = normalizeEquipmentItem(item);

  assert.equal(normalized.id, '64f1a3b0e2a5c0f0d1234567');
  assert.equal(normalized.assetNumber, 'LAP-001');
  assert.equal(normalized.name, 'Laptop');
});

test('normalizeEquipmentItem falls back to asset number when no id exists', () => {
  const item = { assetNumber: 'DES-001', name: 'Desktop' };
  const normalized = normalizeEquipmentItem(item);

  assert.equal(normalized.id, 'DES-001');
});
