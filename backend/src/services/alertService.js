import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { sendSystemAlertEmail } from './emailService.js';
import Loan from '../models/Loan.js';
import StockItem from '../models/StockItem.js';
import Admission from '../models/Admission.js';

export async function dispatchAlert({ roles, title, message, type = 'warning', module, link, dedupeKey }) {
  const users = await User.find({ role: { $in: roles }, status: 'active' }).select('fullName email');
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await Promise.all(users.map(async (user) => {
    const exists = dedupeKey && await Notification.exists({ userId: user._id, dedupeKey, createdAt: { $gte: since } });
    if (exists) return;
    await Notification.create({ userId: user._id, title, message, type, module, link, dedupeKey });
    await sendSystemAlertEmail(user.email, user.fullName, title, message, link);
  }));
}

export async function scanOperationalAlerts() {
  const [overdueLoans, lowStockItems, newApplications] = await Promise.all([
    Loan.find({ status: { $ne: 'returned' }, dueDate: { $lt: new Date() } }).populate('bookId', 'title').limit(100),
    StockItem.find({ active: true, quantity: { $gt: 0 } }).where({ $expr: { $lte: ['$quantity', '$minLevel'] } }).limit(100),
    Admission.find({ status: 'new' }).limit(100),
  ]);

  if (overdueLoans.length) await dispatchAlert({ roles: ['admin', 'librarian', 'management'], title: 'Overdue books need attention', message: `${overdueLoans.length} active loan(s) are past their due date.`, type: 'warning', module: 'Library', link: '/library/overdue', dedupeKey: `overdue-${new Date().toISOString().slice(0, 10)}` });
  if (lowStockItems.length) await dispatchAlert({ roles: ['admin', 'stock_manager', 'management'], title: 'Low stock alert', message: `${lowStockItems.length} stock item(s) are at or below their minimum level.`, type: 'warning', module: 'Stock', link: '/stock/low-stock', dedupeKey: `low-stock-${new Date().toISOString().slice(0, 10)}` });
  if (newApplications.length) await dispatchAlert({ roles: ['admin', 'management'], title: 'New applications received', message: `${newApplications.length} application(s) are waiting for review.`, type: 'info', module: 'Admissions', link: '/management/applications', dedupeKey: `applications-${new Date().toISOString().slice(0, 10)}` });
  return { overdue: overdueLoans.length, lowStock: lowStockItems.length, applications: newApplications.length };
}
