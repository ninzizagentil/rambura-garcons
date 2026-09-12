import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, BookOpen, Package, Globe, AlertTriangle, CheckCircle2,
  UserPlus, Globe2, ArrowRight,
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
import { getNews, refreshContent } from '../../services/contentService';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useApp();

  const [users, setUsers] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getUsers().then((data) => { if (!cancelled) setUsers(data || []); }),
      refreshLibrary().catch(() => {}),
      refreshStock().catch(() => {}),
      refreshActivity().catch(() => {}),
      refreshContent().catch(() => {}),
    ])
      .then(() => { if (!cancelled) setRefreshTick((t) => t + 1); })
      .catch((err) => { if (!cancelled) setLoadError(err.message || t('failedLoadDashboard')); });
    return () => { cancelled = true; };
  }, []);

  const loans = useMemo(() => getLoans(), [refreshTick]);
  const transactions = useMemo(() => getTransactions(), [refreshTick]);
  const lowStock = useMemo(() => getLowStockItems(), [refreshTick]);
  const news = useMemo(() => getNews(), [refreshTick]);

  const activeUsers = users.filter((u) => u.status === 'active').length;
  const lowStockPreview = useMemo(() => lowStock.slice(0, 3), [lowStock]);

  const systemStatus = [
    { label: t('serverStatus'), description: t('allSystemsOperational'), icon: CheckCircle2 },
    { label: t('database'), description: t('databaseConnectionHealthy'), icon: CheckCircle2 },
    { label: t('website'), description: t('websiteRunningSmoothly'), icon: Globe },
    { label: t('libraryMis'), description: t('librarySystemOperational'), icon: BookOpen },
    { label: t('stockMis'), description: t('stockSystemOperational'), icon: Package },
  ];

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
            <QuickActions actions={[
              { label: t('addUser'), to: '/admin/users', icon: UserPlus },
              { label: t('manageWebsite'), to: '/admin/website', icon: Globe2 },
              { label: t('viewReports'), to: '/admin/reports', icon: ArrowRight },
            ]} />
          </div>
        }
      />


      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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
        <StatCard
          label={t('libraryLoans')}
          value={loans.length}
          icon={BookOpen}
          onClick={() => navigate('/admin/reports')}
        />
        <StatCard
          label={t('stockAlerts')}
          value={lowStock.length}
          icon={AlertTriangle}
          tone="amber"
          trend={lowStock.length > 0 ? { label: t('needsRestocking'), positive: false } : { label: t('allClear'), positive: true }}
          onClick={() => navigate('/admin/reports')}
        />
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

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label={t('websitePosts')}
          value={news.length}
          icon={Globe}
          onClick={() => navigate('/admin/website')}
        />
        <StatCard
          label={t('transactions')}
          value={transactions.length}
          icon={Package}
          onClick={() => navigate('/admin/reports')}
        />
      </section>
    </div>
  );
}
