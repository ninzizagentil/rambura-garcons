import { useEffect, useState } from 'react';
import { api } from './api';

let activity = [];
let loading;
let loadingKey;
let activityRequestId = 0;

// Only administrators and management (permission audit.view) may read the activity log.
// Other roles used to send this request anyway and got a 403 on every login and every action.
function canReadActivity() {
  try {
    const user = JSON.parse(localStorage.getItem('rg_auth_session') || 'null');
    return !!user && !!user.permissions?.includes('audit.view');
  } catch {
    return false;
  }
}

export async function refreshActivity(filters = {}) {
  const requestKey = JSON.stringify(filters);
  if (loading && loadingKey === requestKey) return loading;
  if (!canReadActivity()) {
    activity = [];
    return activity;
  }
  const requestId = ++activityRequestId;
  loadingKey = requestKey;
  loading = (async () => {
    const firstPage = await api.get('/activity', { limit: 100, page: 1, ...filters }, { quiet403: true });
    const totalPages = firstPage.pagination?.totalPages || 1;
    const remainingPages = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) => api.get('/activity', { limit: 100, page: index + 2, ...filters }, { quiet403: true }))
    );
    if (requestId !== activityRequestId) return activity;
    activity = [firstPage, ...remainingPages].flatMap((page) => page.data || []);
    window.dispatchEvent(new Event('rg:activity-updated'));
    return activity;
  })().finally(() => {
    if (requestId === activityRequestId) {
      loading = null;
      loadingKey = null;
    }
  });
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
