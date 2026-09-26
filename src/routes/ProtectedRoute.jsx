import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from '../components/feedback/States';

export function ProtectedRoute() {
  const { isAuthenticated, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <LoadingState label="Checking your session…" className="min-h-screen" />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
}

export function RoleProtectedRoute({ allow }) {
  const { role, isAuthenticated, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <LoadingState label="Checking your session…" className="min-h-screen" />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
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
  const location = useLocation();

  if (initializing) return <LoadingState label="Checking your session…" className="min-h-screen" />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;

  const allowed = mode === 'all'
    ? permissions.every((permission) => hasPermission(permission))
    : permissions.some((permission) => hasPermission(permission));

  if (!allowed) return <Navigate to="/access-restricted" replace />;
  return <Outlet />;
}
