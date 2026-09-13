import { NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ChevronsLeft, ChevronsRight, ChevronDown, GraduationCap, Languages } from 'lucide-react';
import BrandMark from '../common/BrandMark';
import { NAV_BY_ROLE, ROLE_LABELS, filterNavItems } from '../../data/roles';
import { useAuth } from '../../context/AuthContext';
import { useApp, LANGUAGE_OPTIONS } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../utils/cn';

function translateLabel(label, t) {
  const labelMap = {
    'Dashboard': 'dashboard',
    'Website': 'website',
    'Reports': 'reports',
    'Users & Roles': 'usersRoles',
    'Roles & Permissions': 'rolesPermissions',
    'Activity / Audit': 'activityAudit',
    'Settings': 'settings',
    'Library MIS': 'libraryMis',
    'Stock MIS': 'stockMis',
    'School Modules': 'schoolModules',
    Administration: 'administration',
    Inventory: 'inventory',
    Operations: 'operations',
    'Transfer Stock': 'transferStock',
    'Adjust Stock': 'adjustStock',
    Items: 'allItems',
    Alerts: 'stockAlerts',
    'Receive Stock': 'stockInMenu',
    'Issue Stock': 'stockOutMenu',
    Transfer: 'stockTransfer',
    Adjust: 'stockAdjustment',
    'Damage & Disposal': 'damageDisposal',
    Activity: 'activity',
    'All Items': 'allItems',
    'Low Stock': 'lowStockMenu',
    'Out of Stock': 'outOfStockMenu',
    'Damaged Items': 'damagedItems',
    'Expired Items': 'expiredItems',
    'Removed / Disposed': 'removedDisposed',
    'Stock Operations': 'stockOperations',
    'Stock In': 'stockInMenu',
    'Stock Out': 'stockOutMenu',
    'Stock Adjustment': 'stockAdjustment',
    'Stock Transfer': 'stockTransfer',
    'Transactions': 'transactions',
    'Suppliers': 'suppliers',
    'Usage Analytics': 'usageAnalytics',
    'Stock Reports': 'stockReports',
    'Books': 'books',
    'Borrowed Books': 'borrowedBooks',
    'Overdue Books': 'overdueBooks',
    'Returns': 'returns',
    'Borrowing History': 'borrowingHistory',
    'Library Reports': 'libraryReports',
    'Applications': 'applications',
    'Management Insights': 'managementInsights',
    'Notifications': 'notifications',
    'Profile': 'profile',
    'Change Password': 'changePassword',
    'Logout': 'logout',
    'Collapse': 'collapse',
    'IT / System Administrator': 'roleAdmin',
    Librarian: 'roleLibrarian',
    'Stock Manager': 'roleStockManager',
    'School Management / Director': 'roleManagement',
  };
  return t(labelMap[label] || label);
}

