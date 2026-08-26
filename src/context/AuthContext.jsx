import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, clearTokens } from '../services/api';
import { getSession, hasPermission as canPermission, login as authenticate, logout as endSession } from '../services/authService';

const AuthContext = createContext(null);
const STORAGE_KEY = 'rg_auth_session';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    getSession().then(setUser).finally(() => setInitializing(false));
    const handleExpired = () => { setUser(null); clearTokens(); localStorage.removeItem(STORAGE_KEY); };
    window.addEventListener('rg:session-expired', handleExpired);
    return () => window.removeEventListener('rg:session-expired', handleExpired);
  }, []);

  const login = useCallback(async ({ identifier, password }) => {
    const result = await authenticate({ identifier, password });
    if (result.success) {
      setUser(result.user);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(result.user));
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
