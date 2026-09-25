import Equipment from '../models/Equipment.js';
import { fail, list, ok } from '../utils/api.js';
import { recordAudit } from '../services/auditService.js';
import mongoose from 'mongoose';

const allowed = ['assetNumber', 'name', 'type', 'brand', 'model', 'serialNumber', 'location', 'condition', 'purchaseDate', 'purchaseCost', 'warrantyExpiry', 'notes'];

function filterFor(query) {
  const filter = { active: true };
  if (query.type) filter.type = query.type;
  if (query.condition) filter.condition = query.condition;
  if (query.status) filter.status = query.status;
  if (query.location) filter.location = query.location;
  if (query.search) {
    const search = String(query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [{ assetNumber: new RegExp(search, 'i') }, { name: new RegExp(search, 'i') }, { serialNumber: new RegExp(search, 'i') }];
  }
  return filter;
}

export async function getEquipment(req, res) {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 100)));
  const filter = filterFor(req.query);
  const [data, total] = await Promise.all([
    Equipment.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(limit),
    Equipment.countDocuments(filter),
  ]);
  return list(res, data, { page, limit, total, totalPages: Math.ceil(total / limit) });
}

export async function getEquipmentById(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 'Equipment not found', 404);
  const equipment = await Equipment.findOne({ _id: req.params.id, active: true });
  return equipment ? ok(res, equipment) : fail(res, 'Equipment not found', 404);
}

export async function createEquipment(req, res) {
  const data = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  if (!data.assetNumber?.trim() || !data.name?.trim() || !data.type || !data.location?.trim()) return fail(res, 'Asset number, name, type, and location are required', 422);
  // New equipment cannot be created already retired.
  if (data.condition === 'retired' || data.status === 'retired') {
    return fail(res, 'Equipment cannot be registered as already retired. Register it first, then submit a retirement request.', 422);
  }
  try {
    const equipment = await Equipment.create({ ...data, assetNumber: data.assetNumber.trim().toUpperCase(), name: data.name.trim(), location: data.location.trim() });
    await recordAudit(req, { action: 'Equipment created', module: 'Equipment', resourceType: 'Equipment', resourceId: equipment._id, description: `Created ${equipment.assetNumber}` });
    return ok(res, equipment, 'Equipment created', 201);
  } catch (error) {
    if (error.code === 11000) return fail(res, 'Asset number already exists', 409);
    throw error;
  }
}

export async function updateEquipment(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 'Equipment not found', 404);
  const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  if (Object.hasOwn(updates, 'assetNumber') && !String(updates.assetNumber || '').trim()) return fail(res, 'Asset number is required', 422);
  if (Object.hasOwn(updates, 'name') && !String(updates.name || '').trim()) return fail(res, 'Name is required', 422);
  if (Object.hasOwn(updates, 'type') && !String(updates.type || '').trim()) return fail(res, 'Type is required', 422);
  if (Object.hasOwn(updates, 'location') && !String(updates.location || '').trim()) return fail(res, 'Location is required', 422);
  if (updates.assetNumber) updates.assetNumber = updates.assetNumber.trim().toUpperCase();
  const current = await Equipment.findOne({ _id: req.params.id, active: true });
  if (!current) return fail(res, 'Equipment not found', 404);

  // Block retirement via direct edit — retirement must go through the approval workflow.
  // Any attempt to set condition=retired or status=retired is rejected.
  if (updates.condition === 'retired' || updates.status === 'retired') {
    return fail(
      res,
      'Equipment cannot be retired by editing. Submit a retirement request through the approval workflow.',
      403
    );
  }

  // Also ensure we never silently un-retire equipment by downgrading a field.
  if (current.status === 'retired' || current.condition === 'retired') {
    // Only allow notes/description updates on already-retired equipment; block
    // status/condition changes that would smuggle data into a retired record.
    const safeForRetired = ['notes'];
    const unsafeKeys = Object.keys(updates).filter((k) => !safeForRetired.includes(k));
    if (unsafeKeys.length) {
      return fail(res, 'Retired equipment cannot be edited. Contact your administrator.', 403);
    }
  }

  let equipment;
  try {
    equipment = await Equipment.findOneAndUpdate({ _id: req.params.id, active: true }, updates, { new: true, runValidators: true });
  } catch (error) {
    if (error.code === 11000) return fail(res, 'Asset number already exists', 409);
    throw error;
  }
  if (!equipment) return fail(res, 'Equipment not found', 404);
  await recordAudit(req, { action: 'Equipment updated', module: 'Equipment', resourceType: 'Equipment', resourceId: equipment._id, description: `Updated ${equipment.assetNumber}` });
  return ok(res, equipment, 'Equipment updated');
}

