import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { DEMO_USERS } from '../data/users';

const AuthContext = createContext(null);
const STORAGE_KEY = 'rg_auth_session';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setInitializing(false);
    }
  }, []);

  const login = useCallback(({ identifier, password }) => {
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
    setUser(safeUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safeUser));
    return { success: true, user: safeUser };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const hasRole = useCallback((...roles) => !!user && roles.includes(user.role), [user]);

  // Persists a profile photo (base64 data URL) onto the current session.
  // Demo/local-only persistence today (localStorage), same shape a real
  // PATCH /users/:id/avatar call would return, so swapping in a real API
  // later only means changing this function's body.
  const updateAvatar = useCallback((avatarDataUrl) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, avatar: avatarDataUrl };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Placeholder permission model: role-based for now, structured so a real
  // permission matrix (per Roles & Permissions admin screen) can slot in later.
  const hasPermission = useCallback(
    (_permission) => {
      if (!user) return false;
      if (user.role === 'admin') return true;
      return true; // demo: role-level access covers current module scope
    },
    [user]
  );

  const value = {
    user,
    role: user?.role || null,
    isAuthenticated: !!user,
    initializing,
    login,
    logout,
    hasRole,
    hasPermission,
    updateAvatar,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
