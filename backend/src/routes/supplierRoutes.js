import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { asyncHandler } from '../utils/api.js';
import { getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier, supplierHistory } from '../controllers/supplierController.js';
import { validateBody } from '../middleware/validate.js';
import { rules } from '../utils/validators.js';

const router = Router();
const supplierValidation = validateBody({
  name: rules.alnum('Supplier name'), contactPerson: rules.name('Contact person'), phone: rules.phone('Phone number'),
  email: { email: true, maxLength: 160 }, address: rules.alnum('Address'),
});
router.use(authenticate);
router.get('/', requirePermission('stock.view'), asyncHandler(getSuppliers));
router.get('/:id/history', requirePermission('stock.view'), asyncHandler(supplierHistory));
router.get('/:id', requirePermission('stock.view'), asyncHandler(getSupplier));
router.post('/', requirePermission('stock.suppliers'), supplierValidation, asyncHandler(createSupplier));
router.put('/:id', requirePermission('stock.suppliers'), supplierValidation, asyncHandler(updateSupplier));
router.delete('/:id', requirePermission('stock.suppliers'), asyncHandler(deleteSupplier));
export default router;
