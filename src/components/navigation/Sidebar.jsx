import { NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ChevronsLeft, ChevronsRight, ChevronDown } from 'lucide-react';
import BrandMark from '../common/BrandMark';
import { NAV_BY_ROLE, ROLE_LABELS } from '../../data/roles';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { cn } from '../../utils/cn';

function NavItem({ item, collapsed }) {
  const location = useLocation();
  const hasChildren = !!item.children?.length;
  const childActive = hasChildren && item.children.some((c) => location.pathname.startsWith(c.to));
  const [open, setOpen] = useState(childActive);

  // Keep the group expanded automatically while a child route is active
  // (e.g. navigating between Stock MIS pages), without fighting a
  // manual collapse of an unrelated group.
  useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive]);

  if (!hasChildren) {
    return (
      <NavLink
        to={item.to}
        end={item.to.split('/').length <= 2}
        title={collapsed ? item.label : undefined}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
            isActive
              ? 'bg-[rgba(255,255,255,0.16)] text-white'
              : 'text-[rgba(255,255,255,0.8)] hover:bg-[rgba(255,255,255,0.1)] hover:text-white'
          )
        }
      >
        <item.icon className="w-[18px] h-[18px] flex-shrink-0" aria-hidden="true" />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </NavLink>
    );
  }

  // Expandable group (e.g. admin's "Stock MIS"). Collapsed sidebar: clicking
  // the group navigates straight to its dashboard, matching the plain-link
  // behavior of every other item when there's no room to show children.
  if (collapsed) {
    return (
      <NavLink
        to={item.to}
        title={item.label}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
            isActive || childActive
              ? 'bg-[rgba(255,255,255,0.16)] text-white'
              : 'text-[rgba(255,255,255,0.8)] hover:bg-[rgba(255,255,255,0.1)] hover:text-white'
          )
        }
      >
        <item.icon className="w-[18px] h-[18px] flex-shrink-0" aria-hidden="true" />
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
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
          childActive
            ? 'bg-[rgba(255,255,255,0.16)] text-white'
            : 'text-[rgba(255,255,255,0.8)] hover:bg-[rgba(255,255,255,0.1)] hover:text-white'
        )}
      >
        <item.icon className="w-[18px] h-[18px] flex-shrink-0" aria-hidden="true" />
        <span className="truncate flex-1 text-left">{item.label}</span>
        <ChevronDown className={cn('w-4 h-4 flex-shrink-0 transition-transform duration-200', open && 'rotate-180')} aria-hidden="true" />
      </button>
      {open && (
        <div className="mt-0.5 ml-[13px] pl-[19px] border-l border-[rgba(255,255,255,0.15)] space-y-0.5">
          {item.children.map((child) => (
            <NavLink
              key={child.to}
              to={child.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[rgba(255,255,255,0.16)] text-white'
                    : 'text-[rgba(255,255,255,0.72)] hover:bg-[rgba(255,255,255,0.1)] hover:text-white'
                )
              }
            >
              <child.icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <span className="truncate">{child.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const { role } = useAuth();
  const { sidebarCollapsed, toggleSidebar } = useApp();
  const navItems = NAV_BY_ROLE[role] || [];

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col bg-[var(--color-deep-green)] text-white h-screen sticky top-0 transition-[width] duration-200',
        sidebarCollapsed ? 'w-[76px]' : 'w-[264px]'
      )}
      aria-label="Main navigation"
    >
      <div className="flex items-center gap-2.5 px-4 h-16 border-b border-[rgba(255,255,255,0.12)] flex-shrink-0">
        <BrandMark containerClassName="w-9 h-9 rounded-lg bg-[var(--color-gold)] flex-shrink-0" />
        {!sidebarCollapsed && (
          <div className="leading-tight overflow-hidden">
            <p className="font-display font-semibold text-sm text-white whitespace-nowrap">Rambura Garçons</p>
            <p className="text-[11px] text-[rgba(255,255,255,0.65)] whitespace-nowrap">{ROLE_LABELS[role]}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
        {navItems.map((item) => (
          <NavItem key={item.to} item={item} collapsed={sidebarCollapsed} />
        ))}
      </nav>

      <button
        type="button"
        onClick={toggleSidebar}
        className="flex items-center gap-2 px-4 py-3.5 border-t border-[rgba(255,255,255,0.12)] text-[rgba(255,255,255,0.75)] hover:text-white text-sm"
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {sidebarCollapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
        {!sidebarCollapsed && <span>Collapse</span>}
      </button>
    </aside>
  );
}
