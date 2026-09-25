/**
 * ArchiveRequests.jsx — /equipment/archive-requests
 *
 * Equipment Manager view: submit and track archive requests.
 * Uses existing UI components and design patterns only.
 */
/* oxlint-disable react/set-state-in-effect -- form options mirror the external equipment cache. */
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
import { refreshEquipment, getEquipment } from '../../services/equipmentService';

const ARCHIVE_REASONS = [
  'No longer needed',
  'Replaced by new equipment',
  'End of product lifecycle',
  'Non-repairable fault',
  'Duplicate record',
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

export default function EquipmentArchiveRequestsPage() {
  const { t } = useApp();
  const { showToast } = useToast();

  const [requests, setRequests]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [availableEquipment, setAvail]  = useState([]);
  const [formOpen, setFormOpen]         = useState(false);
  const [form, setForm]                 = useState({ equipmentId: '', reason: '', notes: '' });
  const [submitting, setSubmitting]     = useState(false);
  const [selected, setSelected]         = useState(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const json = await api.get('/equipment-archive-requests/my');
      setRequests(json.data || []);
    } catch (err) {
      if (err.status !== 403) showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // This effect synchronizes the equipment cache with selectable records.
  // oxlint-disable-next-line react/set-state-in-effect
  useEffect(() => {
    loadRequests();
    const syncEquip = () => {
      // Only show available/unassigned equipment (not retired, not assigned).
      // oxlint-disable-next-line react(set-state-in-effect)
      setAvail(
        getEquipment().filter(
          (e) => e.status !== 'retired' && e.status !== 'assigned'
               && e.condition !== 'retired' && e.status !== 'under_maintenance'
        )
      );
    };
    refreshEquipment().then(syncEquip).catch(() => {});
    window.addEventListener('rg:equipment-updated', syncEquip);
    return () => window.removeEventListener('rg:equipment-updated', syncEquip);
  }, [loadRequests]);

  const resetForm = () => setForm({ equipmentId: '', reason: '', notes: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.equipmentId || !form.reason) {
      showToast(t('equipmentAndReasonRequired'), 'error');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/equipment-archive-requests', {
        equipmentId: form.equipmentId,
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
    { key: 'assetNumber',   header: t('assetNumber'), render: (r) => <span className="font-mono text-xs font-semibold">{r.assetNumber}</span> },
    { key: 'equipmentName', header: t('equipment'),   render: (r) => r.equipmentName },
    { key: 'reason',        header: t('reason'),      render: (r) => <span className="text-sm">{r.reason}</span> },
    { key: 'status',        header: t('status'),      render: (r) => <StatusBadge status={r.status} /> },
    { key: 'createdAt',     header: t('date'),        render: (r) => formatDate(r.createdAt) },
    { key: 'reviewedBy',    header: t('reviewedBy'),  render: (r) => r.reviewedBy?.fullName || '—' },
    {
      key: 'actions', header: t('actions'),
      render: (r) => <Button size="sm" variant="ghost" onClick={() => setSelected(r)}>{t('viewDetails')}</Button>,
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('equipmentArchiveRequests')}
        description={t('equipmentArchiveRequestsDescription')}
        breadcrumb={[
          { label: t('equipmentMis'), to: '/equipment' },
          { label: t('equipmentArchiveRequests') },
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
          <Select
            label={t('equipment')}
            required
            value={form.equipmentId}
            onChange={(e) => setForm({ ...form, equipmentId: e.target.value })}
            options={availableEquipment.map((eq) => ({
              value: eq.id || eq._id,
              label: `${eq.assetNumber} — ${eq.name}`,
            }))}
          />
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
            <div><dt className="font-semibold text-[var(--color-mid-gray)]">{t('assetNumber')}</dt><dd className="mt-1 font-mono text-xs">{selected.assetNumber}</dd></div>
            <div><dt className="font-semibold text-[var(--color-mid-gray)]">{t('equipment')}</dt><dd className="mt-1">{selected.equipmentName}</dd></div>
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
