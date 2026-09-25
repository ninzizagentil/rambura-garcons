import Event from '../models/Event.js';
import { fail, list, ok } from '../utils/api.js';
import { recordAudit } from '../services/auditService.js';

function slugify(value) { return String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
async function uniqueSlug(title, id) {
  const base = slugify(title) || `event-${Date.now()}`;
  let slug = base;
  let count = 2;
  while (await Event.exists({ slug, ...(id ? { _id: { $ne: id } } : {}) })) slug = `${base}-${count++}`;
  return slug;
}

export async function publicEvents(req, res) {
  const events = await Event.find({ active: true, published: true, startDate: { $gte: new Date(Date.now() - 86400000) } }).sort('startDate').limit(100);
  return ok(res, events);
}
export async function listEvents(req, res) { return list(res, await Event.find({ active: true }).sort('-startDate')); }
export async function createEvent(req, res) {
  const { title, description, startDate, endDate, location, image, published, featured } = req.body;
  if (!title?.trim() || !description?.trim() || !startDate || !location?.trim()) return fail(res, 'Title, description, date, and location are required', 422);
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;
  if (Number.isNaN(start.getTime()) || (end && Number.isNaN(end.getTime()))) return fail(res, 'Event dates must be valid', 422);
  if (end && end < start) return fail(res, 'End date cannot be before start date', 422);
  const event = await Event.create({ title: title.trim(), slug: await uniqueSlug(title), description: description.trim(), startDate, endDate, location: location.trim(), image, published: published === true || published === 'true', featured: featured === true || featured === 'true', createdBy: req.user._id });
  await recordAudit(req, { action: 'Event created', module: 'Website', resourceType: 'Event', resourceId: event._id, description: `Created event ${event.title}` });
  return ok(res, event, 'Event created', 201);
}
export async function updateEvent(req, res) {
  const event = await Event.findOne({ _id: req.params.id, active: true });
  if (!event) return fail(res, 'Event not found', 404);
  const fields = ['title', 'description', 'startDate', 'endDate', 'location', 'image', 'published', 'featured'];
  for (const field of fields) if (req.body[field] !== undefined) event[field] = req.body[field];
  if (req.body.startDate !== undefined || req.body.endDate !== undefined) {
    const start = new Date(event.startDate);
    const end = event.endDate ? new Date(event.endDate) : null;
    if (Number.isNaN(start.getTime()) || (end && Number.isNaN(end.getTime()))) return fail(res, 'Event dates must be valid', 422);
    if (end && end < start) return fail(res, 'End date cannot be before start date', 422);
  }
  if (req.body.title) event.slug = await uniqueSlug(req.body.title, event._id);
  await event.save();
  await recordAudit(req, { action: 'Event updated', module: 'Website', resourceType: 'Event', resourceId: event._id, description: `Updated event ${event.title}` });
  return ok(res, event, 'Event updated');
}
export async function deleteEvent(req, res) {
  const event = await Event.findOneAndUpdate({ _id: req.params.id, active: true }, { active: false }, { new: true });
  if (!event) return fail(res, 'Event not found', 404);
  await recordAudit(req, { action: 'Event archived', module: 'Website', resourceType: 'Event', resourceId: event._id, description: `Archived event ${event.title}` });
  return ok(res, event, 'Event archived');
}
