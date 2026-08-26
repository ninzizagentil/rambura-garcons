import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import DataTable, { TablePagination } from '../../components/tables/DataTable';
import { SearchBar, FilterDropdown } from '../../components/common/SearchBar';
import { Badge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { Input } from '../../components/forms/FormField';
import { EmptyState } from '../../components/feedback/States';
import { getTransactions } from '../../services/stockService';
import { STOCK_CATEGORIES } from '../../data/stock';
import { exportToCSV } from '../../utils/export';
import { useToast } from '../../context/ToastContext';

const TYPE_CONFIG = {
  in: { label: 'Stock In', tone: 'green', sign: '+' },
  out: { label: 'Stock Out', tone: 'amber', sign: '−' },
  adjustment: { label: 'Adjustment', tone: 'blue', sign: '' },
  transfer: { label: 'Transfer', tone: 'blue', sign: '' },
  damaged: { label: 'Damaged', tone: 'orange', sign: '−' },
  removed: { label: 'Removed', tone: 'red', sign: '−' },
};

export default function Transactions() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [transactions] = useState(getTransactions());
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [sortKey, setSortKey] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const filtered = useMemo(() => {
    const rows = transactions.filter((t) => {
      const matchesSearch =
        !search ||
        t.itemName.toLowerCase().includes(search.toLowerCase()) ||
        (t.party || '').toLowerCase().includes(search.toLowerCase()) ||
        (t.responsibleUser || '').toLowerCase().includes(search.toLowerCase());
      const matchesType = !typeFilter || t.type === typeFilter;
      const matchesCategory = !categoryFilter || t.category === categoryFilter;
      const matchesFrom = !dateFrom || t.date >= dateFrom;
      const matchesTo = !dateTo || t.date <= dateTo;
      return matchesSearch && matchesType && matchesCategory && matchesFrom && matchesTo;
    });
    const sorted = [...rows].sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [transactions, search, typeFilter, categoryFilter, dateFrom, dateTo, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('desc');
    }
    setPage(1);
  };

  const handleFilterChange = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const handleExport = () => {
    exportToCSV(
      'stock-transactions',
      [
        { key: 'itemName', header: 'Item' },
        { key: 'category', header: 'Category' },
        { header: 'Type', value: (t) => TYPE_CONFIG[t.type]?.label || t.type },
        { key: 'quantity', header: 'Quantity' },
        { key: 'previousQuantity', header: 'Previous Quantity' },
        { key: 'newQuantity', header: 'New Quantity' },
        { key: 'date', header: 'Date' },
        { key: 'responsibleUser', header: 'Responsible User' },
        { key: 'party', header: 'Source / Destination' },
        { key: 'notes', header: 'Notes' },
      ],
      filtered
    );
    showToast('Stock transactions exported to CSV.', 'success');
  };

  const columns = [
    { key: 'itemName', header: 'Item', sortable: true },
    { key: 'category', header: 'Category' },
    {
      key: 'type',
      header: 'Transaction Type',
      render: (t) => <Badge tone={TYPE_CONFIG[t.type]?.tone || 'neutral'}>{TYPE_CONFIG[t.type]?.label || t.type}</Badge>,
    },
    {
      key: 'quantity',
      header: 'Quantity',
      sortable: true,
      render: (t) => `${TYPE_CONFIG[t.type]?.sign || ''}${t.quantity}`,
    },
    { key: 'previousQuantity', header: 'Previous Qty', render: (t) => t.previousQuantity ?? '—' },
    { key: 'newQuantity', header: 'New Qty', render: (t) => t.newQuantity ?? '—' },
    { key: 'date', header: 'Date', sortable: true },
    { key: 'responsibleUser', header: 'Responsible User' },
    { key: 'party', header: 'Source / Destination' },
    { key: 'notes', header: 'Notes', render: (t) => t.notes || '—' },
  ];

  return (
    <div>
      <PageHeader
        title="Stock Transactions"
        description="Complete audit trail of every stock movement — in, out, adjustments, and transfers."
        breadcrumb={[{ label: 'Stock', to: '/stock' }, { label: 'Transactions' }]}
        actions={<Button variant="secondary" icon={Download} onClick={handleExport}>Export CSV</Button>}
      />
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <SearchBar value={search} onChange={handleFilterChange(setSearch)} placeholder="Search by item, party, or user…" className="flex-1 min-w-[220px]" />
        <FilterDropdown
          label="All Types"
          value={typeFilter}
          onChange={handleFilterChange(setTypeFilter)}
          options={Object.entries(TYPE_CONFIG).map(([value, cfg]) => ({ value, label: cfg.label }))}
        />
        <FilterDropdown label="All Categories" value={categoryFilter} onChange={handleFilterChange(setCategoryFilter)} options={STOCK_CATEGORIES.map((c) => ({ value: c, label: c }))} />
        <Input label="From" type="date" value={dateFrom} onChange={(e) => handleFilterChange(setDateFrom)(e.target.value)} className="!py-2" />
        <Input label="To" type="date" value={dateTo} onChange={(e) => handleFilterChange(setDateTo)(e.target.value)} className="!py-2" />
      </div>
      <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)]">
        <DataTable
          columns={columns}
          data={paged}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
          emptyState={<EmptyState title="No transactions found" message="Try a different search or filter." actionLabel="Record Stock In" onAction={() => navigate('/stock/stock-in')} />}
        />
        <TablePagination page={page} totalPages={totalPages} totalItems={filtered.length} pageSize={pageSize} onPageChange={setPage} />
      </div>
    </div>
  );
}
