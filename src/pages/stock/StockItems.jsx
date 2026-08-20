import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Pencil, PackagePlus, PackageMinus } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/tables/DataTable';
import { SearchBar, FilterDropdown } from '../../components/common/SearchBar';
import { StatusBadge } from '../../components/common/Badge';
import IconButton from '../../components/common/IconButton';
import Button from '../../components/common/Button';
import { EmptyState } from '../../components/feedback/States';
import { getItems } from '../../services/stockService';
import { STOCK_CATEGORIES } from '../../data/stock';
import StockItemFormModal from './StockItemFormModal';

export default function StockItems() {
  const navigate = useNavigate();
  const [items, setItems] = useState(getItems());
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  const refresh = () => setItems(getItems());

  const filtered = useMemo(() => {
    return items.filter((i) => {
      const matchesSearch = !search || i.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !categoryFilter || i.category === categoryFilter;
      const matchesStatus = !statusFilter || i.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [items, search, categoryFilter, statusFilter]);

  const columns = [
    { key: 'name', header: 'Item Name' },
    { key: 'category', header: 'Category' },
    { key: 'unit', header: 'Unit' },
    { key: 'quantity', header: 'Quantity' },
    { key: 'minLevel', header: 'Minimum Level' },
    { key: 'status', header: 'Status', render: (i) => <StatusBadge status={i.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      render: (i) => (
        <div className="flex items-center gap-1">
          <IconButton icon={Eye} label={`View ${i.name}`} onClick={() => navigate(`/stock/items/${i.id}`)} />
          <IconButton icon={Pencil} label={`Edit ${i.name}`} onClick={() => navigate(`/stock/items/${i.id}?edit=1`)} />
          <IconButton icon={PackagePlus} label={`Stock In ${i.name}`} onClick={() => navigate(`/stock/stock-in?item=${i.id}`)} />
          <IconButton icon={PackageMinus} label={`Stock Out ${i.name}`} onClick={() => navigate(`/stock/stock-out?item=${i.id}`)} />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="All Items"
        description="Manage the school's stock catalogue."
        breadcrumb={[{ label: 'Stock', to: '/stock' }, { label: 'All Items' }]}
        actions={<Button icon={Plus} onClick={() => setFormOpen(true)}>Add Item</Button>}
      />

      <div className="flex flex-wrap gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by item name…" className="flex-1 min-w-[220px]" />
        <FilterDropdown label="All Categories" value={categoryFilter} onChange={setCategoryFilter} options={STOCK_CATEGORIES.map((c) => ({ value: c, label: c }))} />
        <FilterDropdown
          label="All Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[{ value: 'normal', label: 'Normal' }, { value: 'low-stock', label: 'Low Stock' }]}
        />
      </div>

      <div className="bg-white rounded-[var(--radius-card)] border border-[var(--color-border-gray)]">
        <DataTable
          columns={columns}
          data={filtered}
          onRowClick={(i) => navigate(`/stock/items/${i.id}`)}
          emptyState={
            <EmptyState title="No stock items found" message="Try a different search, or add a new item to the catalogue." actionLabel="Add Item" onAction={() => setFormOpen(true)} />
          }
        />
      </div>

      <StockItemFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={() => { refresh(); setFormOpen(false); }} />
    </div>
  );
}
