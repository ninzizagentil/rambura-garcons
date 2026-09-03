import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { PROFILE_NAV } from '../../data/roles';
import { useAuth } from '../../context/AuthContext';
import ConfirmModal from '../modals/ConfirmModal';
import Avatar from '../common/Avatar';

export default function ProfileMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    setConfirmLogout(false);
    navigate('/login');
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full pl-1 pr-2.5 py-1 hover:bg-[var(--color-soft-gray)]"
      >
        <Avatar name={user?.fullName} src={user?.avatar} size="sm" />
        <span className="hidden sm:block text-sm font-medium text-[var(--color-dark-gray)]">{user?.fullName}</span>
        <ChevronDown className="w-4 h-4 text-[var(--color-mid-gray)]" aria-hidden="true" />
      </button>

      {/* Uses the same semantic tokens as the rest of the app. Note: Tailwind
          v4 ties utilities like `bg-white` to the theme's --color-white
          variable, which .dark re-points to the navy card color — so a
          "fixed light" panel built from bg-white + literal hex text was
          actually going dark-background / dark-text (invisible) in dark
          mode. Using the tokens here keeps text and background in sync in
          both themes instead. */}
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-3 w-[min(19rem,calc(100vw-2rem))] overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border-gray)] bg-[var(--sidebar-bg)] shadow-[0_20px_48px_rgba(15,108,255,0.16)] z-30"
        >
          <div className="flex items-center gap-3 border-b border-[var(--color-border-gray)] bg-[var(--surface-hover)] px-4 py-4">
            <Avatar name={user?.fullName} src={user?.avatar} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--color-dark-gray)]">{user?.fullName || 'Account user'}</p>
              <p className="mt-0.5 truncate text-xs text-[var(--color-mid-gray)]">{user?.role || 'School account'}</p>
            </div>
          </div>

          <div className="space-y-1 p-2">
            {PROFILE_NAV.map((item) =>
              item.action === 'logout' ? (
                <button
                  key={item.label}
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    setConfirmLogout(true);
                  }}
                  className="group mt-2 flex w-full items-center gap-3 rounded-xl border border-[var(--color-status-red)]/20 bg-[var(--color-status-red-bg)] px-3 py-3 text-left text-sm font-semibold text-[var(--color-status-red)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-status-red)]/40 hover:bg-[var(--color-status-red-bg)] hover:shadow-[0_8px_18px_rgba(220,38,38,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-status-red)]/40"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--surface)] shadow-sm transition-transform duration-200 group-hover:translate-x-0.5">
                    <item.icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="flex-1">{item.label}</span>
                  <span className="text-xs opacity-60">&#8594;</span>
                </button>
              ) : (
                <Link
                  key={item.label}
                  to={item.to}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-[var(--color-dark-gray)] transition-colors hover:bg-[var(--surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)]/40"
                >
                  <item.icon className="h-4 w-4 text-[var(--color-mid-gray)]" aria-hidden="true" />
                  {item.label}
                </Link>
              )
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={handleLogout}
        title="Log out"
        message="Are you sure you want to log out of your Rambura Garçons account?"
        confirmLabel="Log out"
        variant="danger"
      />
    </div>
  );
}
