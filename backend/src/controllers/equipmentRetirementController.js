import mongoose from 'mongoose';
import Equipment from '../models/Equipment.js';
import EquipmentRetirementRequest from '../models/EquipmentRetirementRequest.js';
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

export async function createRetirementRequest(req, res) {
  const { equipmentId, reason, notes } = req.body;
  const requesterId = req.user?._id || req.user?.id;
  if (!validId(requesterId)) return fail(res, 'Authenticated user could not be identified', 401);
  if (!validId(equipmentId)) return fail(res, 'Equipment not found', 404);
  if (!String(reason || '').trim()) return fail(res, 'Retirement reason is required', 422);

  const equipment = await Equipment.findOne({ _id: equipmentId, active: true });
  if (!equipment) return fail(res, 'Equipment not found', 404);
  if (equipment.status === 'retired' || equipment.condition === 'retired') {
    return fail(res, 'Equipment is already retired', 409);
  }

  const existing = await EquipmentRetirementRequest.findOne({ equipmentId, status: 'pending' });
  if (existing) return fail(res, 'A retirement request is already pending for this equipment', 409);

  let request;
  try {
    request = await EquipmentRetirementRequest.create({
      equipmentId,
      assetNumber: equipment.assetNumber,
      equipmentName: equipment.name,
      reason: String(reason).trim(),
      ...(notes ? { notes: String(notes).trim() } : {}),
      requestedBy: requesterId,
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return fail(res, 'Retirement request data is invalid', 422, Object.values(error.errors).map((item) => ({ field: item.path, message: item.message })));
    }
    throw error;
  }
  await recordAudit(req, {
    action: 'Equipment retirement requested',
    module: 'Equipment',
    resourceType: 'EquipmentRetirementRequest',
    resourceId: request._id,
    description: `Requested retirement for ${equipment.assetNumber}`,
  });
  return ok(res, request, 'Retirement request submitted', 201);
}

export async function getMyRetirementRequests(req, res) {
  const requests = await EquipmentRetirementRequest.find({ requestedBy: req.user._id })
    .populate('reviewedBy', 'fullName')
    .sort('-createdAt');
  return ok(res, requests);
}

export async function getRetirementRequests(req, res) {
  const { page, limit, skip } = pagination(req);
  const filter = { status: req.query.status || 'pending' };
  const [requests, total] = await Promise.all([
    EquipmentRetirementRequest.find(filter)
      .populate('requestedBy', 'fullName')
      .populate('reviewedBy', 'fullName')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    EquipmentRetirementRequest.countDocuments(filter),
  ]);
  return list(res, requests, { page, limit, total, totalPages: Math.ceil(total / limit) });
}

export async function approveRetirementRequest(req, res) {
  if (!validId(req.params.id)) return fail(res, 'Retirement request not found', 404);
  const request = await EquipmentRetirementRequest.findOneAndUpdate(
    { _id: req.params.id, status: 'pending' },
    { $set: { status: 'approved', reviewedBy: req.user._id, reviewedAt: new Date(), rejectionReason: undefined } },
    { new: true }
  );
  if (!request) return fail(res, 'Retirement request is no longer pending', 409);

  const equipment = await Equipment.findOneAndUpdate(
    { _id: request.equipmentId, active: true, status: { $ne: 'retired' }, condition: { $ne: 'retired' } },
    { $set: { status: 'retired', condition: 'retired' }, $unset: { currentAssignee: 1 } },
    { new: true, runValidators: true }
  );
  if (!equipment) {
    await EquipmentRetirementRequest.updateOne(
      { _id: request._id, status: 'approved' },
      { $set: { status: 'pending' }, $unset: { reviewedBy: 1, reviewedAt: 1 } }
    );
    return fail(res, 'Equipment could not be retired because it is no longer active', 409);
  }

  await recordAudit(req, {
    action: 'Equipment retirement approved',
    module: 'Equipment',
    resourceType: 'EquipmentRetirementRequest',
    resourceId: request._id,
    description: `Approved retirement for ${equipment.assetNumber}`,
  });
  await Notification.create({
    userId: request.requestedBy,
    title: 'Retirement request approved',
    message: `The retirement request for ${equipment.assetNumber} was approved by management.`,
    type: 'success',
    module: 'Equipment',
    link: '/equipment/retirement-requests',
  }).catch((error) => console.warn('[notification] retirement approval notification failed:', error.message));
  return ok(res, request, 'Retirement request approved');
}

export async function rejectRetirementRequest(req, res) {
  if (!validId(req.params.id)) return fail(res, 'Retirement request not found', 404);
  const rejectionReason = String(req.body.rejectionReason || '').trim();
  if (!rejectionReason) return fail(res, 'Rejection reason is required', 422);

  const request = await EquipmentRetirementRequest.findOneAndUpdate(
    { _id: req.params.id, status: 'pending' },
    { $set: { status: 'rejected', reviewedBy: req.user._id, reviewedAt: new Date(), rejectionReason } },
    { new: true }
  );
  if (!request) return fail(res, 'Retirement request is no longer pending', 409);

  await recordAudit(req, {
    action: 'Equipment retirement rejected',
    module: 'Equipment',
    resourceType: 'EquipmentRetirementRequest',
    resourceId: request._id,
    description: `Rejected equipment retirement request: ${rejectionReason}`,
    status: 'warning',
  });
  await Notification.create({
    userId: request.requestedBy,
    title: 'Retirement request rejected',
    message: `The retirement request for ${request.assetNumber} was rejected: ${rejectionReason}`,
    type: 'warning',
    module: 'Equipment',
    link: '/equipment/retirement-requests',
  }).catch((error) => console.warn('[notification] retirement rejection notification failed:', error.message));
  return ok(res, request, 'Retirement request rejected');
}
