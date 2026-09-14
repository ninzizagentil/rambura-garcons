import { NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ChevronDown, Languages } from 'lucide-react';
import BrandMark from '../common/BrandMark';
import { NAV_BY_ROLE, ROLE_LABELS, filterNavItems } from '../../data/roles';
import { useAuth } from '../../context/AuthContext';
import { useApp, LANGUAGE_OPTIONS } from '../../context/AppContext';
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
    'Library Catalogue': 'libraryCatalogue',
    'Library Activity': 'libraryActivity',
    Management: 'managementMenu',
    'Reports & Insights': 'reportsInsights',
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
    'Contact Messages': 'contactMessages',
    'Developers Page': 'developersPage',
    'Management Insights': 'managementInsights',
    'Notifications': 'notifications',
    'IT / System Administrator': 'roleAdmin',
    Librarian: 'roleLibrarian',
    'Stock Manager': 'roleStockManager',
    'School Management / Director': 'roleManagement',
  };
  return t(labelMap[label] || label);
}

function MobileNavItem({ item, onNavigate }) {
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
        <span>{translateLabel(item.label, t)}</span>
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
        <span className="flex-1 text-left">{translateLabel(item.label, t)}</span>
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
              <span>{translateLabel(child.label, t)}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MobileMenu() {
  const { role, hasPermission } = useAuth();
  const { mobileMenuOpen, closeMobileMenu, language, changeLanguage, t } = useApp();
  const navItems = filterNavItems(NAV_BY_ROLE[role] || [], role, hasPermission);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    const closeOnEscape = (event) => event.key === 'Escape' && closeMobileMenu();
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [mobileMenuOpen, closeMobileMenu]);

  return (
    <AnimatePresence>
      {mobileMenuOpen && <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Mobile navigation">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[rgba(0,0,0,0.4)]" onClick={closeMobileMenu} aria-hidden="true" />
      <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ duration: 0.22, ease: 'easeOut' }} className="absolute inset-y-0 left-0 w-[min(280px,88vw)] bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 h-20 border-b border-[var(--sidebar-border)]">
          <div className="flex items-center gap-2.5">
            <div className="rounded-full border border-[var(--border)] bg-white p-1.5 shadow-[0_12px_26px_rgba(23,59,49,0.08)]">
              <BrandMark containerClassName="w-11 h-11 rounded-full bg-white" imgClassName="p-1.5" />
            </div>
            <div className="leading-[1.05]">
              <p className="font-display text-[12.5px] font-black tracking-[0.12em] text-[var(--sidebar-text)] uppercase">Rambura Garçons</p>
              <p className="mt-1 text-[8.5px] font-semibold uppercase tracking-[0.18em] text-[var(--sidebar-text-secondary)]">TVET Secondary School</p>
              <p className="mt-1 text-[8.5px] font-bold uppercase tracking-[0.16em] text-[var(--color-gold)]">{translateLabel(ROLE_LABELS[role], t)}</p>
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
        <div className="border-t border-[var(--sidebar-border)] p-3">
          <label className="flex items-center gap-3 rounded-xl border border-[var(--sidebar-border)] bg-[var(--sidebar-nav-hover-bg)] px-3 py-2.5">
            <Languages className="h-4 w-4 flex-shrink-0 text-[var(--color-gold)]" aria-hidden="true" />
            <span className="flex-1 text-xs font-bold uppercase tracking-[0.12em] text-[var(--sidebar-text-secondary)]">{t('languageLabel')}</span>
            <select
              value={language}
              aria-label={t('languageLabel')}
              onChange={(event) => changeLanguage(event.target.value)}
              className="cursor-pointer rounded-lg border border-[var(--sidebar-border)] bg-transparent px-2 py-1.5 text-xs font-bold text-[var(--sidebar-text)] outline-none focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold)]/20"
            >
              {LANGUAGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>
      </motion.div>
      </div>}
    </AnimatePresence>
  );
}
