import { getBooks, getLoans, daysOverdue } from './bookService';
import { getItems, getTransactions, getLowStockItems, getUsageByItem } from './stockService';

export function getCirculationSummary() {
  const books = getBooks();
  const totalCopies = books.reduce((s, b) => s + b.copies, 0);
  const borrowedCopies = books.reduce((s, b) => s + b.borrowedCopies, 0);
  const availableCopies = totalCopies - borrowedCopies;
  return { totalBooks: books.length, totalCopies, borrowedCopies, availableCopies };
}

export function getOverdueSummary() {
  const loans = getLoans();
  return loans.filter((l) => l.status !== 'returned' && daysOverdue(l.dueDate) > 0);
}

export function getMostBorrowedBooks(limit = 5) {
  return [...getBooks()].sort((a, b) => b.borrowedCopies - a.borrowedCopies).slice(0, limit);
}

export function getStockBalanceSummary() {
  const items = getItems();
  const transactions = getTransactions();
  return {
    totalItems: items.length,
    received: transactions.filter((t) => t.type === 'in').reduce((s, t) => s + t.quantity, 0),
    issued: transactions.filter((t) => t.type === 'out').reduce((s, t) => s + t.quantity, 0),
    lowStockCount: getLowStockItems().length,
  };
}

export function getStockUsageSummary(limit = 5) {
  const usage = getUsageByItem();
  return {
    mostUsed: usage.slice(0, limit),
    leastUsed: [...usage].sort((a, b) => a.used - b.used).slice(0, limit),
  };
}

/**
 * Demo export — in a real backend this would trigger a file download or
 * server-generated report (CSV/PDF). For now it just resolves so the UI can
 * show a success toast; swap the body for a real fetch() once an API exists.
 */
export function exportReport(reportName) {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ success: true, reportName }), 400);
  });
}
