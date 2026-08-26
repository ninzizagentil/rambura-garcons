import mongoose from 'mongoose';
import Book from '../models/Book.js';
import Loan from '../models/Loan.js';
import { fail, list, ok } from '../utils/api.js';
import { recordAudit } from '../services/auditService.js';

function queryFilter(query) {
  const filter = { active: true };
  const safeRegex = (value) => new RegExp(String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  if (query.category) filter.category = query.category;
  if (query.search) filter.$or = [{ title: safeRegex(query.search) }, { author: safeRegex(query.search) }, { bookCode: safeRegex(query.search) }];
  return filter;
}

export async function getBooks(req, res) {
  const page = Math.max(1, Number(req.query.page || 1)); const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20))); const filter = queryFilter(req.query);
  const [data, total] = await Promise.all([Book.find(filter).sort(req.query.sort || '-createdAt').skip((page - 1) * limit).limit(limit), Book.countDocuments(filter)]);
  return list(res, data, { page, limit, total, totalPages: Math.ceil(total / limit) });
}
export async function getBook(req, res) { const book = await Book.findById(req.params.id); return book ? ok(res, book) : fail(res, 'Book not found', 404); }
export async function createBook(req, res) { const book = await Book.create({ ...req.body, totalCopies: Number(req.body.totalCopies), borrowedCopies: 0 }); await recordAudit(req, { action: 'Book created', module: 'Library', resourceType: 'Book', resourceId: book._id, description: `Created book ${book.title}` }); return ok(res, book, 'Book created', 201); }
export async function updateBook(req, res) { const allowed = ['title', 'author', 'category', 'bookCode', 'description', 'coverImage', 'totalCopies', 'active']; const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key))); const book = await Book.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }); return book ? ok(res, book, 'Book updated') : fail(res, 'Book not found', 404); }
export async function deleteBook(req, res) { const book = await Book.findByIdAndUpdate(req.params.id, { active: false }, { new: true }); return book ? ok(res, book, 'Book archived') : fail(res, 'Book not found', 404); }

export async function borrowBook(req, res) {
  const session = await mongoose.startSession();
  try {
    let loan;
    await session.withTransaction(async () => {
      const book = await Book.findOneAndUpdate({ _id: req.body.bookId, active: true, $expr: { $gt: ['$totalCopies', '$borrowedCopies'] } }, { $inc: { borrowedCopies: 1 } }, { new: true, session });
      if (!book) { const error = new Error('Book not found or no copies are available'); error.statusCode = 409; throw error; }
      loan = await Loan.create([{ ...req.body, issuedBy: req.user._id, status: 'borrowed' }], { session });
      await recordAudit(req, { action: 'Book borrowed', module: 'Library', resourceType: 'Loan', resourceId: loan[0]._id, description: `Borrowed ${book.title}` });
      loan = loan[0];
    });
    return ok(res, loan, 'Book borrowed', 201);
  } finally { await session.endSession(); }
}

export async function getLoans(req, res) {
  const page = Math.max(1, Number(req.query.page || 1)); const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20))); const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const data = await Loan.find(filter).populate('bookId', 'title bookCode').sort('-createdAt').skip((page - 1) * limit).limit(limit); const total = await Loan.countDocuments(filter);
  return list(res, data.map((loan) => { const value = loan.toObject(); if (value.status !== 'returned' && value.dueDate < new Date()) value.status = 'overdue'; return value; }), { page, limit, total, totalPages: Math.ceil(total / limit) });
}
export async function returnBook(req, res) {
  const session = await mongoose.startSession();
  try {
    let loan;
    await session.withTransaction(async () => {
      loan = await Loan.findOneAndUpdate({ _id: req.params.id, returnDate: null, status: { $ne: 'returned' } }, { returnDate: new Date(), status: 'returned', returnedBy: req.user._id }, { new: true, session });
      if (!loan) { const error = new Error('Loan not found or already returned'); error.statusCode = 409; throw error; }
      await Book.findOneAndUpdate({ _id: loan.bookId, borrowedCopies: { $gt: 0 } }, { $inc: { borrowedCopies: -1 } }, { session });
      await recordAudit(req, { action: 'Book returned', module: 'Library', resourceType: 'Loan', resourceId: loan._id, description: 'Book returned to library' });
    });
    return ok(res, loan, 'Book returned');
  } finally { await session.endSession(); }
}
export async function overdueLoans(req, res) { const data = await Loan.find({ returnDate: null, dueDate: { $lt: new Date() } }).populate('bookId', 'title bookCode').sort('dueDate'); return ok(res, data); }
