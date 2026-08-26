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
              ? 'bg-[rgba(255,255,255,0.16)] text-white'
              : 'text-[rgba(255,255,255,0.8)] hover:bg-[rgba(255,255,255,0.1)] hover:text-white'
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
            ? 'bg-[rgba(255,255,255,0.16)] text-white'
            : 'text-[rgba(255,255,255,0.8)] hover:bg-[rgba(255,255,255,0.1)] hover:text-white'
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
                    ? 'bg-[rgba(255,255,255,0.16)] text-white'
                    : 'text-[rgba(255,255,255,0.72)] hover:bg-[rgba(255,255,255,0.1)] hover:text-white'
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
      <div className="absolute inset-y-0 left-0 w-[280px] bg-[var(--color-deep-green)] text-white flex flex-col">
        <div className="flex items-center justify-between px-4 h-16 border-b border-[rgba(255,255,255,0.12)]">
          <div className="flex items-center gap-2.5">
            <BrandMark containerClassName="w-9 h-9 rounded-lg bg-[var(--color-gold)]" />
            <div className="leading-tight">
              <p className="font-display font-semibold text-sm text-white">Rambura Garçons</p>
              <p className="text-[11px] text-[rgba(255,255,255,0.65)]">{ROLE_LABELS[role]}</p>
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
