/**
 * RetirementRequests.jsx — /equipment/retirement-requests
 *
 * Equipment Manager view for submitting and tracking retirement requests.
 * Uses existing UI components, CSS variables, and design patterns only.
 */
/* oxlint-disable react/set-state-in-effect -- form options mirror the external equipment cache. */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Download, Plus, Printer, Search } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import DataTable, { TablePagination } from '../../components/tables/DataTable';
import { Badge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/modals/Modal';
import Alert from '../../components/feedback/Alert';
import { Input, Select, Textarea } from '../../components/forms/FormField';
import { EmptyState } from '../../components/feedback/States';
import { useToast } from '../../context/ToastContext';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { requestEquipmentRetirement, refreshEquipment, getEquipment } from '../../services/equipmentService';
import { exportToCSV } from '../../utils/export';
import { printReport } from '../../utils/print';

const RETIREMENT_REASONS = [
  'End of life',
  'Beyond economical repair',
  'Obsolete technology',
  'Irreparable physical damage',
  'Health and safety risk',
  'Replaced by new asset',
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

export default function RetirementRequests() {
  const { t } = useApp();
  const { showToast } = useToast();

  const [requests, setRequests]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [availableEquipment, setAvailableEquipment] = useState([]);
  const [formOpen, setFormOpen]     = useState(false);
  const [form, setForm]             = useState({ equipmentId: '', reason: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected]     = useState(null);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]             = useState(1);
  const [pageSize, setPageSize]     = useState(10);

  const pendingEquipmentIds = useMemo(
    () => new Set(requests.filter((request) => request.status === 'pending').map((request) => String(request.equipmentId))),
    [requests]
  );

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const json = await api.get('/equipment-retirement/my');
      setRequests(json.data || []);
    } catch (err) {
      if (err.status !== 403) showToast(err.message || t('failedToLoadRetirementRequests'), 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast, t]);

  // This effect synchronizes the equipment cache with selectable records.
  // oxlint-disable-next-line react/set-state-in-effect
  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    const syncEquipment = () => {
      // oxlint-disable-next-line react(set-state-in-effect)
      setAvailableEquipment(
        getEquipment().filter((e) => e.status !== 'retired' && e.condition !== 'retired' && !pendingEquipmentIds.has(String(e.id || e._id)))
      );
    };
    refreshEquipment().then(syncEquipment).catch(() => {});
    window.addEventListener('rg:equipment-updated', syncEquipment);
    return () => window.removeEventListener('rg:equipment-updated', syncEquipment);
  }, [pendingEquipmentIds]);

  const resetForm = () => setForm({ equipmentId: '', reason: '', notes: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.equipmentId || !form.reason) {
      showToast(t('equipmentAndReasonRequired'), 'error');
      return;
    }
    setSubmitting(true);
    try {
      await requestEquipmentRetirement({
        equipmentId: form.equipmentId,
        reason: form.reason,
        notes: form.notes || undefined,
      });
      showToast(t('retirementRequestSubmitted'), 'success');
      setFormOpen(false);
      resetForm();
      loadRequests();
    } catch (err) {
      const details = err.errors?.map((error) => error.message).filter(Boolean).join(', ');
      showToast(details ? `${err.message}: ${details}` : err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();
    return requests.filter((request) => {
      const matchesStatus = !statusFilter || request.status === statusFilter;
      const matchesSearch = !query || [request.assetNumber, request.equipmentName, request.reason]
        .some((value) => String(value || '').toLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    });
  }, [requests, search, statusFilter]);

  const summary = useMemo(() => ({
    total: requests.length,
    pending: requests.filter((request) => request.status === 'pending').length,
    approved: requests.filter((request) => request.status === 'approved').length,
    rejected: requests.filter((request) => request.status === 'rejected').length,
  }), [requests]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  const visibleRequests = filteredRequests.slice((page - 1) * pageSize, page * pageSize);
  const updateSearch = (event) => { setSearch(event.target.value); setPage(1); };
  const updateStatus = (event) => { setStatusFilter(event.target.value); setPage(1); };

  const reportColumns = [
    { key: 'assetNumber', header: t('assetNumber') },
    { key: 'equipmentName', header: t('equipment') },
    { key: 'reason', header: t('reason') },
    { key: 'status', header: t('status') },
    { key: 'createdAt', header: t('date'), value: (row) => formatDate(row.createdAt) },
    { key: 'reviewedBy', header: t('reviewedBy'), value: (row) => row.reviewedBy?.fullName || '—' },
    { key: 'reviewedAt', header: t('reviewedBy'), value: (row) => formatDate(row.reviewedAt) },
    { key: 'rejectionReason', header: t('rejectionReason') },
  ];

  const handleExport = () => {
    exportToCSV('equipment-retirement-requests', reportColumns, filteredRequests);
    showToast(t('exportCsv'), 'success');
  };

  const handlePrint = () => {
    const opened = printReport(t('retirementRequests'), reportColumns, filteredRequests, {
      summary: [
        { label: t('total'), value: summary.total },
        { label: t('pendingApproval'), value: summary.pending },
        { label: t('approved'), value: summary.approved },
        { label: t('rejected'), value: summary.rejected },
      ],
    });
    if (opened) showToast(t('printReportOpened'), 'success');
    else showToast(t('enablePopupsToPrint'), 'error');
  };

  const columns = [
    {
      key: 'assetNumber',
      header: t('assetNumber'),
      render: (r) => <span className="font-mono text-xs font-semibold">{r.assetNumber}</span>,
    },
    { key: 'equipmentName', header: t('equipment'),  render: (r) => r.equipmentName },
    { key: 'reason',        header: t('reason'),     render: (r) => <span className="text-sm">{r.reason}</span> },
    { key: 'status',        header: t('status'),     render: (r) => <StatusBadge status={r.status} /> },
    { key: 'createdAt',     header: t('date'),       render: (r) => formatDate(r.createdAt) },
    {
      key: 'reviewedBy',
      header: t('reviewedBy'),
      render: (r) => r.reviewedBy?.fullName || '—',
    },
    {
      key: 'actions',
      header: t('actions'),
      render: (r) => (
        <Button size="sm" variant="ghost" onClick={() => setSelected(r)}>
          {t('viewDetails')}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('retirementRequests')}
        description={t('retirementRequestsDescription')}
        breadcrumb={[
          { label: t('equipmentMis'), to: '/equipment' },
          { label: t('retirementRequests') },
        ]}
        actions={(
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" icon={Download} onClick={handleExport} disabled={!filteredRequests.length}>{t('csv')}</Button>
            <Button variant="secondary" icon={Printer} onClick={handlePrint} disabled={!filteredRequests.length}>{t('print')}</Button>
            <Button icon={Plus} onClick={() => { resetForm(); setFormOpen(true); }}>{t('newRetirementRequest')}</Button>
          </div>
        )}
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          [t('total'), summary.total, 'text-[var(--color-dark-gray)]'],
          [t('pendingApproval'), summary.pending, 'text-[var(--color-status-amber)]'],
          [t('approved'), summary.approved, 'text-[var(--color-status-green)]'],
          [t('rejected'), summary.rejected, 'text-[var(--color-status-red)]'],
        ].map(([label, value, tone]) => (
          <div key={label} className="rounded-[var(--radius-card)] border border-[var(--color-border-gray)] bg-[var(--color-white)] p-4 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-mid-gray)]">{label}</p>
            <p className={`mt-2 text-2xl font-bold ${tone}`}>{value}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-3 rounded-[var(--radius-card)] border border-[var(--color-border-gray)] bg-[var(--color-white)] p-4 md:grid-cols-[1fr_220px]">
        <Input
          label={t('searchPlaceholder')}
          icon={Search}
          value={search}
          onChange={updateSearch}
          placeholder={t('searchPlaceholder')}
        />
        <Select
          label={t('status')}
          value={statusFilter}
          onChange={updateStatus}
          options={[
            { value: '', label: t('all') },
            { value: 'pending', label: t('pendingApproval') },
            { value: 'approved', label: t('approved') },
            { value: 'rejected', label: t('rejected') },
          ]}
        />
      </div>

      {/* Requests table */}
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border-gray)] bg-[var(--color-white)] overflow-hidden">
        {loading ? (
          <div className="py-10 text-center text-sm text-[var(--color-mid-gray)]">{t('loading')}</div>
        ) : filteredRequests.length === 0 ? (
          <EmptyState
            title={requests.length === 0 ? t('noRetirementRequests') : t('noDataAvailable')}
            message={requests.length === 0 ? t('noRetirementRequestsDescription') : t('adjustActivityFilters')}
          />
        ) : (
          <>
            <DataTable columns={columns} data={visibleRequests} />
            <TablePagination
              page={page}
              totalPages={totalPages}
              totalItems={filteredRequests.length}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
            />
          </>
        )}
      </div>

      {/* Submit form modal */}
      <Modal
        open={formOpen}
        onClose={() => { setFormOpen(false); resetForm(); }}
        title={t('newRetirementRequest')}
        footer={
          <>
            <Button variant="ghost" onClick={() => { setFormOpen(false); resetForm(); }} disabled={submitting}>
              {t('cancel')}
            </Button>
            <Button variant="primary" onClick={handleSubmit} loading={submitting} disabled={submitting || !form.equipmentId || !form.reason}>
              {t('submitRequest')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Alert type="info">{t('retirementRequestInfo')}</Alert>
          {availableEquipment.length === 0 && (
            <Alert type="warning">{t('noEquipmentRegistered')}</Alert>
          )}
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
            options={RETIREMENT_REASONS.map((r) => ({ value: r, label: r }))}
          />
          <Textarea
            label={t('additionalNotes')}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            placeholder={t('retirementNotesPlaceholder')}
          />
        </div>
      </Modal>

      {/* Detail modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={t('retirementRequestDetails')}
        footer={
          <Button variant="ghost" onClick={() => setSelected(null)}>{t('close')}</Button>
        }
      >
        {selected && (
          <div className="space-y-4">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <dt className="font-semibold text-[var(--color-mid-gray)]">{t('assetNumber')}</dt>
                <dd className="mt-1 font-mono text-xs">{selected.assetNumber}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--color-mid-gray)]">{t('equipment')}</dt>
                <dd className="mt-1">{selected.equipmentName}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--color-mid-gray)]">{t('status')}</dt>
                <dd className="mt-1"><StatusBadge status={selected.status} /></dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--color-mid-gray)]">{t('date')}</dt>
                <dd className="mt-1">{formatDate(selected.createdAt)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="font-semibold text-[var(--color-mid-gray)]">{t('reason')}</dt>
                <dd className="mt-1">{selected.reason}</dd>
              </div>
              {selected.notes && (
                <div className="col-span-2">
                  <dt className="font-semibold text-[var(--color-mid-gray)]">{t('notes')}</dt>
                  <dd className="mt-1">{selected.notes}</dd>
                </div>
              )}
              {selected.reviewedBy && (
                <div>
                  <dt className="font-semibold text-[var(--color-mid-gray)]">{t('reviewedBy')}</dt>
                  <dd className="mt-1">{selected.reviewedBy?.fullName}</dd>
                </div>
              )}
              {selected.reviewedAt && (
                <div>
                  <dt className="font-semibold text-[var(--color-mid-gray)]">{t('date')}</dt>
                  <dd className="mt-1">{formatDate(selected.reviewedAt)}</dd>
                </div>
              )}
              {selected.rejectionReason && (
                <div className="col-span-2">
                  <dt className="font-semibold text-[var(--color-mid-gray)]">{t('rejectionReason')}</dt>
                  <dd className="mt-1 text-[var(--color-status-red)]">{selected.rejectionReason}</dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </Modal>
    </div>
  );
}
