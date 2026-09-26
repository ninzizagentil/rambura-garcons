import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { asyncHandler } from '../utils/api.js';
import { getBooks, getBook, createBook, updateBook, borrowBook, getLoans, returnBook, overdueLoans } from '../controllers/libraryController.js';
import { validateBody } from '../middleware/validate.js';
import { rules } from '../utils/validators.js';

const router = Router();
const bookValidation = validateBody({
  title: rules.alnum('Title'), author: rules.name('Author'), bookCode: rules.code('Book code'), totalCopies: rules.integer('Number of copies'),
});
router.use(authenticate);
router.get('/books', requirePermission('library.view'), asyncHandler(getBooks));
router.get('/books/:id', requirePermission('library.view'), asyncHandler(getBook));
router.post('/books', requirePermission('library.books.create'), bookValidation, asyncHandler(createBook));
router.put('/books/:id', requirePermission('library.books.update'), bookValidation, asyncHandler(updateBook));
router.post('/loans', requirePermission('library.borrow'), validateBody({
  borrower: rules.name('Borrower name', { maxLength: 120 }),
  sdmsCode: { ...rules.code('SDMS Code', { maxLength: 40 }), requiredWhen: (body) => body.borrowerType === 'Student' },
}), asyncHandler(borrowBook));
router.get('/loans/overdue', requirePermission('library.view'), asyncHandler(overdueLoans));
router.get('/loans', requirePermission('library.view'), asyncHandler(getLoans));
router.post('/loans/:id/return', requirePermission('library.return'), asyncHandler(returnBook));
export default router;
