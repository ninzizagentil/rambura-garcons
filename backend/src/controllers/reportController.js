import Book from '../models/Book.js';
import Loan from '../models/Loan.js';
import StockItem from '../models/StockItem.js';
import StockTransaction from '../models/StockTransaction.js';
import DamagedStock from '../models/DamagedStock.js';
import DisposedStock from '../models/DisposedStock.js';
import PDFDocument from 'pdfkit';
import { ok } from '../utils/api.js';

function csv(rows) {
  if (!rows.length) return '';
  const keys = Object.keys(rows[0]);
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  return [keys.join(','), ...rows.map((row) => keys.map((key) => escape(row[key])).join(','))].join('\n');
}
function sendReport(req, res, data, filename) {
  if (req.query.format === 'pdf') {
    const document = new PDFDocument({ margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
    document.pipe(res);
    document.fontSize(16).text(`Rambura Garcons - ${filename}`, { underline: true });
    document.moveDown();
    const rows = Array.isArray(data) ? data : [data];
    rows.forEach((row) => document.fontSize(9).text(Object.entries(row).map(([key, value]) => `${key}: ${value ?? ''}`).join(' | ')));
    return document.end();
  }
  if (req.query.format === 'csv') {
    const rows = Array.isArray(data) ? data : [data];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
    return res.send(csv(rows));
  }
  return ok(res, data);
}

export async function librarySummary(req, res) {
  const [books, overdueLoans, returnedLoans, mostBorrowed] = await Promise.all([
    Book.aggregate([{ $match: { active: true } }, { $group: { _id: null, totalBooks: { $sum: 1 }, totalCopies: { $sum: '$totalCopies' }, borrowedCopies: { $sum: '$borrowedCopies' } } }]),
    Loan.countDocuments({ returnDate: null, dueDate: { $lt: new Date() } }), Loan.countDocuments({ status: 'returned' }),
    Loan.aggregate([{ $group: { _id: '$bookId', borrowCount: { $sum: 1 } } }, { $sort: { borrowCount: -1 } }, { $limit: 10 }, { $lookup: { from: 'books', localField: '_id', foreignField: '_id', as: 'book' } }, { $unwind: '$book' }, { $project: { _id: 0, title: '$book.title', bookCode: '$book.bookCode', borrowCount: 1 } }]),
  ]);
  const summary = books[0] || { totalBooks: 0, totalCopies: 0, borrowedCopies: 0 };
  return sendReport(req, res, { ...summary, availableCopies: summary.totalCopies - summary.borrowedCopies, overdueLoans, returnedLoans, mostBorrowedBooks: mostBorrowed }, 'library-summary');
}
export async function overdue(req, res) { return sendReport(req, res, await Loan.find({ returnDate: null, dueDate: { $lt: new Date() } }).populate('bookId', 'title bookCode'), 'library-overdue'); }
export async function circulation(req, res) { return librarySummary(req, res); }
export async function inventory(req, res) { return sendReport(req, res, await StockItem.find({ active: true }).sort('name'), 'stock-inventory'); }
export async function movement(req, res) { return sendReport(req, res, await StockTransaction.find().populate('itemId', 'name category unit').sort('-date'), 'stock-movement'); }
export async function lowStock(req, res) { return sendReport(req, res, await StockItem.find({ active: true, $expr: { $lte: ['$quantity', '$minLevel'] } }).sort('quantity'), 'stock-low-stock'); }
export async function outOfStock(req, res) { return sendReport(req, res, await StockItem.find({ active: true, quantity: { $lte: 0 } }), 'stock-out-of-stock'); }
export async function expired(req, res) { return sendReport(req, res, await StockItem.find({ active: true, expiryDate: { $lt: new Date() } }).sort('expiryDate'), 'stock-expired'); }
export async function damaged(req, res) { return sendReport(req, res, await DamagedStock.find().populate('itemId', 'name unit').sort('-createdAt'), 'stock-damaged'); }
export async function disposed(req, res) { return sendReport(req, res, await DisposedStock.find().populate('itemId', 'name unit').sort('-createdAt'), 'stock-disposed'); }

export async function stockAnalytics(req, res) {
  const days = Math.min(365, Math.max(7, Number(req.query.days || 30)));
  const since = new Date(Date.now() - days * 86400000);
  const [usage, category, movement] = await Promise.all([
    StockTransaction.aggregate([{ $match: { type: 'out', date: { $gte: since } } }, { $group: { _id: '$itemId', used: { $sum: '$quantity' } } }, { $sort: { used: -1 } }, { $limit: 20 }, { $lookup: { from: 'stockitems', localField: '_id', foreignField: '_id', as: 'item' } }, { $unwind: '$item' }, { $project: { _id: 0, name: '$item.name', category: '$item.category', unit: '$item.unit', used: 1 } }]),
    StockItem.aggregate([{ $match: { active: true } }, { $group: { _id: '$category', value: { $sum: { $multiply: ['$quantity', '$unitPrice'] } }, count: { $sum: 1 } } }, { $project: { _id: 0, category: '$_id', value: 1, count: 1 } }]),
    StockTransaction.aggregate([{ $match: { date: { $gte: since } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, received: { $sum: { $cond: [{ $eq: ['$type', 'in'] }, '$quantity', 0] } }, issued: { $sum: { $cond: [{ $eq: ['$type', 'out'] }, '$quantity', 0] } } } }, { $sort: { _id: 1 } }]),
  ]);
  return ok(res, { days, mostUsedItems: usage, leastUsedItems: [...usage].sort((a, b) => a.used - b.used), valueByCategory: category, monthlyMovement: movement });
}
