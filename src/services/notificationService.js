import { api } from './api';
export async function getNotifications(params = {}) { const first = await api.get('/notifications', { ...params, page: 1, limit: 100 }); const pages = first.pagination?.totalPages || 1; const rest = await Promise.all(Array.from({ length: Math.max(0, pages - 1) }, (_, index) => api.get('/notifications', { ...params, page: index + 2, limit: 100 }))); return [first.data || [], ...rest.map((result) => result.data || [])].flat(); }
export async function markNotificationRead(id) { const result = await api.patch(`/notifications/${id}/read`, {}); return result.data; }
export async function markAllNotificationsRead() { await api.patch('/notifications/read-all', {}); }
export async function deleteNotification(id) { await api.delete(`/notifications/${id}`); }
