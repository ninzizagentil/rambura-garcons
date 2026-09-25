import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { asyncHandler } from '../utils/api.js';
import { getItems, getItem, createItem, updateItem, deleteItem, stockIn, stockOut, getTransactions, adjustment, transfer, damaged, getDamaged, dispose, expiry, dashboard, requestDisposal, approveDisposal, rejectDisposal, getPendingDisposals, getDisposedPaginated, validateBatchNumber, validateSerialNumber, getABCClassificationReport, getFastMovingReport, getSlowMovingReport } from '../controllers/stockController.js';
import { validateBody } from '../middleware/validate.js';
import { rules } from '../utils/validators.js';
const router = Router();
router.use(authenticate);
const STOCK_CATEGORIES = ['Foods', 'Other School Materials'];
const STOCK_UNITS = ['kg', 'litres', 'bags', 'cartons', 'boxes', 'pieces', 'units', 'sets'];
const itemValidation = validateBody({
  name: { ...rules.alnum('Item name'), required: true, maxLength: 100 },
  category: { enum: STOCK_CATEGORIES },
  unit: { enum: STOCK_UNITS },
  quantity: { ...rules.number('Quantity'), required: true },
  minLevel: { ...rules.number('Minimum level'), required: true },
  unitPrice: { ...rules.number('Unit value'), required: true },
  batchNumber: {
    requiredWhen: (body) => body.category === 'Foods',
    validate: (value) => /^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(String(value || '').trim()),
    message: 'Batch number must be a valid code and is required for Foods',
  },
  expiryDate: { validate: (value) => !Number.isNaN(new Date(value).getTime()), message: 'Expiry date must be valid' },
});
const movementValidation = validateBody({ quantity: rules.number('Quantity'), party: rules.alnum('Source / destination') });
router.get('/items', requirePermission('stock.view'), asyncHandler(getItems)); router.get('/items/:id/transactions', requirePermission('stock.view'), asyncHandler(async (req, res) => getTransactions({ ...req, query: { ...req.query, itemId: req.params.id } }, res))); router.get('/items/:id', requirePermission('stock.view'), asyncHandler(getItem));
router.post('/items', requirePermission('stock.create'), itemValidation, asyncHandler(createItem)); router.put('/items/:id', requirePermission('stock.update'), itemValidation, asyncHandler(updateItem)); // No permission check on purpose: nobody may delete directly, and the answer explains how to archive instead.
router.delete('/items/:id', asyncHandler(deleteItem));
router.post('/transactions/in', requirePermission('stock.in'), movementValidation, asyncHandler(stockIn)); router.post('/transactions/out', requirePermission('stock.out'), movementValidation, asyncHandler(stockOut)); router.get('/transactions', requirePermission('stock.view'), asyncHandler(getTransactions));
router.post('/transactions/adjustment', requirePermission('stock.adjust'), validateBody({ physicalQuantity: rules.number('Physical quantity') }), asyncHandler(adjustment)); router.post('/transactions/transfer', requirePermission('stock.transfer'), validateBody({ quantity: rules.number('Quantity'), fromLocation: rules.alnum('From location'), toLocation: rules.alnum('To location') }), asyncHandler(transfer));
router.get('/damaged', requirePermission('stock.view'), asyncHandler(getDamaged)); router.post('/damaged', requirePermission('stock.damage'), validateBody({ quantity: rules.number('Quantity') }), asyncHandler(damaged));
router.post('/disposal-requests', requirePermission('stock.dispose.request'), validateBody({ quantity: rules.number('Quantity') }), asyncHandler(requestDisposal));
router.get('/disposal-requests/pending', requirePermission('stock.dispose.approve'), asyncHandler(getPendingDisposals));
router.post('/disposal-requests/:id/approve', requirePermission('stock.dispose.approve'), asyncHandler(approveDisposal));
router.post('/disposal-requests/:id/reject', requirePermission('stock.dispose.approve'), asyncHandler(rejectDisposal));
router.get('/disposed', requirePermission('stock.view'), asyncHandler(getDisposedPaginated));
// POST /stock/disposed — two sub-flows with different authorization:
//  - damagedId present: finalise a damage record (no stock deduction, stock.damage is enough)
//  - direct dispose:    immediately removes stock (requires stock.dispose.approve — management only)
router.post('/disposed', (req, res, next) => {
  const permission = req.body.damagedId ? 'stock.damage' : 'stock.dispose.approve';
  return requirePermission(permission)(req, res, next);
}, validateBody({ quantity: rules.number('Quantity'), approvedBy: rules.name('Approved by') }), asyncHandler(dispose));

router.post('/validate/batch', requirePermission('stock.view'), asyncHandler(validateBatchNumber));
router.post('/validate/serial', requirePermission('stock.view'), asyncHandler(validateSerialNumber));

router.get('/reports/abc-classification', requirePermission('stock.reports'), asyncHandler(getABCClassificationReport));
router.get('/reports/fast-moving', requirePermission('stock.reports'), asyncHandler(getFastMovingReport));
router.get('/reports/slow-moving', requirePermission('stock.reports'), asyncHandler(getSlowMovingReport));

router.get('/expired', requirePermission('stock.view'), asyncHandler((req, res) => expiry({ ...req, query: { ...req.query, kind: 'expired' } }, res))); router.get('/expiring-soon', requirePermission('stock.view'), asyncHandler((req, res) => expiry({ ...req, query: { ...req.query, kind: 'soon' } }, res)));
router.get('/dashboard', requirePermission('stock.view'), asyncHandler(dashboard));
export default router;