function NavItem({ item, collapsed }) {
  const { t } = useApp();
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
        title={collapsed ? translateLabel(item.label, t) : undefined}
        className={({ isActive }) =>
          cn(
            'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold tracking-[0.01em] transition-all duration-200 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-full before:bg-[var(--color-gold)] before:opacity-0 before:transition-opacity hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(0,0,0,0.18)]',
            isActive
              ? 'bg-[var(--sidebar-nav-active-bg)] text-[var(--sidebar-nav-active-text)] shadow-[0_10px_22px_rgba(23,59,49,0.12)] ring-1 ring-[var(--color-gold)]/20 before:opacity-100'
              : 'text-[var(--sidebar-text-secondary)] hover:bg-[var(--sidebar-nav-hover-bg)] hover:text-[var(--sidebar-text)] before:opacity-0'
          )
        }
      >
        <item.icon className="h-[18px] w-[18px] flex-shrink-0" aria-hidden="true" />
        {!collapsed && <span className="truncate">{translateLabel(item.label, t)}</span>}
      </NavLink>
    );
  }

  if (collapsed) {
    return (
      <NavLink
        to={item.to}
        title={translateLabel(item.label, t)}
        className={({ isActive }) =>
          cn(
            'group relative flex items-center justify-center rounded-xl px-3 py-2.5 text-sm font-semibold tracking-[0.01em] transition-all duration-200 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-full before:bg-[var(--color-gold)] before:opacity-0 before:transition-opacity hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(0,0,0,0.18)]',
            isActive || childActive
              ? 'bg-[var(--sidebar-nav-active-bg)] text-[var(--sidebar-nav-active-text)] shadow-[0_10px_22px_rgba(23,59,49,0.12)] ring-1 ring-[var(--color-gold)]/20 before:opacity-100'
              : 'text-[var(--sidebar-text-secondary)] hover:bg-[var(--sidebar-nav-hover-bg)] hover:text-[var(--sidebar-text)] before:opacity-0'
          )
        }
      >
        <item.icon className="h-[18px] w-[18px] flex-shrink-0" aria-hidden="true" />
      </NavLink>
    );
  }

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold tracking-[0.01em] transition-all duration-200 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-full before:bg-[var(--color-gold)] before:opacity-0 before:transition-opacity hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(0,0,0,0.18)]',
          childActive
            ? 'bg-[var(--sidebar-nav-active-bg)] text-[var(--sidebar-nav-active-text)] shadow-[0_10px_22px_rgba(23,59,49,0.12)] ring-1 ring-[var(--color-gold)]/20 before:opacity-100'
            : 'text-[var(--sidebar-text-secondary)] hover:bg-[var(--sidebar-nav-hover-bg)] hover:text-[var(--sidebar-text)] before:opacity-0'
        )}
      >
        <item.icon className="h-[18px] w-[18px] flex-shrink-0" aria-hidden="true" />
        <span className="flex-1 truncate text-left">{translateLabel(item.label, t)}</span>
        <ChevronDown className={cn('h-4 w-4 flex-shrink-0 transition-transform duration-200', open && 'rotate-180')} aria-hidden="true" />
      </button>

      {open && (
        <div className="ml-4 space-y-1.5 border-l border-[rgba(213,162,74,0.18)] pl-3">
          {item.children.map((child) => (
            <NavLink
              key={child.to}
              to={child.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200 hover:translate-x-0.5',
                  isActive
                    ? 'bg-[var(--sidebar-nav-active-bg)] text-[var(--sidebar-nav-active-text)] shadow-[inset_0_0_0_1px_rgba(25,135,84,0.14)]'
                    : 'text-[var(--sidebar-text-secondary)] hover:bg-[var(--sidebar-nav-hover-bg)] hover:text-[var(--sidebar-text)]'
                )
              }
            >
              <child.icon className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
              <span className="truncate">{translateLabel(child.label, t)}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const { role, hasPermission } = useAuth();
  const { sidebarCollapsed, toggleSidebar, language, changeLanguage, t } = useApp();
  const { isDark } = useTheme();
  const navItems = filterNavItems(NAV_BY_ROLE[role] || [], role, hasPermission);

  return (
    <aside
      className={cn(
        'hidden md:flex h-screen sticky top-0 flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] shadow-[0_30px_80px_rgba(0,0,0,0.08)] backdrop-blur-sm transition-[width] duration-200',
        isDark && 'bg-[linear-gradient(180deg,_#0B2D26,_#0E3C34_42%,_#0B2D26)] shadow-[0_30px_80px_rgba(0,0,0,0.28)]',
        sidebarCollapsed ? 'w-[84px]' : 'w-[280px]'
      )}
      aria-label="Main navigation"
    >
      <div className={cn(
        'flex h-24 items-center gap-3 border-b border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] px-4 flex-shrink-0 backdrop-blur-sm',
        isDark && 'bg-[rgba(6,27,23,0.42)]'
      )}>
        <div className={cn(
          'rounded-full border p-1.5 shadow-[0_12px_26px_rgba(23,59,49,0.08)]',
          isDark
            ? 'border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)]'
            : 'border-[var(--border)] bg-white'
        )}>
            <BrandMark
            containerClassName={cn(
              'w-12 h-12 rounded-full flex-shrink-0',
              isDark ? 'bg-[rgba(11,45,38,0.9)]' : 'bg-white'
            )}
            imgClassName="w-full h-full object-contain p-1.5"
            fallback={<GraduationCap className={cn('w-5 h-5', isDark ? 'text-[#8FE3B4]' : 'text-[var(--color-gold)]')} aria-hidden="true" />}
          />
        </div>
        {!sidebarCollapsed && (
          <div className="overflow-hidden leading-[1.05]">
            <p className="font-display text-[13px] font-black tracking-[0.12em] text-[var(--sidebar-text)] uppercase">Rambura Garçons</p>
            <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--sidebar-text-secondary)]">TVET Secondary School</p>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--color-gold)]">{translateLabel(ROLE_LABELS[role], t)}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 py-4">
        <div className="space-y-1.5">
          {navItems.map((item) => (
            <NavItem key={item.to} item={item} collapsed={sidebarCollapsed} />
          ))}
        </div>
      </nav>

      <div className="border-t border-[var(--sidebar-border)] p-2">
        <div className={cn('mb-2 flex items-center gap-2 rounded-xl border border-[var(--sidebar-border)] p-2', isDark ? 'bg-[rgba(16,61,52,0.8)]' : 'bg-[var(--color-white)]')}>
          <Languages className="h-4 w-4 flex-shrink-0 text-[var(--color-gold)]" aria-hidden="true" />
          {!sidebarCollapsed && <span className="flex-1 text-xs font-bold uppercase tracking-[0.12em] text-[var(--sidebar-text-secondary)]">{t('languageLabel')}</span>}
          <select
            value={language}
            aria-label={t('languageLabel')}
            onChange={(event) => changeLanguage(event.target.value)}
            className={cn('cursor-pointer rounded-lg border border-[var(--sidebar-border)] bg-transparent px-1.5 py-1 text-xs font-bold text-[var(--sidebar-text)] outline-none focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold)]/20', sidebarCollapsed && 'w-full')}
          >
            {LANGUAGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
        <button
          type="button"
          onClick={toggleSidebar}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--sidebar-border)] px-3 py-2.5 text-sm font-medium text-[var(--sidebar-text-secondary)] transition hover:border-[var(--color-gold)]/50 hover:text-[var(--sidebar-text)]',
            isDark
              ? 'bg-[rgba(16,61,52,0.8)] shadow-[0_8px_20px_rgba(0,0,0,0.18)]'
              : 'bg-[var(--color-white)] shadow-[0_8px_20px_rgba(15,108,255,0.08)]'
          )}
          aria-label={sidebarCollapsed ? t('expandSidebar') : t('collapse')}
        >
          {sidebarCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          {!sidebarCollapsed && <span>{t('collapse')}</span>}
        </button>
      </div>
    </aside>
  );
}
