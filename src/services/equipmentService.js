import { api } from './api.js';

let equipment = [];
let loading;
let lastLoadedAt = 0;
const CACHE_TTL_MS = 30_000;
export function normalizeEquipmentItem(item = {}) {
  const rawId = item.id ?? item._id ?? item.assetNumber ?? `${Date.now()}-${Math.random()}`;
  return { ...item, id: String(rawId) };
}
const list = (result) => (Array.isArray(result?.data) ? result.data : result?.data?.items || []).map(normalizeEquipmentItem);

export async function refreshEquipment({ force = false } = {}) {
  if (!force && lastLoadedAt && Date.now() - lastLoadedAt < CACHE_TTL_MS) return equipment;
  if (loading && !force) return loading;
  if (loading && force) await loading.catch(() => {});
  loading = api.get('/equipment', { page: 1, limit: 100 }).then(async (result) => {
    const firstPage = list(result);
    const totalPages = result.pagination?.totalPages || 1;
    const remaining = await Promise.all(Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) => api.get('/equipment', { page: index + 2, limit: 100 })));
    equipment = firstPage.concat(...remaining.map(list));
    lastLoadedAt = Date.now();
    window.dispatchEvent(new Event('rg:equipment-updated'));
    return equipment;
  }).catch((error) => {
    equipment = [];
    window.dispatchEvent(new Event('rg:equipment-updated'));
    throw error;
  }).finally(() => { loading = null; });
  return loading;
}
export function getEquipment() { return equipment; }
async function mutate(method, path, data = {}) {
  try { const result = await api[method](path, data); try { await refreshEquipment({ force: true }); } catch (refreshError) { console.error('[equipment] refresh after mutation failed:', refreshError); } return { success: true, equipment: result.data }; }
  catch (error) { return { success: false, error: error.message }; }
}
export const createEquipment = (data) => mutate('post', '/equipment', data);
export const updateEquipment = (id, data) => mutate('put', `/equipment/${id}`, data);
export const deleteEquipment = (id) => mutate('delete', `/equipment/${id}`);
export const assignEquipment = (id, data) => mutate('post', `/equipment/${id}/assign`, data);
export const returnEquipment = (id) => mutate('post', `/equipment/${id}/return`);
export const addMaintenance = (id, data) => mutate('post', `/equipment/${id}/maintenance`, data);
export function clearEquipmentCache() { equipment = []; lastLoadedAt = 0; window.dispatchEvent(new Event('rg:equipment-updated')); }
if (typeof window !== 'undefined') {
  window.addEventListener('rg:authenticated', () => { clearEquipmentCache(); refreshEquipment().catch(() => {}); });
  window.addEventListener('rg:session-expired', clearEquipmentCache);
}

export const requestEquipmentRetirement = (data) =>
  api.post('/equipment-retirement', data);

export const getRetirementRequests = (params = {}) =>
  api.get('/equipment-retirement', params);

export const approveRetirementRequest = (id, data = {}) =>
  api.post(`/equipment-retirement/${id}/approve`, data);

export const rejectRetirementRequest = (id, data = {}) =>
  api.post(`/equipment-retirement/${id}/reject`, data);

export const requestEquipmentArchive = (data) =>
  api.post('/equipment-archive-requests', data);

export const getEquipmentArchiveRequests = (params = {}) =>
  api.get('/equipment-archive-requests', params);

export const approveEquipmentArchiveRequest = (id, data = {}) =>
  api.post(`/equipment-archive-requests/${id}/approve`, data);

export const rejectEquipmentArchiveRequest = (id, data = {}) =>
  api.post(`/equipment-archive-requests/${id}/reject`, data);
