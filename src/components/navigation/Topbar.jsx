import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { NAV_BY_ROLE, filterNavItems } from '../../data/roles';
import NotificationBell from './NotificationBell';
import ProfileMenu from './ProfileMenu';
import ThemeToggle from './ThemeToggle';

const NAV_LABEL_KEYS = {
  Dashboard: 'dashboard', Website: 'website', Reports: 'reports', 'Users & Roles': 'usersRoles',
  'Roles & Permissions': 'rolesPermissions', 'Activity / Audit': 'activityAudit', Settings: 'settings',
  'Library MIS': 'libraryMis', 'Stock MIS': 'stockMis', 'School Modules': 'schoolModules', Administration: 'administration', Inventory: 'inventory', Operations: 'operations', Items: 'allItems', Alerts: 'stockAlerts', 'Receive Stock': 'stockInMenu',
  'Issue Stock': 'stockOutMenu', Transfer: 'stockTransfer', 'Transfer Stock': 'transferStock', Adjust: 'stockAdjustment', 'Adjust Stock': 'adjustStock', Activity: 'activity', 'Damage & Disposal': 'damageDisposal', 'All Items': 'allItems', 'Low Stock': 'lowStockMenu',
  'Out of Stock': 'outOfStockMenu', 'Damaged Items': 'damagedItems', 'Expired Items': 'expiredItems',
  'Removed / Disposed': 'removedDisposed', 'Stock Operations': 'stockOperations', 'Stock In': 'stockInMenu',
  'Stock Out': 'stockOutMenu', 'Stock Adjustment': 'stockAdjustment', 'Stock Transfer': 'stockTransfer',
  Transactions: 'transactions', Suppliers: 'suppliers', 'Usage Analytics': 'usageAnalytics', 'Stock Reports': 'stockReports',
  Books: 'books', 'Borrowed Books': 'borrowedBooks', 'Overdue Books': 'overdueBooks', Returns: 'returns',
  'Borrowing History': 'borrowingHistory', 'Library Reports': 'libraryReports', Applications: 'applications',
  'Management Insights': 'managementInsights', Notifications: 'notifications',
};

/** Flattens the role's nav (including grouped children like Stock MIS's
 * sub-items) into one searchable list of { label, to, icon, group }. */
function useSearchableItems() {
  const { role, hasPermission } = useAuth();
  return useMemo(() => {
    const items = filterNavItems(NAV_BY_ROLE[role] || [], role, hasPermission);
    const flat = [];
    for (const item of items) {
      flat.push({ label: item.label, to: item.to, icon: item.icon });
      if (item.children?.length) {
        for (const child of item.children) {
          flat.push({ label: child.label, to: child.to, icon: child.icon, group: item.label });
        }
      }
    }
    return flat;
  }, [role, hasPermission]);
}

