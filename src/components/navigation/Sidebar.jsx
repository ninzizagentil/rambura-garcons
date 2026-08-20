import { NavLink } from 'react-router-dom';
import { GraduationCap, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { NAV_BY_ROLE, ROLE_LABELS } from '../../data/roles';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { cn } from '../../utils/cn';

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
      <div className="flex items-center gap-2.5 px-4 h-16 border-b border-white/10 flex-shrink-0">
        <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[var(--color-gold)] flex-shrink-0">
          <GraduationCap className="w-5 h-5 text-white" aria-hidden="true" />
        </span>
        {!sidebarCollapsed && (
          <div className="leading-tight overflow-hidden">
            <p className="font-display font-semibold text-sm whitespace-nowrap">Rambura Garçons</p>
            <p className="text-[11px] text-white/60 whitespace-nowrap">{ROLE_LABELS[role]}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to.split('/').length <= 2}
            title={sidebarCollapsed ? item.label : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive ? 'bg-white/15 text-white' : 'text-white/75 hover:bg-white/10 hover:text-white'
              )
            }
          >
            <item.icon className="w-[18px] h-[18px] flex-shrink-0" aria-hidden="true" />
            {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <button
        type="button"
        onClick={toggleSidebar}
        className="flex items-center gap-2 px-4 py-3.5 border-t border-white/10 text-white/70 hover:text-white text-sm"
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {sidebarCollapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
        {!sidebarCollapsed && <span>Collapse</span>}
      </button>
    </aside>
  );
}
