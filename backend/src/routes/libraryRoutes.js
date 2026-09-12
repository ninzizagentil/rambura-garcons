import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { asyncHandler } from '../utils/api.js';
import { getBooks, getBook, createBook, updateBook, deleteBook, borrowBook, getLoans, returnBook, overdueLoans } from '../controllers/libraryController.js';

const router = Router();
router.use(authenticate);
router.get('/books', requirePermission('library.view'), asyncHandler(getBooks));
router.get('/books/:id', requirePermission('library.view'), asyncHandler(getBook));
router.post('/books', requirePermission('library.books.create'), asyncHandler(createBook));
router.put('/books/:id', requirePermission('library.books.update'), asyncHandler(updateBook));
router.delete('/books/:id', requirePermission('library.books.delete'), asyncHandler(deleteBook));
router.post('/loans', requirePermission('library.borrow'), asyncHandler(borrowBook));
router.get('/loans/overdue', requirePermission('library.view'), asyncHandler(overdueLoans));
router.get('/loans', requirePermission('library.view'), asyncHandler(getLoans));
router.post('/loans/:id/return', requirePermission('library.return'), asyncHandler(returnBook));
export default router;
