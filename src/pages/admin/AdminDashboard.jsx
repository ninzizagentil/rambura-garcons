import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, BookOpen, Package, Globe, AlertTriangle, CheckCircle2,
  UserPlus, Globe2, ArrowRight, ShieldCheck, Activity, Settings, Laptop,
} from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import QuickActions from '../../components/common/QuickActions';
import StatCard from '../../components/cards/StatCard';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { getUsers } from '../../services/userService';
import { getLoans, refreshLibrary } from '../../services/bookService';
import { getTransactions, getLowStockItems, refreshStock } from '../../services/stockService';
import { refreshActivity } from '../../services/activityService';
import { getEquipment, refreshEquipment } from '../../services/equipmentService';
import { getNews, refreshContent } from '../../services/contentService';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const { t } = useApp();

  const canViewLibrary = hasPermission('library.view');
  const canViewStock = hasPermission('stock.view');
  const canViewEquipment = hasPermission('equipment.view');
  const canViewWebsite = hasPermission('website.view');

  const [users, setUsers] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const tasks = [
      getUsers().then((data) => { if (!cancelled) setUsers(data || []); }),
      refreshActivity().catch(() => {}),
      ...(canViewWebsite ? [refreshContent().catch(() => {})] : []),
      ...(canViewLibrary ? [refreshLibrary().catch(() => {})] : []),
      ...(canViewStock ? [refreshStock().catch(() => {})] : []),
      ...(canViewEquipment ? [refreshEquipment().then((data) => { if (!cancelled) setEquipment(data || getEquipment()); }).catch(() => {})] : []),
    ];

    Promise.all(tasks)
      .then(() => { if (!cancelled) setRefreshTick((tick) => tick + 1); })
      .catch((err) => { if (!cancelled) setLoadError(err.message || t('failedLoadDashboard')); });
    return () => { cancelled = true; };
  }, [canViewEquipment, canViewLibrary, canViewStock, canViewWebsite, t]);

  const loans = useMemo(() => {
    if (!canViewLibrary) return [];
    void refreshTick;
    return getLoans();
  }, [canViewLibrary, refreshTick]);

  const transactions = useMemo(() => {
    if (!canViewStock) return [];
    void refreshTick;
    return getTransactions();
  }, [canViewStock, refreshTick]);

  const lowStock = useMemo(() => {
    if (!canViewStock) return [];
    void refreshTick;
    return getLowStockItems();
  }, [canViewStock, refreshTick]);

  const news = useMemo(() => {
    if (!canViewWebsite) return [];
    void refreshTick;
    return getNews();
  }, [canViewWebsite, refreshTick]);

  const activeUsers = users.filter((u) => u.status === 'active').length;
  const lowStockPreview = useMemo(() => lowStock.slice(0, 3), [lowStock]);

  const adminQuickActions = [
    { label: t('addUser'), to: '/admin/users', icon: UserPlus, permission: 'users.view' },
    { label: t('manageWebsite'), to: '/admin/website', icon: Globe2, permission: 'website.view' },
    { label: t('viewReports'), to: '/management/insights', icon: ArrowRight, permission: 'reports.view' },
  ].filter((action) => !action.permission || hasPermission(action.permission));

  const systemStatus = [
    { label: t('serverStatus'), description: t('allSystemsOperational'), icon: CheckCircle2 },
    { label: t('database'), description: t('databaseConnectionHealthy'), icon: CheckCircle2 },
    ...(hasPermission('website.view') ? [{ label: t('website'), description: t('websiteRunningSmoothly'), icon: Globe }] : []),
    ...(hasPermission('library.view') ? [{ label: t('libraryMis'), description: t('librarySystemOperational'), icon: BookOpen }] : []),
    ...(hasPermission('stock.view') ? [{ label: t('stockMis'), description: t('stockSystemOperational'), icon: Package }] : []),
  ];

  const adminCards = [
    { label: t('usersRoles'), description: t('manageStaffAccounts'), icon: ShieldCheck, to: '/admin/users', permission: 'users.view' },
    { label: t('rolesPermissions'), description: t('controlRoleAccess'), icon: ShieldCheck, to: '/admin/roles', permission: 'users.update' },
    { label: t('reports'), description: t('crossModuleActivityOverview'), icon: ArrowRight, to: '/management/insights', permission: 'reports.view' },
    { label: t('activityAudit'), description: t('activityAuditDescription'), icon: Activity, to: '/admin/activity', permission: 'audit.view' },
    { label: t('settings'), description: t('settings'), icon: Settings, to: '/admin/settings', permission: 'settings.view' },
  ].filter((card) => !card.permission || hasPermission(card.permission));

  return (
    <div className="space-y-6">
      {loadError && (
        <div className="mb-4 rounded-[var(--radius-card)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {t('couldNotLoadDashboardData')}: {loadError}. {t('checkBackendReachable')}
        </div>
      )}

      <PageHeader
        title={t('adminDashboard')}
        description={t('welcomeBack', { name: user?.fullName?.split(' ')[0] || 'Marie' })}
        breadcrumb={[
          { label: t('admin'), to: '/admin' },
          { label: t('adminDashboard') },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <QuickActions actions={adminQuickActions} />
          </div>
        }
      />


      <section className="mb-2">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-mid-gray)]">Overview</p>
            <h3 className="mt-1 font-display text-lg font-semibold text-[var(--color-dark-gray)]">System snapshot</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          <StatCard
            label={t('totalUsers')}
            value={users.length}
            icon={Users}
            onClick={() => navigate('/admin/users')}
          />
          <StatCard
            label={t('activeUsers')}
            value={activeUsers}
            icon={Users}
            tone="gold"
            onClick={() => navigate('/admin/users')}
          />
          {canViewWebsite && (
            <StatCard
              label={t('websitePosts')}
              value={news.length}
              icon={Globe}
              onClick={() => navigate('/admin/website')}
            />
          )}
          {canViewLibrary && (
            <StatCard
              label={t('libraryLoans')}
              value={loans.length}
              icon={BookOpen}
              onClick={() => navigate('/library/reports')}
            />
          )}
          {canViewStock && (
            <StatCard
              label={t('stockAlerts')}
              value={lowStock.length}
              icon={AlertTriangle}
              tone="amber"
              trend={lowStock.length > 0 ? { label: t('needsRestocking'), positive: false } : { label: t('allClear'), positive: true }}
              onClick={() => navigate('/management/stock-reports')}
            />
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border-gray)] bg-[var(--color-white)] p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-semibold text-[var(--color-dark-gray)]">{t('systemStatus')}</h3>
              <p className="text-xs text-[var(--color-mid-gray)] mt-1">{t('criticalPlatformServices')}</p>
            </div>
            <span className="rounded-full bg-[var(--color-status-green-bg)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-status-green)]">
              {t('healthy')}
            </span>
          </div>
          <ul className="space-y-3">
            {systemStatus.map((s) => (
              <li key={s.label} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border-gray)] bg-[var(--color-soft-gray)] px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-light-green-100)] text-[var(--color-heading)]">
                    <s.icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--color-dark-gray)]">{s.label}</p>
                    <p className="truncate text-xs text-[var(--color-mid-gray)]">{s.description}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-status-green-bg)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-status-green)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                  {t('OK')}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[var(--radius-card)] border border-[var(--color-border-gray)] bg-[var(--color-white)] p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-semibold text-[var(--color-dark-gray)]">{t('priorityAlerts')}</h3>
              <p className="text-xs text-[var(--color-mid-gray)] mt-1">{t('actionRequired')}</p>
            </div>
            <span className="rounded-full bg-[var(--color-status-amber-bg)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-status-amber)]">
              {t('watchlist')}
            </span>
          </div>

          {lowStockPreview.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--color-border-gray)] bg-[var(--color-soft-gray)] p-4 text-sm text-[var(--color-mid-gray)]">
              {t('noStockIssuesDetected')}
            </div>
          ) : (
            <ul className="space-y-3">
              {lowStockPreview.map((item) => (
                <li key={item.id || item.name || item._id} className="rounded-2xl border border-[var(--color-border-gray)] bg-[var(--color-soft-gray)] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-[var(--color-dark-gray)]">{item.name || item.itemName || t('inventoryItem')}</p>
                    <span className="rounded-full bg-[var(--color-status-amber-bg)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-status-amber)]">
                      {t('lowStockLabel')}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-mid-gray)]">
                    {t('available')}: {item.stock ?? item.quantity ?? item.currentStock ?? 0}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-[var(--radius-card)] border border-[var(--color-border-gray)] bg-[var(--color-white)] p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-semibold text-[var(--color-dark-gray)]">{t('administration')}</h3>
            <p className="mt-1 text-xs text-[var(--color-mid-gray)]">{t('accessControl')} · {t('reports')} · {t('systemStatus')}</p>
          </div>
          <ShieldCheck className="h-5 w-5 text-[var(--color-heading)]" aria-hidden="true" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {adminCards.map(({ label, description, icon: Icon, to }) => (
            <button key={to} type="button" onClick={() => navigate(to)} className="group rounded-xl border border-[var(--color-border-gray)] bg-[var(--color-soft-gray)] p-4 text-left transition hover:-translate-y-0.5 hover:border-[var(--color-gold)] hover:bg-[var(--color-light-green-100)]">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-white)] text-[var(--color-heading)] shadow-sm"><Icon className="h-4 w-4" aria-hidden="true" /></span>
              <span className="mt-3 block text-sm font-semibold text-[var(--color-dark-gray)]">{label}</span>
              <span className="mt-1 block text-xs leading-5 text-[var(--color-mid-gray)]">{description}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
