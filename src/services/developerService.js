import { api } from './api';

export async function getDeveloperOverview() {
  const result = await api.get('/developer/overview');
  return result.data;
}

export async function getDeveloperDiagnostics() {
  const result = await api.get('/developer/diagnostics');
  return result.data;
}

export async function getDeveloperUsers() {
  const result = await api.get('/developer/users');
  return Array.isArray(result.data) ? result.data : [];
}

export async function getDeveloperRoles() {
  const result = await api.get('/developer/roles');
  return Array.isArray(result.data) ? result.data : [];
}

export async function troubleshootAccess({ userId, module = 'stock', action = 'view' }) {
  const result = await api.get('/developer/access-troubleshooter', { userId, module, action });
  return result.data;
}

export async function listDeveloperBackups() {
  const result = await api.get('/developer/backups');
  return Array.isArray(result.data) ? result.data : [];
}

export async function createDeveloperBackup() {
  const result = await api.post('/developer/backups', {});
  return result.data;
}

export async function restoreDeveloperBackup(fileName) {
  const result = await api.post(`/developer/backups/${encodeURIComponent(fileName)}/restore`, { confirm: true });
  return result.data;
}

export async function getMaintenanceMode() {
  const result = await api.get('/developer/maintenance');
  return Boolean(result.data?.enabled);
}

export async function setMaintenanceMode(enabled) {
  const result = await api.patch('/developer/maintenance', { enabled });
  return Boolean(result.data?.enabled);
}
