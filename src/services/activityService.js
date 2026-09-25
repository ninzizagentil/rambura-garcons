import { useEffect, useState } from 'react';
import { api } from './api';

let activity = [];
let loading;

// Only administrators and management (permission audit.view) may read the activity log.
// Other roles used to send this request anyway and got a 403 on every login and every action.
function canReadActivity() {
  try {
    const user = JSON.parse(localStorage.getItem('rg_auth_session') || 'null');
    return !!user && (user.role === 'admin' || !!user.permissions?.includes('audit.view'));
  } catch {
    return false;
  }
}

export async function refreshActivity() {
  if (loading) return loading;
  if (!canReadActivity()) {
    activity = [];
    return activity;
  }
  loading = api.get('/activity', { limit: 100 }, { quiet403: true }).then((result) => {
    activity = result.data || [];
    window.dispatchEvent(new Event('rg:activity-updated'));
    return activity;
  }).finally(() => { loading = null; });
  return loading;
}

if (typeof window !== 'undefined') {
  // The audit page can be opened with a session restored from storage, so it
  // cannot rely on the login event to populate its server-backed cache.
  refreshActivity().catch(() => {});
  window.addEventListener('rg:authenticated', () => { refreshActivity().catch(() => {}); });
}

// Same rationale as useContentVersion/useSiteImageVersion: getActivity()
// reads a plain in-memory array that's only populated after the async
// refreshActivity() above resolves (triggered at login, and again after
// every logActivity() call below). Call this hook anywhere that reads
// getActivity() so the component re-renders once the real log arrives.
export function useActivityVersion() {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener('rg:activity-updated', bump);
    return () => window.removeEventListener('rg:activity-updated', bump);
  }, []);
  return version;
}

export function getActivity() { return activity; }
export async function logActivity({ user, action, module, status = 'success' }) {
  const payload = { user, action, module, status, description: action };
  try {
    const result = await api.post('/activity', payload);
    await refreshActivity();
    return result.data;
  } catch {
    return null;
  }
}
