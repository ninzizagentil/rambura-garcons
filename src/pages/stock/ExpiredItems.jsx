import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Trash2, CalendarClock } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/tables/DataTable';
import { Badge } from '../../components/common/Badge';
import { FilterDropdown } from '../../components/common/SearchBar';
import IconButton from '../../components/common/IconButton';
import Button from '../../components/common/Button';
import { EmptyState } from '../../components/feedback/States';
import ViewOnlyBanner from '../../components/feedback/ViewOnlyBanner';
import DisposeStockModal from '../../components/modals/DisposeStockModal';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { ROLES } from '../../data/roles';
import { getItems } from '../../services/stockService';
import { useApp } from '../../context/AppContext';

const STATUS_OPTIONS = [
  { value: 'expired', label: 'Expired' },
  { value: 'expiring-soon', label: 'Expiring Soon' },
  { value: 'valid', label: 'Valid' },
];

export default function ExpiredItems() {
  const navigate = useNavigate();
  const { viewOnly } = useModuleAccess(ROLES.STOCK_MANAGER);
  const { t } = useApp();
  const [statusFilter, setStatusFilter] = useState('');
  const [disposeTarget, setDisposeTarget] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const items = useMemo(() => getItems().filter((i) => !!i.expiryDate), [refreshTick]);
  const filtered = statusFilter ? items.filter((i) => i.expiryStatus === statusFilter) : items;

  const columns = [
    { key: 'name', header: t('item') },
    { key: 'batchNumber', header: t('batchLot'), render: (i) => <span className="font-mono text-xs">{i.batchNumber || '—'}</span> },
    { key: 'expiryDate', header: t('expiryDate') },
    { key: 'quantity', header: t('quantity'), render: (i) => `${i.quantity} ${i.unit}` },
    {
      key: 'expiryDaysRemaining',
      header: t('daysRemaining'),
      render: (i) => (i.expiryDaysRemaining < 0 ? t('daysOverdueCount', { count: Math.abs(i.expiryDaysRemaining) }) : t('daysCount', { count: i.expiryDaysRemaining })),
    },
    {
      key: 'expiryStatus',
      header: t('status'),
      render: (i) => <Badge tone={i.expiryStatus === 'expired' ? 'purple' : i.expiryStatus === 'expiring-soon' ? 'amber' : 'green'}>
        {t(i.expiryStatus === 'expired' ? 'itemExpired' : i.expiryStatus === 'expiring-soon' ? 'itemExpiringSoon' : 'valid')}
      </Badge>,
    },
  ];
  columns.push({
    key: 'actions',
    header: t('action'),
    render: (i) => (
      <div className="flex items-center gap-1">
        <IconButton icon={Eye} label={`${t('view')} ${i.name}`} onClick={() => navigate(`/stock/items/${i.id}`)} />
        {!viewOnly && i.expiryStatus === 'expired' && (
          <Button size="sm" variant="danger" icon={Trash2} onClick={() => setDisposeTarget(i)}>{t('dispose')}</Button>
        )}
      </div>
    ),
  });

  return (
    <div>
      <PageHeader
        title="Expiry Management"
        description={t('expiryManagementDescription')}
        breadcrumb={[{ label: 'Stock', to: '/stock' }, { label: 'Expired Items' }]}
      />
      {viewOnly && <ViewOnlyBanner module="Stock MIS" />}

      <div className="flex items-center gap-3 mb-4">
        <FilterDropdown label={t('allStatuses')} value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS.map((option) => ({ ...option, label: t(option.label) }))} />
      </div>

      <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)]">
        <DataTable
          columns={columns}
          data={filtered}
          emptyState={<EmptyState icon={CalendarClock} title={t('noBatchesToShow')} message={t('noPerishableMatches')} />}
        />
      </div>

      <DisposeStockModal
        open={!!disposeTarget}
        item={disposeTarget}
        defaultReason="Expired"
        onClose={() => setDisposeTarget(null)}
        onDisposed={() => setRefreshTick((n) => n + 1)}
      />
    </div>
  );
}