export async function deleteEquipment(req, res) {
  // Direct archive via DELETE is no longer allowed.
  // Equipment Managers must submit an archive request via POST /equipment-archive-requests
  // and Management must approve it before the equipment is archived.
  // This closes all archive-bypass paths for both normal and retired equipment.
  if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 'Equipment not found', 404);
  return fail(
    res,
    'Direct archive is not allowed. Submit an archive request for management approval.',
    403
  );
}

export async function assignEquipment(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 'Equipment not found', 404);
  const { userName, userId, notes } = req.body;
  if (!userName?.trim()) return fail(res, 'Assignee name is required', 422);
  const equipment = await Equipment.findOne({ _id: req.params.id, active: true });
  if (!equipment) return fail(res, 'Equipment not found', 404);
  if (equipment.status === 'retired' || equipment.status === 'under_maintenance' || equipment.condition === 'retired' || equipment.condition === 'under_repair') return fail(res, 'Equipment is not available for assignment', 409);
  equipment.currentAssignee = { userName: userName.trim(), userId: userId || undefined, assignedAt: new Date() };
  equipment.assignmentHistory.push({ userName: userName.trim(), userId: userId || undefined, notes });
  equipment.status = 'assigned';
  await equipment.save();
  await recordAudit(req, { action: 'Equipment assigned', module: 'Equipment', resourceType: 'Equipment', resourceId: equipment._id, description: `Assigned ${equipment.assetNumber} to ${userName}` });
  return ok(res, equipment, 'Equipment assigned');
}

export async function returnEquipment(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 'Equipment not found', 404);
  const equipment = await Equipment.findOne({ _id: req.params.id, active: true });
  if (!equipment) return fail(res, 'Equipment not found', 404);
  if (equipment.currentAssignee) {
    const last = equipment.assignmentHistory[equipment.assignmentHistory.length - 1];
    if (last && !last.returnedAt) last.returnedAt = new Date();
  }
  equipment.currentAssignee = undefined;
  equipment.status = equipment.condition === 'under_repair' ? 'under_maintenance' : 'available';
  await equipment.save();
  await recordAudit(req, { action: 'Equipment returned', module: 'Equipment', resourceType: 'Equipment', resourceId: equipment._id, description: `Returned ${equipment.assetNumber}` });
  return ok(res, equipment, 'Equipment returned');
}

export async function addMaintenance(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 'Equipment not found', 404);
  const { type, description, cost, performedBy, nextDueDate, notes } = req.body;
  if (!type || !description?.trim()) return fail(res, 'Maintenance type and description are required', 422);
  const equipment = await Equipment.findOne({ _id: req.params.id, active: true });
  if (!equipment) return fail(res, 'Equipment not found', 404);
  equipment.maintenanceRecords.push({ type, description: description.trim(), cost: Number(cost || 0), performedBy, nextDueDate, notes, recordedBy: req.user._id });
  equipment.status = type === 'repair' || type === 'service' ? 'under_maintenance' : equipment.status;
  if (req.body.completed === true || req.body.completed === 'true') equipment.status = equipment.currentAssignee ? 'assigned' : 'available';
  await equipment.save();
  await recordAudit(req, { action: 'Equipment maintenance recorded', module: 'Equipment', resourceType: 'Equipment', resourceId: equipment._id, description: `Recorded maintenance for ${equipment.assetNumber}` });
  return ok(res, equipment, 'Maintenance record added');
}

export async function equipmentDashboard(_req, res) {
  const items = await Equipment.find({ active: true }).lean();
  return ok(res, {
    total: items.length,
    available: items.filter((item) => item.status === 'available').length,
    assigned: items.filter((item) => item.status === 'assigned').length,
    underMaintenance: items.filter((item) => item.status === 'under_maintenance').length,
    damaged: items.filter((item) => item.condition === 'damaged').length,
    retired: items.filter((item) => item.status === 'retired').length,
  });
}
