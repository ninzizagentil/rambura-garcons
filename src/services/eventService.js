import { api } from './api';

let events = [];
const normalize = (event) => ({ ...event, id: event.id || event._id });
export async function refreshEvents() {
  const result = await api.get('/events');
  events = (Array.isArray(result.data) ? result.data : []).map(normalize);
  window.dispatchEvent(new Event('rg:events-updated'));
  return events;
}
export async function getPublicEvents() {
  const result = await api.get('/events/public');
  return (Array.isArray(result.data) ? result.data : []).map(normalize);
}
export function getEvents() { return events; }
async function mutate(method, path, data = {}) {
  try { const result = await api[method](path, data); await refreshEvents(); return { success: true, event: result.data }; }
  catch (error) { return { success: false, error: error.message }; }
}
export const createEvent = (data) => mutate('post', '/events', data);
export const updateEvent = (id, data) => mutate('put', `/events/${id}`, data);
export const deleteEvent = (id) => mutate('delete', `/events/${id}`);
