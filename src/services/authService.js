import { DEMO_USERS } from '../data/users';

const SESSION_KEY = 'rg_auth_session';

/**
 * Demo authentication only — checks against local mock users.
 * Swap the body of this function for a real API call (e.g. POST /auth/login)
 * when a backend is connected; the return shape can stay the same.
 */
export function login({ identifier, password }) {
  const found = DEMO_USERS.find(
    (u) => (u.username === identifier || u.email === identifier) && u.password === password
  );
  if (!found) {
    return { success: false, error: 'Invalid username/email or password.' };
  }
  if (found.status !== 'active') {
    return { success: false, error: 'This account has been deactivated. Contact the administrator.' };
  }
  // eslint-disable-next-line no-unused-vars
  const { password: _pw, ...safeUser } = found;
  persistSession(safeUser);
  return { success: true, user: safeUser };
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
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
export function hasPermission(user, _permission) {
  if (!user) return false;
  return true; // demo: role-level access already covers current module scope
}
