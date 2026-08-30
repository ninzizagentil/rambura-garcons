import mongoose from 'mongoose';
import StockItem from '../models/StockItem.js';
import StockTransaction from '../models/StockTransaction.js';
import DamagedStock from '../models/DamagedStock.js';
import DisposedStock from '../models/DisposedStock.js';
import { fail, list, ok } from '../utils/api.js';
import { recordAudit } from '../services/auditService.js';

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

export async function getItems(req, res) { const page = Math.max(1, Number(req.query.page || 1)); const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20))); const filter = filterFor(req.query); const [data, total] = await Promise.all([StockItem.find(filter).sort(req.query.sort || '-createdAt').skip((page - 1) * limit).limit(limit), StockItem.countDocuments(filter)]); return list(res, data.map((item) => ({ ...item.toObject(), status: item.quantity <= 0 ? 'out-of-stock' : item.quantity <= item.minLevel ? 'low-stock' : 'normal', value: item.stockValue })), { page, limit, total, totalPages: Math.ceil(total / limit) }); }
export async function getItem(req, res) { const item = await StockItem.findById(req.params.id); return item ? ok(res, item) : fail(res, 'Stock item not found', 404); }
export async function createItem(req, res) { const item = await StockItem.create(req.body); await recordAudit(req, { action: 'Stock item created', module: 'Stock', resourceType: 'StockItem', resourceId: item._id, description: `Created ${item.name}` }); return ok(res, item, 'Stock item created', 201); }
export async function updateItem(req, res) { const allowed = ['code', 'name', 'category', 'unit', 'minLevel', 'unitPrice', 'description', 'location', 'supplierId', 'batchNumber', 'expiryDate', 'active']; const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key))); const item = await StockItem.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }); if (!item) return fail(res, 'Stock item not found', 404); await recordAudit(req, { action: 'Stock item updated', module: 'Stock', resourceType: 'StockItem', resourceId: item._id, description: `Updated ${item.name}` }); return ok(res, item, 'Stock item updated'); }
export async function deleteItem(req, res) { const item = await StockItem.findByIdAndUpdate(req.params.id, { active: false }, { new: true }); if (!item) return fail(res, 'Stock item not found', 404); await recordAudit(req, { action: 'Stock item archived', module: 'Stock', resourceType: 'StockItem', resourceId: item._id, description: `Archived ${item.name}` }); return ok(res, item, 'Stock item archived'); }

async function mutateStock(req, res, type) {
  const quantity = Number(req.body.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) return fail(res, 'Quantity must be greater than zero', 422);
  const session = await mongoose.startSession(); let transaction;
  try { await session.withTransaction(async () => { const query = { _id: req.body.itemId, active: true }; if (type === 'out') query.quantity = { $gte: quantity }; const item = await StockItem.findOne(query).session(session); if (!item) { const error = new Error(type === 'out' ? 'Insufficient stock or item not found' : 'Stock item not found'); error.statusCode = type === 'out' ? 409 : 404; throw error; } const previousQuantity = item.quantity; item.quantity += type === 'in' ? quantity : -quantity; await item.save({ session }); [transaction] = await StockTransaction.create([{ itemId: item._id, type, quantity, previousQuantity, newQuantity: item.quantity, date: req.body.date || new Date(), party: req.body.party, supplierId: req.body.supplierId, responsibleUser: req.user._id, notes: req.body.notes }], { session }); await recordAudit(req, { action: type === 'in' ? 'Stock received' : 'Stock issued', module: 'Stock', resourceType: 'StockTransaction', resourceId: transaction._id, description: `${type} ${quantity} ${item.unit} of ${item.name}` }); }); return ok(res, transaction, type === 'in' ? 'Stock received' : 'Stock issued', 201); } finally { await session.endSession(); }
}
export const stockIn = (req, res) => mutateStock(req, res, 'in');
export const stockOut = (req, res) => mutateStock(req, res, 'out');
export async function getTransactions(req, res) { const page = Math.max(1, Number(req.query.page || 1)); const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20))); const filter = {}; if (req.query.type) filter.type = req.query.type; if (req.query.itemId) filter.itemId = req.query.itemId; const [data, total] = await Promise.all([StockTransaction.find(filter).populate('itemId', 'name code category unit').sort('-date').skip((page - 1) * limit).limit(limit), StockTransaction.countDocuments(filter)]); return list(res, data, { page, limit, total, totalPages: Math.ceil(total / limit) }); }

