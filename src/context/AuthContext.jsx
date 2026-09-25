import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { api, clearTokens } from '../services/api';
import { getSession, hasPermission as canPermission, login as authenticate, logout as endSession, persistSession } from '../services/authService';

const AuthContext = createContext(null);
const STORAGE_KEY = 'rg_auth_session';
const PERMISSION_SYNC_MS = Number(import.meta.env.VITE_PERMISSION_SYNC_SECONDS || 15) * 1000;

// Only the parts that decide what the user may see/do. Comparing these (not the
// whole user object) keeps the menu from re-rendering when nothing changed.
function accessSignature(user) {
  if (!user) return '';
  return JSON.stringify([user.role, user.status, [...(user.permissions || [])].sort()]);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (!user) return undefined;
    let timer;
    const idleLimit = Number(import.meta.env.VITE_SESSION_IDLE_MINUTES || 30) * 60 * 1000;
    const resetIdleTimer = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        window.dispatchEvent(new Event('rg:session-expired'));
      }, idleLimit);
    };
    const events = ['click', 'keydown', 'mousemove', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, resetIdleTimer, { passive: true }));
    resetIdleTimer();
    return () => {
      window.clearTimeout(timer);
      events.forEach((event) => window.removeEventListener(event, resetIdleTimer));
    };
  }, [user]);

  useEffect(() => {
    getSession().then(setUser).finally(() => setInitializing(false));
    const handleExpired = () => { setUser(null); clearTokens(); localStorage.removeItem(STORAGE_KEY); };
    window.addEventListener('rg:session-expired', handleExpired);
    return () => window.removeEventListener('rg:session-expired', handleExpired);
  }, []);

  const login = useCallback(async ({ identifier, password }) => {
    const result = await authenticate({ identifier, password });
    if (result.success) {
      const session = await getSession();
      const authenticatedUser = session || result.user;
      setUser(authenticatedUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authenticatedUser));
      return { ...result, user: authenticatedUser };
    }
    return result;
  }, []);

  const logout = useCallback(async () => {
    await endSession();
    setUser(null);
  }, []);

  const hasRole = useCallback((...roles) => !!user && roles.includes(user.role), [user]);

  // Persists a profile photo (base64 data URL) onto the current session.
  // Demo/local-only persistence today (localStorage), same shape a real
  // PATCH /users/:id/avatar call would return, so swapping in a real API
  // later only means changing this function's body.
  const updateAvatar = useCallback(async (avatarDataUrl) => {
    const result = await api.patch('/auth/avatar', { profileImage: avatarDataUrl ? { imageUrl: avatarDataUrl } : null });
    setUser(result.data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result.data));
    return result.data;
  }, []);

  // Placeholder permission model: role-based for now, structured so a real
  // permission matrix (per Roles & Permissions admin screen) can slot in later.
  const hasPermission = useCallback((permission) => canPermission(user, permission), [user]);

  const refreshSession = useCallback(async () => {
    const session = await getSession();
    setUser(session);
    return session;
  }, []);

  // Re-reads the user's role + permissions from the server and swaps them in
  // ONLY when they changed, so menus and route guards update immediately after
  // an administrator edits a role. Failures are ignored on purpose: a network
  // blip must never sign someone out (an expired session is handled by api.js).
  const syncInFlight = useRef(false);
  const syncPermissions = useCallback(async () => {
    if (syncInFlight.current || !localStorage.getItem('rg_access_token')) return;
    syncInFlight.current = true;
    try {
      const result = await api.get('/auth/me');
      const fresh = result.data;
      setUser((current) => {
        if (!current || accessSignature(current) === accessSignature(fresh)) return current;
        persistSession(fresh);
        return fresh;
      });
    } catch {
      // keep the current session
    } finally {
      syncInFlight.current = false;
    }
  }, []);

  const isSignedIn = !!user;
  useEffect(() => {
    if (!isSignedIn) return undefined;
    const check = () => { if (document.visibilityState === 'visible') syncPermissions(); };
    const timer = window.setInterval(check, PERMISSION_SYNC_MS);
    window.addEventListener('focus', check);
    document.addEventListener('visibilitychange', check);
    // api.js fires this when the server answers 403 "permission required",
    // i.e. the user still had a stale menu entry — refresh right away.
    window.addEventListener('rg:permissions-changed', syncPermissions);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', check);
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('rg:permissions-changed', syncPermissions);
    };
  }, [isSignedIn, syncPermissions]);

  const updatePermissions = useCallback((permissions) => {
    setUser((currentUser) => {
      if (!currentUser) return currentUser;
      const nextUser = { ...currentUser, permissions };
      persistSession(nextUser);
      return nextUser;
    });
  }, []);

  const value = {
    user,
    role: user?.role || null,
    isAuthenticated: !!user,
    initializing,
    login,
    logout,
    hasRole,
    hasPermission,
    refreshSession,
    syncPermissions,
    updatePermissions,
    updateAvatar,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
