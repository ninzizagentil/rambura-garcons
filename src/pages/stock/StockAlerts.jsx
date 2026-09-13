import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CalendarClock, Eye, PackagePlus, PackageX, Trash2, TrendingDown,
} from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/tables/DataTable';
import { Badge, StatusBadge } from '../../components/common/Badge';
import { FilterDropdown } from '../../components/common/SearchBar';
import IconButton from '../../components/common/IconButton';
import Button from '../../components/common/Button';
import { EmptyState } from '../../components/feedback/States';
import ViewOnlyBanner from '../../components/feedback/ViewOnlyBanner';
import DisposeStockModal from '../../components/modals/DisposeStockModal';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { ROLES } from '../../data/roles';
import {
  getLowStockItems, getOutOfStockItems, getItems,
  getTransactionsForItem, refreshStock,
} from '../../services/stockService';
import { useApp } from '../../context/AppContext';

const TABS = [
  { id: 'low-stock',      label: 'lowStock',       icon: TrendingDown,   tone: 'amber'  },
  { id: 'out-of-stock',   label: 'outOfStock',     icon: PackageX,       tone: 'red'    },
  { id: 'expiring',       label: 'expiryDate',     icon: CalendarClock,  tone: 'purple' },
];

const EXPIRY_STATUS_OPTIONS = [
  { value: 'expired',       label: 'itemExpired'      },
  { value: 'expiring-soon', label: 'itemExpiringSoon' },
  { value: 'valid',         label: 'valid'            },
];

