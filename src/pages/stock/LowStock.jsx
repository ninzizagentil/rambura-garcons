import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, PackagePlus } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/tables/DataTable';
import { StatusBadge } from '../../components/common/Badge';
import IconButton from '../../components/common/IconButton';
import { EmptyState } from '../../components/feedback/States';
import ViewOnlyBanner from '../../components/feedback/ViewOnlyBanner';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { ROLES } from '../../data/roles';
import { getLowStockItems } from '../../services/stockService';

export default function LowStock() {
  const navigate = useNavigate();
  const { viewOnly } = useModuleAccess(ROLES.STOCK_MANAGER);
  const [items] = useState(getLowStockItems());

  const columns = [
    { key: 'name', header: 'Item' },
    { key: 'category', header: 'Category' },
    { key: 'quantity', header: 'Current Quantity', render: (i) => `${i.quantity} ${i.unit}` },
    { key: 'minLevel', header: 'Minimum Level', render: (i) => `${i.minLevel} ${i.unit}` },
    { key: 'status', header: 'Status', render: () => <StatusBadge status="low-stock" /> },
  ];
  if (!viewOnly) {
    columns.push({
      key: 'actions',
      header: 'Actions',
      render: (i) => (
        <div className="flex items-center gap-1">
          <IconButton icon={Eye} label={`View ${i.name}`} onClick={() => navigate(`/stock/items/${i.id}`)} />
          <IconButton icon={PackagePlus} label={`Stock In ${i.name}`} onClick={() => navigate(`/stock/stock-in?item=${i.id}`)} />
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
        title="Low Stock"
        description="Items at or below their minimum stock level."
        breadcrumb={[{ label: 'Stock', to: '/stock' }, { label: 'Low Stock' }]}
      />
      {viewOnly && <ViewOnlyBanner module="Stock MIS" />}      <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)]">
        <DataTable columns={columns} data={items} emptyState={<EmptyState title="No low stock items" message="Nice — every item is above its minimum level." />} />
      </div>
    </div>
  );
}
