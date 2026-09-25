import mongoose from 'mongoose';
import Equipment from '../models/Equipment.js';
import EquipmentArchiveRequest from '../models/EquipmentArchiveRequest.js';
import Notification from '../models/Notification.js';
import { fail, list, ok } from '../utils/api.js';
import { recordAudit } from '../services/auditService.js';

function validId(id) {
  return mongoose.isValidObjectId(id);
}

function pagination(req) {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 10)));
  return { page, limit, skip: (page - 1) * limit };
}

export async function createArchiveRequest(req, res) {
  const { equipmentId, reason, notes } = req.body;
  const requesterId = req.user?._id || req.user?.id;
  if (!validId(requesterId)) return fail(res, 'Authenticated user could not be identified', 401);
  if (!validId(equipmentId)) return fail(res, 'Equipment not found', 404);
  if (!String(reason || '').trim()) return fail(res, 'Archive reason is required', 422);

  const equipment = await Equipment.findOne({ _id: equipmentId, active: true });
  if (!equipment) return fail(res, 'Equipment not found', 404);

  const existing = await EquipmentArchiveRequest.findOne({ equipmentId, status: 'pending' });
  if (existing) return fail(res, 'An archive request is already pending for this equipment', 409);

  const request = await EquipmentArchiveRequest.create({
    equipmentId,
    assetNumber: equipment.assetNumber,
    equipmentName: equipment.name,
    reason: String(reason).trim(),
    ...(notes ? { notes: String(notes).trim() } : {}),
    requestedBy: requesterId,
  });

  await recordAudit(req, {
    action: 'Equipment archive requested',
    module: 'Equipment',
    resourceType: 'EquipmentArchiveRequest',
    resourceId: request._id,
    description: `Requested archive for ${equipment.assetNumber}`,
  });
  return ok(res, request, 'Archive request submitted', 201);
}

export async function getMyArchiveRequests(req, res) {
  const requests = await EquipmentArchiveRequest.find({ requestedBy: req.user._id })
    .populate('reviewedBy', 'fullName')
    .sort('-createdAt');
  return ok(res, requests);
}

export async function getArchiveRequests(req, res) {
  const { page, limit, skip } = pagination(req);
  const filter = { status: req.query.status || 'pending' };
  const [requests, total] = await Promise.all([
    EquipmentArchiveRequest.find(filter)
      .populate('requestedBy', 'fullName')
      .populate('reviewedBy', 'fullName')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    EquipmentArchiveRequest.countDocuments(filter),
  ]);
  return list(res, requests, { page, limit, total, totalPages: Math.ceil(total / limit) });
}

export async function approveArchiveRequest(req, res) {
  if (!validId(req.params.id)) return fail(res, 'Archive request not found', 404);
  const request = await EquipmentArchiveRequest.findOneAndUpdate(
    { _id: req.params.id, status: 'pending' },
    { $set: { status: 'approved', reviewedBy: req.user._id, reviewedAt: new Date() }, $unset: { rejectionReason: 1 } },
    { new: true }
  );
  if (!request) return fail(res, 'Archive request is no longer pending', 409);

  const equipment = await Equipment.findOneAndUpdate(
    { _id: request.equipmentId, active: true },
    { $set: { active: false } },
    { new: true }
  );
  if (!equipment) {
    await EquipmentArchiveRequest.updateOne(
      { _id: request._id, status: 'approved' },
      { $set: { status: 'pending' }, $unset: { reviewedBy: 1, reviewedAt: 1 } }
    );
    return fail(res, 'Equipment could not be archived because it is no longer active', 409);
  }

  await recordAudit(req, {
    action: 'Equipment archive approved',
    module: 'Equipment',
    resourceType: 'EquipmentArchiveRequest',
    resourceId: request._id,
    description: `Approved archive for ${equipment.assetNumber}`,
  });
  await Notification.create({
    userId: request.requestedBy,
    title: 'Archive request approved',
    message: `The archive request for ${equipment.assetNumber} was approved by management.`,
    type: 'success',
    module: 'Equipment',
    link: '/equipment/archive-requests',
  }).catch((error) => console.warn('[notification] archive approval notification failed:', error.message));
  return ok(res, request, 'Archive request approved');
}

export async function rejectArchiveRequest(req, res) {
  if (!validId(req.params.id)) return fail(res, 'Archive request not found', 404);
  const rejectionReason = String(req.body.rejectionReason || '').trim();
  if (!rejectionReason) return fail(res, 'Rejection reason is required', 422);

  const request = await EquipmentArchiveRequest.findOneAndUpdate(
    { _id: req.params.id, status: 'pending' },
    { $set: { status: 'rejected', reviewedBy: req.user._id, reviewedAt: new Date(), rejectionReason } },
    { new: true }
  );
  if (!request) return fail(res, 'Archive request is no longer pending', 409);

  await recordAudit(req, {
    action: 'Equipment archive rejected',
    module: 'Equipment',
    resourceType: 'EquipmentArchiveRequest',
    resourceId: request._id,
    description: `Rejected equipment archive request: ${rejectionReason}`,
    status: 'warning',
  });
  await Notification.create({
    userId: request.requestedBy,
    title: 'Archive request rejected',
    message: `The archive request for ${request.assetNumber} was rejected: ${rejectionReason}`,
    type: 'warning',
    module: 'Equipment',
    link: '/equipment/archive-requests',
  }).catch((error) => console.warn('[notification] archive rejection notification failed:', error.message));
  return ok(res, request, 'Archive request rejected');
}
