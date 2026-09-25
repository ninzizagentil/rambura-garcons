import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Eye, Pencil, Trash2, Boxes, TrendingDown, PackageX, Wallet,
  Download, SlidersHorizontal, UtensilsCrossed, Package, Printer, FileSpreadsheet,
} from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import DataTable, { TablePagination } from '../../components/tables/DataTable';
import RowActionMenu from '../../components/tables/RowActionMenu';
import { SearchBar, FilterDropdown } from '../../components/common/SearchBar';
import { StatusBadge } from '../../components/common/Badge';
import IconButton from '../../components/common/IconButton';
import Button from '../../components/common/Button';
import StatCard from '../../components/cards/StatCard';
import Modal from '../../components/modals/Modal';
import { EmptyState, ErrorState } from '../../components/feedback/States';
import ViewOnlyBanner from '../../components/feedback/ViewOnlyBanner';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { useToast } from '../../context/ToastContext';
import { ROLES } from '../../data/roles';
import { getItems, refreshStock, createItem } from '../../services/stockService';
import { STOCK_CATEGORIES, STOCK_UNITS } from '../../data/stock';
import { exportToCSV, exportToExcel, parseCSV } from '../../utils/export';
import { printReport } from '../../utils/print';
import CsvImportButton from '../../components/common/CsvImportButton';
import { cn } from '../../utils/cn';
import StockItemFormModal from './StockItemFormModal';
import { useApp } from '../../context/AppContext';

const STATUS_OPTIONS = [
  { value: 'normal', label: 'normal' },
  { value: 'low-stock', label: 'lowStock' },
  { value: 'out-of-stock', label: 'outOfStock' },
];

function formatRWF(amount, language) {
  const locale = language === 'fr' ? 'fr-FR' : language === 'rw' ? 'rw-RW' : 'en-US';
  return `RWF ${Math.round(amount || 0).toLocaleString(locale)}`;
}

/**
 * ItemThumb — clean category-icon thumbnail standing in for a product photo.
 * The catalogue has no real item images or an upload pipeline, so rather than
 * fabricate broken <img> sources this renders an honest, professional
 * placeholder tied to the item's category.
 */
function ItemThumb({ category }) {
  const Icon = category === 'Foods' ? UtensilsCrossed : Package;
  return (
    <span
      className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--color-light-green-100)] text-[var(--color-medium-green)] flex-shrink-0"
      aria-hidden="true"
    >
      <Icon className="w-[18px] h-[18px]" />
    </span>
  );
}

