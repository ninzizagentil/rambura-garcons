import { useState, useMemo, useEffect } from 'react';
import { Plus, Truck, Boxes, CalendarClock, Pencil, Trash2, History, Phone, Mail, Tag } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import DataTable, { TablePagination } from '../../components/tables/DataTable';
import RowActionMenu from '../../components/tables/RowActionMenu';
import { SearchBar } from '../../components/common/SearchBar';
import Button from '../../components/common/Button';
import StatCard from '../../components/cards/StatCard';
import Modal from '../../components/modals/Modal';
import ConfirmModal from '../../components/modals/ConfirmModal';
import { EmptyState } from '../../components/feedback/States';
import ViewOnlyBanner from '../../components/feedback/ViewOnlyBanner';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { useToast } from '../../context/ToastContext';
import { ROLES } from '../../data/roles';
import { getSuppliers, refreshStock, deleteSupplier, getSupplyHistoryForSupplier, getItems } from '../../services/stockService';
import { logActivity } from '../../services/activityService';
import { useAuth } from '../../context/AuthContext';
import SupplierFormModal from './SupplierFormModal';
import { useApp } from '../../context/AppContext';

export default function Suppliers() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { viewOnly } = useModuleAccess(ROLES.STOCK_MANAGER);
  const { t } = useApp();

  const [suppliers, setSuppliers] = useState([]);
  const [allItems, setAllItems]   = useState(() => getItems());
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [historyTarget, setHistoryTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [supplierItemsTarget, setSupplierItemsTarget] = useState(null);

  const refresh = () => { setSuppliers([...getSuppliers()]); setAllItems(getItems()); };
  useEffect(() => {
    window.addEventListener('rg:stock-updated', refresh);
    refreshStock().catch(() => {});
    return () => window.removeEventListener('rg:stock-updated', refresh);
  }, []);
  useEffect(() => { setPage(1); }, [search]);

  // Items linked to a supplier via supplierId, grouped by category
  const getSupplierItems = (supplierId) =>
    allItems.filter((i) => i.supplierId === supplierId || i.supplierId?._id === supplierId || i.supplierId === supplierId?.toString());

  const getCategoryBadges = (supplierId) => {
    const items = getSupplierItems(supplierId);
    if (items.length === 0) return null;
    const cats = [...new Set(items.map((i) => i.category))];
    return { items, cats };
  };

  const filtered = useMemo(() => {
    if (!search) return suppliers;
    const q = search.toLowerCase();
    return suppliers.filter((s) => s.name.toLowerCase().includes(q) || s.contactPerson.toLowerCase().includes(q));
  }, [suppliers, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const stats = useMemo(() => ({
    total: suppliers.length,
    active: suppliers.filter((s) => s.status === 'active').length,
    itemsLinked: allItems.filter((i) => !!i.supplierId).length,
  }), [suppliers, allItems]);

  const handleDelete = async () => {
    setDeleting(true);
    const res = await deleteSupplier(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    if (!res.success) { showToast(res.error, 'error'); return; }
    showToast(t('removeSupplier'), 'success');
    logActivity({ user: user?.fullName || 'Stock Manager', action: `Removed supplier: ${deleteTarget.name}`, module: 'Stock', status: 'success' });
    refresh();
  };

  const columns = [
    { key: 'name', header: 'Supplier Name', render: (s) => <span className="font-medium text-[var(--color-heading)]">{s.name}</span> },
    { key: 'contactPerson', header: 'Contact Person' },
    { key: 'phone', header: 'Phone', render: (s) => <span className="inline-flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-[var(--color-mid-gray)]" aria-hidden="true" />{s.phone || '—'}</span> },
    { key: 'email', header: 'Email', render: (s) => s.email ? <span className="inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-[var(--color-mid-gray)]" aria-hidden="true" />{s.email}</span> : '—' },
    {
      key: 'itemsSupplied',
      header: 'Items Currently Supplied',
      render: (s) => {
        const info = getCategoryBadges(s.id);
        if (!info) return <span className="text-xs text-[var(--color-mid-gray)]">—</span>;
        return (
          <button
            className="flex flex-wrap gap-1 text-left"
            onClick={() => setSupplierItemsTarget(s)}
            title={`${info.items.length} item(s) — click to view`}
          >
            {info.cats.map((cat) => {
              const count = info.items.filter((i) => i.category === cat).length;
              const tone = cat === 'Foods' ? 'bg-[var(--color-status-green-bg)] text-[var(--color-status-green)]'
                : cat === 'Electronic Devices' ? 'bg-[var(--color-status-blue-bg)] text-[var(--color-status-blue)]'
                : 'bg-[var(--color-soft-gray)] text-[var(--color-mid-gray)]';
              return (
                <span key={cat} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tone}`}>
                  <Tag className="w-2.5 h-2.5" aria-hidden="true" />
                  {cat === 'Other School Materials' ? 'Materials' : cat} ({count})
                </span>
              );
            })}
          </button>
        );
      },
    },
    { key: 'lastSupply', header: 'Last Supply', render: (s) => s.lastSupply || 'No deliveries yet' },
    {
      key: 'actions',
      header: 'Actions',
      render: (s) => (
        <RowActionMenu
          items={[
            { label: t('fullHistory'), icon: History, onClick: () => setHistoryTarget(s) },
            !viewOnly && { label: t('edit'), icon: Pencil, onClick: () => { setEditTarget(s); setFormOpen(true); } },
            !viewOnly && { label: t('delete'), icon: Trash2, tone: 'danger', onClick: () => setDeleteTarget(s) },
          ]}
        />
      ),
    },
  ];

  const [historyRows, setHistoryRows] = useState([]);
  useEffect(() => {
    if (!historyTarget) { setHistoryRows([]); return; }
    getSupplyHistoryForSupplier(historyTarget.id).then(setHistoryRows);
  }, [historyTarget]);

  return (
    <div>
      <PageHeader
        title={t('suppliers')}
        description={t('suppliersDescription')}
        breadcrumb={[{ label: t('stockManagement'), to: '/stock' }, { label: t('suppliers') }]}
        actions={!viewOnly && <Button icon={Plus} onClick={() => { setEditTarget(null); setFormOpen(true); }}>{t('addSupplier')}</Button>}
      />

      {viewOnly && <ViewOnlyBanner module="Stock MIS" />}

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <StatCard label={t('totalSuppliers')} value={stats.total} icon={Truck} />
        <StatCard label={t('activeSuppliers')} value={stats.active} icon={CalendarClock} tone="default" />
        <StatCard label={t('itemsCurrentlySupplied')} value={stats.itemsLinked} icon={Boxes} />
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder={t('searchSupplierContact')} className="flex-1 min-w-[220px]" />
      </div>

      <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)]">
        <DataTable
          columns={columns}
          data={paged}
          emptyState={<EmptyState title={t('noSuppliersFound')} message={t('tryAddSupplier')} actionLabel={!viewOnly ? t('addSupplier') : undefined} onAction={!viewOnly ? () => { setEditTarget(null); setFormOpen(true); } : undefined} />}
        />
        <TablePagination page={page} totalPages={totalPages} totalItems={filtered.length} pageSize={pageSize} onPageChange={setPage} />
      </div>

      <SupplierFormModal open={formOpen} onClose={() => setFormOpen(false)} supplier={editTarget} onSaved={() => { refresh(); setFormOpen(false); }} />

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        variant="danger"
        title={t('removeSupplier')}
        confirmLabel={t('removeSupplier')}
        message={t('removeSupplierConfirm', { name: deleteTarget?.name || '' })}
      />

      <Modal open={!!historyTarget} onClose={() => setHistoryTarget(null)} title={`Supply History — ${historyTarget?.name || ''}`} size="lg">
        {historyRows.length === 0 ? (
          <EmptyState title={t('noTransactionsFound')} message={t('tryDifferentSearchFilter')} />
        ) : (
          <div className="table-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border-gray)] text-xs uppercase text-[var(--color-mid-gray)]">
                  <th className="text-left py-2 pr-4">{t('date')}</th>
                  <th className="text-left py-2 pr-4">{t('item')}</th>
                  <th className="text-left py-2 pr-4">{t('quantity')}</th>
                  <th className="text-left py-2">{t('responsibleUser')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-gray)]">
                {historyRows.map((t) => (
                  <tr key={t.id}>
                    <td className="py-2.5 pr-4">{t.date}</td>
                    <td className="py-2.5 pr-4">{t.itemName}</td>
                    <td className="py-2.5 pr-4 font-medium text-[var(--color-status-green)]">+{t.quantity}</td>
                    <td className="py-2.5">{t.responsibleUser}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      {/* Items currently supplied by this supplier */}
      <Modal
        open={!!supplierItemsTarget}
        onClose={() => setSupplierItemsTarget(null)}
        title={`Items Supplied — ${supplierItemsTarget?.name || ''}`}
        size="lg"
      >
        {(() => {
          const info = supplierItemsTarget ? getCategoryBadges(supplierItemsTarget.id) : null;
          if (!info) return <EmptyState title={t('noStockItemsFound')} message={t('tryDifferentStockSearch')} />;

          // Group items by category for the modal
          const byCategory = info.cats.map((cat) => ({
            cat,
            items: info.items.filter((i) => i.category === cat),
          }));

          return (
            <div className="space-y-5">
              {/* Summary badges */}
              <div className="flex flex-wrap gap-2 pb-3 border-b border-[var(--color-border-gray)]">
                <span className="text-sm font-semibold text-[var(--color-dark-gray)]">
                  {info.items.length} item{info.items.length !== 1 ? 's' : ''} across {info.cats.length} categor{info.cats.length !== 1 ? 'ies' : 'y'}
                </span>
              </div>

              {byCategory.map(({ cat, items: catItems }) => (
                <div key={cat}>
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-mid-gray)] mb-2">{cat}</p>
                  <div className="rounded-[var(--radius-card)] border border-[var(--color-border-gray)] overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--color-border-gray)] bg-[var(--color-soft-gray)] text-xs uppercase text-[var(--color-mid-gray)]">
                          <th className="text-left py-2 px-3">{t('itemName')}</th>
                          <th className="text-left py-2 px-3">{t('code')}</th>
                          <th className="text-left py-2 px-3">{t('quantity')}</th>
                          <th className="text-left py-2 px-3">{t('unit')}</th>
                          <th className="text-left py-2 px-3">{t('location')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border-gray)]">
                        {catItems.map((item) => (
                          <tr key={item.id} className="hover:bg-[var(--color-soft-gray)]">
                            <td className="py-2.5 px-3 font-medium">{item.name}</td>
                            <td className="py-2.5 px-3 font-mono text-xs text-[var(--color-mid-gray)]">{item.code}</td>
                            <td className="py-2.5 px-3">{item.quantity}</td>
                            <td className="py-2.5 px-3 text-[var(--color-mid-gray)]">{item.unit}</td>
                            <td className="py-2.5 px-3 text-[var(--color-mid-gray)]">{item.location || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
