import { fail, ok } from '../utils/api.js';
import { sendContactEmail } from '../services/emailService.js';
import ContactMessage from '../models/ContactMessage.js';

export async function submitContact(req, res) {
  const { name, email, subject, message } = req.body;
  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) return fail(res, 'Name, email, subject, and message are required', 422);
  const payload = { name: name.trim(), email: email.trim(), subject: subject.trim(), message: message.trim() };
  const result = await sendContactEmail(payload);
  if (!result.success && result.reason !== 'SMTP not configured') return fail(res, 'Unable to send your message right now. Please try again.', 502);
  const saved = await ContactMessage.create(payload);
  return ok(res, { id: saved._id, delivered: result.success }, 'Message received. We will get back to you soon.', 201);
}