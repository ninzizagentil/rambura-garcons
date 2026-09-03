import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../utils/api.js';
import { getItems, getItem, createItem, updateItem, deleteItem, stockIn, stockOut, getTransactions, adjustment, transfer, damaged, getDamaged, getDisposed, dispose, expiry, dashboard, requestDisposal, approveDisposal, rejectDisposal, getPendingDisposals, getDisposedPaginated, validateBatchNumber, validateSerialNumber, getABCClassificationReport, getFastMovingReport, getSlowMovingReport } from '../controllers/stockController.js';
const router = Router();
router.use(authenticate);
router.get('/items', asyncHandler(getItems)); router.get('/items/:id/transactions', asyncHandler(async (req, res) => getTransactions({ ...req, query: { ...req.query, itemId: req.params.id } }, res))); router.get('/items/:id', asyncHandler(getItem));
router.post('/items', authorize('admin', 'stock_manager'), asyncHandler(createItem)); router.put('/items/:id', authorize('admin', 'stock_manager'), asyncHandler(updateItem)); router.delete('/items/:id', authorize('admin', 'stock_manager'), asyncHandler(deleteItem));
router.post('/transactions/in', authorize('admin', 'stock_manager'), asyncHandler(stockIn)); router.post('/transactions/out', authorize('admin', 'stock_manager'), asyncHandler(stockOut)); router.get('/transactions', asyncHandler(getTransactions));
router.post('/transactions/adjustment', authorize('admin', 'stock_manager'), asyncHandler(adjustment)); router.post('/transactions/transfer', authorize('admin', 'stock_manager'), asyncHandler(transfer));
router.get('/damaged', asyncHandler(getDamaged)); router.post('/damaged', authorize('admin', 'stock_manager'), asyncHandler(damaged));
// ============ DISPOSAL APPROVAL WORKFLOW ============
router.post('/disposal-requests', authorize('admin', 'stock_manager'), asyncHandler(requestDisposal));
router.get('/disposal-requests/pending', authorize('admin'), asyncHandler(getPendingDisposals));
router.post('/disposal-requests/:id/approve', authorize('admin'), asyncHandler(approveDisposal));
router.post('/disposal-requests/:id/reject', authorize('admin'), asyncHandler(rejectDisposal));
router.get('/disposed', asyncHandler(getDisposedPaginated));
router.post('/disposed', authorize('admin', 'stock_manager'), asyncHandler(dispose));

// ============ VALIDATION ============
router.post('/validate/batch', asyncHandler(validateBatchNumber));
router.post('/validate/serial', asyncHandler(validateSerialNumber));

// ============ ANALYTICS & REPORTS ============
router.get('/reports/abc-classification', asyncHandler(getABCClassificationReport));
router.get('/reports/fast-moving', asyncHandler(getFastMovingReport));
router.get('/reports/slow-moving', asyncHandler(getSlowMovingReport));

router.get('/expired', asyncHandler((req, res) => expiry({ ...req, query: { ...req.query, kind: 'expired' } }, res))); router.get('/expiring-soon', asyncHandler((req, res) => expiry({ ...req, query: { ...req.query, kind: 'soon' } }, res)));
router.get('/dashboard', asyncHandler(dashboard));
export default router;
