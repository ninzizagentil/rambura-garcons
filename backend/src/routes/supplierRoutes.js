import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../utils/api.js';
import { getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier, supplierHistory } from '../controllers/supplierController.js';

const router = Router();
router.use(authenticate);
router.get('/', asyncHandler(getSuppliers));
router.get('/:id/history', asyncHandler(supplierHistory));
router.get('/:id', asyncHandler(getSupplier));
router.post('/', authorize('admin', 'stock_manager'), asyncHandler(createSupplier));
router.put('/:id', authorize('admin', 'stock_manager'), asyncHandler(updateSupplier));
router.delete('/:id', authorize('admin', 'stock_manager'), asyncHandler(deleteSupplier));
export default router;
