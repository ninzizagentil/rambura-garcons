import test from 'node:test';
import assert from 'node:assert/strict';
import { sortActivityEntries, matchesActivityDateRange } from './activitySort.js';

test('sortActivityEntries orders audit rows by newest date first', () => {
  const entries = [
    { id: 1, action: 'Old row', date: '2024-01-01T08:00:00Z' },
    { id: 2, action: 'Newest row', date: '2024-02-02T12:00:00Z' },
    { id: 3, action: 'Middle row', date: '2024-01-15T10:30:00Z' },
  ];

  assert.deepEqual(sortActivityEntries(entries, 'date', 'desc').map((entry) => entry.id), [2, 3, 1]);
  assert.deepEqual(sortActivityEntries(entries, 'date', 'asc').map((entry) => entry.id), [1, 3, 2]);
});

test('matchesActivityDateRange filters entries within an inclusive date range', () => {
  const entry = { id: 1, date: '2024-02-15T12:00:00Z' };

  assert.equal(matchesActivityDateRange(entry, '2024-02-10', '2024-02-20'), true);
  assert.equal(matchesActivityDateRange(entry, '2024-02-16', '2024-02-20'), false);
  assert.equal(matchesActivityDateRange(entry, '', '2024-02-15'), true);
  assert.equal(matchesActivityDateRange(entry, '2024-02-15', ''), true);
});
