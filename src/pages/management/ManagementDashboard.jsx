import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Package, AlertTriangle, TrendingDown, BookMarked, GraduationCap, Laptop, ArrowUpRight, MonitorCog } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import QuickActions from '../../components/common/QuickActions';
import StatCard from '../../components/cards/StatCard';
import { useAuth } from '../../context/AuthContext';
import { getLoans, refreshLibrary, daysOverdue } from '../../services/bookService';
import { getItems, getLowStockItems, refreshStock } from '../../services/stockService';
import { getApplications } from '../../services/applicationService';
import { getEquipment, refreshEquipment } from '../../services/equipmentService';
import { useApp } from '../../context/AppContext';

export default function ManagementDashboard() {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const { t } = useApp();
  const [applications, setApplications] = useState([]);
  const [equipment, setEquipment] = useState(() => getEquipment());
  const [, setDataVersion] = useState(0);
  const loans = getLoans();
  const items = getItems();
  const lowStock = getLowStockItems();

  useEffect(() => {
    let active = true;
    const update = () => { if (active) setDataVersion((version) => version + 1); };
    const stockRequest = hasPermission('stock.view') ? refreshStock() : Promise.resolve();
    const equipmentRequest = hasPermission('equipment.view') ? refreshEquipment().catch(() => []) : Promise.resolve();
    Promise.all([
      refreshLibrary().catch(() => {}),
      stockRequest.catch(() => {}),
      equipmentRequest,
      getApplications().catch(() => []),
    ]).then(([, , nextEquipment, nextApplications]) => {
      if (active) {
        setEquipment(nextEquipment || getEquipment());
        setApplications(nextApplications || []);
        update();
      }
    });
    window.addEventListener('rg:library-updated', update);
    window.addEventListener('rg:stock-updated', update);
    window.addEventListener('rg:equipment-updated', update);
    return () => {
      active = false;
      window.removeEventListener('rg:library-updated', update);
      window.removeEventListener('rg:stock-updated', update);
      window.removeEventListener('rg:equipment-updated', update);
    };
  }, [hasPermission]);

  const activeLoans = loans.filter((l) => l.status !== 'returned');
  const overdue = activeLoans.filter((l) => daysOverdue(l.dueDate) > 0);
  const newApplications = applications.filter((a) => a.status === 'new');
  const equipmentAttention = equipment.filter((item) => item.condition === 'damaged' || item.status === 'under_maintenance');

  const alerts = useMemo(() => [
    ...(overdue.length && hasPermission('library.reports') ? [{ label: t('managementOverdueAlert', { count: overdue.length }), to: '/library/reports' }] : []),
    ...(lowStock.length && hasPermission('stock.reports') ? [{ label: t('managementLowStockAlert', { count: lowStock.length }), to: '/management/stock-reports' }] : []),
    ...(newApplications.length && hasPermission('applications.view') ? [{ label: t('managementApplicationsAlert', { count: newApplications.length }), to: '/management/applications' }] : []),
    ...(equipmentAttention.length && hasPermission('equipment.view') ? [{ label: `${equipmentAttention.length} ${t('equipment')} ${t('attentionRequired').toLowerCase()}`, to: '/equipment/items?status=under_maintenance' }] : []),
  ], [overdue.length, lowStock.length, newApplications.length, equipmentAttention.length, hasPermission, t]);

  const quickActions = [
    { label: t('reviewApplications'), to: '/management/applications', icon: GraduationCap, permission: 'applications.view' },
    { label: t('libraryReport'), to: '/library/reports', icon: BookOpen, permission: 'library.reports' },
    { label: t('stockReport'), to: '/management/stock-reports', icon: Package, permission: 'stock.reports' },
    { label: t('equipmentDashboard'), to: '/equipment', icon: Laptop, permission: 'equipment.view' },
  ].filter((action) => hasPermission(action.permission));

  const scopeModules = [
    {
      key: 'equipment',
      label: t('equipmentDashboard'),
      description: t('equipmentDashboardDescription'),
      icon: Laptop,
      to: '/equipment',
      permission: 'equipment.view',
      tone: 'bg-[var(--color-status-green-bg)] text-[var(--color-status-green)]',
    },
    {
      key: 'inventory',
      label: t('stockMis'),
      description: t('stockDashboardDescription'),
      icon: Package,
      to: '/management/stock-reports',
      permission: 'stock.reports',
      tone: 'bg-[var(--color-status-amber-bg)] text-[var(--color-status-amber)]',
    },
    {
      key: 'library',
      label: t('libraryDashboard'),
      description: t('libraryDashboardDescription'),
      icon: BookOpen,
      to: '/library/reports',
      permission: 'library.reports',
      tone: 'bg-[var(--color-status-purple-bg)] text-[var(--color-status-purple)]',
    },
    {
      key: 'administration',
      label: t('managementMenu'),
      description: t('managementInsightsDescription'),
      icon: MonitorCog,
      to: '/management/insights',
      permission: 'reports.view',
      tone: 'bg-[var(--color-status-gray-bg)] text-[var(--color-status-gray)]',
    },
  ].filter((module) => hasPermission(module.permission));

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('directorDashboard')}
        description={t('welcomeBack', { name: user?.fullName?.split(' ')[0] || t('director') })}
        breadcrumb={[
          { label: t('schoolManagement'), to: '/management' },
          { label: t('directorDashboard') },
        ]}
        actions={
          <QuickActions actions={quickActions} />
        }
      />

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {hasPermission('applications.view') && <StatCard
          label={t('newApplications')}
          value={newApplications.length}
          icon={GraduationCap}
          tone={newApplications.length ? 'gold' : 'default'}
          onClick={() => navigate('/management/applications')}
        />}
        {hasPermission('library.reports') && <StatCard label={t('borrowedBooks')} value={activeLoans.length} icon={BookMarked} onClick={() => navigate('/library/reports')} />}
        {hasPermission('library.reports') && <StatCard label={t('overdueBooks')} value={overdue.length} icon={AlertTriangle} tone="red" onClick={() => navigate('/library/reports')} />}
        {hasPermission('stock.reports') && <StatCard label={t('stockItems')} value={items.length} icon={Package} onClick={() => navigate('/management/stock-reports')} />}
        {hasPermission('stock.reports') && <StatCard label={t('lowStockLabelSimple')} value={lowStock.length} icon={TrendingDown} tone="amber" onClick={() => navigate('/management/stock-reports')} />}
        {hasPermission('equipment.view') && <StatCard label={t('totalAssets')} value={equipment.length} icon={Laptop} onClick={() => navigate('/equipment/items')} />}
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold text-[var(--color-dark-gray)]">{t('schoolModules')}</h2>
            <p className="mt-1 text-xs text-[var(--color-mid-gray)]">{t('directorScopeOverview')}</p>
          </div>
          <MonitorCog className="h-5 w-5 text-[var(--color-heading)]" aria-hidden="true" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {scopeModules.map((module) => (
            <button key={module.key} type="button" onClick={() => navigate(module.to)} className="group flex min-h-[158px] flex-col justify-between rounded-[var(--radius-card)] border border-[var(--color-border-gray)] bg-[var(--color-white)] p-4 text-left shadow-card transition hover:-translate-y-0.5 hover:border-[var(--color-gold)] hover:shadow-card-hover">
              <span>
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${module.tone}`}><module.icon className="h-5 w-5" aria-hidden="true" /></span>
                <span className="mt-3 block text-sm font-bold text-[var(--color-dark-gray)]">{module.label}</span>
                <span className="mt-1 block line-clamp-2 text-xs leading-5 text-[var(--color-mid-gray)]">{module.description}</span>
              </span>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[var(--color-gold)]">{t('openModule')} <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border-gray)] bg-[var(--color-white)] p-5 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-semibold text-[var(--color-dark-gray)]">{t('attentionRequired')}</h2>
              <p className="mt-1 text-xs text-[var(--color-mid-gray)]">{t('prioritizedManagementAlerts')}</p>
            </div>
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-[var(--color-status-amber-bg)] text-[var(--color-status-amber)]">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>

          <div className="mt-4 space-y-2">
            {alerts.length ? alerts.map((alert) => (
              <button key={alert.to} type="button" onClick={() => navigate(alert.to)} className="flex w-full items-center justify-between rounded-lg border border-[var(--color-border-gray)] px-3 py-2.5 text-left text-sm text-[var(--color-dark-gray)] transition-colors hover:border-[var(--color-gold)] hover:bg-[var(--color-light-green-100)]">
                <span>{alert.label}</span><span className="text-[var(--color-gold)]">{t('view')}</span>
              </button>
            )) : <p className="rounded-lg bg-[var(--color-status-green-bg)] px-3 py-3 text-sm text-[var(--color-status-green)]">{t('noOpenAlerts')}</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
