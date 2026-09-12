import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { asyncHandler } from '../utils/api.js';
import { getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier, supplierHistory } from '../controllers/supplierController.js';

const router = Router();
router.use(authenticate);
router.get('/', asyncHandler(getSuppliers));
router.get('/:id/history', asyncHandler(supplierHistory));
router.get('/:id', asyncHandler(getSupplier));
router.post('/', requirePermission('stock.suppliers'), asyncHandler(createSupplier));
router.put('/:id', requirePermission('stock.suppliers'), asyncHandler(updateSupplier));
router.delete('/:id', requirePermission('stock.suppliers'), asyncHandler(deleteSupplier));
export default router;
