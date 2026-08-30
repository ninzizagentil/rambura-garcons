import { api } from './api';

export async function getRoles() {
  const result = await api.get('/roles');
  return result.data;
}

export async function getPermissions() {
  const result = await api.get('/permissions');
  return result.data;
}

export async function updateRolePermissions(roleName, permissionIds) {
  try {
    const result = await api.put(`/roles/${roleName}`, { permissions: permissionIds });
    return { success: true, role: result.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
