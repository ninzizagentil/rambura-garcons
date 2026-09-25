import { api } from './api';

function normalizeUser(user) { return { ...user, id: user.id || user._id }; }

export async function getUsers(params = {}) {
  const result = await api.get('/users', params);
  return Array.isArray(result.data) ? result.data.map(normalizeUser) : [];
}

export async function getUserById(id) { const result = await api.get(`/users/${id}`); return normalizeUser(result.data); }

export async function createUser(data) {
  try { const result = await api.post('/users', data); return { success: true, user: result.data }; }
  catch (error) { return { success: false, error: error.message, errors: error.errors || [] }; }
}

export async function updateUser(id, updates) {
  try { await api.put(`/users/${id}`, updates); return { success: true }; }
  catch (error) { return { success: false, error: error.message }; }
}

export async function setUserStatus(id, status) { try { await api.patch(`/users/${id}/status`, { status }); return { success: true }; } catch (error) { return { success: false, error: error.message }; } }
export async function deleteUser(id) { try { await api.delete(`/users/${id}`); return { success: true }; } catch (error) { return { success: false, error: error.message }; } }
