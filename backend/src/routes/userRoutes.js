import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { asyncHandler } from '../utils/api.js';
import { getUsers, getUser, createUser, updateUser, setStatus, deleteUser, resetPassword } from '../controllers/userController.js';
import { validateBody } from '../middleware/validate.js';
import { rules } from '../utils/validators.js';

const router = Router();
const userValidation = validateBody({
  fullName: rules.name('Full name', { maxLength: 120 }), username: rules.username('Username', { maxLength: 60 }),
  email: { email: true, maxLength: 160 }, phone: rules.phone('Phone number'),
});
router.use(authenticate);
router.get('/', requirePermission('users.view'), asyncHandler(getUsers));
router.get('/:id', requirePermission('users.view'), asyncHandler(getUser));
router.post('/', requirePermission('users.create'), userValidation, asyncHandler(createUser));
router.put('/:id', requirePermission('users.update'), userValidation, asyncHandler(updateUser));
router.patch('/:id/status', requirePermission('users.update'), asyncHandler(setStatus));
router.delete('/:id', requirePermission('users.delete'), asyncHandler(deleteUser));
router.post('/:id/reset-password', requirePermission('users.update'), asyncHandler(resetPassword));
export default router;
