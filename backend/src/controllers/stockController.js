import StockItem from '../models/StockItem.js';
import StockTransaction from '../models/StockTransaction.js';
import DamagedStock from '../models/DamagedStock.js';
import DisposedStock from '../models/DisposedStock.js';
import { fail, list, ok } from '../utils/api.js';
import { recordAudit } from '../services/auditService.js';
import { dispatchWorkflowNotification } from '../services/notificationService.js';

function filterFor(query) {
  const filter = { active: true };
  const safeRegex = (value) => new RegExp(String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  if (query.category) filter.category = query.category;
  if (query.location) filter.location = query.location;
  if (query.supplierId) filter.supplierId = query.supplierId;
  if (query.search) filter.$or = [{ name: safeRegex(query.search) }, { code: safeRegex(query.search) }];
  if (query.lowStock === 'true') filter.$expr = { $and: [{ $gt: ['$quantity', 0] }, { $lte: ['$quantity', '$minLevel'] }] };
  if (query.outOfStock === 'true') filter.quantity = { $lte: 0 };
  return filter;
}

// Category prefix + zero-padded sequence, e.g. "FOD-013". Retries on the
// rare race where two requests generate the same code at once.
async function generateItemCode(category) {
  const prefix = category === 'Other School Materials' ? 'OTH' : 'FOD';
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const count = await StockItem.countDocuments({});
    const candidate = `${prefix}-${String(count + 1 + attempt).padStart(3, '0')}`;
    if (!(await StockItem.exists({ code: candidate }))) return candidate;
  }
  return `${prefix}-${Date.now()}`;
}

