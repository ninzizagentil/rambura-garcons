import { Link } from 'react-router-dom';
import { Mail, ShieldCheck, KeyRound } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import { ROLE_LABELS } from '../../data/roles';
import { useAuth } from '../../context/AuthContext';

function initials(name = '') {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

export default function Profile() {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader title="My Profile" description="Your account details." />
      <div className="bg-white rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-6 max-w-lg">
        <div className="flex items-center gap-4 mb-6">
          <span className="w-16 h-16 rounded-full bg-[var(--color-medium-green)] text-white flex items-center justify-center text-xl font-semibold">
            {initials(user?.fullName)}
          </span>
          <div>
            <p className="font-display text-lg font-semibold text-[var(--color-dark-gray)]">{user?.fullName}</p>
            <p className="text-sm text-[var(--color-mid-gray)]">{ROLE_LABELS[user?.role]}</p>
          </div>
        </div>
        <dl className="space-y-3 text-sm border-t border-[var(--color-border-gray)] pt-4">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-[var(--color-mid-gray)]" aria-hidden="true" />
            <dt className="sr-only">Email</dt>
            <dd className="text-[var(--color-dark-gray)]">{user?.email}</dd>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[var(--color-mid-gray)]" aria-hidden="true" />
            <dt className="sr-only">Status</dt>
            <dd className="text-[var(--color-dark-gray)] capitalize">{user?.status}</dd>
          </div>
        </dl>
        <Link
          to="/change-password"
          className="inline-flex items-center gap-2 mt-6 text-sm font-semibold text-[var(--color-medium-green)] hover:underline"
        >
          <KeyRound className="w-4 h-4" aria-hidden="true" /> Change Password
        </Link>
      </div>
    </div>
  );
}
