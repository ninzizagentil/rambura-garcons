/**
 * alertService.js
 *
 * Operational alerts scanned on demand (POST /notifications/scan).
 * These are the routine alerts for day-to-day operations:
 *   - Overdue library books    → librarian (+ management for high count)
 *   - Low stock items          → stock_manager (+ management for high count)
 *   - New admissions           → management + admin
 *
 * Uses dedupeKey with a daily window so repeated scans do not create
 * duplicate notifications.  Email is sent alongside the in-app alert
 * for the same recipients using the existing emailService.
 */

import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { sendSystemAlertEmail } from './emailService.js';
import Loan from '../models/Loan.js';
import StockItem from '../models/StockItem.js';
import Admission from '../models/Admission.js';

const DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000;
const MODULE_PERMISSION_MAP = {
  Library: ['library.view', 'library.books.create', 'library.books.update', 'library.books.archive.request', 'library.books.archive.approve', 'library.borrow', 'library.return', 'library.reports'],
  Stock: ['stock.view', 'stock.create', 'stock.update', 'stock.in', 'stock.out', 'stock.adjust', 'stock.transfer', 'stock.damage', 'stock.dispose.request', 'stock.dispose.approve', 'stock.archive.request', 'stock.archive.approve', 'stock.suppliers', 'stock.reports'],
  Admissions: ['applications.view', 'applications.update'],
  Website: ['website.view', 'website.create', 'website.update', 'website.delete'],
  Settings: ['settings.view', 'settings.update'],
  Audit: ['audit.view'],
  Users: ['users.view', 'users.create', 'users.update', 'users.delete'],
};

export function isUserEligibleForAlert(user, { roles = [], module } = {}) {
  if (!user || user.status !== 'active') return false;

  const permissionHints = MODULE_PERMISSION_MAP[module] || [];
  const roleMatch = roles.includes(user.role);
  const hasModulePermission = (user.permissions || []).some((permission) => permissionHints.includes(permission));

  return roleMatch || hasModulePermission;
}

export async function dispatchAlert({ roles, title, message, type = 'warning', module, link, dedupeKey }) {
  const users = await User.find({ status: 'active' }).select('fullName email role permissions');
  const recipients = users.filter((user) => isUserEligibleForAlert(user, { roles, module }));
  const since = new Date(Date.now() - DEDUPE_WINDOW_MS);

  await Promise.all(recipients.map(async (user) => {
    const exists = dedupeKey && await Notification.exists({ userId: user._id, dedupeKey, createdAt: { $gte: since } });
    if (exists) return;
    await Notification.create({ userId: user._id, title, message, type, module, link, dedupeKey });
    await sendSystemAlertEmail(user.email, user.fullName, title, message, link);
  }));
}

export async function scanOperationalAlerts() {
  const today = new Date().toISOString().slice(0, 10);

  const [overdueLoans, lowStockItems, newApplications] = await Promise.all([
    Loan.find({ status: { $ne: 'returned' }, dueDate: { $lt: new Date() } })
      .populate('bookId', 'title')
      .limit(100),
    StockItem.find({ active: true, quantity: { $gt: 0 } })
      .where({ $expr: { $lte: ['$quantity', '$minLevel'] } })
      .limit(100),
    Admission.find({ status: 'new' }).limit(100),
  ]);

  // Overdue books → librarian always; management only when 3+ overdue.
  if (overdueLoans.length) {
    const overdueRoles = overdueLoans.length >= 3
      ? ['librarian', 'management']
      : ['librarian'];
    await dispatchAlert({
      roles: overdueRoles,
      title: 'Overdue books need attention',
      message: `${overdueLoans.length} active loan(s) are past their due date.`,
      type: 'warning',
      module: 'Library',
      link: '/library/overdue',
      dedupeKey: `overdue-${today}`,
    });
  }

  // Low stock → stock_manager always; management only when 5+ items low.
  if (lowStockItems.length) {
    const lowStockRoles = lowStockItems.length >= 5
      ? ['stock_manager', 'management']
      : ['stock_manager'];
    await dispatchAlert({
      roles: lowStockRoles,
      title: 'Low stock alert',
      message: `${lowStockItems.length} stock item(s) are at or below their minimum level.`,
      type: 'warning',
      module: 'Stock',
      link: '/stock/alerts',
      dedupeKey: `low-stock-${today}`,
    });
  }

  // New admissions → management + admin.
  if (newApplications.length) {
    await dispatchAlert({
      roles: ['admin', 'management'],
      title: 'New applications received',
      message: `${newApplications.length} application(s) are waiting for review.`,
      type: 'info',
      module: 'Admissions',
      link: '/management/applications',
      dedupeKey: `applications-${today}`,
    });
  }

  return {
    overdue: overdueLoans.length,
    lowStock: lowStockItems.length,
    applications: newApplications.length,
  };
}
