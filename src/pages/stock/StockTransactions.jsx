import { useState, useMemo } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/tables/DataTable';
import { SearchBar, FilterDropdown } from '../../components/common/SearchBar';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/feedback/States';
import { getTransactions } from '../../services/stockService';
import { STOCK_CATEGORIES } from '../../data/stock';
import { useApp } from '../../context/AppContext';

function formatTransactionDate(value, language) {
  const date = new Date(value);
  const locale = language === 'fr' ? 'fr-FR' : language === 'rw' ? 'rw-RW' : 'en-GB';
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function StockTransactions() {
  const { t, language } = useApp();
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
    { key: 'itemName', header: t('item'), render: (row) => <span className="whitespace-nowrap font-semibold text-[var(--color-heading)]">{row.itemName}</span> },
    { key: 'category', header: t('category'), render: (row) => <span className="inline-flex whitespace-nowrap rounded-md bg-[var(--color-light-green-100)] px-2 py-1 text-xs font-semibold text-[var(--color-heading)]">{t(`stockCategory.${row.category}`)}</span> },
    { key: 'type', header: t('transactionType'), render: (row) => <Badge tone={row.type === 'in' ? 'green' : 'amber'}>{row.type === 'in' ? t('stockIn') : t('stockOut')}</Badge> },
    { key: 'quantity', header: t('quantity') },
    { key: 'date', header: t('date'), render: (row) => <span className="whitespace-nowrap font-semibold text-[var(--color-heading)]">{formatTransactionDate(row.date, language)}</span> },
    { key: 'responsibleUser', header: t('responsibleUser'), render: (row) => <span className="font-semibold text-[var(--color-heading)]">{row.responsibleUser}</span> },
    { key: 'party', header: t('sourceDestination') },
    { key: 'notes', header: t('notes'), render: (row) => row.notes || '—' },
  ];

  return (
    <div>
      <PageHeader
        title={t('stockTransactions')}
        description={t('stockTransactionsDescription')}
        breadcrumb={[{ label: t('stockManagement'), to: '/stock' }, { label: t('transactions') }]}
      />

      <div className="flex flex-wrap gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder={t('searchByItem')} className="flex-1 min-w-[220px]" />
        <FilterDropdown label={t('allTypes')} value={typeFilter} onChange={setTypeFilter} options={[{ value: 'in', label: t('stockIn') }, { value: 'out', label: t('stockOut') }]} />
        <FilterDropdown label={t('allCategories')} value={categoryFilter} onChange={setCategoryFilter} options={STOCK_CATEGORIES.map((c) => ({ value: c, label: c }))} />
      </div>

      <div className="bg-[var(--surface)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)]">
        <DataTable
          columns={columns}
          data={filtered}
          emptyState={<EmptyState title={t('noTransactionsFound')} message={t('tryDifferentSearchFilter')} />}
        />
      </div>
    </div>
  );
}