export default function StockItems() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { viewOnly } = useModuleAccess(ROLES.STOCK_MANAGER, 'stock', ['stock.create', 'stock.update', 'stock.delete']);
  const { t, language } = useApp();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [unitFilter, setUnitFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedKeys, setSelectedKeys] = useState(() => new Set());

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);

  const fetchItems = () => {
    try {
      setItems([...getItems()]);
      setError(null);
      return true;
    } catch {
      setError(t('failedLoadStockItems'));
      return false;
    }
  };

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      await refreshStock();
      fetchItems();
    } catch {
      setError(t('failedLoadStockItems'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleStockUpdated = () => fetchItems();
    window.addEventListener('rg:stock-updated', handleStockUpdated);
    setLoading(true);
    refreshStock()
      .catch(() => setError(t('failedLoadStockItems')))
      .finally(() => {
        fetchItems();
        setLoading(false);
      });
    return () => window.removeEventListener('rg:stock-updated', handleStockUpdated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset to page 1 whenever the result set could change shape.
  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, unitFilter, statusFilter, pageSize]);

  const stats = useMemo(() => {
    const total = items.length;
    const lowStock = items.filter((i) => i.status === 'low-stock').length;
    const outOfStock = items.filter((i) => i.status === 'out-of-stock').length;
    const totalValue = items.reduce((sum, i) => sum + (i.value || 0), 0);
    return { total, lowStock, outOfStock, totalValue };
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      const matchesSearch =
        !q ||
        i.name.toLowerCase().includes(q) ||
        i.code?.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q);
      const matchesCategory = !categoryFilter || i.category === categoryFilter;
      const matchesUnit = !unitFilter || i.unit === unitFilter;
      const matchesStatus = !statusFilter || i.status === statusFilter;
      return matchesSearch && matchesCategory && matchesUnit && matchesStatus;
    });
  }, [items, search, categoryFilter, unitFilter, statusFilter]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'string') return av.localeCompare(bv) * dir;
      return ((av ?? 0) - (bv ?? 0)) * dir;
    });
  }, [filtered, sortKey, sortDir]);

  const totalItems = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = useMemo(
    () => sorted.slice((safePage - 1) * pageSize, safePage * pageSize),
    [sorted, safePage, pageSize]
  );

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const toggleRow = (row) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(row.id)) next.delete(row.id);
      else next.add(row.id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedKeys((prev) => {
      const allChecked = paged.length > 0 && paged.every((row) => prev.has(row.id));
      const next = new Set(prev);
      if (allChecked) paged.forEach((row) => next.delete(row.id));
      else paged.forEach((row) => next.add(row.id));
      return next;
    });
  };

  const handleExport = () => {
    if (sorted.length === 0) {
      showToast(t('noItemsToExportFilters'), 'warning');
      return;
    }
    exportToCSV(
      'stock-items',
      [
        { key: 'code', header: t('code') }, { key: 'name', header: t('itemName') }, { key: 'category', header: t('category') },
        { key: 'unit', header: t('unit') }, { key: 'quantity', header: t('quantity') }, { key: 'minLevel', header: t('minimumLevel') },
        { key: 'status', header: t('status') }, { key: 'value', header: t('valueRwf'), value: (row) => row.value },
      ],
      sorted
    );
    showToast(t('stockItemsExported'), 'success');
  };

  const exportColumns = [
    { key: 'code', header: t('code') }, { key: 'name', header: t('itemName') }, { key: 'category', header: t('category') },
    { key: 'unit', header: t('unit') }, { key: 'quantity', header: t('quantity') }, { key: 'minLevel', header: t('minimumLevel') },
    { key: 'status', header: t('status') }, { key: 'value', header: t('valueRwf'), value: (row) => row.value },
  ];

  const handleExcelExport = () => {
    if (!sorted.length) { showToast(t('noItemsToExport'), 'warning'); return; }
    exportToExcel('stock-items', exportColumns, sorted); showToast(t('excelFileExported'), 'success');
  };

  const handlePrint = () => {
    printReport(t('stockItems'), exportColumns, sorted); showToast(t('printReportOpened'), 'success');
  };

  const handleImport = async (text) => {
    const rows = parseCSV(text);
    if (!rows.length) { showToast(t('csvNoDataRows'), 'warning'); return; }
    let imported = 0;
    for (const row of rows) {
      if (!row.name || !STOCK_CATEGORIES.includes(row.category)) continue;
      const result = await createItem({ ...row, quantity: Number(row.quantity || 0), minLevel: Number(row.minLevel || 0), unitPrice: Number(row.unitPrice || 0) });
      if (result.success) imported += 1;
    }
    await refresh();
    showToast(t('stockItemsImported', { count: imported }), imported ? 'success' : 'warning');
  };

  const columns = [
    {
      key: 'name',
      header: t('itemName'),
      sortable: true,
      render: (i) => (
        <div className="flex items-center gap-3">
          <ItemThumb category={i.category} />
          <div className="min-w-0">
            <p className="font-medium text-[var(--color-dark-gray)] truncate">{i.name}</p>
            <p className="text-xs text-[var(--color-mid-gray)] font-mono">{i.code}</p>
          </div>
        </div>
      ),
    },
    { key: 'category', header: t('category') }, { key: 'unit', header: t('unit') },
    { key: 'quantity', header: t('quantity'), sortable: true, render: (i) => `${i.quantity} ${i.unit}` },
    { key: 'minLevel', header: t('minimumLevel'), render: (i) => `${i.minLevel} ${i.unit}` },
    { key: 'status', header: t('status'), render: (i) => <StatusBadge status={i.status} label={t(i.status === 'normal' ? 'normal' : i.status === 'low-stock' ? 'lowStock' : 'outOfStock')} /> },
    { key: 'value', header: t('valueRwf'), sortable: true, render: (i) => formatRWF(i.value, language) },
    {
      key: 'actions',
      header: 'Actions',
      render: (i) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <IconButton icon={Eye} label={`${t('view')} ${i.name}`} onClick={() => setViewItem(i)} />
          <RowActionMenu
            label={t('actionsForItem', { name: i.name })}
            items={[
              { label: t('viewDetails'), icon: Eye, onClick: () => navigate(`/stock/items/${i.id}`) },
              !viewOnly && { label: t('edit'), icon: Pencil, onClick: () => setEditItem(i) },
              // Items are never deleted directly: management must approve an archive request first.
              !viewOnly && { label: t('newArchiveRequest'), icon: Trash2, tone: 'danger', onClick: () => navigate('/stock/archive-requests') },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('allItems')}
        description={t('manageStockCatalogue')}
        breadcrumb={[{ label: t('stockMis'), to: '/stock' }, { label: t('allItems') }]}
        actions={!viewOnly && <Button icon={Plus} onClick={() => setFormOpen(true)}>{t('addNewItem')}</Button>}
      />

      {viewOnly && <ViewOnlyBanner module="Stock MIS" />}

      {error ? (
        <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)]">
          <ErrorState message={error} onRetry={refresh} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label={t('totalItems')} value={stats.total} icon={Boxes} />
            <StatCard
              label={t('lowStock')}
              value={stats.lowStock}
              icon={TrendingDown}
              tone="amber"
              onClick={() => navigate('/stock/alerts?tab=low-stock')}
            />
            <StatCard
              label={t('outOfStock')}
              value={stats.outOfStock}
              icon={PackageX}
              tone="red"
              onClick={() => navigate('/stock/alerts?tab=out-of-stock')}
            />
            <StatCard label={t('totalValue')} value={formatRWF(stats.totalValue, language)} icon={Wallet} tone="blue" />
          </div>

          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div className={cn('flex flex-wrap gap-3 flex-1 min-w-[260px]', !filtersOpen && 'hidden sm:flex')}>
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder={t('searchStockItems')}
                className="flex-1 min-w-[220px]"
              />
              <FilterDropdown
                label={t('allCategories')}
                value={categoryFilter}
                onChange={setCategoryFilter}
                options={STOCK_CATEGORIES.map((c) => ({ value: c, label: t(`stockCategory.${c}`) }))}
              />
              <FilterDropdown
                label={t('allUnits')}
                value={unitFilter}
                onChange={setUnitFilter}
                options={STOCK_UNITS.map((u) => ({ value: u, label: t(`stockUnit.${u}`) }))}
              />
              <FilterDropdown
                label={t('allStatus')}
                value={statusFilter}
                onChange={setStatusFilter}
                options={STATUS_OPTIONS.map((option) => ({ ...option, label: t(option.label) }))}
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                icon={SlidersHorizontal}
                onClick={() => setFiltersOpen((v) => !v)}
                className="sm:hidden"
              >
                {t('filters')}
              </Button>
              <Button variant="secondary" icon={Download} onClick={handleExport}>
                {t('csv')}
              </Button>
              <Button variant="secondary" icon={FileSpreadsheet} onClick={handleExcelExport}>{t('excel')}</Button>
              <Button variant="secondary" icon={Printer} onClick={handlePrint}>{t('printPdf')}</Button>
              {!viewOnly && <CsvImportButton onImport={handleImport} />}
            </div>
          </div>

          {selectedKeys.size > 0 && (
            <p className="text-xs font-medium text-[var(--color-medium-green)] mb-2">
              {t('itemsSelected', { count: selectedKeys.size })}
            </p>
          )}

          <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)]">
            <DataTable
              columns={columns}
              data={paged}
              loading={loading}
              rowKey="id"
              onRowClick={(i) => navigate(`/stock/items/${i.id}`)}
              selectable
              selectedKeys={selectedKeys}
              onToggleRow={toggleRow}
              onToggleAll={toggleAll}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
              emptyState={
                <EmptyState
                  title={t('noStockItemsFound')}
                  message={t('tryDifferentStockSearch')}
                  actionLabel={viewOnly ? undefined : t('addNewItem')}
                  onAction={viewOnly ? undefined : () => setFormOpen(true)}
                />
              }
            />
            {!loading && totalItems > 0 && (
              <TablePagination
                page={safePage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            )}
          </div>
        </>
      )}

      {!viewOnly && (
        <>
          <StockItemFormModal
            open={formOpen}
            onClose={() => setFormOpen(false)}
            onSaved={() => { refresh(); setFormOpen(false); }}
          />
          <StockItemFormModal
            open={!!editItem}
            item={editItem}
            onClose={() => setEditItem(null)}
            onSaved={() => { refresh(); setEditItem(null); }}
          />
        </>
      )}

      <Modal
        open={!!viewItem}
        onClose={() => setViewItem(null)}
        title={viewItem?.name || t('itemDetails')}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setViewItem(null)}>{t('close')}</Button>
            <Button
              variant="primary"
              onClick={() => { if (viewItem) navigate(`/stock/items/${viewItem.id}`); }}
            >
              {t('openFullDetails')}
            </Button>
          </>
        }
      >
        {viewItem && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <ItemThumb category={viewItem.category} />
              <div>
                <p className="font-display font-semibold text-[var(--color-dark-gray)]">{viewItem.name}</p>
                <p className="text-xs text-[var(--color-mid-gray)] font-mono">{viewItem.code}</p>
              </div>
              <StatusBadge status={viewItem.status} className="ml-auto" />
            </div>
            {viewItem.description && (
              <p className="text-sm text-[var(--color-dark-gray)] leading-relaxed">{viewItem.description}</p>
            )}
            <dl className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--color-border-gray)]">
              <div><dt className="text-xs text-[var(--color-mid-gray)]">{t('category')}</dt><dd className="font-medium text-[var(--color-dark-gray)] mt-0.5">{t(`stockCategory.${viewItem.category}`)}</dd></div>
              <div><dt className="text-xs text-[var(--color-mid-gray)]">{t('unit')}</dt><dd className="font-medium text-[var(--color-dark-gray)] mt-0.5">{viewItem.unit}</dd></div>
              <div><dt className="text-xs text-[var(--color-mid-gray)]">{t('quantity')}</dt><dd className="font-medium text-[var(--color-dark-gray)] mt-0.5">{viewItem.quantity} {viewItem.unit}</dd></div>
              <div><dt className="text-xs text-[var(--color-mid-gray)]">{t('minimumLevel')}</dt><dd className="font-medium text-[var(--color-dark-gray)] mt-0.5">{viewItem.minLevel} {viewItem.unit}</dd></div>
              <div className="col-span-2"><dt className="text-xs text-[var(--color-mid-gray)]">{t('totalValue')}</dt><dd className="font-display font-semibold text-[var(--color-heading)] mt-0.5">{formatRWF(viewItem.value, language)}</dd></div>
            </dl>
          </div>
        )}
      </Modal>
    </div>
  );
}
