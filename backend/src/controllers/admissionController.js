import jwt from 'jsonwebtoken';
import Admission from '../models/Admission.js';
import { env } from '../config/env.js';

import { fail, list, ok } from '../utils/api.js';

import { recordAudit } from '../services/auditService.js';

import { dispatchAlert } from '../services/alertService.js';

import { sendAdmissionStatusEmail } from '../services/emailService.js';

export async function submit(req, res) {
    if (req.body.privacyConsent !== true) {
        return fail(res, 'Privacy consent is required', 422);
    }

    const application = await Admission.create({
        fullName: req.body.fullName,
        email: req.body.email,
        phone: req.body.phone,
        program: req.body.program,
        programLabel: req.body.programLabel || req.body.program,
        dateOfBirth: req.body.dateOfBirth,
        gender: req.body.gender,
        educationLevel: req.body.educationLevel,
        district: req.body.district,
        previousSchool: req.body.previousSchool,
        guardianName: req.body.guardianName,
        guardianPhone: req.body.guardianPhone,
        guardianRelationship: req.body.guardianRelationship,
        emergencyContactName: req.body.emergencyContactName,
        emergencyContactPhone: req.body.emergencyContactPhone,
        intakeYear: req.body.intakeYear,
        applicantPhoto: req.body.applicantPhoto,
        supportingDocument: req.body.supportingDocument,
        privacyConsent: req.body.privacyConsent,
        message: req.body.message,
    });

    await recordAudit(req, {
        userName: application.fullName,
        action: 'Application submitted',
        module: 'Admissions',
        resourceId: application._id,
        description: `Application for ${application.programLabel}`,
    });

    // Do not make the applicant wait for notification e-mails (SMTP can be slow or down).
    dispatchAlert({
        roles: ['admin', 'management'],
        title: 'New application received',
        message: `${application.fullName} submitted an application for ${application.programLabel}.`,
        type: 'info',
        module: 'Admissions',
        link: '/management/applications',
        dedupeKey: `application-${application._id}`,
    }).catch((error) => console.warn('[alert] new-application alert failed:', error.message));

    // Only the small confirmation is returned - not the uploaded photo/document (up to 3 MB each).
    return ok(res, {
        _id: application._id,
        referenceNumber: application.referenceNumber,
        fullName: application.fullName,
        programLabel: application.programLabel,
        status: application.status,
        submittedAt: application.submittedAt,
    }, 'Application submitted', 201);
}

export async function getApplications(req, res) {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const filter = req.query.status ? { status: req.query.status } : {};

    const [data, total] = await Promise.all([
        Admission.find(filter)
            // photos/documents are base64 (up to 3 MB each): load them only in the detail view
            .select('-applicantPhoto -supportingDocument -adminAttachment')
            .sort('-submittedAt')
            .skip((page - 1) * limit)
            .limit(limit),
        Admission.countDocuments(filter),
    ]);

    return list(res, data, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
    });
}

export async function getApplication(req, res) {
    const item = await Admission.findById(req.params.id);

    return item
        ? ok(res, item)
        : fail(res, 'Application not found', 404);
}

const digitsOnly = (value) => String(value || '').replace(/\D/g, '');
const NOT_FOUND_MESSAGE = 'No application found. Please check your reference number and your email or phone number and try again.';

/**
 * Public endpoint - look up an application. BOTH values are required:
 *   ref     the reference number given after applying
 *   contact the email address OR phone number written on the application
 * (Email or phone alone is not enough: anyone who knows a phone number could otherwise read a
 * student's admission result.) Returns only safe public-facing fields.
 */
export async function trackApplication(req, res) {
    const ref = typeof req.query.ref === 'string' ? req.query.ref.trim().toUpperCase() : '';
    const contact = typeof req.query.contact === 'string' ? req.query.contact.trim() : '';

    if (!ref || !contact) {
        return fail(res, 'Please enter your reference number and the email address or phone number you applied with.', 422);
    }

    const item = await Admission.findOne({ referenceNumber: ref })
        .select('referenceNumber fullName email phone programLabel status submittedAt reviewedAt reviewFeedback adminAttachmentName intakeYear')
        .lean();
    const contactMatches = item && (
        item.email.toLowerCase() === contact.toLowerCase()
        || (digitsOnly(contact).length >= 9 && digitsOnly(item.phone) === digitsOnly(contact))
    );
    if (!contactMatches) return fail(res, NOT_FOUND_MESSAGE, 404);

    const hasAttachment = !!(await Admission.exists({ _id: item._id, adminAttachment: { $nin: [null, ''] } }));
    return ok(res, {
        referenceNumber: item.referenceNumber,
        fullName: item.fullName,
        programLabel: item.programLabel,
        status: item.status,
        submittedAt: item.submittedAt,
        reviewedAt: item.reviewedAt,
        reviewFeedback: item.reviewFeedback || null,
        hasAdminAttachment: hasAttachment,
        adminAttachmentName: item.adminAttachmentName || null,
        // Short-lived proof that this visitor passed the reference + contact check.
        attachmentToken: hasAttachment
            ? jwt.sign({ purpose: 'track-attachment', ref: item.referenceNumber }, env.accessSecret, { expiresIn: '15m' })
            : null,
        intakeYear: item.intakeYear,
    });
}