export default function StockAlerts() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { viewOnly } = useModuleAccess(ROLES.STOCK_MANAGER);
  const { t } = useApp();

  const initialTab = TABS.find((tb) => tb.id === searchParams.get('tab'))?.id ?? 'low-stock';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [expiryFilter, setExpiryFilter] = useState('');
  const [disposeTarget, setDisposeTarget] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const [lowStock, setLowStock]   = useState(() => getLowStockItems());
  const [outOfStock, setOutOfStock] = useState(() => getOutOfStockItems());

  const refresh = () => {
    setLowStock(getLowStockItems());
    setOutOfStock(getOutOfStockItems());
    setRefreshTick((n) => n + 1);
  };

  useEffect(() => {
    window.addEventListener('rg:stock-updated', refresh);
    refreshStock().catch(() => {});
    return () => window.removeEventListener('rg:stock-updated', refresh);
  }, []);

  const switchTab = (id) => {
    setActiveTab(id);
    setSearchParams({ tab: id }, { replace: true });
  };

  // ── Low Stock rows ─────────────────────────────────────────────────────────
  const lowStockCols = useMemo(() => [
    { key: 'name',     header: t('item'),            render: (i) => <span className="font-medium">{i.name}</span> },
    { key: 'category', header: t('category') },
    { key: 'quantity', header: t('currentQuantity'),  render: (i) => `${i.quantity} ${i.unit}` },
    { key: 'minLevel', header: t('minimumLevel'),      render: (i) => `${i.minLevel} ${i.unit}` },
    { key: 'status',   header: t('status'),
      render: () => <StatusBadge status="low-stock" label={t('itemLowStock')} /> },
    { key: 'actions',  header: t('actions'),
      render: (i) => (
        <div className="flex items-center gap-1">
          <IconButton icon={Eye} label={`${t('view')} ${i.name}`} onClick={() => navigate(`/stock/items/${i.id}`)} />
          {!viewOnly && (
            <IconButton icon={PackagePlus} label={`${t('stockIn')} ${i.name}`}
              onClick={() => navigate(`/stock/stock-in?item=${i.id}`)} />
          )}
        </div>
      ),
    },
  ], [navigate, viewOnly, t]);

  // ── Out of Stock rows ──────────────────────────────────────────────────────
  const outOfStockRows = useMemo(() =>
    outOfStock.map((i) => {
      const lastTx = getTransactionsForItem(i.id).sort((a, b) => (a.date < b.date ? 1 : -1))[0];
      return {
        ...i,
        lastMovement: lastTx
          ? `${lastTx.date} (${lastTx.type === 'in' ? t('stockIn') : t('stockOut')})`
          : '—',
      };
    }),
  [outOfStock, t]);

  const outOfStockCols = useMemo(() => [
    { key: 'name',         header: t('item'),
      render: (i) => (
        <div>
          <p className="font-medium text-[var(--color-dark-gray)]">{i.name}</p>
          <p className="text-xs text-[var(--color-mid-gray)] font-mono">{i.code}</p>
        </div>
      ),
    },
    { key: 'category',     header: t('category') },
    { key: 'lastMovement', header: t('lastMovement') },
    { key: 'minLevel',     header: t('minimumLevel'), render: (i) => `${i.minLevel} ${i.unit}` },
    { key: 'supplier',     header: t('supplier'),     render: (i) => i.supplier || '—' },
    { key: 'status',       header: t('status'),
      render: () => <StatusBadge status="out-of-stock" label={t('itemOutOfStock')} /> },
    { key: 'actions',      header: t('action'),
      render: (i) => (
        <div className="flex items-center gap-1">
          <IconButton icon={Eye} label={`${t('view')} ${i.name}`} onClick={() => navigate(`/stock/items/${i.id}`)} />
          {!viewOnly && (
            <Button size="sm" icon={PackagePlus} onClick={() => navigate(`/stock/stock-in?item=${i.id}`)}>
              {t('restock')}
            </Button>
          )}
        </div>
      ),
    },
  ], [navigate, viewOnly, t]);

  // ── Expiry rows ────────────────────────────────────────────────────────────
  const expiryItems = useMemo(
    () => {
      const all = getItems().filter((i) => !!i.expiryDate);
      return expiryFilter ? all.filter((i) => i.expiryStatus === expiryFilter) : all;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refreshTick, expiryFilter],
  );

  const expiryCols = useMemo(() => [
    { key: 'name',        header: t('item') },
    { key: 'batchNumber', header: t('batchLot'),
      render: (i) => <span className="font-mono text-xs">{i.batchNumber || '—'}</span> },
    { key: 'expiryDate',  header: t('expiryDate') },
    { key: 'quantity',    header: t('quantity'),     render: (i) => `${i.quantity} ${i.unit}` },
    { key: 'expiryDaysRemaining', header: t('daysRemaining'),
      render: (i) =>
        i.expiryDaysRemaining < 0
          ? t('daysOverdueCount', { count: Math.abs(i.expiryDaysRemaining) })
          : t('daysCount', { count: i.expiryDaysRemaining }),
    },
    { key: 'expiryStatus', header: t('status'),
      render: (i) => (
        <Badge tone={i.expiryStatus === 'expired' ? 'purple' : i.expiryStatus === 'expiring-soon' ? 'amber' : 'green'}>
          {t(i.expiryStatus === 'expired' ? 'itemExpired' : i.expiryStatus === 'expiring-soon' ? 'itemExpiringSoon' : 'valid')}
        </Badge>
      ),
    },
    { key: 'actions',     header: t('action'),
      render: (i) => (
        <div className="flex items-center gap-1">
          <IconButton icon={Eye} label={`${t('view')} ${i.name}`} onClick={() => navigate(`/stock/items/${i.id}`)} />
          {!viewOnly && i.expiryStatus === 'expired' && (
            <Button size="sm" variant="danger" icon={Trash2} onClick={() => setDisposeTarget(i)}>
              {t('dispose')}
            </Button>
          )}
        </div>
      ),
    },
  ], [navigate, viewOnly, t]);

  // ── Tab badge counts ───────────────────────────────────────────────────────
  const counts = {
    'low-stock':    lowStock.filter((i) => i.quantity > 0).length,
    'out-of-stock': outOfStock.length,
    'expiring':     getItems().filter((i) => i.expiryStatus === 'expired' || i.expiryStatus === 'expiring-soon').length,
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('stockAlerts')}
        description={t('stockAlertsDescription')}
        breadcrumb={[
          { label: t('stockManagement'), to: '/stock' },
          { label: t('inventory'),        to: '/stock/items' },
          { label: t('alerts') },
        ]}
      />

      {viewOnly && <ViewOnlyBanner module="Stock MIS" />}

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 border-b border-[var(--color-border-gray)] pb-0">
        {TABS.map(({ id, label, icon: Icon }) => {
          const count = counts[id] ?? 0;
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => switchTab(id)}
              role="tab"
              aria-selected={isActive}
              className={[
                'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 -mb-px transition-colors',
                isActive
                  ? 'border-[var(--color-medium-green)] text-[var(--color-medium-green)] bg-[var(--color-white)]'
                  : 'border-transparent text-[var(--color-mid-gray)] hover:text-[var(--color-dark-gray)]',
              ].join(' ')}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              {t(label)}
              {count > 0 && (
                <span className={[
                  'rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none',
                  isActive
                    ? 'bg-[var(--color-medium-green)] text-white'
                    : 'bg-[var(--color-status-amber-bg)] text-[var(--color-status-amber)]',
                ].join(' ')}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab content ─────────────────────────────────────────────────── */}
      {activeTab === 'low-stock' && (
        <div>
          <p className="text-sm text-[var(--color-mid-gray)] mb-3">
            Items that have reached or fallen below their minimum stock level. Restock them before they run out.
          </p>
          <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)]">
            <DataTable
              columns={lowStockCols}
              data={lowStock.filter((i) => i.quantity > 0)}
              emptyState={
                <EmptyState
                  title={t('noLowStockItems')}
                  message={t('allItemsAboveMinimum')}
                />
              }
            />
          </div>
        </div>
      )}

      {activeTab === 'out-of-stock' && (
        <div>
          <p className="text-sm text-[var(--color-mid-gray)] mb-3">
            Items with zero quantity on hand. These need to be restocked urgently.
          </p>
          <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)]">
            <DataTable
              columns={outOfStockCols}
              data={outOfStockRows}
              emptyState={
                <EmptyState
                  icon={PackageX}
                  title={t('nothingOutOfStock')}
                  message={t('everyItemAvailable')}
                />
              }
            />
          </div>
        </div>
      )}

      {activeTab === 'expiring' && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <p className="text-sm text-[var(--color-mid-gray)] flex-1">
              Perishable items tracked by batch and expiry date.
            </p>
            <FilterDropdown
              label={t('allStatuses')}
              value={expiryFilter}
              onChange={setExpiryFilter}
              options={EXPIRY_STATUS_OPTIONS.map((opt) => ({ ...opt, label: t(opt.label) || opt.label }))}
            />
          </div>
          <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)]">
            <DataTable
              columns={expiryCols}
              data={expiryItems}
              emptyState={
                <EmptyState
                  icon={CalendarClock}
                  title={t('noBatchesToShow')}
                  message={t('noPerishableMatches')}
                />
              }
            />
          </div>
        </div>
      )}

      <DisposeStockModal
        open={!!disposeTarget}
        item={disposeTarget}
        defaultReason="Expired"
        onClose={() => setDisposeTarget(null)}
        onDisposed={() => { setDisposeTarget(null); refresh(); }}
      />
    </div>
  );
}
