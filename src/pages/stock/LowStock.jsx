import { useState, useEffect } from 'react';
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
import { getLowStockItems, refreshStock } from '../../services/stockService';
import { useApp } from '../../context/AppContext';

export default function LowStock() {
  const navigate = useNavigate();
  const { viewOnly } = useModuleAccess(ROLES.STOCK_MANAGER);
  const { t } = useApp();
  const [items, setItems] = useState(() => getLowStockItems());

  useEffect(() => {
    const refresh = () => setItems(getLowStockItems());
    window.addEventListener('rg:stock-updated', refresh);
    refreshStock().catch(() => {});
    return () => window.removeEventListener('rg:stock-updated', refresh);
  }, []);

  const columns = [
    { key: 'name', header: t('item') },
    { key: 'category', header: t('category') },
    { key: 'quantity', header: t('currentQuantity'), render: (i) => `${i.quantity} ${i.unit}` },
    { key: 'minLevel', header: t('minimumLevel'), render: (i) => `${i.minLevel} ${i.unit}` },
    { key: 'status', header: t('status'), render: () => <StatusBadge status="low-stock" label={t('itemLowStock')} /> },
  ];
  if (!viewOnly) {
    columns.push({
      key: 'actions',
      header: t('actions'),
      render: (i) => (
        <div className="flex items-center gap-1">
          <IconButton icon={Eye} label={`${t('view')} ${i.name}`} onClick={() => navigate(`/stock/items/${i.id}`)} />
          <IconButton icon={PackagePlus} label={`${t('stockIn')} ${i.name}`} onClick={() => navigate(`/stock/stock-in?item=${i.id}`)} />
        </div>
      ),
    });
  } else {
    columns.push({
      key: 'view',
      header: '',
      render: (i) => <IconButton icon={Eye} label={`${t('view')} ${i.name}`} onClick={() => navigate(`/stock/items/${i.id}`)} />,
    });
  }

  return (
    <div>
      <PageHeader
        title="Low Stock"
        description={t('lowStockDescription')}
        breadcrumb={[{ label: t('stockManagement'), to: '/stock' }, { label: t('lowStock') }]}
      />
      {viewOnly && <ViewOnlyBanner module="Stock MIS" />}      <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)]">
        <DataTable columns={columns} data={items} emptyState={<EmptyState title={t('noLowStockItems')} message={t('allItemsAboveMinimum')} />} />
      </div>
    </div>
  );
}
