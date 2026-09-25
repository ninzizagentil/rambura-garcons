import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileBarChart,
  Laptop,
  Settings2,
  ShieldAlert,
  UserCheck,
  Wrench,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader';
import StatCard from '../../components/cards/StatCard';
import Button from '../../components/common/Button';
import { StatusBadge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { getEquipment, refreshEquipment } from '../../services/equipmentService';

export default function EquipmentDashboard() {
  const { language } = useApp();
  return <EquipmentDashboardView key={language} />;
}

function EquipmentDashboardView() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useApp();
  const { hasPermission } = useAuth();
  const canOpenRecords = hasPermission('equipment.view');
  const [items, setItems] = useState(() => getEquipment());

  const load = () => setItems([...getEquipment()]);

  useEffect(() => {
    refreshEquipment().then(load).catch((error) => showToast(error.message, 'error'));
    window.addEventListener('rg:equipment-updated', load);
    return () => window.removeEventListener('rg:equipment-updated', load);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stats = useMemo(() => ({
    total: items.length,
    available: items.filter((item) => item.status === 'available').length,
    assigned: items.filter((item) => item.status === 'assigned').length,
    maintenance: items.filter((item) => item.status === 'under_maintenance').length,
    damaged: items.filter((item) => item.condition === 'damaged').length,
    retired: items.filter((item) => item.status === 'retired').length,
  }), [items]);

  const attention = useMemo(
    () => items
      .filter((item) => item.condition === 'damaged' || item.status === 'under_maintenance' || item.status === 'retired')
      .slice(0, 6),
    [items]
  );

  const attentionCount = stats.damaged + stats.maintenance + stats.retired;
  const availabilityRate = stats.total ? Math.round((stats.available / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('equipmentDashboard')}
        description={t('equipmentDashboardDescription')}
        breadcrumb={[{ label: t('equipmentDashboard') }]}
        actions={canOpenRecords && <Button variant="secondary" icon={Laptop} onClick={() => navigate('/equipment/items')}>{t('equipmentRecords')}</Button>}
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('totalAssets')} value={stats.total} icon={Laptop} onClick={canOpenRecords ? () => navigate('/equipment/items') : undefined} />
        <StatCard label={t('available')} value={stats.available} icon={CheckCircle2} tone="green" onClick={canOpenRecords ? () => navigate('/equipment/items?status=available') : undefined} />
        <StatCard label={t('assigned')} value={stats.assigned} icon={UserCheck} tone="blue" onClick={canOpenRecords ? () => navigate('/equipment/items?status=assigned') : undefined} />
        <StatCard label={t('underMaintenance')} value={stats.maintenance} icon={Wrench} tone="amber" onClick={canOpenRecords ? () => navigate('/equipment/items?status=under_maintenance') : undefined} />
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border-gray)] bg-[var(--color-white)] p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-semibold text-[var(--color-dark-gray)]">{t('assetHealthOverview')}</h2>
              <p className="mt-1 text-xs text-[var(--color-mid-gray)]">{t('assetHealthOverviewDescription')}</p>
            </div>
            <ClipboardCheck className="h-5 w-5 text-[var(--color-heading)]" aria-hidden="true" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--color-border-gray)] bg-[var(--color-soft-gray)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-mid-gray)]">{t('availabilityRate')}</p>
              <p className="mt-2 text-2xl font-bold text-[var(--color-dark-gray)]">{availabilityRate}%</p>
              <p className="mt-1 text-xs text-[var(--color-mid-gray)]">{t('assetsReadyToUse', { count: stats.available })}</p>
            </div>
            <div className="rounded-xl border border-[var(--color-border-gray)] bg-[var(--color-soft-gray)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-mid-gray)]">{t('riskLevel')}</p>
              <p className="mt-2 text-2xl font-bold text-[var(--color-dark-gray)]">{attentionCount}</p>
              <p className="mt-1 text-xs text-[var(--color-mid-gray)]">{t('assetsFlaggedForFollowUp')}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[var(--radius-card)] border border-[var(--color-border-gray)] bg-[var(--color-white)] p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-semibold text-[var(--color-dark-gray)]">{t('equipmentActionCentre')}</h2>
              <p className="mt-1 text-xs text-[var(--color-mid-gray)]">{t('equipmentActionCentreDescription')}</p>
            </div>
            <Settings2 className="h-5 w-5 text-[var(--color-heading)]" aria-hidden="true" />
          </div>
          <div className="grid gap-2">
            {canOpenRecords && <Button variant="secondary" icon={Laptop} onClick={() => navigate('/equipment/items')}>{t('openEquipmentRecords')}</Button>}
            {canOpenRecords && <Button variant="secondary" icon={FileBarChart} onClick={() => navigate('/equipment/reports')}>Equipment reports</Button>}
            {canOpenRecords && <Button variant="secondary" icon={Wrench} onClick={() => navigate('/equipment/items?status=under_maintenance')}>{t('reviewMaintenance')}</Button>}
          </div>
        </div>
      </section>

      <section className="rounded-[var(--radius-card)] border border-[var(--color-border-gray)] bg-[var(--color-white)] p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold text-[var(--color-dark-gray)]">{t('equipmentAttentionRequired')}</h2>
            <p className="mt-1 text-xs text-[var(--color-mid-gray)]">{t('equipmentAttentionRequiredDescription')}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[var(--color-status-amber-bg)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-status-amber)]">{attentionCount} {t('active')}</span>
            {canOpenRecords && <Button variant="ghost" size="sm" onClick={() => navigate('/equipment/items?status=under_maintenance')}>{t('viewAll')} <ArrowRight className="ml-1 h-4 w-4" /></Button>}
          </div>
        </div>
        {attention.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--color-border-gray)] p-6 text-center text-sm text-[var(--color-mid-gray)]">
            <ShieldAlert className="mx-auto mb-2 h-7 w-7 text-[var(--color-status-green)]" aria-hidden="true" />
            {t('noEquipmentNeedsAttention')}
          </div>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {attention.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border-gray)] bg-[var(--color-soft-gray)] px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--color-dark-gray)]">{item.name}</p>
                  <p className="text-xs text-[var(--color-mid-gray)]">{item.assetNumber} · {item.location || t('unassigned')}</p>
                </div>
                <StatusBadge status={item.condition === 'damaged' ? 'damaged' : item.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
