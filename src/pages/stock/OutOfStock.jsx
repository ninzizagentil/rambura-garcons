import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, PackagePlus, PackageX } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/tables/DataTable';
import { StatusBadge } from '../../components/common/Badge';
import IconButton from '../../components/common/IconButton';
import Button from '../../components/common/Button';
import { EmptyState } from '../../components/feedback/States';
import ViewOnlyBanner from '../../components/feedback/ViewOnlyBanner';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { ROLES } from '../../data/roles';
import { getOutOfStockItems, getTransactionsForItem, refreshStock } from '../../services/stockService';

export default function OutOfStock() {
  const navigate = useNavigate();
  const { viewOnly } = useModuleAccess(ROLES.STOCK_MANAGER);
  const [items, setItems] = useState(() => getOutOfStockItems());

  useEffect(() => {
    const refresh = () => setItems(getOutOfStockItems());
    window.addEventListener('rg:stock-updated', refresh);
    refreshStock().catch(() => {});
    return () => window.removeEventListener('rg:stock-updated', refresh);
  }, []);

  const rows = useMemo(
    () =>
      items.map((i) => {
        const lastTx = getTransactionsForItem(i.id).sort((a, b) => (a.date < b.date ? 1 : -1))[0];
        return { ...i, lastMovement: lastTx ? `${lastTx.date} (${lastTx.type === 'in' ? 'Stock In' : 'Stock Out'})` : '—' };
      }),
    [items]
  );

  const columns = [
    { key: 'name', header: 'Item', render: (i) => (
      <div>
        <p className="font-medium text-[var(--color-dark-gray)]">{i.name}</p>
        <p className="text-xs text-[var(--color-mid-gray)] font-mono">{i.code}</p>
      </div>
    ) },
    { key: 'category', header: 'Category' },
    { key: 'lastMovement', header: 'Last Movement' },
    { key: 'minLevel', header: 'Minimum Level', render: (i) => `${i.minLevel} ${i.unit}` },
    { key: 'supplier', header: 'Supplier', render: (i) => i.supplier || '—' },
    { key: 'status', header: 'Status', render: () => <StatusBadge status="out-of-stock" /> },
  ];
  if (!viewOnly) {
    columns.push({
      key: 'actions',
      header: 'Action',
      render: (i) => (
        <div className="flex items-center gap-1">
          <IconButton icon={Eye} label={`View ${i.name}`} onClick={() => navigate(`/stock/items/${i.id}`)} />
          <Button size="sm" icon={PackagePlus} onClick={() => navigate(`/stock/stock-in?item=${i.id}`)}>Restock</Button>
        </div>
      ),
    });
  } else {
    columns.push({
      key: 'view',
      header: '',
      render: (i) => <IconButton icon={Eye} label={`View ${i.name}`} onClick={() => navigate(`/stock/items/${i.id}`)} />,
    });
  }

  return (
    <div>
      <PageHeader
        title="Out of Stock"
        description="Items with zero units currently available."
        breadcrumb={[{ label: 'Stock', to: '/stock' }, { label: 'Out of Stock' }]}
      />
      {viewOnly && <ViewOnlyBanner module="Stock MIS" />}
      <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)]">
        <DataTable
          columns={columns}
          data={rows}
          emptyState={<EmptyState icon={PackageX} title="Nothing out of stock" message="Every item currently has units available." />}
        />
      </div>
    </div>
  );
}
