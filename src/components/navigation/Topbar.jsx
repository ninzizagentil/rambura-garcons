import { Menu } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import NotificationBell from './NotificationBell';
import ProfileMenu from './ProfileMenu';

export default function Topbar({ breadcrumbLabel }) {
  const { toggleMobileMenu } = useApp();
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 md:px-6 bg-white border-b border-[var(--color-border-gray)]">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleMobileMenu}
          aria-label="Open menu"
          className="md:hidden p-2 -ml-2 rounded-lg hover:bg-[var(--color-soft-gray)] text-[var(--color-dark-gray)]"
        >
          <Menu className="w-5 h-5" />
        </button>
        {breadcrumbLabel && (
          <p className="hidden sm:block text-sm text-[var(--color-mid-gray)]">{breadcrumbLabel}</p>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <NotificationBell />
        <ProfileMenu />
      </div>
    </header>
  );
}
