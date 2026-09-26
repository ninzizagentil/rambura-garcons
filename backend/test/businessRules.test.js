import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import Book from '../src/models/Book.js';
import StockItem from '../src/models/StockItem.js';
import Loan from '../src/models/Loan.js';

async function rejectsValidation(document, path) {
  await assert.rejects(() => document.validate(), (error) => Boolean(error.errors[path]));
}

const workspaceRoot = path.resolve(import.meta.dirname, '../..');

test('books reject negative copy counts', async () => {
  await rejectsValidation(new Book({ title: 'Test', category: 'Reference', bookCode: 'T-1', totalCopies: -1 }), 'totalCopies');
});

test('stock rejects negative quantities and minimum levels', async () => {
  await rejectsValidation(new StockItem({ code: 'T-1', name: 'Test', category: 'Foods', unit: 'kg', quantity: -1 }), 'quantity');
  await rejectsValidation(new StockItem({ code: 'T-2', name: 'Test', category: 'Foods', unit: 'kg', minLevel: -1 }), 'minLevel');
});

test('loans reject due dates before borrow dates', async () => {
  await rejectsValidation(new Loan({ bookId: '000000000000000000000001', borrower: 'Student', borrowDate: '2026-08-25', dueDate: '2026-08-24' }), 'dueDate');
});

test('library delete permissions are removed in favor of archive requests', () => {
  const files = [
    path.join(workspaceRoot, 'backend/src/services/alertService.js'),
    path.join(workspaceRoot, 'src/context/NotificationContext.jsx'),
  ];

  for (const file of files) {
    const contents = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(contents, /library\.books\.delete/);
    assert.match(contents, /library\.books\.archive\.request|library\.books\.archive\.approve/);
  }
});
