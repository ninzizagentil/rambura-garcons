import { NavLink } from 'react-router-dom';
import { X, GraduationCap } from 'lucide-react';
import { NAV_BY_ROLE, ROLE_LABELS } from '../../data/roles';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

export default function MobileMenu() {
  const { role } = useAuth();
  const { mobileMenuOpen, closeMobileMenu } = useApp();
  const navItems = NAV_BY_ROLE[role] || [];

  if (!mobileMenuOpen) return null;

  return (
    <div className="fixed inset-0 z-40 md:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={closeMobileMenu} aria-hidden="true" />
      <div className="absolute inset-y-0 left-0 w-[280px] bg-[var(--color-deep-green)] text-white flex flex-col">
        <div className="flex items-center justify-between px-4 h-16 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[var(--color-gold)]">
              <GraduationCap className="w-5 h-5 text-white" aria-hidden="true" />
            </span>
            <div className="leading-tight">
              <p className="font-display font-semibold text-sm">Rambura Garçons</p>
              <p className="text-[11px] text-white/60">{ROLE_LABELS[role]}</p>
            </div>
          </div>
          <button type="button" onClick={closeMobileMenu} aria-label="Close menu" className="p-1.5 text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to.split('/').length <= 2}
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-white/15 text-white' : 'text-white/75 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <item.icon className="w-[18px] h-[18px] flex-shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
