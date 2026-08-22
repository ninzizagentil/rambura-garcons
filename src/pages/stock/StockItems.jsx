import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Eye, Pencil, Trash2, Boxes, TrendingDown, PackageX, Wallet,
  Download, SlidersHorizontal, UtensilsCrossed, Cpu,
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
import ConfirmModal from '../../components/modals/ConfirmModal';
import { EmptyState, ErrorState } from '../../components/feedback/States';
import ViewOnlyBanner from '../../components/feedback/ViewOnlyBanner';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { useToast } from '../../context/ToastContext';
import { ROLES } from '../../data/roles';
import { getItems, deleteItem } from '../../services/stockService';
import { STOCK_CATEGORIES, STOCK_UNITS } from '../../data/stock';
import { exportToCSV } from '../../utils/export';
import { cn } from '../../utils/cn';
import StockItemFormModal from './StockItemFormModal';

const STATUS_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'low-stock', label: 'Low Stock' },
  { value: 'out-of-stock', label: 'Out of Stock' },
];

function formatRWF(amount) {
  return `RWF ${Math.round(amount || 0).toLocaleString('en-US')}`;
}

/**
 * ItemThumb — clean category-icon thumbnail standing in for a product photo.
 * The catalogue has no real item images or an upload pipeline, so rather than
 * fabricate broken <img> sources this renders an honest, professional
 * placeholder tied to the item's category.
 */
