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

export function PermissionProtectedRoute({ allow, permissions = [] }) {
  const { role, isAuthenticated, initializing, hasPermission } = useAuth();
  const location = useLocation();

  if (initializing) return <LoadingState label="Checking your session…" className="min-h-screen" />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (role !== 'admin' && (!allow.includes(role) || !permissions.some((permission) => hasPermission(permission)))) {
    return <Navigate to="/access-restricted" replace />;
  }
  return <Outlet />;
}