async function transaction(req, item, payload, session) {
  const previousQuantity = item.quantity;
  await item.save({ session });
  const [created] = await StockTransaction.create([{ itemId: item._id, responsibleUser: req.user._id, ...payload, previousQuantity, newQuantity: item.quantity }], { session });
  await recordAudit(req, { action: `Stock ${payload.type}`, module: 'Stock', resourceType: 'StockTransaction', resourceId: created._id, description: `${payload.type} transaction for ${item.name}` });
  return created;
}

export async function adjustment(req, res) {
  const physicalQuantity = Number(req.body.physicalQuantity); if (!Number.isFinite(physicalQuantity) || physicalQuantity < 0 || !req.body.reason) return fail(res, 'A valid physical quantity and reason are required', 422);
  const session = await mongoose.startSession(); let result;
  try { await session.withTransaction(async () => { const item = await StockItem.findOne({ _id: req.body.itemId, active: true }).session(session); if (!item) { const e = new Error('Stock item not found'); e.statusCode = 404; throw e; } const difference = physicalQuantity - item.quantity; if (difference === 0) { const e = new Error('No adjustment is needed'); e.statusCode = 409; throw e; } const previousQuantity = item.quantity; item.quantity = physicalQuantity; result = await transaction(req, item, { type: 'adjustment', quantity: Math.abs(difference), difference, date: req.body.date || new Date(), notes: `${req.body.reason}${req.body.notes ? ` - ${req.body.notes}` : ''}` }, session); result.systemQuantity = previousQuantity; result.physicalQuantity = physicalQuantity; }); return ok(res, result, 'Stock adjusted', 201); } finally { await session.endSession(); }
}

export async function transfer(req, res) {
  const quantity = Number(req.body.quantity); if (!Number.isFinite(quantity) || quantity <= 0 || !req.body.fromLocation || !req.body.toLocation || req.body.fromLocation === req.body.toLocation) return fail(res, 'Quantity must be positive and source/destination must be different', 422);
  const session = await mongoose.startSession(); let result;
  try { await session.withTransaction(async () => { const item = await StockItem.findOne({ _id: req.body.itemId, active: true, quantity: { $gte: quantity } }).session(session); if (!item) { const e = new Error('Insufficient stock or item not found'); e.statusCode = 409; throw e; } if (quantity === item.quantity) item.location = req.body.toLocation; result = await transaction(req, item, { type: 'transfer', quantity, date: req.body.date || new Date(), fromLocation: req.body.fromLocation, toLocation: req.body.toLocation, party: `${req.body.fromLocation} -> ${req.body.toLocation}`, notes: req.body.notes || req.body.reason }, session); }); return ok(res, result, 'Stock transferred', 201); } finally { await session.endSession(); }
}

