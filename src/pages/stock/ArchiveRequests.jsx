/**
 * ArchiveRequests.jsx — /stock/archive-requests
 *
 * Stock Manager view: submit and track archive requests for zero-quantity items.
 * Uses existing UI components and design patterns only.
 */
/* oxlint-disable react/set-state-in-effect -- form options mirror the external stock cache. */
import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/tables/DataTable';
import { Badge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/modals/Modal';
import Alert from '../../components/feedback/Alert';
import { Select, Textarea } from '../../components/forms/FormField';
import { EmptyState } from '../../components/feedback/States';
import { useToast } from '../../context/ToastContext';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { getItems, refreshStock } from '../../services/stockService';

const ARCHIVE_REASONS = [
  'Item no longer in use',
  'Replaced by new item',
  'End of product lifecycle',
  'Damaged beyond repair',
  'Other',
];

function StatusBadge({ status }) {
  const map = {
    pending:  { tone: 'amber', label: 'Pending'  },
    approved: { tone: 'green', label: 'Approved' },
    rejected: { tone: 'red',   label: 'Rejected' },
  };
  const cfg = map[status] || { tone: 'neutral', label: status };
  return <Badge tone={cfg.tone}>{cfg.label}</Badge>;
}

function formatDate(v) {
  if (!v) return '—';
  return new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ArchiveRequests() {
  const { t } = useApp();
  const { showToast } = useToast();

  const [requests, setRequests]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [zeroItems, setZeroItems] = useState([]);
  const [formOpen, setFormOpen]   = useState(false);
  const [form, setForm]           = useState({ itemId: '', reason: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected]   = useState(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const json = await api.get('/stock/archive-requests/my');
      setRequests(json.data || []);
    } catch (err) {
      if (err.status !== 403) showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // This effect synchronizes the stock cache with selectable records.
  // oxlint-disable-next-line react/set-state-in-effect
  useEffect(() => {
    loadRequests();
    const syncItems = () => {
      // Only show items with zero quantity — only those can be archived.
      // oxlint-disable-next-line react(set-state-in-effect)
      setZeroItems(getItems().filter((i) => i.active !== false && i.quantity === 0));
    };
    refreshStock().then(syncItems).catch(() => {});
    window.addEventListener('rg:stock-updated', syncItems);
    return () => window.removeEventListener('rg:stock-updated', syncItems);
  }, [loadRequests]);

  const resetForm = () => setForm({ itemId: '', reason: '', notes: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.itemId || !form.reason) {
      showToast(t('itemAndReasonRequired'), 'error');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/stock/archive-requests', {
        itemId: form.itemId,
        reason: form.reason,
        notes: form.notes || undefined,
      });
      showToast(t('archiveRequestSubmitted'), 'success');
      setFormOpen(false);
      resetForm();
      loadRequests();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: 'itemName',    header: t('item'),        render: (r) => <span className="font-semibold">{r.itemName}</span> },
    { key: 'itemCode',    header: t('code'),        render: (r) => <span className="font-mono text-xs">{r.itemCode || '—'}</span> },
    { key: 'reason',      header: t('reason'),      render: (r) => <span className="text-sm">{r.reason}</span> },
    { key: 'status',      header: t('status'),      render: (r) => <StatusBadge status={r.status} /> },
    { key: 'createdAt',   header: t('date'),        render: (r) => formatDate(r.createdAt) },
    { key: 'reviewedBy',  header: t('reviewedBy'),  render: (r) => r.reviewedBy?.fullName || '—' },
    {
      key: 'actions', header: t('actions'),
      render: (r) => <Button size="sm" variant="ghost" onClick={() => setSelected(r)}>{t('viewDetails')}</Button>,
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('stockArchiveRequests')}
        description={t('stockArchiveRequestsDescription')}
        breadcrumb={[
          { label: t('stockManagement'), to: '/stock' },
          { label: t('stockArchiveRequests') },
        ]}
        actions={
          <Button icon={Plus} onClick={() => { resetForm(); setFormOpen(true); }}>
            {t('newArchiveRequest')}
          </Button>
        }
      />

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border-gray)] bg-[var(--color-white)] overflow-hidden">
        {loading ? (
          <div className="py-10 text-center text-sm text-[var(--color-mid-gray)]">{t('loading')}</div>
        ) : requests.length === 0 ? (
          <EmptyState title={t('noArchiveRequests')} message={t('noArchiveRequestsDescription')} />
        ) : (
          <DataTable columns={columns} data={requests} />
        )}
      </div>

      {/* Submit form modal */}
      <Modal
        open={formOpen}
        onClose={() => { setFormOpen(false); resetForm(); }}
        title={t('newArchiveRequest')}
        footer={
          <>
            <Button variant="ghost" onClick={() => { setFormOpen(false); resetForm(); }} disabled={submitting}>{t('cancel')}</Button>
            <Button variant="primary" onClick={handleSubmit} loading={submitting}>{t('submitRequest')}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Alert type="info">{t('archiveRequestInfo')}</Alert>
          {zeroItems.length === 0 ? (
            <Alert type="warning">{t('noZeroQuantityItems')}</Alert>
          ) : (
            <Select
              label={t('item')}
              required
              value={form.itemId}
              onChange={(e) => setForm({ ...form, itemId: e.target.value })}
              options={zeroItems.map((i) => ({ value: i.id || i._id, label: `${i.code ? `[${i.code}] ` : ''}${i.name}` }))}
            />
          )}
          <Select
            label={t('reason')}
            required
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            options={ARCHIVE_REASONS.map((r) => ({ value: r, label: r }))}
          />
          <Textarea
            label={t('additionalNotes')}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            placeholder={t('archiveNotesPlaceholder')}
          />
        </div>
      </Modal>

      {/* Detail modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={t('archiveRequestDetails')}
        footer={<Button variant="ghost" onClick={() => setSelected(null)}>{t('close')}</Button>}
      >
        {selected && (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <div><dt className="font-semibold text-[var(--color-mid-gray)]">{t('item')}</dt><dd className="mt-1">{selected.itemName}</dd></div>
            <div><dt className="font-semibold text-[var(--color-mid-gray)]">{t('code')}</dt><dd className="mt-1 font-mono text-xs">{selected.itemCode || '—'}</dd></div>
            <div><dt className="font-semibold text-[var(--color-mid-gray)]">{t('status')}</dt><dd className="mt-1"><StatusBadge status={selected.status} /></dd></div>
            <div><dt className="font-semibold text-[var(--color-mid-gray)]">{t('date')}</dt><dd className="mt-1">{formatDate(selected.createdAt)}</dd></div>
            <div className="col-span-2"><dt className="font-semibold text-[var(--color-mid-gray)]">{t('reason')}</dt><dd className="mt-1">{selected.reason}</dd></div>
            {selected.notes && <div className="col-span-2"><dt className="font-semibold text-[var(--color-mid-gray)]">{t('notes')}</dt><dd className="mt-1">{selected.notes}</dd></div>}
            {selected.reviewedBy && <div><dt className="font-semibold text-[var(--color-mid-gray)]">{t('reviewedBy')}</dt><dd className="mt-1">{selected.reviewedBy?.fullName}</dd></div>}
            {selected.rejectionReason && <div className="col-span-2"><dt className="font-semibold text-[var(--color-mid-gray)]">{t('rejectionReason')}</dt><dd className="mt-1 text-[var(--color-status-red)]">{selected.rejectionReason}</dd></div>}
          </dl>
        )}
      </Modal>
    </div>
  );
}
