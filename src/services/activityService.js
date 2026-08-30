import { useEffect, useState } from 'react';
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
export function logActivity({ user, action, module, status = 'success' }) {
  const payload = { user, action, module, status, description: action };
  // Posting alone isn't enough — the in-memory `activity` array above is
  // only ever replaced by refreshActivity(), so without pulling a fresh
  // copy here, this brand-new entry would stay invisible to every "Recent
  // Activity" panel until the next login.
  api.post('/activity', payload).then(() => refreshActivity()).catch(() => {});
  return { id: `pending-${Date.now()}`, user, action, module, status, date: new Date().toISOString() };
}
