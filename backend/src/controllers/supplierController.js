import Supplier from '../models/Supplier.js';
import StockTransaction from '../models/StockTransaction.js';
import { fail, list, ok } from '../utils/api.js';

export async function getSuppliers(req, res) {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
  const filter = req.query.search ? { name: new RegExp(String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } : {};
  const [data, total] = await Promise.all([Supplier.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(limit), Supplier.countDocuments(filter)]);
  return list(res, data, { page, limit, total, totalPages: Math.ceil(total / limit) });
}
export async function getSupplier(req, res) { const supplier = await Supplier.findById(req.params.id); return supplier ? ok(res, supplier) : fail(res, 'Supplier not found', 404); }
export async function createSupplier(req, res) { return ok(res, await Supplier.create(req.body), 'Supplier created', 201); }
export async function updateSupplier(req, res) { const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }); return supplier ? ok(res, supplier, 'Supplier updated') : fail(res, 'Supplier not found', 404); }
export async function deleteSupplier(req, res) { const used = await StockTransaction.exists({ supplierId: req.params.id }); if (used) return fail(res, 'Supplier has historical stock transactions and cannot be deleted', 409); const supplier = await Supplier.findByIdAndDelete(req.params.id); return supplier ? ok(res, {}, 'Supplier deleted') : fail(res, 'Supplier not found', 404); }
export async function supplierHistory(req, res) { return ok(res, await StockTransaction.find({ supplierId: req.params.id }).populate('itemId', 'name unit').sort('-date')); }
