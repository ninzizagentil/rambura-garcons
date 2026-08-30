import { api, clearTokens, setTokens } from './api';

const SESSION_KEY = 'rg_auth_session';

function loginErrorMessage(error) {
  if (error?.message === 'Failed to fetch' || error?.name === 'TypeError') {
    return 'The server is unavailable. Start the backend and MongoDB, then try again.';
  }

  // Preserve useful messages returned by the API, while always falling back
  // to a clear, actionable message for unexpected failures.
  return error?.message || 'Unable to sign in right now. Please try again.';
}

/**
 * Demo authentication only — checks against local mock users.
 * Swap the body of this function for a real API call (e.g. POST /auth/login)
 * when a backend is connected; the return shape can stay the same.
 */
export async function login({ identifier, password }) {
  try {
    const result = await api.post('/auth/login', { identifier, password });
    setTokens(result.data);
    persistSession(result.data.user);
    window.dispatchEvent(new Event('rg:authenticated'));
    return { success: true, user: result.data.user };
  } catch (error) {
    return { success: false, error: loginErrorMessage(error) };
  }
}

export async function logout() {
  try { await api.post('/auth/logout', {}); } catch { /* session may already be expired */ }
  clearTokens();
  localStorage.removeItem(SESSION_KEY);
}

export async function getSession() {
  try {
    const result = await api.get('/auth/me');
    persistSession(result.data);
    return result.data;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function persistSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

/**
 * Placeholder permission model: role-based for now, structured so a real
 * permission matrix (per the Roles & Permissions admin screen) can slot in
 * without changing the call sites that use hasPermission().
 */
export function hasPermission(user, permission) {
  return !!user && (user.role === 'admin' || user.permissions?.includes(permission));
}
