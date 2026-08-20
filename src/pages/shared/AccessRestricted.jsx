import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_HOME } from '../../data/roles';
import Button from '../../components/common/Button';

export default function AccessRestricted() {
  const { role } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-off-white)] px-4">
      <div className="text-center max-w-sm">
        <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-status-red-bg)] mb-5">
          <ShieldAlert className="w-8 h-8 text-[var(--color-status-red)]" aria-hidden="true" />
        </span>
        <h1 className="font-display text-xl font-semibold text-[var(--color-dark-gray)]">Access Restricted</h1>
        <p className="text-sm text-[var(--color-mid-gray)] mt-2">You do not have permission to access this area.</p>
        <Link to={role ? ROLE_HOME[role] : '/login'} className="inline-block mt-6">
          <Button variant="primary">Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
