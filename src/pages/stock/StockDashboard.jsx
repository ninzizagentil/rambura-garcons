import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Boxes, PackageCheck, PackageMinus, PackagePlus, TrendingDown,
  ShieldAlert, Plus, ArrowRight,
  PackageX, Wallet,
} from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import StatCard from '../../components/cards/StatCard';
import Button from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import {
  getItems, getLowStockItems, getOutOfStockItems, getExpiredItems,
  getExpiringSoonItems, getDamagedItems, getTotalStockValue,
  refreshStock,
} from '../../services/stockService';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { ROLES } from '../../data/roles';
import { useApp } from '../../context/AppContext';

function formatRWF(amount, language) {
  const locale = language === 'fr' ? 'fr-FR' : language === 'rw' ? 'rw-RW' : 'en-US';
  return `RWF ${Math.round(amount || 0).toLocaleString(locale)}`;
}

const ATTENTION_TONE = {
  'out-of-stock': 'red',
  'low-stock': 'amber',
  expired: 'purple',
  'expiring-soon': 'amber',
  damaged: 'orange',
};

export default function StockDashboard() {
  const { language } = useApp();
  return <StockDashboardView key={language} />;
}

function StockDashboardView() {
  const navigate = useNavigate();
  const { viewOnly } = useModuleAccess(ROLES.STOCK_MANAGER);
  const { t, language } = useApp();

  const [items, setItems] = useState(() => getItems());
  const [lowStock, setLowStock] = useState(() => getLowStockItems());
  const [outOfStock, setOutOfStock] = useState(() => getOutOfStockItems());
  const [expired, setExpired] = useState(() => getExpiredItems());
  const [expiringSoon, setExpiringSoon] = useState(() => getExpiringSoonItems());
  const [damaged, setDamaged] = useState(() => getDamagedItems());
  const [totalValue, setTotalValue] = useState(() => getTotalStockValue());

  const refresh = () => {
    setItems(getItems());
    setLowStock(getLowStockItems());
    setOutOfStock(getOutOfStockItems());
    setExpired(getExpiredItems());
    setExpiringSoon(getExpiringSoonItems());
    setDamaged(getDamagedItems());
    setTotalValue(getTotalStockValue());
  };

  useEffect(() => {
    window.addEventListener('rg:stock-updated', refresh);
    refreshStock().catch(() => {});
    return () => window.removeEventListener('rg:stock-updated', refresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalItems = items.length;
  const inStock = items.filter((i) => i.quantity > 0).length;
  const availableQuantity = useMemo(() => items.reduce((sum, item) => sum + Number(item.quantity || 0), 0), [items]);

  const attention = useMemo(() => [
    ...outOfStock.map((i) => ({ key: `oos-${i.id}`, name: i.name, sub: `0 ${i.unit}`, badge: 'out-of-stock', label: t('itemOutOfStock'), action: 'restock', to: `/stock/stock-in?item=${i.id}` })),
    ...lowStock.filter((i) => i.quantity > 0).map((i) => ({ key: `low-${i.id}`, name: i.name, sub: `${i.quantity} ${i.unit}`, badge: 'low-stock', label: t('itemLowStock'), action: 'restock', to: `/stock/stock-in?item=${i.id}` })),
    ...expired.map((i) => ({ key: `exp-${i.id}`, name: i.name, sub: t('expiredDaysAgo', { days: Math.abs(i.expiryDaysRemaining) }), badge: 'expired', label: t('itemExpired'), action: 'review', to: '/stock/alerts?tab=expiring' })),
    ...expiringSoon.map((i) => ({ key: `soon-${i.id}`, name: i.name, sub: t('expiringDaysLeft', { days: i.expiryDaysRemaining }), badge: 'expiring-soon', label: t('itemExpiringSoon'), action: 'review', to: '/stock/alerts?tab=expiring' })),
    ...damaged.map((d) => ({ key: `dmg-${d.id}`, name: d.itemName, sub: `${d.quantity} ${d.unit} — ${d.reason}`, badge: 'damaged', label: t('itemDamaged'), action: 'review', to: '/stock/activity?tab=damaged' })),
  ].slice(0, 8), [outOfStock, lowStock, expired, expiringSoon, damaged, t]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('stockManagement')}
        description={t('inventoryOperationsOverview')}
        breadcrumb={[
          { label: t('stockManagement'), to: '/stock' },
          { label: t('stockManagement') },
        ]}
        actions={
          !viewOnly && (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" icon={PackageMinus} onClick={() => navigate('/stock/stock-out')}>{t('stockOut')}</Button>
              <Button variant="secondary" icon={PackagePlus} onClick={() => navigate('/stock/stock-in')}>{t('stockIn')}</Button>
              <Button icon={Plus} onClick={() => navigate('/stock/items')}>{t('addItem')}</Button>
            </div>
          )
        }
      />

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard className="stock-metric-card" label={t('totalItems')} value={totalItems} icon={Boxes} onClick={() => navigate('/stock/items')} />
        <StatCard className="stock-metric-card" label={t('itemsInStock')} value={inStock} icon={PackageCheck} onClick={() => navigate('/stock/items')} />
        <StatCard className="stock-metric-card" label={t('lowStock')} value={lowStock.length} icon={TrendingDown} tone="amber" onClick={() => navigate('/stock/alerts?tab=low-stock')} />
        <StatCard className="stock-metric-card" label={t('outOfStock')} value={outOfStock.length} icon={PackageX} tone="red" onClick={() => navigate('/stock/alerts?tab=out-of-stock')} />
        <StatCard className="stock-metric-card" label={t('stockValue')} value={formatRWF(totalValue, language)} icon={Wallet} tone="gold" onClick={() => navigate('/stock/reports')} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.65fr] gap-5">
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border-gray)] bg-[var(--color-white)] p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-[var(--color-status-red-bg)] text-[var(--color-status-red)]">
                <ShieldAlert className="w-4 h-4" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-display text-base font-semibold text-[var(--color-dark-gray)]">{t('attentionRequired')}</h2>
                <p className="text-xs text-[var(--color-mid-gray)]">{t('priorityStockAction')}</p>
              </div>
            </div>
            <span className="rounded-full bg-[var(--color-status-amber-bg)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-status-amber)]">
              {attention.length} {t('active')}
            </span>
          </div>

          {attention.length === 0 ? (
            <p className="text-sm text-[var(--color-mid-gray)]">{t('nothingNeedsAttention')}</p>
          ) : (
            <ul className="space-y-3">
              {attention.map((a) => (
                <li key={a.key} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border-gray)] bg-[var(--color-soft-gray)] px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--color-dark-gray)] truncate">{a.name}</p>
                    <p className="text-xs text-[var(--color-mid-gray)]">{a.sub}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge tone={ATTENTION_TONE[a.badge]}>{a.label}</Badge>
                    {!viewOnly && (
                      <Button size="sm" variant="outline" onClick={() => navigate(a.to)}>{t(a.action)}</Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-[var(--radius-card)] border border-[var(--color-border-gray)] bg-[var(--color-white)] p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-semibold text-[var(--color-dark-gray)]">{t('inventorySummary')}</h2>
              <p className="text-xs text-[var(--color-mid-gray)] mt-1">{t('operationsHealth')}</p>
            </div>
            <PackageCheck className="w-5 h-5 text-[var(--color-heading)]" />
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-[var(--color-mid-gray)]">{t('availableQuantity')}</span>
              <span className="font-semibold text-[var(--color-dark-gray)]">{availableQuantity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[var(--color-mid-gray)]">{t('lowStockItems')}</span>
              <span className="font-semibold text-[var(--color-amber)]">{lowStock.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[var(--color-mid-gray)]">{t('outOfStockCount')}</span>
              <span className="font-semibold text-[var(--color-status-red)]">{outOfStock.length}</span>
            </div>
            <div className="rounded-2xl border border-[var(--color-border-gray)] bg-[var(--color-soft-gray)] p-4 mt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-mid-gray)]">{t('actionCenter')}</span>
                <ArrowRight className="w-4 h-4 text-[var(--color-heading)]" />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" icon={PackagePlus} onClick={() => navigate('/stock/stock-in')}>{t('stockIn')}</Button>
                <Button size="sm" variant="secondary" icon={PackageMinus} onClick={() => navigate('/stock/stock-out')}>{t('stockOut')}</Button>
                <Button size="sm" icon={Plus} onClick={() => navigate('/stock/items')}>{t('addItem')}</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[var(--radius-card)] border border-[var(--color-border-gray)] bg-[var(--color-white)] p-5 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-semibold text-[var(--color-dark-gray)]">{t('riskSignals')}</h2>
            <p className="text-xs text-[var(--color-mid-gray)] mt-1">{t('expiredLabel')}, {t('damagedLabel')} and {t('disposedLabel')} watch</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/stock/alerts?tab=expiring')}>{t('expiredLabel')}</Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/stock/activity?tab=damaged')}>{t('damagedLabel')}</Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/stock/activity?tab=disposed')}>{t('disposedLabel')}</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
