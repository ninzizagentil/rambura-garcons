import { NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import BrandMark from '../common/BrandMark';
import { NAV_BY_ROLE, ROLE_LABELS } from '../../data/roles';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { cn } from '../../utils/cn';

function MobileNavItem({ item, onNavigate }) {
  const location = useLocation();
  const hasChildren = !!item.children?.length;
  const childActive = hasChildren && item.children.some((c) => location.pathname.startsWith(c.to));
  const [open, setOpen] = useState(childActive);

  useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive]);

  if (!hasChildren) {
    return (
      <NavLink
        to={item.to}
        end={item.to.split('/').length <= 2}
        onClick={onNavigate}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium',
            isActive
              ? 'bg-[var(--sidebar-nav-active-bg)] text-[var(--sidebar-nav-active-text)]'
              : 'text-[var(--sidebar-text-secondary)] hover:bg-[var(--sidebar-nav-hover-bg)] hover:text-[var(--sidebar-text)]'
          )
        }
      >
        <item.icon className="w-[18px] h-[18px] flex-shrink-0" aria-hidden="true" />
        <span>{item.label}</span>
      </NavLink>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium',
          childActive
            ? 'bg-[var(--sidebar-nav-active-bg)] text-[var(--sidebar-nav-active-text)]'
            : 'text-[var(--sidebar-text-secondary)] hover:bg-[var(--sidebar-nav-hover-bg)] hover:text-[var(--sidebar-text)]'
        )}
      >
        <item.icon className="w-[18px] h-[18px] flex-shrink-0" aria-hidden="true" />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown className={cn('w-4 h-4 flex-shrink-0 transition-transform duration-200', open && 'rotate-180')} aria-hidden="true" />
      </button>
      {open && (
        <div className="mt-0.5 ml-[13px] pl-[19px] border-l border-[rgba(255,255,255,0.15)] space-y-0.5">
          {item.children.map((child) => (
            <NavLink
              key={child.to}
              to={child.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium',
                  isActive
                    ? 'bg-[var(--sidebar-nav-active-bg)] text-[var(--sidebar-nav-active-text)]'
                    : 'text-[var(--sidebar-text-secondary)] hover:bg-[var(--sidebar-nav-hover-bg)] hover:text-[var(--sidebar-text)]'
                )
              }
            >
              <child.icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <span>{child.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MobileMenu() {
  const { role } = useAuth();
  const { mobileMenuOpen, closeMobileMenu } = useApp();
  const navItems = NAV_BY_ROLE[role] || [];

  if (!mobileMenuOpen) return null;

  return (
    <div className="fixed inset-0 z-40 md:hidden">
      <div className="absolute inset-0 bg-[rgba(0,0,0,0.4)]" onClick={closeMobileMenu} aria-hidden="true" />
      <div className="absolute inset-y-0 left-0 w-[280px] bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] flex flex-col">
        <div className="flex items-center justify-between px-4 h-20 border-b border-[var(--sidebar-border)]">
          <div className="flex items-center gap-2.5">
            <div className="rounded-full border border-[var(--border)] bg-white p-1.5 shadow-[0_12px_26px_rgba(15,108,255,0.08)]">
              <BrandMark containerClassName="w-11 h-11 rounded-full bg-white" imgClassName="p-1.5" />
            </div>
            <div className="leading-[1.05]">
              <p className="font-display text-[12.5px] font-black tracking-[0.12em] text-[var(--sidebar-text)] uppercase">Rambura Garçons</p>
              <p className="mt-1 text-[8.5px] font-semibold uppercase tracking-[0.18em] text-[var(--sidebar-text-secondary)]">TVET Secondary School</p>
              <p className="mt-1 text-[8.5px] font-bold uppercase tracking-[0.16em] text-[var(--color-gold)]">{ROLE_LABELS[role]}</p>
            </div>
          </div>
          <button type="button" onClick={closeMobileMenu} aria-label="Close menu" className="p-1.5 text-[rgba(255,255,255,0.8)] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
          {navItems.map((item) => (
            <MobileNavItem key={item.to} item={item} onNavigate={closeMobileMenu} />
          ))}
        </nav>
      </div>
    </div>
  );
}
