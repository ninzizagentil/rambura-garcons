import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Package, AlertTriangle, TrendingDown, BookMarked, GraduationCap, ClipboardCheck } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import QuickActions from '../../components/common/QuickActions';
import StatCard from '../../components/cards/StatCard';
import { useAuth } from '../../context/AuthContext';
import { getLoans, refreshLibrary, daysOverdue } from '../../services/bookService';
import { getItems, getLowStockItems, refreshStock } from '../../services/stockService';
import { getApplications } from '../../services/applicationService';
import { useApp } from '../../context/AppContext';

export default function ManagementDashboard() {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const { t } = useApp();
  const [applications, setApplications] = useState([]);
  const [, setDataVersion] = useState(0);
  const loans = getLoans();
  const items = getItems();
  const lowStock = getLowStockItems();

  useEffect(() => {
    let active = true;
    const update = () => { if (active) setDataVersion((version) => version + 1); };
    const stockRequest = hasPermission('stock.view') ? refreshStock() : Promise.resolve();
    Promise.all([
      refreshLibrary().catch(() => {}),
      stockRequest.catch(() => {}),
      getApplications().catch(() => []),
    ]).then(([, , nextApplications]) => {
      if (active) {
        setApplications(nextApplications || []);
        update();
      }
    });
    window.addEventListener('rg:library-updated', update);
    window.addEventListener('rg:stock-updated', update);
    return () => {
      active = false;
      window.removeEventListener('rg:library-updated', update);
      window.removeEventListener('rg:stock-updated', update);
    };
  }, [hasPermission]);

  const activeLoans = loans.filter((l) => l.status !== 'returned');
  const overdue = activeLoans.filter((l) => daysOverdue(l.dueDate) > 0);
  const newApplications = applications.filter((a) => a.status === 'new');

  const alerts = useMemo(() => [
    ...(overdue.length && hasPermission('library.reports') ? [{ label: t('managementOverdueAlert', { count: overdue.length }), to: '/management/library-reports' }] : []),
    ...(lowStock.length && hasPermission('stock.reports') ? [{ label: t('managementLowStockAlert', { count: lowStock.length }), to: '/management/stock-reports' }] : []),
    ...(newApplications.length && hasPermission('applications.view') ? [{ label: t('managementApplicationsAlert', { count: newApplications.length }), to: '/management/applications' }] : []),
  ], [overdue.length, lowStock.length, newApplications.length, hasPermission, t]);

  const quickActions = [
    { label: t('reviewApplications'), to: '/management/applications', icon: GraduationCap, permission: 'applications.view' },
    { label: t('libraryReport'), to: '/management/library-reports', icon: BookOpen, permission: 'library.reports' },
    { label: t('stockReport'), to: '/management/stock-reports', icon: Package, permission: 'stock.reports' },
  ].filter((action) => hasPermission(action.permission));

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

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {hasPermission('applications.view') && <StatCard
          label={t('newApplications')}
          value={newApplications.length}
          icon={GraduationCap}
          tone={newApplications.length ? 'gold' : 'default'}
          onClick={() => navigate('/management/applications')}
        />}
        {hasPermission('library.reports') && <StatCard label={t('borrowedBooks')} value={activeLoans.length} icon={BookMarked} onClick={() => navigate('/management/library-reports')} />}
        {hasPermission('library.reports') && <StatCard label={t('overdueBooks')} value={overdue.length} icon={AlertTriangle} tone="red" onClick={() => navigate('/management/library-reports')} />}
        {hasPermission('stock.reports') && <StatCard label={t('stockItems')} value={items.length} icon={Package} onClick={() => navigate('/management/stock-reports')} />}
        {hasPermission('stock.reports') && <StatCard label={t('lowStockLabelSimple')} value={lowStock.length} icon={TrendingDown} tone="amber" onClick={() => navigate('/management/stock-reports')} />}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-5">
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

        <div className="rounded-[var(--radius-card)] border border-[var(--color-border-gray)] bg-[var(--color-white)] p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-semibold text-[var(--color-dark-gray)]">{t('managementSummary')}</h2>
              <p className="text-xs text-[var(--color-mid-gray)] mt-1">{t('schoolOperationsStatus')}</p>
            </div>
            <ClipboardCheck className="w-5 h-5 text-[var(--color-heading)]" />
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-[var(--color-mid-gray)]">{t('applications')}</span>
              <span className="font-semibold text-[var(--color-dark-gray)]">{newApplications.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[var(--color-mid-gray)]">{t('activeLoansLabel')}</span>
              <span className="font-semibold text-[var(--color-dark-gray)]">{activeLoans.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[var(--color-mid-gray)]">{t('lowStockLabelSimple')}</span>
              <span className="font-semibold text-[var(--color-status-amber)]">{lowStock.length}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