export async function damaged(req, res) { const quantity = Number(req.body.quantity); if (!Number.isFinite(quantity) || quantity <= 0) return fail(res, 'Quantity must be greater than zero', 422); const session = await mongoose.startSession(); let record; try { await session.withTransaction(async () => { const item = await StockItem.findOne({ _id: req.body.itemId, quantity: { $gte: quantity }, active: true }).session(session); if (!item) { const e = new Error('Insufficient stock or item not found'); e.statusCode = 409; throw e; } item.quantity -= quantity; record = await DamagedStock.create([{ ...req.body, quantity, reportedBy: req.user._id }], { session }); await transaction(req, item, { type: 'damaged', quantity, date: req.body.date || new Date(), notes: req.body.notes }, session); record = record[0]; }); return ok(res, record, 'Damaged stock reported', 201); } finally { await session.endSession(); } }
export async function getDamaged(req, res) { return ok(res, await DamagedStock.find({ status: 'reported' }).populate('itemId', 'name unit quantity').sort('-createdAt')); }
export async function getDisposed(req, res) { return ok(res, await DisposedStock.find().populate('itemId', 'name unit').sort('-createdAt')); }
async function disposeDamaged(req, session) {
  const damagedRecord = await DamagedStock.findOne({ _id: req.body.damagedId, status: 'reported' }).session(session);
  if (!damagedRecord) { const e = new Error('Damaged stock record not found or already disposed'); e.statusCode = 404; throw e; }
  const item = await StockItem.findById(damagedRecord.itemId).session(session);
  damagedRecord.status = 'disposed';
  await damagedRecord.save({ session });
  const [created] = await DisposedStock.create([{
    itemId: damagedRecord.itemId,
    itemName: item?.name,
    quantityRemoved: damagedRecord.quantity,
    remainingQuantity: item ? item.quantity : 0,
    reason: 'Damaged',
    date: req.body.date || new Date(),
    responsibleUser: req.user._id,
    approvedBy: req.body.approvedBy,
    notes: req.body.notes,
  }], { session });
  await recordAudit(req, { action: 'Damaged stock disposed', module: 'Stock', resourceType: 'DisposedStock', resourceId: created._id, description: `Disposed damaged ${item?.name || 'item'} (${damagedRecord.quantity}${item?.unit || ''})` });
  return created;
}
async function disposeDirect(req, session) {
  const quantity = Number(req.body.quantity);
  const item = await StockItem.findOne({ _id: req.body.itemId, quantity: { $gte: quantity }, active: true }).session(session);
  if (!item || quantity <= 0) { const e = new Error('Insufficient stock or invalid quantity'); e.statusCode = 409; throw e; }
  const previousQuantity = item.quantity;
  item.quantity -= quantity;
  const [created] = await DisposedStock.create([{ ...req.body, quantityRemoved: quantity, remainingQuantity: item.quantity, itemName: item.name, responsibleUser: req.user._id }], { session });
  await transaction(req, item, { type: 'removed', quantity, date: req.body.date || new Date(), notes: req.body.notes }, session);
  created.previousQuantity = previousQuantity;
  return created;
}
export async function dispose(req, res) { const session = await mongoose.startSession(); let result; try { await session.withTransaction(async () => { result = req.body.damagedId ? await disposeDamaged(req, session) : await disposeDirect(req, session); }); return ok(res, result, 'Stock disposed', 201); } finally { await session.endSession(); } }
export async function expiry(req, res) { const now = new Date(); const end = new Date(now.getTime() + 30 * 86400000); const filter = { active: true, expiryDate: req.query.kind === 'expired' ? { $lt: now } : { $gte: now, $lte: end } }; return ok(res, await StockItem.find(filter).sort('expiryDate')); }
export async function dashboard(_req, res) { const items = await StockItem.find({ active: true }); const transactions = await StockTransaction.find(); const now = new Date(); const soon = new Date(now.getTime() + 30 * 86400000); const low = items.filter((i) => i.quantity > 0 && i.quantity <= i.minLevel); const out = items.filter((i) => i.quantity <= 0); return ok(res, { totalItems: items.length, itemsInStock: items.filter((i) => i.quantity > 0).length, lowStockCount: low.length, outOfStockCount: out.length, expiredCount: items.filter((i) => i.expiryDate && i.expiryDate < now).length, expiringSoonCount: items.filter((i) => i.expiryDate >= now && i.expiryDate <= soon).length, damagedCount: await DamagedStock.countDocuments({ status: 'reported' }), disposedCount: await DisposedStock.countDocuments(), totalStockValue: items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0), stockInTotal: transactions.filter((t) => t.type === 'in').reduce((sum, t) => sum + t.quantity, 0), stockOutTotal: transactions.filter((t) => t.type === 'out').reduce((sum, t) => sum + t.quantity, 0), recentTransactions: transactions.sort((a, b) => b.date - a.date).slice(0, 8), attentionRequired: [...out, ...low] }); }
