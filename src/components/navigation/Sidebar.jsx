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
            'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
            isActive
              ? 'bg-[linear-gradient(135deg,_rgba(44,103,84,0.12),_rgba(217,164,65,0.08))] text-[var(--sidebar-nav-active-text)] shadow-[inset_0_0_0_1px_rgba(44,103,84,0.08)]'
              : 'text-[var(--sidebar-text-secondary)] hover:bg-[var(--sidebar-nav-hover-bg)] hover:text-[var(--sidebar-text)]'
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
            'flex items-center justify-center rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
            isActive || childActive
              ? 'bg-[linear-gradient(135deg,_rgba(44,103,84,0.12),_rgba(217,164,65,0.08))] text-[var(--sidebar-nav-active-text)] shadow-[inset_0_0_0_1px_rgba(44,103,84,0.08)]'
              : 'text-[var(--sidebar-text-secondary)] hover:bg-[var(--sidebar-nav-hover-bg)] hover:text-[var(--sidebar-text)]'
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
          'w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
          childActive
            ? 'bg-[linear-gradient(135deg,_rgba(44,103,84,0.12),_rgba(217,164,65,0.08))] text-[var(--sidebar-nav-active-text)] shadow-[inset_0_0_0_1px_rgba(44,103,84,0.08)]'
            : 'text-[var(--sidebar-text-secondary)] hover:bg-[var(--sidebar-nav-hover-bg)] hover:text-[var(--sidebar-text)]'
        )}
      >
        <item.icon className="w-[18px] h-[18px] flex-shrink-0" aria-hidden="true" />
        <span className="truncate flex-1 text-left">{item.label}</span>
        <ChevronDown className={cn('w-4 h-4 flex-shrink-0 transition-transform duration-200', open && 'rotate-180')} aria-hidden="true" />
      </button>
      {open && (
        <div className="mt-1 ml-[13px] space-y-1 border-l border-[var(--sidebar-border)] pl-[18px]">
          {item.children.map((child) => (
            <NavLink
              key={child.to}
              to={child.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-[var(--sidebar-nav-active-bg)] text-[var(--sidebar-nav-active-text)]'
                    : 'text-[var(--sidebar-text-secondary)] hover:bg-[var(--sidebar-nav-hover-bg)] hover:text-[var(--sidebar-text)]'
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
        'hidden md:flex flex-col h-screen sticky top-0 border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] shadow-[0_20px_45px_rgba(14,43,39,0.12)] backdrop-blur-sm transition-[width] duration-200',
        sidebarCollapsed ? 'w-[82px]' : 'w-[272px]'
      )}
      aria-label="Main navigation"
    >
      <div className="flex h-20 items-center gap-3 border-b border-[var(--sidebar-border)] bg-[radial-gradient(circle_at_top_left,_rgba(44,103,84,0.12),_transparent_35%),linear-gradient(135deg,_rgba(44,103,84,0.04),_rgba(217,164,65,0.03))] px-4 flex-shrink-0">
        <div className="rounded-2xl border border-[rgba(44,103,84,0.12)] bg-[linear-gradient(135deg,_var(--color-gold),_#f2d299)] p-2 shadow-sm">
          <BrandMark containerClassName="w-8 h-8 rounded-xl bg-[var(--color-white)]/80 flex-shrink-0" />
        </div>
        {!sidebarCollapsed && (
          <div className="overflow-hidden leading-tight">
            <p className="font-display text-sm font-semibold tracking-[0.08em] text-[var(--sidebar-text)] uppercase">Rambura</p>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--sidebar-text-secondary)]">{ROLE_LABELS[role]}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-1.5">
        {navItems.map((item) => (
          <NavItem key={item.to} item={item} collapsed={sidebarCollapsed} />
        ))}
      </nav>

      <button
        type="button"
        onClick={toggleSidebar}
        className="mx-2 mb-3 flex items-center justify-center gap-2 rounded-2xl border border-[var(--sidebar-border)] bg-[var(--color-white)]/80 px-3 py-3 text-sm font-medium text-[var(--sidebar-text-secondary)] shadow-sm transition hover:border-[var(--color-medium-green)]/40 hover:text-[var(--sidebar-text)]"
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {sidebarCollapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
        {!sidebarCollapsed && <span>Collapse</span>}
      </button>
    </aside>
  );
}
