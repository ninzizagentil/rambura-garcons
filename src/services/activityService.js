import { api } from './api';

let activity = [];
let loading;

export async function refreshActivity() {
  if (loading) return loading;
  loading = api.get('/activity', { limit: 100 }).then((result) => {
    activity = result.data || [];
    window.dispatchEvent(new Event('rg:activity-updated'));
    return activity;
  }).finally(() => { loading = null; });
  return loading;
}

if (typeof window !== 'undefined') window.addEventListener('rg:authenticated', () => { refreshActivity().catch(() => {}); });
export function getActivity() { return activity; }
export function logActivity({ user, action, module, status = 'success' }) {
  const payload = { user, action, module, status, description: action };
  api.post('/activity', payload).catch(() => {});
  return { id: `pending-${Date.now()}`, user, action, module, status, date: new Date().toISOString() };
}