function ItemThumb({ category }) {
  const Icon = category === 'Foods' ? UtensilsCrossed : Cpu;
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
  const { viewOnly } = useModuleAccess(ROLES.STOCK_MANAGER);

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
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchItems = () => {
    try {
      setItems(getItems());
      setError(null);
      return true;
    } catch {
      setError('Failed to load stock items. Please try again.');
      return false;
    }
  };

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      fetchItems();
      setLoading(false);
    }, 450);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = () => fetchItems();

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
      showToast('There are no items to export for the current filters.', 'warning');
      return;
    }
    exportToCSV(
      'stock-items',
      [
        { key: 'code', header: 'Code' },
        { key: 'name', header: 'Item Name' },
        { key: 'category', header: 'Category' },
        { key: 'unit', header: 'Unit' },
        { key: 'quantity', header: 'Quantity' },
        { key: 'minLevel', header: 'Minimum Level' },
        { key: 'status', header: 'Status' },
        { key: 'value', header: 'Value (RWF)', value: (row) => row.value },
      ],
      sorted
    );
    showToast('Stock items exported.', 'success');
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setTimeout(() => {
      const result = deleteItem(deleteTarget.id);
      setDeleting(false);
      setDeleteTarget(null);
      if (result.success) {
        showToast(`${deleteTarget.name} removed from stock.`, 'success');
        refresh();
        setSelectedKeys((prev) => {
          const next = new Set(prev);
          next.delete(deleteTarget.id);
          return next;
        });
      } else {
        showToast(result.error, 'error');
      }
    }, 350);
  };

  const columns = [
    {
      key: 'name',
      header: 'Item Name',
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
    { key: 'category', header: 'Category' },
    { key: 'unit', header: 'Unit' },
    { key: 'quantity', header: 'Quantity', sortable: true, render: (i) => `${i.quantity} ${i.unit}` },
    { key: 'minLevel', header: 'Minimum Level', render: (i) => `${i.minLevel} ${i.unit}` },
    { key: 'status', header: 'Status', render: (i) => <StatusBadge status={i.status} /> },
    { key: 'value', header: 'Value (RWF)', sortable: true, render: (i) => formatRWF(i.value) },
    {
      key: 'actions',
      header: 'Actions',
      render: (i) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <IconButton icon={Eye} label={`View ${i.name}`} onClick={() => setViewItem(i)} />
          <RowActionMenu
            label={`Actions for ${i.name}`}
            items={[
              { label: 'View Details', icon: Eye, onClick: () => navigate(`/stock/items/${i.id}`) },
              !viewOnly && { label: 'Edit', icon: Pencil, onClick: () => setEditItem(i) },
              !viewOnly && { label: 'Delete', icon: Trash2, tone: 'danger', onClick: () => setDeleteTarget(i) },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="All Items"
        description="Manage the school's stock catalogue."
        breadcrumb={[{ label: 'Stock MIS', to: '/stock' }, { label: 'All Items' }]}
        actions={!viewOnly && <Button icon={Plus} onClick={() => setFormOpen(true)}>Add New Item</Button>}
      />

      {viewOnly && <ViewOnlyBanner module="Stock MIS" />}

      {error ? (
        <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)]">
          <ErrorState message={error} onRetry={refresh} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Items" value={stats.total} icon={Boxes} />
            <StatCard
              label="Low Stock"
              value={stats.lowStock}
              icon={TrendingDown}
              tone="amber"
              onClick={() => setStatusFilter('low-stock')}
            />
            <StatCard
              label="Out of Stock"
              value={stats.outOfStock}
              icon={PackageX}
              tone="red"
              onClick={() => setStatusFilter('out-of-stock')}
            />
            <StatCard label="Total Value" value={formatRWF(stats.totalValue)} icon={Wallet} tone="blue" />
          </div>

          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div className={cn('flex flex-wrap gap-3 flex-1 min-w-[260px]', !filtersOpen && 'hidden sm:flex')}>
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search by item name, code or category…"
                className="flex-1 min-w-[220px]"
              />
              <FilterDropdown
                label="All Categories"
                value={categoryFilter}
                onChange={setCategoryFilter}
                options={STOCK_CATEGORIES.map((c) => ({ value: c, label: c }))}
              />
              <FilterDropdown
                label="All Units"
                value={unitFilter}
                onChange={setUnitFilter}
                options={STOCK_UNITS.map((u) => ({ value: u, label: u }))}
              />
              <FilterDropdown
                label="All Status"
                value={statusFilter}
                onChange={setStatusFilter}
                options={STATUS_OPTIONS}
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                icon={SlidersHorizontal}
                onClick={() => setFiltersOpen((v) => !v)}
                className="sm:hidden"
              >
                Filters
              </Button>
              <Button variant="secondary" icon={Download} onClick={handleExport}>
                Export
              </Button>
            </div>
          </div>

          {selectedKeys.size > 0 && (
            <p className="text-xs font-medium text-[var(--color-medium-green)] mb-2">
              {selectedKeys.size} item{selectedKeys.size > 1 ? 's' : ''} selected
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
                  title="No stock items found"
                  message="Try a different search or filter, or add a new item to the catalogue."
                  actionLabel={viewOnly ? undefined : 'Add New Item'}
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
          <ConfirmModal
            open={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleDelete}
            title="Delete stock item"
            message={deleteTarget ? `Are you sure you want to delete "${deleteTarget.name}"? This cannot be undone.` : ''}
            confirmLabel="Delete"
            variant="danger"
            loading={deleting}
          />
        </>
      )}

      <Modal
        open={!!viewItem}
        onClose={() => setViewItem(null)}
        title={viewItem?.name || 'Item details'}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setViewItem(null)}>Close</Button>
            <Button
              variant="primary"
              onClick={() => { if (viewItem) navigate(`/stock/items/${viewItem.id}`); }}
            >
              Open Full Details
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
              <div><dt className="text-xs text-[var(--color-mid-gray)]">Category</dt><dd className="font-medium text-[var(--color-dark-gray)] mt-0.5">{viewItem.category}</dd></div>
              <div><dt className="text-xs text-[var(--color-mid-gray)]">Unit</dt><dd className="font-medium text-[var(--color-dark-gray)] mt-0.5">{viewItem.unit}</dd></div>
              <div><dt className="text-xs text-[var(--color-mid-gray)]">Quantity</dt><dd className="font-medium text-[var(--color-dark-gray)] mt-0.5">{viewItem.quantity} {viewItem.unit}</dd></div>
              <div><dt className="text-xs text-[var(--color-mid-gray)]">Minimum Level</dt><dd className="font-medium text-[var(--color-dark-gray)] mt-0.5">{viewItem.minLevel} {viewItem.unit}</dd></div>
              <div className="col-span-2"><dt className="text-xs text-[var(--color-mid-gray)]">Total Value</dt><dd className="font-display font-semibold text-[var(--color-heading)] mt-0.5">{formatRWF(viewItem.value)}</dd></div>
            </dl>
          </div>
        )}
      </Modal>
    </div>
  );
}
