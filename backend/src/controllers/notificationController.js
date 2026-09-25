import Notification from '../models/Notification.js';
import { list, ok, fail } from '../utils/api.js';
import { scanOperationalAlerts } from '../services/alertService.js';

export async function scanAlerts(_req, res) {
  return ok(res, await scanOperationalAlerts(), 'Operational alerts scanned');
}

export async function createNotification(req, res) {
  const { type, title, message, link, module, dedupeKey } = req.body;
  if (!type || !message) return fail(res, 'Type and message are required', 422);
  const notification = new Notification({
    userId: req.user._id,
    title: title || 'System notification',
    type,
    message,
    module,
    link: link || null,
    dedupeKey: dedupeKey || null,
    read: false,
  });
  await notification.save();
  return ok(res, { ...notification.toObject(), id: notification._id.toString(), to: notification.link, date: notification.createdAt }, 'Notification created', 201);
}

export async function getNotifications(req, res) {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
  const filter = { userId: req.user._id };
  const [data, total] = await Promise.all([
    Notification.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(limit),
    Notification.countDocuments(filter),
  ]);
  return list(res, data.map((n) => ({ ...n.toObject(), id: n._id.toString(), to: n.link, date: n.createdAt })), {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}

export async function markRead(req, res) {
  const item = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { read: true },
    { new: true }
  );
  return item ? ok(res, item, 'Notification marked as read') : fail(res, 'Notification not found', 404);
}

export async function markAllRead(req, res) {
  await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
  return ok(res, {}, 'Notifications marked as read');
}

export async function remove(req, res) {
  const item = await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  return item ? ok(res, {}, 'Notification deleted') : fail(res, 'Notification not found', 404);
}
