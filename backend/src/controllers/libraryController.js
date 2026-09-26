import Book from '../models/Book.js';
import Loan from '../models/Loan.js';
import { fail, list, ok } from '../utils/api.js';
import { recordAudit } from '../services/auditService.js';

function queryFilter(query) {
  const filter = { active: query.archived === 'true' ? false : true };
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
// coverImage is stored as { imageUrl, publicId }; guard against a plain
// string (or blank value) slipping through and silently wiping the cover.
function normalizeCover(payload) {
  if (!('coverImage' in payload)) return payload;
  const value = payload.coverImage;
  if (!value || (typeof value === 'string' && !value.trim())) delete payload.coverImage;
  else if (typeof value === 'string') payload.coverImage = { imageUrl: value };
  return payload;
}
export async function createBook(req, res) { const book = await Book.create({ ...normalizeCover({ ...req.body }), totalCopies: Number(req.body.totalCopies), borrowedCopies: 0 }); await recordAudit(req, { action: 'Book created', module: 'Library', resourceType: 'Book', resourceId: book._id, description: `Created book ${book.title}` }); return ok(res, book, 'Book created', 201); }
export async function updateBook(req, res) { const allowed = ['title', 'author', 'category', 'bookCode', 'description', 'coverImage', 'totalCopies']; const updates = normalizeCover(Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)))); const current = await Book.findById(req.params.id); if (!current) return fail(res, 'Book not found', 404); if (updates.totalCopies !== undefined && (!Number.isFinite(Number(updates.totalCopies)) || Number(updates.totalCopies) < current.borrowedCopies)) return fail(res, `Total copies cannot be less than borrowed copies (${current.borrowedCopies})`, 422); const book = await Book.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }); await recordAudit(req, { action: 'Book updated', module: 'Library', resourceType: 'Book', resourceId: book._id, description: `Updated book ${book.title}` }); return ok(res, book, 'Book updated'); }
// This deployment does not support multi-document transactions (it rejects
// retryable writes, which transaction commits require regardless of the
// retryWrites URI flag). Borrow/return are done as atomic single-document
// updates instead, with a compensating rollback if the second step fails.
export async function borrowBook(req, res) {
  const borrowDate = new Date(req.body.borrowDate);
  const dueDate = new Date(req.body.dueDate);
  if (!req.body.borrower?.trim() || Number.isNaN(borrowDate.getTime()) || Number.isNaN(dueDate.getTime())) return fail(res, 'Borrower and valid borrow/due dates are required', 422);
  if (req.body.borrowerType === 'Student') {
    const sdmsCode = String(req.body.sdmsCode || '').trim().toUpperCase();
    if (!sdmsCode) return fail(res, 'Student SDMS Code is required', 422);
    req.body.sdmsCode = sdmsCode;
    const existingLoan = await Loan.exists({ bookId: req.body.bookId, borrowerType: 'Student', sdmsCode, returnDate: null });
    if (existingLoan) return fail(res, 'This student already has this book. Return it before borrowing it again.', 409);
  }
  if (borrowDate > new Date()) return fail(res, 'Borrow date cannot be in the future', 422);
  if (dueDate < borrowDate) return fail(res, 'Due date cannot be before borrow date', 422);
  const book = await Book.findOneAndUpdate(
    { _id: req.body.bookId, active: true, archivePending: { $ne: true }, $expr: { $gt: ['$totalCopies', '$borrowedCopies'] } },
    { $inc: { borrowedCopies: 1 } },
    { new: true },
  );
  if (!book) return fail(res, 'Book not found or no copies are available', 409);

  try {
    const loan = await Loan.create({ ...req.body, issuedBy: req.user._id, status: 'borrowed' });
    await recordAudit(req, { action: 'Book borrowed', module: 'Library', resourceType: 'Loan', resourceId: loan._id, description: `Borrowed ${book.title}` });
    return ok(res, loan, 'Book borrowed', 201);
  } catch (err) {
    // Compensate: the copy was reserved above but the loan record failed, so give it back.
    await Book.findOneAndUpdate({ _id: book._id }, { $inc: { borrowedCopies: -1 } });
    if (err.code === 11000 && err.keyPattern?.sdmsCode) {
      return fail(res, 'This student already has this book. Return it before borrowing it again.', 409);
    }
    throw err;
  }
}

export async function getLoans(req, res) {
  const page = Math.max(1, Number(req.query.page || 1)); const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20))); const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const data = await Loan.find(filter).populate('bookId', 'title bookCode').sort('-createdAt').skip((page - 1) * limit).limit(limit); const total = await Loan.countDocuments(filter);
  return list(res, data.map((loan) => { const value = loan.toObject(); if (value.status !== 'returned' && value.dueDate < new Date()) value.status = 'overdue'; return value; }), { page, limit, total, totalPages: Math.ceil(total / limit) });
}
export async function returnBook(req, res) {
  const loan = await Loan.findOneAndUpdate(
    { _id: req.params.id, returnDate: null, status: { $ne: 'returned' } },
    { returnDate: new Date(), status: 'returned', returnedBy: req.user._id },
    { new: true },
  );
  if (!loan) return fail(res, 'Loan not found or already returned', 409);

  try {
    const book = await Book.findOneAndUpdate({ _id: loan.bookId, borrowedCopies: { $gt: 0 } }, { $inc: { borrowedCopies: -1 } }, { new: true });
    if (!book) throw Object.assign(new Error('Book copy count could not be updated'), { statusCode: 409 });
    await recordAudit(req, { action: 'Book returned', module: 'Library', resourceType: 'Loan', resourceId: loan._id, description: 'Book returned to library' });
    return ok(res, loan, 'Book returned');
  } catch (err) {
    // Compensate: the loan was marked returned above but the copy count update failed, so revert it.
    await Loan.findOneAndUpdate({ _id: loan._id }, { returnDate: null, status: 'borrowed', $unset: { returnedBy: '' } });
    throw err;
  }
}
export async function overdueLoans(req, res) { const data = await Loan.find({ returnDate: null, dueDate: { $lt: new Date() } }).populate('bookId', 'title bookCode').sort('dueDate'); return ok(res, data); }
