import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../utils/api.js';
import { getBooks, getBook, createBook, updateBook, deleteBook, borrowBook, getLoans, returnBook, overdueLoans } from '../controllers/libraryController.js';

const router = Router();
router.use(authenticate);
router.get('/books', asyncHandler(getBooks));
router.get('/books/:id', asyncHandler(getBook));
router.post('/books', authorize('admin', 'librarian'), asyncHandler(createBook));
router.put('/books/:id', authorize('admin', 'librarian'), asyncHandler(updateBook));
router.delete('/books/:id', authorize('admin', 'librarian'), asyncHandler(deleteBook));
router.post('/loans', authorize('admin', 'librarian'), asyncHandler(borrowBook));
router.get('/loans/overdue', asyncHandler(overdueLoans));
router.get('/loans', asyncHandler(getLoans));
router.post('/loans/:id/return', authorize('admin', 'librarian'), asyncHandler(returnBook));
export default router;
