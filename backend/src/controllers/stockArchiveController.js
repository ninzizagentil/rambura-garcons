import mongoose from 'mongoose';
import StockItem from '../models/StockItem.js';
import StockArchiveRequest from '../models/StockArchiveRequest.js';
import Notification from '../models/Notification.js';
import { fail, list, ok } from '../utils/api.js';
import { recordAudit } from '../services/auditService.js';

const validId = (id) => mongoose.isValidObjectId(id);

function pagination(req) {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 10)));
  return { page, limit, skip: (page - 1) * limit };
}

// POST /stock/archive-requests  — stock manager asks to archive a zero-quantity item.
export async function createStockArchiveRequest(req, res) {
  const { itemId, reason, notes } = req.body;
  const requesterId = req.user?._id;
  if (!validId(itemId)) return fail(res, 'Stock item not found', 404);
  if (!String(reason || '').trim()) return fail(res, 'Archive reason is required', 422);

  const item = await StockItem.findOne({ _id: itemId, active: true });
  if (!item) return fail(res, 'Stock item not found', 404);
  if (item.quantity !== 0) return fail(res, 'Only items with zero quantity can be archived', 409);

  const existing = await StockArchiveRequest.findOne({ itemId, status: 'pending' });
  if (existing) return fail(res, 'An archive request is already pending for this item', 409);

  const request = await StockArchiveRequest.create({
    itemId,
    itemName: item.name,
    itemCode: item.code,
    reason: String(reason).trim(),
    ...(notes ? { notes: String(notes).trim() } : {}),
    requestedBy: requesterId,
  });

  await recordAudit(req, {
    action: 'Stock archive requested',
    module: 'Stock',
    resourceType: 'StockArchiveRequest',
    resourceId: request._id,
    description: `Requested archive for ${item.code} - ${item.name}`,
  });
  return ok(res, request, 'Archive request submitted', 201);
}

// GET /stock/archive-requests/my — the requester's own requests.
export async function getMyStockArchiveRequests(req, res) {
  const requests = await StockArchiveRequest.find({ requestedBy: req.user._id })
    .populate('reviewedBy', 'fullName')
    .sort('-createdAt');
  return ok(res, requests);
}

// GET /stock/archive-requests — management list (default: pending).
export async function getStockArchiveRequests(req, res) {
  const { page, limit, skip } = pagination(req);
  const filter = { status: req.query.status || 'pending' };
  const [requests, total] = await Promise.all([
    StockArchiveRequest.find(filter)
      .populate('requestedBy', 'fullName')
      .populate('reviewedBy', 'fullName')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    StockArchiveRequest.countDocuments(filter),
  ]);
  return list(res, requests, { page, limit, total, totalPages: Math.ceil(total / limit) });
}

// POST /stock/archive-requests/:id/approve
export async function approveStockArchiveRequest(req, res) {
  if (!validId(req.params.id)) return fail(res, 'Archive request not found', 404);
  const approvalNotes = String(req.body.approvalNotes || '').trim().slice(0, 1000);

  // Atomic claim: only one approver can move a request out of "pending".
  const request = await StockArchiveRequest.findOneAndUpdate(
    { _id: req.params.id, status: 'pending' },
    { $set: { status: 'approved', reviewedBy: req.user._id, reviewedAt: new Date(), ...(approvalNotes ? { approvalNotes } : {}) }, $unset: { rejectionReason: 1 } },
    { new: true }
  );
  if (!request) return fail(res, 'Archive request is no longer pending', 409);

  // Archive only if the item is still active AND still empty.
  const item = await StockItem.findOneAndUpdate(
    { _id: request.itemId, active: true, quantity: 0 },
    { $set: { active: false } },
    { new: true }
  );
  if (!item) {
    await StockArchiveRequest.updateOne(
      { _id: request._id, status: 'approved' },
      { $set: { status: 'pending' }, $unset: { reviewedBy: 1, reviewedAt: 1, approvalNotes: 1 } }
    );
    return fail(res, 'Item could not be archived because it is no longer active or no longer has zero quantity', 409);
  }

  await recordAudit(req, {
    action: 'Stock archive approved',
    module: 'Stock',
    resourceType: 'StockArchiveRequest',
    resourceId: request._id,
    description: `Approved archive for ${item.code} - ${item.name}`,
  });
  await Notification.create({
    userId: request.requestedBy,
    title: 'Archive request approved',
    message: `The archive request for ${item.name} was approved by management.`,
    type: 'success',
    module: 'Stock',
    link: '/stock/archive-requests',
  }).catch((error) => console.warn('[notification] stock archive approval notification failed:', error.message));
  return ok(res, request, 'Archive request approved');
}

// POST /stock/archive-requests/:id/reject
export async function rejectStockArchiveRequest(req, res) {
  if (!validId(req.params.id)) return fail(res, 'Archive request not found', 404);
  const rejectionReason = String(req.body.rejectionReason || '').trim().slice(0, 500);
  if (!rejectionReason) return fail(res, 'Rejection reason is required', 422);

  const request = await StockArchiveRequest.findOneAndUpdate(
    { _id: req.params.id, status: 'pending' },
    { $set: { status: 'rejected', reviewedBy: req.user._id, reviewedAt: new Date(), rejectionReason } },
    { new: true }
  );
  if (!request) return fail(res, 'Archive request is no longer pending', 409);

  await recordAudit(req, {
    action: 'Stock archive rejected',
    module: 'Stock',
    resourceType: 'StockArchiveRequest',
    resourceId: request._id,
    description: `Rejected stock archive request: ${rejectionReason}`,
    status: 'warning',
  });
  await Notification.create({
    userId: request.requestedBy,
    title: 'Archive request rejected',
    message: `The archive request for ${request.itemName} was rejected: ${rejectionReason}`,
    type: 'warning',
    module: 'Stock',
    link: '/stock/archive-requests',
  }).catch((error) => console.warn('[notification] stock archive rejection notification failed:', error.message));
  return ok(res, request, 'Archive request rejected');
}
