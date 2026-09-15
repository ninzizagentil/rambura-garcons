import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { asyncHandler } from '../utils/api.js';
import { getItems, getItem, createItem, updateItem, deleteItem, stockIn, stockOut, getTransactions, adjustment, transfer, damaged, getDamaged, getDisposed, dispose, expiry, dashboard, requestDisposal, approveDisposal, rejectDisposal, getPendingDisposals, getDisposedPaginated, validateBatchNumber, validateSerialNumber, getABCClassificationReport, getFastMovingReport, getSlowMovingReport } from '../controllers/stockController.js';
const router = Router();
router.use(authenticate);
router.get('/items', requirePermission('stock.view'), asyncHandler(getItems)); router.get('/items/:id/transactions', requirePermission('stock.view'), asyncHandler(async (req, res) => getTransactions({ ...req, query: { ...req.query, itemId: req.params.id } }, res))); router.get('/items/:id', requirePermission('stock.view'), asyncHandler(getItem));
router.post('/items', requirePermission('stock.create'), asyncHandler(createItem)); router.put('/items/:id', requirePermission('stock.update'), asyncHandler(updateItem)); router.delete('/items/:id', requirePermission('stock.delete'), asyncHandler(deleteItem));
router.post('/transactions/in', requirePermission('stock.in'), asyncHandler(stockIn)); router.post('/transactions/out', requirePermission('stock.out'), asyncHandler(stockOut)); router.get('/transactions', asyncHandler(getTransactions));
router.post('/transactions/adjustment', requirePermission('stock.adjust'), asyncHandler(adjustment)); router.post('/transactions/transfer', requirePermission('stock.transfer'), asyncHandler(transfer));
router.get('/damaged', requirePermission('stock.view'), asyncHandler(getDamaged)); router.post('/damaged', requirePermission('stock.damage'), asyncHandler(damaged));
router.post('/disposal-requests', requirePermission('stock.dispose'), asyncHandler(requestDisposal));
router.get('/disposal-requests/pending', requirePermission('stock.dispose'), asyncHandler(getPendingDisposals));
router.post('/disposal-requests/:id/approve', requirePermission('stock.dispose'), asyncHandler(approveDisposal));
router.post('/disposal-requests/:id/reject', requirePermission('stock.dispose'), asyncHandler(rejectDisposal));
router.get('/disposed', requirePermission('stock.view'), asyncHandler(getDisposedPaginated));
router.post('/disposed', requirePermission('stock.dispose'), asyncHandler(dispose));

router.post('/validate/batch', asyncHandler(validateBatchNumber));
router.post('/validate/serial', asyncHandler(validateSerialNumber));

router.get('/reports/abc-classification', asyncHandler(getABCClassificationReport));
router.get('/reports/fast-moving', asyncHandler(getFastMovingReport));
router.get('/reports/slow-moving', asyncHandler(getSlowMovingReport));

router.get('/expired', requirePermission('stock.view'), asyncHandler((req, res) => expiry({ ...req, query: { ...req.query, kind: 'expired' } }, res))); router.get('/expiring-soon', requirePermission('stock.view'), asyncHandler((req, res) => expiry({ ...req, query: { ...req.query, kind: 'soon' } }, res)));
router.get('/dashboard', requirePermission('stock.view'), asyncHandler(dashboard));
export default router;
