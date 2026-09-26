import { Link, useSearchParams } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getHomePath } from '../../data/roles';
import Button from '../../components/common/Button';

export default function AccessRestricted() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const maintenanceMode = searchParams.get('maintenance') === '1';

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-off-white)] px-4">
      <div className="text-center max-w-md">
        <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-status-red-bg)] mb-5">
          <ShieldAlert className="w-8 h-8 text-[var(--color-status-red)]" aria-hidden="true" />
        </span>
        <h1 className="font-display text-xl font-semibold text-[var(--color-dark-gray)]">
          {maintenanceMode ? 'System Under Maintenance' : 'Access Restricted'}
        </h1>
        <p className="mt-2 text-sm text-[var(--color-mid-gray)]">
          {maintenanceMode
            ? 'The platform is temporarily under maintenance. Normal users cannot access any panel while this mode is active. Developers can still access the developer tools.'
            : 'You do not have permission to access this area.'}
        </p>
        <Link to={getHomePath(user)} className="inline-block mt-6">
          <Button variant="primary">{maintenanceMode ? 'Back to Home' : 'Back to Dashboard'}</Button>
        </Link>
      </div>
    </div>
  );
}
