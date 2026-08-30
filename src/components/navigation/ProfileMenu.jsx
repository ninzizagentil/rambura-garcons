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
          className="absolute right-0 mt-2 w-56 bg-[var(--sidebar-bg)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] shadow-card-hover py-1.5 z-30"
        >
          {PROFILE_NAV.map((item) =>
            item.action === 'logout' ? (
              <button
                key={item.label}
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  setConfirmLogout(true);
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--color-status-red)] hover:bg-[var(--color-status-red-bg)] text-left"
              >
                <item.icon className="w-4 h-4" aria-hidden="true" />
                {item.label}
              </button>
            ) : (
              <Link
                key={item.label}
                to={item.to}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--color-dark-gray)] hover:bg-[var(--color-off-white)]"
              >
                <item.icon className="w-4 h-4" aria-hidden="true" />
                {item.label}
              </Link>
            )
          )}
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
