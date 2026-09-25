import { api } from './api';

export async function getContactMessages() {
  const result = await api.get('/admin/contact-messages');
  return result.data || [];
}

/** Delete a single message by id */
export async function deleteContactMessage(id) {
  return api.delete(`/admin/contact-messages/${id}`);
}

/** Mark a single message as read */
export async function markMessageRead(id) {
  const result = await api.patch(`/admin/contact-messages/${id}/read`, {});
  return result.data;
}

/**
 * Bulk-mark messages as read.
 * @param {'all'|'unread'} target
 */
export async function bulkMarkRead(target = 'all') {
  const result = await api.patch('/admin/contact-messages-bulk/read', { target });
  return result.data;
}

/**
 * Bulk-delete messages.
 * @param {'all'|'read'} target
 */
export async function bulkDeleteMessages(target = 'all') {
  const result = await api.post('/admin/contact-messages-bulk/delete', { target });
  return result.data;
}
