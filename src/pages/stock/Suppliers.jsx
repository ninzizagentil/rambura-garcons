import { useState, useMemo, useEffect } from 'react';
import { Plus, Truck, Boxes, CalendarClock, Pencil, Trash2, History, Phone, Mail } from 'lucide-react';
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
import { getSuppliers, refreshStock, deleteSupplier, getSupplyHistoryForSupplier } from '../../services/stockService';
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
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [historyTarget, setHistoryTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const refresh = () => setSuppliers([...getSuppliers()]);
  useEffect(() => {
    window.addEventListener('rg:stock-updated', refresh);
    refreshStock().catch(() => {});
    return () => window.removeEventListener('rg:stock-updated', refresh);
  }, []);
  useEffect(() => { setPage(1); }, [search]);

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
    itemsSupplied: suppliers.reduce((sum, s) => sum + s.itemsSupplied, 0),
  }), [suppliers]);

  const handleDelete = async () => {
    setDeleting(true);
    const res = await deleteSupplier(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    if (!res.success) { showToast(res.error, 'error'); return; }
    showToast(`"${deleteTarget.name}" removed from suppliers.`, 'success');
    logActivity({ user: user?.fullName || 'Stock Manager', action: `Removed supplier: ${deleteTarget.name}`, module: 'Stock', status: 'success' });
    refresh();
  };

  const columns = [
    { key: 'name', header: 'Supplier Name', render: (s) => <span className="font-medium text-[var(--color-heading)]">{s.name}</span> },
    { key: 'contactPerson', header: 'Contact Person' },
    { key: 'phone', header: 'Phone', render: (s) => <span className="inline-flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-[var(--color-mid-gray)]" aria-hidden="true" />{s.phone || '—'}</span> },
    { key: 'email', header: 'Email', render: (s) => s.email ? <span className="inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-[var(--color-mid-gray)]" aria-hidden="true" />{s.email}</span> : '—' },
    { key: 'itemsSupplied', header: 'Items Supplied' },
    { key: 'lastSupply', header: 'Last Supply', render: (s) => s.lastSupply || 'No deliveries yet' },
    {
      key: 'actions',
      header: 'Actions',
      render: (s) => (
        <RowActionMenu
          items={[
            { label: 'Supply History', icon: History, onClick: () => setHistoryTarget(s) },
            !viewOnly && { label: 'Edit', icon: Pencil, onClick: () => { setEditTarget(s); setFormOpen(true); } },
            !viewOnly && { label: 'Delete', icon: Trash2, tone: 'danger', onClick: () => setDeleteTarget(s) },
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
        <StatCard label={t('itemsCurrentlySupplied')} value={stats.itemsSupplied} icon={Boxes} />
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
          <EmptyState title="No deliveries recorded" message="This supplier has no Stock In history yet." />
        ) : (
          <div className="table-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border-gray)] text-xs uppercase text-[var(--color-mid-gray)]">
                  <th className="text-left py-2 pr-4">Date</th>
                  <th className="text-left py-2 pr-4">Item</th>
                  <th className="text-left py-2 pr-4">Quantity</th>
                  <th className="text-left py-2">Responsible User</th>
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
    </div>
  );
}
