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

const STATUS_OPTIONS = [
  { value: 'expired', label: 'Expired' },
  { value: 'expiring-soon', label: 'Expiring Soon' },
  { value: 'valid', label: 'Valid' },
];

export default function ExpiredItems() {
  const navigate = useNavigate();
  const { viewOnly } = useModuleAccess(ROLES.STOCK_MANAGER);
  const [statusFilter, setStatusFilter] = useState('');
  const [disposeTarget, setDisposeTarget] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const items = useMemo(() => getItems().filter((i) => !!i.expiryDate), [refreshTick]);
  const filtered = statusFilter ? items.filter((i) => i.expiryStatus === statusFilter) : items;

  const columns = [
    { key: 'name', header: 'Item' },
    { key: 'batchNumber', header: 'Batch / Lot', render: (i) => <span className="font-mono text-xs">{i.batchNumber || '—'}</span> },
    { key: 'expiryDate', header: 'Expiry Date' },
    { key: 'quantity', header: 'Quantity', render: (i) => `${i.quantity} ${i.unit}` },
    {
      key: 'expiryDaysRemaining',
      header: 'Days Remaining',
      render: (i) => (i.expiryDaysRemaining < 0 ? `${Math.abs(i.expiryDaysRemaining)} days overdue` : `${i.expiryDaysRemaining} days`),
    },
    {
      key: 'expiryStatus',
      header: 'Status',
      render: (i) => <Badge tone={i.expiryStatus === 'expired' ? 'purple' : i.expiryStatus === 'expiring-soon' ? 'amber' : 'green'}>
        {i.expiryStatus === 'expired' ? 'Expired' : i.expiryStatus === 'expiring-soon' ? 'Expiring Soon' : 'Valid'}
      </Badge>,
    },
  ];
  columns.push({
    key: 'actions',
    header: 'Action',
    render: (i) => (
      <div className="flex items-center gap-1">
        <IconButton icon={Eye} label={`View ${i.name}`} onClick={() => navigate(`/stock/items/${i.id}`)} />
        {!viewOnly && i.expiryStatus === 'expired' && (
          <Button size="sm" variant="danger" icon={Trash2} onClick={() => setDisposeTarget(i)}>Dispose</Button>
        )}
      </div>
    ),
  });

  return (
    <div>
      <PageHeader
        title="Expiry Management"
        description="Perishable stock tracked by batch and expiry date."
        breadcrumb={[{ label: 'Stock', to: '/stock' }, { label: 'Expired Items' }]}
      />
      {viewOnly && <ViewOnlyBanner module="Stock MIS" />}

      <div className="flex items-center gap-3 mb-4">
        <FilterDropdown label="All Statuses" value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} />
      </div>

      <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)]">
        <DataTable
          columns={columns}
          data={filtered}
          emptyState={<EmptyState icon={CalendarClock} title="No batches to show" message="No perishable items match this filter." />}
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
