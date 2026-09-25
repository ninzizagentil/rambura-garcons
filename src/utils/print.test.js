import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLibraryActivityPrintRows, buildAdminSummaryPrintRows } from './print.js';

test('buildLibraryActivityPrintRows converts library activity into printable rows', () => {
  const rows = buildLibraryActivityPrintRows([
    { month: '2026-01', loans: 12 },
    { month: '2026-02', loans: 0 },
    { month: '2026-03', loans: 18 },
  ]);

  assert.deepEqual(rows, [
    { month: 'Jan 2026', activity: 12 },
    { month: 'Feb 2026', activity: 0 },
    { month: 'Mar 2026', activity: 18 },
  ]);
});

test('buildAdminSummaryPrintRows includes all KPI values for a printable summary', () => {
  const rows = buildAdminSummaryPrintRows(
    {
      totalBooks: 250,
      borrowedCopies: 42,
      overdueLoans: 6,
    },
    83,
    {
      totalEquipment: 92,
      underMaintenance: 7,
    }
  );

  assert.deepEqual(rows, [
    { metric: 'Total Books', value: 250 },
    { metric: 'Borrowed Active Loans', value: 42 },
    { metric: 'Overdue Loans', value: 6 },
    { metric: 'Transactions', value: 83 },
    { metric: 'Equipment Registered', value: 92 },
    { metric: 'Under Maintenance', value: 7 },
  ]);
});
