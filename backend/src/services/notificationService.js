import User from '../models/User.js';
import Notification from '../models/Notification.js';

export async function dispatchWorkflowNotification({
  userIds = [],
  roles = [],
  title,
  message,
  type = 'info',
  module,
  link,
  dedupeKey,
}) {
  const filters = [];
  if (userIds.length) filters.push({ _id: { $in: userIds } });
  if (roles.length) filters.push({ role: { $in: roles } });
  if (!filters.length) return [];

  const users = await User.find({ $or: filters, status: 'active' }).select('_id').lean();
  if (!users.length) return [];

  const notifications = users.map(({ _id: userId }) => ({
    userId,
    title,
    message,
    type,
    module,
    link,
    dedupeKey,
  }));

  return Notification.insertMany(notifications);
}
