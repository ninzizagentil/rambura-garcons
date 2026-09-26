import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from '../components/feedback/States';
import { api } from '../services/api';

function useMaintenanceGate() {
  const { isAuthenticated, role } = useAuth();
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || role === 'developer') {
      setMaintenanceEnabled(false);
      setChecking(false);
      return undefined;
    }

    let active = true;
    api.get('/developer/maintenance')
      .then((result) => {
        if (active) setMaintenanceEnabled(Boolean(result?.data?.enabled));
      })
      .catch(() => {
        if (active) setMaintenanceEnabled(false);
      })
      .finally(() => {
        if (active) setChecking(false);
      });

    return () => { active = false; };
  }, [isAuthenticated, role]);

  return { maintenanceEnabled, checking };
}

export function ProtectedRoute() {
  const { isAuthenticated, initializing } = useAuth();
  const { maintenanceEnabled, checking } = useMaintenanceGate();
  const location = useLocation();

  if (initializing || checking) return <LoadingState label="Checking your session…" className="min-h-screen" />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (maintenanceEnabled) return <Navigate to="/access-restricted?maintenance=1" replace />;
  return <Outlet />;
}

export function RoleProtectedRoute({ allow }) {
  const { role, isAuthenticated, initializing } = useAuth();
  const { maintenanceEnabled, checking } = useMaintenanceGate();
  const location = useLocation();

  if (initializing || checking) return <LoadingState label="Checking your session…" className="min-h-screen" />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (maintenanceEnabled) return <Navigate to="/access-restricted?maintenance=1" replace />;
  if (!allow.includes(role)) return <Navigate to="/access-restricted" replace />;
  return <Outlet />;
}

/**
 * Opens the route only while the user currently holds the permission(s).
 * `permissions` is "any of" by default; pass mode="all" to require every one.
 * The role name is deliberately NOT checked: access follows permissions, so
 * granting or removing one in Roles & Permissions takes effect straight away.
 */
export function PermissionProtectedRoute({ permissions = [], mode = 'any' }) {
  const { isAuthenticated, initializing, hasPermission } = useAuth();
  const { maintenanceEnabled, checking } = useMaintenanceGate();
  const location = useLocation();

  if (initializing || checking) return <LoadingState label="Checking your session…" className="min-h-screen" />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (maintenanceEnabled) return <Navigate to="/access-restricted?maintenance=1" replace />;

  const allowed = mode === 'all'
    ? permissions.every((permission) => hasPermission(permission))
    : permissions.some((permission) => hasPermission(permission));

  if (!allowed) return <Navigate to="/access-restricted" replace />;
  return <Outlet />;
}
