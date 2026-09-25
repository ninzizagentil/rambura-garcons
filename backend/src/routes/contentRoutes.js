import { Router } from 'express';
import { authenticate, authorize, requireAnyPermission, requirePermission } from '../middleware/auth.js';
import { asyncHandler, fail, ok } from '../utils/api.js';
import { publicList, publicDetail, adminList, adminCreate, adminUpdate, adminDelete, publishNews, getSettings, updateSettings, updateDevelopersPageSettings, getHero, updateHero, getEmailSettings, updateEmailSettings } from '../controllers/contentController.js';
import { submit, getApplications, getApplication, updateStatus, remove, trackApplication, downloadAdminAttachment } from '../controllers/admissionController.js';
import { submitContact } from '../controllers/contactController.js';
import ContactMessage from '../models/ContactMessage.js';
import { validateBody } from '../middleware/validate.js';
import { rules } from '../utils/validators.js';
import { trackingLimiter, publicFormLimiter } from '../middleware/rateLimits.js';
const publicRouter = Router();
const currentYear = new Date().getFullYear();
const applicationValidation = validateBody({
	fullName: rules.name('Full name', { required: true, maxLength: 120 }), email: { required: true, email: true, maxLength: 160 },
	phone: rules.phone('Phone number', { required: true, maxLength: 40 }), program: { required: true, maxLength: 120 },
	dateOfBirth: { required: true, maxLength: 30, validate: (value) => !Number.isNaN(Date.parse(value)) && new Date(value) <= new Date(), message: 'dateOfBirth must be a valid date that is not in the future' },
	gender: { required: true, enum: ['female', 'male'] },
	educationLevel: { required: true, enum: ['ordinary-level', 'advanced-level'] },
	district: rules.name('District', { required: true, maxLength: 100 }), guardianName: rules.name('Guardian name', { required: true, maxLength: 120 }),
	guardianPhone: rules.phone('Guardian phone number', { required: true, maxLength: 40 }), guardianRelationship: rules.name('Relationship', { required: true, maxLength: 60 }),
	emergencyContactName: rules.name('Emergency contact name', { maxLength: 120 }), emergencyContactPhone: rules.phone('Emergency contact phone number', { maxLength: 40 }),
	intakeYear: { required: true, enum: [String(currentYear)] },
	applicantPhoto: { maxLength: 3000000 }, supportingDocument: { maxLength: 3000000 }, privacyConsent: { required: true },
	previousSchool: rules.alnum('Previous school', { maxLength: 160 }), message: { maxLength: 3000 },
});
publicRouter.post('/applications', publicFormLimiter, applicationValidation, asyncHandler(submit));
publicRouter.get('/track-application', trackingLimiter, asyncHandler(trackApplication));
publicRouter.get('/track-attachment/:ref', trackingLimiter, asyncHandler(downloadAdminAttachment));
publicRouter.post('/contact', publicFormLimiter, validateBody({ name: rules.name('Name', { required: true, maxLength: 120 }), email: { required: true, email: true, maxLength: 160 }, subject: rules.alnum('Subject', { required: true, maxLength: 160 }), message: { required: true, maxLength: 5000 } }), asyncHandler(submitContact));
publicRouter.get('/settings', asyncHandler(getSettings)); publicRouter.get('/home', asyncHandler(getHero)); publicRouter.get('/:resource/:slug', asyncHandler(publicDetail)); publicRouter.get('/:resource', asyncHandler(publicList));
const adminRouter = Router();
adminRouter.use(authenticate);

// ── Contact messages ──────────────────────────────────────────────────────────
adminRouter.get('/contact-messages', requirePermission('applications.view'), asyncHandler(async (_req, res) => {
	const data = await ContactMessage.find().sort({ createdAt: -1 }).limit(500);
	return ok(res, data);
}));

// Mark a single message as read
adminRouter.patch('/contact-messages/:id/read', requirePermission('applications.update'), asyncHandler(async (req, res) => {
	const message = await ContactMessage.findByIdAndUpdate(req.params.id, { status: 'read' }, { new: true });
	return message ? ok(res, message, 'Message marked as read') : fail(res, 'Message not found', 404);
}));

// Bulk-mark as read: body { target: 'all' | 'unread' }
adminRouter.patch('/contact-messages-bulk/read', requirePermission('applications.update'), asyncHandler(async (req, res) => {
	const filter = req.body.target === 'unread' ? { status: 'new' } : {};
	const result = await ContactMessage.updateMany(filter, { status: 'read' });
	return ok(res, { modified: result.modifiedCount }, 'Messages marked as read');
}));

// Bulk-delete: body { target: 'all' | 'read' }
adminRouter.post('/contact-messages-bulk/delete', requirePermission('applications.update'), asyncHandler(async (req, res) => {
	const filter = req.body.target === 'read' ? { status: 'read' } : {};
	const result = await ContactMessage.deleteMany(filter);
	return ok(res, { deleted: result.deletedCount }, 'Messages deleted');
}));

// Delete a single message
adminRouter.delete('/contact-messages/:id', requirePermission('applications.update'), asyncHandler(async (req, res) => {
	const message = await ContactMessage.findByIdAndDelete(req.params.id);
	return message ? ok(res, { id: message._id }, 'Contact message deleted') : fail(res, 'Contact message not found', 404);
}));

// ── Generic CMS resource routes ───────────────────────────────────────────────
adminRouter.put('/developers-page', requirePermission('applications.update'), asyncHandler(updateDevelopersPageSettings));
adminRouter.get('/settings', requireAnyPermission('settings.view', 'website.view'), asyncHandler(getSettings));
adminRouter.put('/settings', requireAnyPermission('settings.update', 'website.update'), asyncHandler(updateSettings));
adminRouter.get('/website/hero', requireAnyPermission('website.view'), asyncHandler(getHero));
adminRouter.put('/website/hero', requireAnyPermission('website.update'), asyncHandler(updateHero));
adminRouter.get('/email-settings', authorize('admin'), asyncHandler(getEmailSettings));
adminRouter.put('/email-settings', authorize('admin'), asyncHandler(updateEmailSettings));
adminRouter.post('/news/:id/publish', requireAnyPermission('website.update'), asyncHandler((req, res) => publishNews({ ...req, body: { ...req.body, published: true } }, res)));
adminRouter.post('/news/:id/unpublish', requireAnyPermission('website.update'), asyncHandler((req, res) => publishNews({ ...req, body: { ...req.body, published: false } }, res)));
adminRouter.get('/:resource', requireAnyPermission('website.view'), asyncHandler(adminList));
adminRouter.post('/:resource', requireAnyPermission('website.create'), asyncHandler(adminCreate));
adminRouter.put('/:resource/:id', requireAnyPermission('website.update'), asyncHandler(adminUpdate));
adminRouter.delete('/:resource/:id', requireAnyPermission('website.delete'), asyncHandler(adminDelete));
const applicationRouter = Router(); applicationRouter.use(authenticate); applicationRouter.get('/', requirePermission('applications.view'), asyncHandler(getApplications)); applicationRouter.get('/:id', requirePermission('applications.view'), asyncHandler(getApplication)); applicationRouter.patch('/:id/status', requirePermission('applications.update'), asyncHandler(updateStatus)); applicationRouter.delete('/:id', requirePermission('applications.update'), asyncHandler(remove));
export { publicRouter, adminRouter, applicationRouter };
