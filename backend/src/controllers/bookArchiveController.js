import mongoose from 'mongoose';
import Book from '../models/Book.js';
import Loan from '../models/Loan.js';
import BookArchiveRequest from '../models/BookArchiveRequest.js';
import Notification from '../models/Notification.js';
import { fail, list, ok } from '../utils/api.js';
import { recordAudit } from '../services/auditService.js';

const validId = (id) => mongoose.isValidObjectId(id);

function pagination(req) {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 10)));
  return { page, limit, skip: (page - 1) * limit };
}

export async function createBookArchiveRequest(req, res) {
  const { bookId } = req.body;
  if (!validId(bookId)) return fail(res, 'Book not found', 404);

  const book = await Book.findOne({ _id: bookId, active: true });
  if (!book) return fail(res, 'Book not found', 404);
  if (book.archivePending) return fail(res, 'An archive request is already pending for this book', 409);

  const activeLoan = await Loan.exists({ bookId, returnDate: null, status: { $ne: 'returned' } });
  if (activeLoan || book.borrowedCopies > 0) {
    return fail(res, 'This book cannot be archived while it is borrowed', 409);
  }

  const lockedBook = await Book.findOneAndUpdate(
    { _id: bookId, active: true, archivePending: { $ne: true }, borrowedCopies: 0 },
    { $set: { archivePending: true } },
    { new: true },
  );
  if (!lockedBook) return fail(res, 'Book is already pending archive or has a borrowed copy', 409);

  try {
    const request = await BookArchiveRequest.create({
      bookId: lockedBook._id,
      bookTitle: lockedBook.title,
      bookCode: lockedBook.bookCode,
      requestedBy: req.user._id,
    });
    await recordAudit(req, {
      action: 'Book archive requested',
      module: 'Library',
      resourceType: 'BookArchiveRequest',
      resourceId: request._id,
      description: `Requested archive for ${lockedBook.bookCode} - ${lockedBook.title}`,
    });
    return ok(res, request, 'Book archive request submitted', 201);
  } catch (error) {
    await Book.updateOne({ _id: lockedBook._id, archivePending: true }, { $set: { archivePending: false } });
    throw error;
  }
}

export async function getBookArchiveRequests(req, res) {
  const { page, limit, skip } = pagination(req);
  const filter = { status: req.query.status || 'pending' };
  const [requests, total] = await Promise.all([
    BookArchiveRequest.find(filter)
      .populate('requestedBy', 'fullName')
      .populate('reviewedBy', 'fullName')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    BookArchiveRequest.countDocuments(filter),
  ]);
  return list(res, requests, { page, limit, total, totalPages: Math.ceil(total / limit) });
}

export async function approveBookArchiveRequest(req, res) {
  if (!validId(req.params.id)) return fail(res, 'Book archive request not found', 404);
  const approvalNotes = String(req.body.approvalNotes || '').trim().slice(0, 1000);
  const request = await BookArchiveRequest.findOneAndUpdate(
    { _id: req.params.id, status: 'pending' },
    { $set: { status: 'approved', reviewedBy: req.user._id, reviewedAt: new Date(), ...(approvalNotes ? { approvalNotes } : {}) } },
    { new: true },
  );
  if (!request) return fail(res, 'Book archive request is no longer pending', 409);

  const activeLoan = await Loan.exists({ bookId: request.bookId, returnDate: null, status: { $ne: 'returned' } });
  if (activeLoan) {
    await BookArchiveRequest.updateOne(
      { _id: request._id, status: 'approved' },
      { $set: { status: 'pending' }, $unset: { reviewedBy: 1, reviewedAt: 1, approvalNotes: 1 } },
    );
    return fail(res, 'Book cannot be archived while it is borrowed', 409);
  }

  const book = await Book.findOneAndUpdate(
    { _id: request.bookId, active: true, archivePending: true, borrowedCopies: 0 },
    { $set: { active: false, archivePending: false } },
    { new: true },
  );
  if (!book) {
    await BookArchiveRequest.updateOne(
      { _id: request._id, status: 'approved' },
      { $set: { status: 'pending' }, $unset: { reviewedBy: 1, reviewedAt: 1, approvalNotes: 1 } },
    );
    return fail(res, 'Book is no longer active or has a borrowed copy', 409);
  }

  await recordAudit(req, {
    action: 'Book archive approved',
    module: 'Library',
    resourceType: 'BookArchiveRequest',
    resourceId: request._id,
    description: `Approved archive for ${book.bookCode} - ${book.title}`,
  });
  await Notification.create({
    userId: request.requestedBy,
    title: 'Book archive request approved',
    message: `The archive request for ${book.title} was approved by the Director.`,
    type: 'success',
    module: 'Library',
    link: '/library/books?archived=true',
  }).catch((error) => console.warn('[notification] book archive approval notification failed:', error.message));
  return ok(res, request, 'Book archive request approved');
}

export async function rejectBookArchiveRequest(req, res) {
  if (!validId(req.params.id)) return fail(res, 'Book archive request not found', 404);
  const rejectionReason = String(req.body.rejectionReason || '').trim().slice(0, 500);
  if (!rejectionReason) return fail(res, 'Rejection reason is required', 422);

  const request = await BookArchiveRequest.findOneAndUpdate(
    { _id: req.params.id, status: 'pending' },
    { $set: { status: 'rejected', reviewedBy: req.user._id, reviewedAt: new Date(), rejectionReason } },
    { new: true },
  );
  if (!request) return fail(res, 'Book archive request is no longer pending', 409);

  await Book.updateOne({ _id: request.bookId, active: true, archivePending: true }, { $set: { archivePending: false } });
  await recordAudit(req, {
    action: 'Book archive rejected',
    module: 'Library',
    resourceType: 'BookArchiveRequest',
    resourceId: request._id,
    description: `Rejected book archive request: ${rejectionReason}`,
    status: 'warning',
  });
  await Notification.create({
    userId: request.requestedBy,
    title: 'Book archive request rejected',
    message: `The archive request for ${request.bookTitle} was rejected: ${rejectionReason}`,
    type: 'warning',
    module: 'Library',
    link: '/library/books',
  }).catch((error) => console.warn('[notification] book archive rejection notification failed:', error.message));
  return ok(res, request, 'Book archive request rejected');
}