import { fail, ok } from '../utils/api.js';
import { sendContactEmail } from '../services/emailService.js';
import ContactMessage from '../models/ContactMessage.js';
import { recordAudit } from '../services/auditService.js';
import { dispatchAlert } from '../services/alertService.js';

export async function submitContact(req, res) {
  const { name, email, subject, message } = req.body;
  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) return fail(res, 'Name, email, subject, and message are required', 422);
  const payload = { name: name.trim(), email: email.trim(), subject: subject.trim(), message: message.trim() };
  const result = await sendContactEmail(payload);
  if (!result.success && result.reason !== 'SMTP not configured') return fail(res, 'Unable to send your message right now. Please try again.', 502);
  const saved = await ContactMessage.create(payload);
  await recordAudit(req, { userName: payload.name, action: 'Contact message received', module: 'Contact', resourceType: 'ContactMessage', resourceId: saved._id, description: `${payload.name}: ${payload.subject}` });
  await dispatchAlert({ roles: ['admin', 'management'], title: 'New contact message', message: `${payload.name} sent a message: "${payload.subject}"`, type: 'info', module: 'Contact', link: '/admin/website', dedupeKey: `contact-${saved._id}` });
  return ok(res, { id: saved._id, delivered: result.success }, 'Message received. We will get back to you soon.', 201);
}