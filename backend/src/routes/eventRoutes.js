import { Router } from 'express';
import { authenticate, requireAnyPermission } from '../middleware/auth.js';
import { asyncHandler } from '../utils/api.js';
import { publicEvents, listEvents, createEvent, updateEvent, deleteEvent } from '../controllers/eventController.js';
import { validateBody } from '../middleware/validate.js';
import { rules } from '../utils/validators.js';

const router = Router();
const eventValidation = validateBody({ title: rules.alnum('Title'), location: rules.alnum('Location') });
router.get('/public', asyncHandler(publicEvents));
router.use(authenticate);
router.get('/', requireAnyPermission('events.view', 'website.view'), asyncHandler(listEvents));
router.post('/', requireAnyPermission('events.manage', 'website.create'), eventValidation, asyncHandler(createEvent));
router.put('/:id', requireAnyPermission('events.manage', 'website.update'), eventValidation, asyncHandler(updateEvent));
router.delete('/:id', requireAnyPermission('events.manage', 'website.delete'), asyncHandler(deleteEvent));
export default router;
