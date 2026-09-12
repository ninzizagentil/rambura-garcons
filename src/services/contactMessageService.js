import { api } from './api';

export async function getContactMessages() {
  const result = await api.get('/admin/contact-messages');
  return result.data || [];
}

export async function deleteContactMessage(id) {
  return api.delete(`/admin/contact-messages/${id}`);
}
