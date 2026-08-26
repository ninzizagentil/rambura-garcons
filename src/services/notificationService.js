import { api } from './api';
export async function getNotifications(params = {}) { const result = await api.get('/notifications', params); return result.data; }
export async function markNotificationRead(id) { const result = await api.patch(`/notifications/${id}/read`, {}); return result.data; }
export async function markAllNotificationsRead() { await api.patch('/notifications/read-all', {}); }
export async function deleteNotification(id) { await api.delete(`/notifications/${id}`); }