export async function getItems(req, res) { const page = Math.max(1, Number(req.query.page || 1)); const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20))); const filter = filterFor(req.query); const [data, total] = await Promise.all([StockItem.find(filter).sort(req.query.sort || '-createdAt').skip((page - 1) * limit).limit(limit), StockItem.countDocuments(filter)]); return list(res, data.map((item) => ({ ...item.toObject(), status: item.quantity <= 0 ? 'out-of-stock' : item.quantity <= item.minLevel ? 'low-stock' : 'normal', value: item.stockValue })), { page, limit, total, totalPages: Math.ceil(total / limit) }); }
export async function getItem(req, res) { const item = await StockItem.findById(req.params.id); return item ? ok(res, item) : fail(res, 'Stock item not found', 404); }
export async function createItem(req, res) {
  const { name, category, unit, quantity, minLevel, unitPrice, description, location, supplierId, batchNumber, serialNumber, expiryDate } = req.body;
  if (!name?.trim() || !category || !unit) return fail(res, 'Name, category and unit are required', 422);
  const normalizedName = name.trim();
  const duplicate = await StockItem.findOne({ active: true, category, name: new RegExp(`^${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
  if (duplicate) return fail(res, 'An active stock item with this name already exists in the selected category', 409);
  const numericFields = { quantity, minLevel, unitPrice };
  const invalidNumber = Object.entries(numericFields).find(([, value]) => value === '' || value === null || value === undefined || !Number.isFinite(Number(value)) || Number(value) < 0);
  if (invalidNumber) return fail(res, `${invalidNumber[0]} must be a non-negative number`, 422);
  if (expiryDate && Number.isNaN(new Date(expiryDate).getTime())) return fail(res, 'Expiry date is invalid', 422);
  const code = req.body.code?.trim() || (await generateItemCode(category));
  const item = await StockItem.create({ name: normalizedName, category, unit, quantity: Number(quantity), minLevel: Number(minLevel), unitPrice: Number(unitPrice), description: description?.trim() || undefined, location: location || undefined, supplierId: supplierId || undefined, batchNumber: batchNumber?.trim() || undefined, serialNumber: serialNumber?.trim() || undefined, expiryDate: expiryDate || undefined, code });
  await recordAudit(req, { action: 'Stock item created', module: 'Stock', resourceType: 'StockItem', resourceId: item._id, description: `Created ${item.name}` });
  return ok(res, item, 'Stock item created', 201);
}
export async function updateItem(req, res) { const allowed = ['code', 'name', 'category', 'unit', 'minLevel', 'unitPrice', 'description', 'location', 'supplierId', 'batchNumber', 'expiryDate', 'active']; const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key))); const item = await StockItem.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }); if (!item) return fail(res, 'Stock item not found', 404); await recordAudit(req, { action: 'Stock item updated', module: 'Stock', resourceType: 'StockItem', resourceId: item._id, description: `Updated ${item.name}` }); return ok(res, item, 'Stock item updated'); }
export async function deleteItem(req, res) {
  // Direct archive via DELETE is no longer allowed.
  // Stock Managers must submit an archive request via POST /stock/archive-requests
  // and Management must approve it before the item is archived.
  // This prevents any bypass of the approval workflow.
  return fail(
    res,
    'Direct archive is not allowed. Submit an archive request for management approval.',
    403
  );
}

// This deployment does not support multi-document transactions ("Transaction
// numbers are only allowed on a replica set member or mongos"). Every stock
// mutation below is done as an atomic guarded single-document update
// ($inc/$set with a filter that enforces the business rule), followed by the
// transaction/record write, with a compensating rollback if that second
// write fails. This gives the same correctness guarantees without needing
// replica-set-only transaction support.

async function mutateStock(req, res, type) {
  const quantity = Number(req.body.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) return fail(res, 'Quantity must be greater than zero', 422);

  const query = { _id: req.body.itemId, active: true };
  if (type === 'out') query.quantity = { $gte: quantity };
  const item = await StockItem.findOneAndUpdate(query, { $inc: { quantity: type === 'in' ? quantity : -quantity } }, { new: true });
  if (!item) return fail(res, type === 'out' ? 'Insufficient stock or item not found' : 'Stock item not found', type === 'out' ? 409 : 404);
  const previousQuantity = item.quantity - (type === 'in' ? quantity : -quantity);

  try {
    const created = await StockTransaction.create({ itemId: item._id, type, quantity, previousQuantity, newQuantity: item.quantity, date: req.body.date || new Date(), party: req.body.party, supplierId: req.body.supplierId || undefined, responsibleUser: req.user._id, notes: req.body.notes });
    await recordAudit(req, { action: type === 'in' ? 'Stock received' : 'Stock issued', module: 'Stock', resourceType: 'StockTransaction', resourceId: created._id, description: `${type} ${quantity} ${item.unit} of ${item.name}` });
    return ok(res, created, type === 'in' ? 'Stock received' : 'Stock issued', 201);
  } catch (err) {
    await StockItem.findOneAndUpdate({ _id: item._id }, { $inc: { quantity: type === 'in' ? -quantity : quantity } });
    throw err;
  }
}
export const stockIn = (req, res) => mutateStock(req, res, 'in');
export const stockOut = (req, res) => mutateStock(req, res, 'out');
export async function getTransactions(req, res) { const page = Math.max(1, Number(req.query.page || 1)); const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20))); const filter = {}; if (req.query.type) filter.type = req.query.type; if (req.query.itemId) filter.itemId = req.query.itemId; const [data, total] = await Promise.all([StockTransaction.find(filter).populate('itemId', 'name code category unit').populate('responsibleUser', 'fullName name email').sort('-date').skip((page - 1) * limit).limit(limit), StockTransaction.countDocuments(filter)]); return list(res, data, { page, limit, total, totalPages: Math.ceil(total / limit) }); }

async function recordTransaction(req, item, payload) {
  const created = await StockTransaction.create({ itemId: item._id, responsibleUser: req.user._id, ...payload });
  await recordAudit(req, { action: `Stock ${payload.type}`, module: 'Stock', resourceType: 'StockTransaction', resourceId: created._id, description: `${payload.type} transaction for ${item.name}` });
  return created;
}

export async function adjustment(req, res) {
  const physicalQuantity = Number(req.body.physicalQuantity);
  if (!Number.isFinite(physicalQuantity) || physicalQuantity < 0 || !req.body.reason) return fail(res, 'A valid physical quantity and reason are required', 422);

  const current = await StockItem.findOne({ _id: req.body.itemId, active: true });
  if (!current) return fail(res, 'Stock item not found', 404);
  const previousQuantity = current.quantity;
  const difference = physicalQuantity - previousQuantity;
  if (difference === 0) return fail(res, 'No adjustment is needed', 409);

  // Guard on the quantity we just read so a concurrent change doesn't get silently overwritten.
  const item = await StockItem.findOneAndUpdate({ _id: req.body.itemId, active: true, quantity: previousQuantity }, { $set: { quantity: physicalQuantity } }, { new: true });
  if (!item) return fail(res, 'Stock quantity changed at the same time, please retry', 409);

  try {
    const result = await recordTransaction(req, item, { type: 'adjustment', quantity: Math.abs(difference), previousQuantity, newQuantity: item.quantity, difference, date: req.body.date || new Date(), notes: `${req.body.reason}${req.body.notes ? ` - ${req.body.notes}` : ''}` });
    result.systemQuantity = previousQuantity;
    result.physicalQuantity = physicalQuantity;
    return ok(res, result, 'Stock adjusted', 201);
  } catch (err) {
    await StockItem.findOneAndUpdate({ _id: item._id }, { $set: { quantity: previousQuantity } });
    throw err;
  }
}

export async function transfer(req, res) {
  const quantity = Number(req.body.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0 || !req.body.fromLocation || !req.body.toLocation || req.body.fromLocation === req.body.toLocation) return fail(res, 'Quantity must be positive and source/destination must be different', 422);

  const current = await StockItem.findOne({ _id: req.body.itemId, active: true, quantity: { $gte: quantity } });
  if (!current) return fail(res, 'Insufficient stock or item not found', 409);
  if (quantity !== current.quantity) return fail(res, 'Partial transfers require the stock to be split into separate location items first', 422);
  if (current.location && req.body.fromLocation !== current.location) return fail(res, `Item is currently in ${current.location}, not ${req.body.fromLocation}`, 409);
  const fullTransfer = quantity === current.quantity;
  const previousLocation = current.location;

  let item = current;
  if (fullTransfer) {
    item = await StockItem.findOneAndUpdate({ _id: current._id, active: true }, { $set: { location: req.body.toLocation } }, { new: true });
  }

  try {
    const result = await recordTransaction(req, item, { type: 'transfer', quantity, previousQuantity: item.quantity, newQuantity: item.quantity, date: req.body.date || new Date(), fromLocation: req.body.fromLocation, toLocation: req.body.toLocation, party: `${req.body.fromLocation} -> ${req.body.toLocation}`, notes: req.body.notes || req.body.reason });
    return ok(res, result, 'Stock transferred', 201);
  } catch (err) {
    if (fullTransfer) await StockItem.findOneAndUpdate({ _id: item._id }, { $set: { location: previousLocation } });
    throw err;
  }
}

export async function damaged(req, res) {
  const quantity = Number(req.body.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) return fail(res, 'Quantity must be greater than zero', 422);

  const item = await StockItem.findOneAndUpdate({ _id: req.body.itemId, quantity: { $gte: quantity }, active: true }, { $inc: { quantity: -quantity } }, { new: true });
  if (!item) return fail(res, 'Insufficient stock or item not found', 409);
  const previousQuantity = item.quantity + quantity;

  try {
    const record = await DamagedStock.create({ itemId: item._id, quantity, reason: req.body.reason, date: req.body.date || undefined, notes: req.body.notes, reportedBy: req.user._id });
    await recordTransaction(req, item, { type: 'damaged', quantity, previousQuantity, newQuantity: item.quantity, date: req.body.date || new Date(), notes: req.body.notes });
    return ok(res, record, 'Damaged stock reported', 201);
  } catch (err) {
    await StockItem.findOneAndUpdate({ _id: item._id }, { $inc: { quantity } });
    throw err;
  }
}
export async function getDamaged(req, res) { return ok(res, await DamagedStock.find({ status: 'reported' }).populate('itemId', 'name unit quantity').populate('reportedBy', 'fullName username email').sort('-createdAt')); }
export async function getDisposed(req, res) { return ok(res, await DisposedStock.find().populate('itemId', 'name unit').sort('-createdAt')); }

async function disposeDamaged(req) {
  const damagedRecord = await DamagedStock.findOneAndUpdate({ _id: req.body.damagedId, status: 'reported' }, { status: 'disposed' }, { new: true });
  if (!damagedRecord) { const e = new Error('Damaged stock record not found or already disposed'); e.statusCode = 404; throw e; }

  try {
    const item = await StockItem.findById(damagedRecord.itemId);
    const created = await DisposedStock.create({
      itemId: damagedRecord.itemId,
      itemName: item?.name,
      quantityRemoved: damagedRecord.quantity,
      remainingQuantity: item ? item.quantity : 0,
      reason: 'Damaged',
      date: req.body.date || new Date(),
      responsibleUser: req.user._id,
      approvedByName: typeof req.body.approvedBy === 'string' ? req.body.approvedBy.trim() : undefined,
      status: 'approved', // stock was already deducted when the damage was reported
      notes: req.body.notes,
    });
    await recordAudit(req, { action: 'Damaged stock disposed', module: 'Stock', resourceType: 'DisposedStock', resourceId: created._id, description: `Disposed damaged ${item?.name || 'item'} (${damagedRecord.quantity}${item?.unit || ''})` });
    return created;
  } catch (err) {
    await DamagedStock.findOneAndUpdate({ _id: damagedRecord._id }, { status: 'reported' });
    throw err;
  }
}

async function disposeDirect(req) {
  const quantity = Number(req.body.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) { const e = new Error('Insufficient stock or invalid quantity'); e.statusCode = 409; throw e; }

  const item = await StockItem.findOneAndUpdate({ _id: req.body.itemId, quantity: { $gte: quantity }, active: true }, { $inc: { quantity: -quantity } }, { new: true });
  if (!item) { const e = new Error('Insufficient stock or invalid quantity'); e.statusCode = 409; throw e; }
  const previousQuantity = item.quantity + quantity;

  try {
    const created = await DisposedStock.create({
      itemId: item._id,
      itemName: item.name,
      quantityRemoved: quantity,
      remainingQuantity: item.quantity,
      reason: req.body.reason,
      date: req.body.date || undefined,
      notes: req.body.notes,
      approvedByName: typeof req.body.approvedBy === 'string' ? req.body.approvedBy.trim() : undefined,
      status: 'approved', // stock is deducted immediately, so this must never sit in the pending queue
      responsibleUser: req.user._id,
    });
    await recordTransaction(req, item, { type: 'removed', quantity, previousQuantity, newQuantity: item.quantity, date: req.body.date || new Date(), notes: req.body.notes });
    created.previousQuantity = previousQuantity;
    return created;
  } catch (err) {
    await StockItem.findOneAndUpdate({ _id: item._id }, { $inc: { quantity } });
    throw err;
  }
}
export async function dispose(req, res) {
  const result = req.body.damagedId ? await disposeDamaged(req) : await disposeDirect(req);
  return ok(res, result, 'Stock disposed', 201);
}

export async function expiry(req, res) { const now = new Date(); const end = new Date(now.getTime() + 30 * 86400000); const filter = { active: true, expiryDate: req.query.kind === 'expired' ? { $lt: now } : { $gte: now, $lte: end } }; return ok(res, await StockItem.find(filter).sort('expiryDate')); }
export async function dashboard(_req, res) { const items = await StockItem.find({ active: true }); const transactions = await StockTransaction.find(); const now = new Date(); const soon = new Date(now.getTime() + 30 * 86400000); const low = items.filter((i) => i.quantity > 0 && i.quantity <= i.minLevel); const out = items.filter((i) => i.quantity <= 0); return ok(res, { totalItems: items.length, itemsInStock: items.filter((i) => i.quantity > 0).length, lowStockCount: low.length, outOfStockCount: out.length, expiredCount: items.filter((i) => i.expiryDate && i.expiryDate < now).length, expiringSoonCount: items.filter((i) => i.expiryDate >= now && i.expiryDate <= soon).length, damagedCount: await DamagedStock.countDocuments({ status: 'reported' }), disposedCount: await DisposedStock.countDocuments(), totalStockValue: items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0), stockInTotal: transactions.filter((t) => t.type === 'in').reduce((sum, t) => sum + t.quantity, 0), stockOutTotal: transactions.filter((t) => t.type === 'out').reduce((sum, t) => sum + t.quantity, 0), recentTransactions: transactions.sort((a, b) => b.date - a.date).slice(0, 8), attentionRequired: [...out, ...low] }); }

/**
 * Request disposal - creates a pending disposal record
 */
export async function requestDisposal(req, res) {
  const quantity = Number(req.body.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) return fail(res, 'Quantity must be greater than zero', 422);

  const item = await StockItem.findById(req.body.itemId);
  if (!item || !item.active) return fail(res, 'Stock item not found', 404);
  if (quantity > item.quantity) return fail(res, `Insufficient stock: only ${item.quantity} ${item.unit} available`, 409);

  try {
    const disposed = await DisposedStock.create({
      itemId: req.body.itemId,
      itemName: item.name,
      quantityRemoved: quantity,
      remainingQuantity: item.quantity,
      reason: req.body.reason || 'Other',
      status: 'pending',
      requestedBy: req.user._id,
      notes: req.body.notes,
      date: req.body.date || new Date()
    });

    await recordAudit(req, {
      action: 'Disposal requested',
      module: 'Stock',
      resourceType: 'DisposedStock',
      resourceId: disposed._id,
      description: `Requested disposal of ${quantity} ${item.unit} of ${item.name}`
    });

    // Notify management that a disposal request needs review.
    dispatchWorkflowNotification({
      roles: ['management', 'admin'],
      title: 'New Stock Disposal Request',
      message: `${req.user.fullName} submitted a disposal request for ${quantity} ${item.unit} of ${item.name}. Management approval is required.`,
      type: 'warning',
      module: 'Stock',
      link: '/management/approvals',
      dedupeKey: `disposal-request-${disposed._id}`,
    }).catch(() => {});

    return ok(res, disposed, 'Disposal request created (pending approval)', 201);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

/**
 * Approve disposal request
 */
export async function approveDisposal(req, res) {
  const existing = await DisposedStock.findById(req.params.id);
  if (!existing) return fail(res, 'Disposal record not found', 404);

  // Prevent self-approval: the person who requested cannot also approve.
  if (existing.requestedBy && existing.requestedBy.toString() === req.user._id.toString()) {
    return fail(res, 'You cannot approve your own disposal request', 403);
  }

  // Atomically claim the request so two approvers clicking at once cannot both
  // deduct the stock (a plain read-then-save would let both through).
  const disposed = await DisposedStock.findOneAndUpdate(
    { _id: existing._id, status: 'pending' },
    { $set: { status: 'approved', approvedBy: req.user._id, approvalNotes: req.body.approvalNotes } },
    { new: true }
  );
  if (!disposed) return fail(res, 'Only pending disposals can be approved', 409);

  const releaseClaim = () => DisposedStock.findByIdAndUpdate(disposed._id, { $set: { status: 'pending' }, $unset: { approvedBy: 1, approvalNotes: 1 } }).catch(() => {});

  let deducted = false;
  let createdTransaction;
  try {
    const item = await StockItem.findOneAndUpdate(
      { _id: disposed.itemId, quantity: { $gte: disposed.quantityRemoved }, active: true },
      { $inc: { quantity: -disposed.quantityRemoved } },
      { new: true }
    );

    if (!item) {
      await releaseClaim();
      return fail(res, 'Insufficient stock or item not found', 409);
    }
    deducted = true;

    const previousQuantity = item.quantity + disposed.quantityRemoved;
    createdTransaction = await StockTransaction.create({
      itemId: item._id,
      type: 'removed',
      quantity: disposed.quantityRemoved,
      previousQuantity,
      newQuantity: item.quantity,
      date: new Date(),
      party: `Disposal: ${disposed.reason}`,
      responsibleUser: req.user._id,
      notes: disposed.notes
    });

    await recordAudit(req, {
      action: 'Disposal approved',
      module: 'Stock',
      resourceType: 'DisposedStock',
      resourceId: disposed._id,
      description: `Approved disposal of ${disposed.quantityRemoved} ${item.unit} of ${item.name}`
    });

    // Notify the requester that their disposal was approved.
    if (disposed.requestedBy) {
      dispatchWorkflowNotification({
        userIds: [disposed.requestedBy],
        title: 'Disposal Request Approved',
        message: `Your disposal request for ${disposed.quantityRemoved} units of "${item.name}" was approved by Management.`,
        type: 'success',
        module: 'Stock',
        link: '/stock/activity?tab=disposed',
        dedupeKey: `disposal-approved-${disposed._id}`,
      }).catch(() => {});
    }

    return ok(res, disposed, 'Disposal approved and stock removed', 200);
  } catch (err) {
    // Undo only what actually happened, so a failure before the deduction can
    // never *add* stock that was never removed.
    if (createdTransaction) await StockTransaction.findByIdAndDelete(createdTransaction._id).catch(() => {});
    if (deducted) await StockItem.findOneAndUpdate({ _id: disposed.itemId }, { $inc: { quantity: disposed.quantityRemoved } }).catch(() => {});
    await releaseClaim();
    return fail(res, err.message, err.statusCode || 500);
  }
}

/**
 * Reject disposal request
 */
export async function rejectDisposal(req, res) {
  const existing = await DisposedStock.findById(req.params.id);
  if (!existing) return fail(res, 'Disposal record not found', 404);

  // Prevent self-rejection of own request.
  if (existing.requestedBy && existing.requestedBy.toString() === req.user._id.toString()) {
    return fail(res, 'You cannot reject your own disposal request', 403);
  }

  const disposed = await DisposedStock.findOneAndUpdate(
    { _id: existing._id, status: 'pending' },
    { $set: { status: 'rejected', approvedBy: req.user._id, rejectionReason: req.body.rejectionReason || '' } },
    { new: true }
  );
  if (!disposed) return fail(res, 'Only pending disposals can be rejected', 409);

  await recordAudit(req, {
    action: 'Disposal rejected',
    module: 'Stock',
    resourceType: 'DisposedStock',
    resourceId: disposed._id,
    description: `Rejected disposal request for ${disposed.itemName}`
  });

  // Notify the requester that their disposal was rejected.
  if (disposed.requestedBy) {
    dispatchWorkflowNotification({
      userIds: [disposed.requestedBy],
      title: 'Disposal Request Rejected',
      message: `Your disposal request for "${disposed.itemName}" was rejected by Management.${disposed.rejectionReason ? ` Reason: ${disposed.rejectionReason}` : ''}`,
      type: 'danger',
      module: 'Stock',
      link: '/stock/activity?tab=disposed',
      dedupeKey: `disposal-rejected-${disposed._id}`,
    }).catch(() => {});
  }

  return ok(res, disposed, 'Disposal request rejected', 200);
}

/**
 * Get pending disposal requests (for approval)
 */
export async function getPendingDisposals(req, res) {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));

  const [data, total] = await Promise.all([
    DisposedStock.find({ status: 'pending' })
      .populate('requestedBy', 'fullName email')
      .populate('itemId', 'name code unit quantity')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit),
    DisposedStock.countDocuments({ status: 'pending' })
  ]);

  return list(res, data, { page, limit, total, totalPages: Math.ceil(total / limit) });
}

/**
 * Get all disposal records with pagination
 */
export async function getDisposedPaginated(req, res) {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
  const filter = {};

  if (req.query.status) filter.status = req.query.status;
  if (req.query.reason) filter.reason = req.query.reason;

  const [data, total] = await Promise.all([
    DisposedStock.find(filter)
      .populate('itemId', 'name code category unit')
      .populate('requestedBy', 'fullName')
      .populate('approvedBy', 'fullName')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit),
    DisposedStock.countDocuments(filter)
  ]);

  return list(res, data, { page, limit, total, totalPages: Math.ceil(total / limit) });
}

/**
 * Validate batch number for Foods category
 */
export async function validateBatchNumber(req, res) {
  const { itemId, batchNumber } = req.body;

  if (!batchNumber) {
    return fail(res, 'Batch number is required for Foods', 422);
  }

  const item = await StockItem.findById(itemId);
  if (!item) return fail(res, 'Item not found', 404);

  if (item.category !== 'Foods') {
    return fail(res, 'Batch number is only required for Foods', 422);
  }

  return ok(res, { valid: true, message: 'Batch number is valid' }, '', 200);
}

/**
 * Validate serial number for Electronics category
 */
export async function validateSerialNumber(req, res) {
  const { itemId, serialNumber } = req.body;

  if (!serialNumber) {
    return fail(res, 'Serial number is required for this stock category', 422);
  }

  const item = await StockItem.findById(itemId);
  if (!item) return fail(res, 'Item not found', 404);

  if (item.category !== 'Foods' && item.category !== 'Other School Materials') {
    return fail(res, 'Serial number is not required for this category', 422);
  }

  const existing = await StockItem.findOne({
    _id: { $ne: itemId },
    serialNumber,
    active: true
  });

  if (existing) {
    return fail(res, 'Serial number already in use', 409);
  }

  return ok(res, { valid: true, message: 'Serial number is valid' }, '', 200);
}

/**
 * Get ABC Classification Report
 */
export async function getABCClassificationReport(req, res) {
  try {
    const { getABCReport } = await import('../services/abcClassificationService.js');
    const report = await getABCReport();
    return ok(res, report, '', 200);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

/**
 * Get fast-moving items
 */
export async function getFastMovingReport(req, res) {
  try {
    const { getFastMovingItems } = await import('../services/abcClassificationService.js');
    const limit = Number(req.query.limit || 10);
    const items = await getFastMovingItems(limit);
    return ok(res, items, '', 200);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

/**
 * Get slow-moving items
 */
export async function getSlowMovingReport(req, res) {
  try {
    const { getSlowMovingItems } = await import('../services/abcClassificationService.js');
    const limit = Number(req.query.limit || 10);
    const items = await getSlowMovingItems(limit);
    return ok(res, items, '', 200);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}