/**
 * Public download of the admin-uploaded attachment. Needs the short-lived token returned by
 * trackApplication, so the reference number alone can never download a file.
 */
export async function downloadAdminAttachment(req, res) {
    const ref = String(req.params.ref || '').toUpperCase();
    try {
        const payload = jwt.verify(String(req.query.token || ''), env.accessSecret);
        if (payload.purpose !== 'track-attachment' || payload.ref !== ref) throw new Error('wrong token');
    } catch {
        return fail(res, 'This download link has expired. Please check your application status again.', 403);
    }

    const item = await Admission.findOne({ referenceNumber: ref }).select('adminAttachment adminAttachmentName');

    if (!item || !item.adminAttachment) {
        return fail(res, 'Attachment not found', 404);
    }

    const match = item.adminAttachment.match(
        /^data:([^;]+);base64,(.+)$/
    );

    if (!match) {
        return fail(res, 'Attachment is corrupted', 500);
    }

    const [, mime, b64] = match;
    const buffer = Buffer.from(b64, 'base64');
    // Keep the file name header-safe (no quotes, control characters or path separators).
    const filename = (item.adminAttachmentName || 'attachment').replace(/[^\w.\- ]+/g, '_').slice(0, 120) || 'attachment';

    res.setHeader('Content-Type', mime);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`
    );
    res.setHeader('Content-Length', buffer.length);

    return res.send(buffer);
}

export async function updateStatus(req, res) {
    const allowed = ['new', 'reviewed', 'accepted', 'declined'];

    if (!allowed.includes(req.body.status)) {
        return fail(res, 'Invalid application status', 422);
    }

    const update = {
        status: req.body.status,
        reviewedAt: new Date(),
        reviewedBy: req.user._id,
    };

    if (typeof req.body.reviewFeedback === 'string') {
        const trimmed = req.body.reviewFeedback.trim();

        if (trimmed.length > 5000) {
            return fail(
                res,
                'Feedback must be 5,000 characters or fewer.',
                422
            );
        }

        update.reviewFeedback = trimmed || null;
    }

    if (req.body.adminAttachment !== undefined) {
        if (
            req.body.adminAttachment === null ||
            req.body.adminAttachment === ''
        ) {
            update.adminAttachment = null;
            update.adminAttachmentName = null;
        } else {
            if (
                typeof req.body.adminAttachment !== 'string' ||
                req.body.adminAttachment.length > 3000000
            ) {
                return fail(
                    res,
                    'Attachment must be a base64 file smaller than 2 MB.',
                    422
                );
            }

            update.adminAttachment = req.body.adminAttachment;
            update.adminAttachmentName = (
                req.body.adminAttachmentName || 'attachment'
            ).slice(0, 255);
        }
    }

    const item = await Admission.findByIdAndUpdate(
        req.params.id,
        update,
        {
            new: true,
            runValidators: true,
        }
    );

    if (!item) {
        return fail(res, 'Application not found', 404);
    }

    await recordAudit(req, {
        action: 'Application status changed',
        module: 'Admissions',
        resourceId: item._id,
        description: `${item.fullName} marked ${item.status}`,
    });

    if (['accepted', 'declined'].includes(item.status)) {
        await sendAdmissionStatusEmail({
            email: item.email,
            fullName: item.fullName,
            referenceNumber: item.referenceNumber,
            programLabel: item.programLabel || item.program,
            status: item.status,
        });
    }

    return ok(res, item, 'Application status updated');
}

export async function remove(req, res) {
    const item = await Admission.findByIdAndDelete(req.params.id);

    if (!item) {
        return fail(res, 'Application not found', 404);
    }

    await recordAudit(req, {
        action: 'Application deleted',
        module: 'Admissions',
        resourceId: item._id,
        description: `Deleted application for ${item.fullName}`,
        status: 'warning',
    });

    return ok(res, {}, 'Application deleted');
}