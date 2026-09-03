import { useState, useMemo } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/tables/DataTable';
import { SearchBar, FilterDropdown } from '../../components/common/SearchBar';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/feedback/States';
import { getTransactions } from '../../services/stockService';
import { STOCK_CATEGORIES } from '../../data/stock';

export default function StockTransactions() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const transactions = getTransactions();

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch = !search || t.itemName.toLowerCase().includes(search.toLowerCase());
      const matchesType = !typeFilter || t.type === typeFilter;
      const matchesCategory = !categoryFilter || t.category === categoryFilter;
      return matchesSearch && matchesType && matchesCategory;
    });
  }, [transactions, search, typeFilter, categoryFilter]);

  const columns = [
    { key: 'itemName', header: 'Item' },
    { key: 'category', header: 'Category' },
    { key: 'type', header: 'Transaction Type', render: (t) => <Badge tone={t.type === 'in' ? 'green' : 'amber'}>{t.type === 'in' ? 'Stock In' : 'Stock Out'}</Badge> },
    { key: 'quantity', header: 'Quantity' },
    { key: 'date', header: 'Date' },
    { key: 'responsibleUser', header: 'Responsible User' },
    { key: 'party', header: 'Source / Destination' },
    { key: 'notes', header: 'Notes', render: (t) => t.notes || '—' },
  ];

  return (
    <div>
      <PageHeader
        title="Stock Transactions"
        description="Complete log of Stock In and Stock Out movements."
        breadcrumb={[{ label: 'Stock', to: '/stock' }, { label: 'Transactions' }]}
      />

      <div className="flex flex-wrap gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by item…" className="flex-1 min-w-[220px]" />
        <FilterDropdown label="All Types" value={typeFilter} onChange={setTypeFilter} options={[{ value: 'in', label: 'Stock In' }, { value: 'out', label: 'Stock Out' }]} />
        <FilterDropdown label="All Categories" value={categoryFilter} onChange={setCategoryFilter} options={STOCK_CATEGORIES.map((c) => ({ value: c, label: c }))} />
      </div>

      <div className="bg-[var(--surface)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)]">
        <DataTable
          columns={columns}
          data={filtered}
          emptyState={<EmptyState title="No transactions found" message="Try a different search or filter." />}
        />
      </div>
    </div>
  );
}
