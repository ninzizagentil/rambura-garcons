import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import DataTable, { TablePagination } from '../../components/tables/DataTable';
import { SearchBar, FilterDropdown } from '../../components/common/SearchBar';
import { Badge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { Input } from '../../components/forms/FormField';
import { EmptyState } from '../../components/feedback/States';
import { getTransactions, refreshStock, useStockVersion } from '../../services/stockService';
import { STOCK_CATEGORIES } from '../../data/stock';
import { exportToCSV } from '../../utils/export';
import { useToast } from '../../context/ToastContext';
import { useApp } from '../../context/AppContext';

function formatTransactionDate(value, language) {
  const date = new Date(value);
  const locale = language === 'fr' ? 'fr-FR' : language === 'rw' ? 'rw-RW' : 'en-GB';
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
}

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
  const { t, language } = useApp();
  const stockVersion = useStockVersion();
  // Always pull fresh data when the page opens (other users may have posted movements).
  useEffect(() => { refreshStock().catch(() => {}); }, []);
  const transactions = useMemo(() => { void stockVersion; return getTransactions(); }, [stockVersion]);
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
        { key: 'itemName', header: t('item') }, { key: 'category', header: t('category') },
        { header: t('transactionType'), value: (row) => t(`transaction.${row.type}`) },
        { key: 'quantity', header: t('quantity') }, { key: 'previousQuantity', header: t('previousQuantity') },
        { key: 'newQuantity', header: t('newQuantity') }, { key: 'date', header: t('date') },
        { key: 'responsibleUser', header: t('responsibleUser') }, { key: 'party', header: t('sourceDestination') }, { key: 'notes', header: t('notes') },
      ],
      filtered
    );
    showToast(t('transactionsExported'), 'success');
  };

  const columns = [
    { key: 'itemName', header: t('item'), sortable: true, render: (row) => <span className="whitespace-nowrap font-semibold text-[var(--color-heading)]">{row.itemName}</span> },
    { key: 'category', header: t('category'), render: (row) => <span className="inline-flex whitespace-nowrap rounded-md bg-[var(--color-light-green-100)] px-2 py-1 text-xs font-semibold text-[var(--color-heading)]">{t(`stockCategory.${row.category}`)}</span> },
    {
      key: 'type',
      header: t('transactionType'),
      render: (row) => <Badge tone={TYPE_CONFIG[row.type]?.tone || 'neutral'}>{t(`transaction.${row.type}`)}</Badge>,
    },
    {
      key: 'quantity',
      header: t('quantity'),
      sortable: true,
      render: (row) => `${TYPE_CONFIG[row.type]?.sign || ''}${row.quantity}`,
    },
    { key: 'previousQuantity', header: t('previousQuantity'), render: (row) => row.previousQuantity ?? '—' },
    { key: 'newQuantity', header: t('newQuantity'), render: (row) => row.newQuantity ?? '—' },
    { key: 'date', header: t('date'), sortable: true, render: (row) => <span className="whitespace-nowrap font-semibold text-[var(--color-heading)]">{formatTransactionDate(row.date, language)}</span> },
    { key: 'responsibleUser', header: t('responsibleUser'), render: (row) => <span className="font-semibold text-[var(--color-heading)]">{row.responsibleUser}</span> },
    { key: 'party', header: t('sourceDestination') },
    { key: 'notes', header: t('notes'), render: (row) => row.notes || '—' },
  ];

  return (
    <div>
      <PageHeader
        title={t('stockTransactions')}
        description={t('stockTransactionsAuditDescription')}
        breadcrumb={[{ label: t('stockManagement'), to: '/stock' }, { label: t('transactions') }]}
        actions={<Button variant="secondary" icon={Download} onClick={handleExport}>{t('exportCsv')}</Button>}
      />
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <SearchBar value={search} onChange={handleFilterChange(setSearch)} placeholder={t('searchItemPartyUser')} className="flex-1 min-w-[220px]" />
        <FilterDropdown
          label={t('allTypes')}
          value={typeFilter}
          onChange={handleFilterChange(setTypeFilter)}
          options={Object.keys(TYPE_CONFIG).map((value) => ({ value, label: t(`transaction.${value}`) }))}
        />
        <FilterDropdown label={t('allCategories')} value={categoryFilter} onChange={handleFilterChange(setCategoryFilter)} options={STOCK_CATEGORIES.map((c) => ({ value: c, label: t(`stockCategory.${c}`) }))} />
        <Input label={t('fromDate')} type="date" value={dateFrom} onChange={(e) => handleFilterChange(setDateFrom)(e.target.value)} className="!py-2" />
        <Input label={t('toDate')} type="date" value={dateTo} onChange={(e) => handleFilterChange(setDateTo)(e.target.value)} className="!py-2" />
      </div>
      <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)]">
        <DataTable
          columns={columns}
          data={paged}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
          emptyState={<EmptyState title={t('noTransactionsFound')} message={t('tryDifferentSearchFilter')} actionLabel={t('recordStockIn')} onAction={() => navigate('/stock/stock-in')} />}
        />
        <TablePagination page={page} totalPages={totalPages} totalItems={filtered.length} pageSize={pageSize} onPageChange={setPage} />
      </div>
    </div>
  );
}