function GlobalSearch() {
  const { isDark } = useTheme();
  const { t } = useApp();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const items = useSearchableItems();
  const navigate = useNavigate();
  const ref = useRef(null);
  const inputRef = useRef(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return items.filter((i) => i.label.toLowerCase().includes(q) || t(NAV_LABEL_KEYS[i.label] || i.label).toLowerCase().includes(q)).slice(0, 8);
  }, [query, items, t]);

  useEffect(() => {
    const handler = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => setActiveIndex(0), [query]);

  const goTo = (item) => {
    if (!item) return;
    navigate(item.to);
    setQuery('');
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      goTo(results[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-mid-gray)]" aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={t('searchPlaceholder')}
          aria-label={t('searchPlaceholder')}
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-controls="global-search-results"
          className={[
            'w-full rounded-full border border-[var(--color-border-gray)] pl-9 pr-8 py-2.5 text-sm shadow-inner transition-all focus:outline-none focus:ring-2',
            isDark
              ? 'bg-[rgba(16,61,52,0.72)] text-[var(--sidebar-text)] focus:ring-[rgba(13,122,90,0.35)] focus:border-[rgba(13,122,90,0.7)] focus:bg-[rgba(16,61,52,0.82)]'
              : 'bg-[linear-gradient(135deg,_rgba(25,135,84,0.04),_rgba(185,130,45,0.04))] text-[var(--color-dark-gray)] focus:ring-[var(--color-medium-green)]/30 focus:border-[var(--color-medium-green)] focus:bg-[var(--sidebar-bg)]'
          ].join(' ')}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-mid-gray)] hover:text-[var(--color-dark-gray)]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && query.trim() && (
        <div
          id="global-search-results"
          role="listbox"
          className={[
            'absolute left-0 right-0 mt-2 rounded-[var(--radius-card)] border border-[var(--color-border-gray)] py-1.5 z-30 max-h-80 overflow-y-auto',
            isDark
              ? 'bg-[rgba(11,45,38,0.98)] shadow-[0_20px_40px_rgba(0,0,0,0.26)]'
              : 'bg-[var(--sidebar-bg)] shadow-[0_18px_42px_rgba(23,59,49,0.12)]'
          ].join(' ')}
        >
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-[var(--color-mid-gray)]">{t('noPagesMatch', { query })}</p>
          ) : (
            results.map((item, i) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.to}
                  type="button"
                  role="option"
                  aria-selected={i === activeIndex}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => goTo(item)}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors ${
                    i === activeIndex
                      ? isDark ? 'bg-[rgba(13,122,90,0.16)]' : 'bg-[var(--color-off-white)]'
                      : isDark ? 'hover:bg-[rgba(255,255,255,0.02)]' : 'hover:bg-[var(--sidebar-nav-hover-bg)]'
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4 text-[var(--color-mid-gray)] flex-shrink-0" aria-hidden="true" />}
                  <span className="flex-1 min-w-0">
                    <span className="block truncate text-[var(--color-dark-gray)]">{t(NAV_LABEL_KEYS[item.label] || item.label)}</span>
                    {item.group && <span className="block truncate text-xs text-[var(--color-mid-gray)]">{t(NAV_LABEL_KEYS[item.group] || item.group)}</span>}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default function Topbar({ breadcrumbLabel }) {
  const { toggleMobileMenu } = useApp();
  const { isDark } = useTheme();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  return (
    <header className={[
      'sticky top-0 z-20 border-b border-[var(--color-border-gray)] backdrop-blur-xl',
      isDark ? 'bg-[rgba(11,45,38,0.95)] shadow-[0_8px_24px_rgba(0,0,0,0.18)]' : 'bg-[var(--sidebar-bg)]/90 shadow-[0_8px_24px_rgba(23,59,49,0.06)]'
    ].join(' ')}>
      <div className="flex h-18 items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={toggleMobileMenu}
            aria-label="Open menu"
            className={[
              'rounded-xl p-2 md:hidden',
              isDark ? 'text-[var(--sidebar-text)] hover:bg-[rgba(255,255,255,0.04)]' : 'text-[var(--color-dark-gray)] hover:bg-[var(--color-soft-gray)]'
            ].join(' ')}
          >
            <Menu className="h-5 w-5" />
          </button>
          {breadcrumbLabel && (
            <div className={[
              'hidden items-center gap-2 rounded-full border border-[var(--color-border-gray)] px-3 py-1.5 shadow-sm sm:flex',
              isDark ? 'bg-[rgba(16,61,52,0.7)]' : 'bg-[var(--sidebar-bg)]'
            ].join(' ')}>
              <span className={['h-2 w-2 rounded-full', isDark ? 'bg-[#8FE3B4]' : 'bg-[var(--color-status-green)]'].join(' ')} aria-hidden="true" />
              <p className="truncate text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-mid-gray)]">{breadcrumbLabel}</p>
            </div>
          )}
        </div>

        <div className="hidden flex-1 max-w-md md:block">
          <GlobalSearch />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            aria-label="Search"
            onClick={() => setMobileSearchOpen((v) => !v)}
            className={[
              'rounded-xl p-2 md:hidden',
              isDark ? 'text-[var(--sidebar-text)] hover:bg-[rgba(255,255,255,0.04)]' : 'text-[var(--color-dark-gray)] hover:bg-[var(--color-soft-gray)]'
            ].join(' ')}
          >
            <Search className="h-5 w-5" />
          </button>
          <div className={['rounded-full border border-[var(--color-border-gray)] p-1 shadow-sm', isDark ? 'bg-[rgba(16,61,52,0.7)]' : 'bg-[var(--sidebar-bg)]'].join(' ')}>
            <ThemeToggle />
          </div>
          <div className={['rounded-full border border-[var(--color-border-gray)] p-1 shadow-sm', isDark ? 'bg-[rgba(16,61,52,0.7)]' : 'bg-[var(--sidebar-bg)]'].join(' ')}>
            <NotificationBell />
          </div>
          <div className={['rounded-full border border-[var(--color-border-gray)] p-1 shadow-sm', isDark ? 'bg-[rgba(16,61,52,0.7)]' : 'bg-[var(--sidebar-bg)]'].join(' ')}>
            <ProfileMenu />
          </div>
        </div>
      </div>

      {mobileSearchOpen && (
        <div className="px-4 pb-3 md:hidden">
          <GlobalSearch />
        </div>
      )}
    </header>
  );
}
