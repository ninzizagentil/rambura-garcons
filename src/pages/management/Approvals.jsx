/**
 * Approvals.jsx — /management/approvals
 *
 * Single compact page for Management/Director to review:
 *   - Stock Disposal Requests      (stock.dispose.approve)
 *   - Equipment Retirement Requests (equipment.retire.approve)
 *   - Stock Archive Requests        (stock.archive.approve)
 *   - Equipment Archive Requests    (equipment.archive.approve)
 *
 * Uses only existing UI components, CSS variables and design patterns.
 */
import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, Package, Laptop, Archive, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/tables/DataTable';
import { Badge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/modals/Modal';
import Alert from '../../components/feedback/Alert';
import { Textarea } from '../../components/forms/FormField';
import { EmptyState } from '../../components/feedback/States';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';

const TABS = [
  { id: 'libraryBookArchive', labelKey: 'libraryBookArchiveApprovals', icon: BookOpen, permission: 'library.books.archive.approve' },
  { id: 'stockDisposal',      labelKey: 'stockDisposalApprovals',        icon: Package,  permission: 'stock.dispose.approve'    },
  { id: 'stockArchive',       labelKey: 'stockArchiveApprovals',          icon: Archive,  permission: 'stock.archive.approve'    },
  { id: 'equipmentRetirement',labelKey: 'equipmentRetirementApprovals',   icon: Laptop,   permission: 'equipment.retire.approve' },
  { id: 'equipmentArchive',   labelKey: 'equipmentArchiveApprovals',      icon: Archive,  permission: 'equipment.archive.approve'},
];

// ─── Shared helpers ────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = {
    pending:  { tone: 'amber', label: 'Pending'  },
    approved: { tone: 'green', label: 'Approved' },
    rejected: { tone: 'red',   label: 'Rejected' },
  }[status] || { tone: 'neutral', label: status };
  return <Badge tone={cfg.tone}>{cfg.label}</Badge>;
}

function formatDate(v) {
  if (!v) return '—';
  return new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Generic approval/rejection tab.
 * Works for any workflow that follows the same shape:
 *   - GET  apiPath      → { data: [...], pagination }
 *   - POST apiPath/:id/approve  { [approveBodyKey]: notes }
 *   - POST apiPath/:id/reject   { rejectionReason: notes }
 */
function ApprovalTab({
  t,
  fetchUrl,
  approveUrl,
  rejectUrl,
  emptyTitle,
  emptyDesc,
  loadingKey = 'loading',
  reviewTitle,
  approveWarning,
  rejectNote,
  columns,
  detailRenderer,
}) {
  const { showToast } = useToast();
  const [rows, setRows]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [total, setTotal]         = useState(0);
  const [selected, setSelected]   = useState(null);
  const [actionType, setActionType] = useState(null);
  const [notes, setNotes]         = useState('');
  const [processing, setProcessing] = useState(false);
  const limit = 10;

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const json = await api.get(fetchUrl, { status: 'pending', page, limit });
      setRows(json.data || []);
      setTotal(json.pagination?.total || 0);
    } catch (err) {
      showToast(err.message || t('somethingWentWrong'), 'error');
    } finally {
      setLoading(false);
    }
  }, [fetchUrl, page, showToast, t]);

  // This effect synchronizes the approval table with the API whenever its query changes.
  // oxlint-disable-next-line react/set-state-in-effect
  useEffect(() => { fetch_(); }, [fetch_]);

  const closeModal = () => { setSelected(null); setActionType(null); setNotes(''); };

  const handleAction = async () => {
    if (actionType === 'reject' && !notes.trim()) {
      showToast(t('rejectionReasonRequired'), 'error');
      return;
    }
    setProcessing(true);
    try {
      const url   = actionType === 'approve' ? approveUrl(selected._id) : rejectUrl(selected._id);
      const body  = actionType === 'approve' ? { approvalNotes: notes } : { rejectionReason: notes };
      await api.post(url, body);
      showToast(actionType === 'approve' ? t('requestApproved') : t('requestRejected'), 'success');
      closeModal();
      fetch_();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (loading) return (
    <div className="py-10 text-center text-sm text-[var(--color-mid-gray)]">{t(loadingKey)}</div>
  );

  return (
    <div className="space-y-4">
      {rows.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border-gray)] bg-[var(--color-white)] py-14 text-center">
          <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-[var(--color-status-green)]" />
          <p className="font-semibold text-[var(--color-dark-gray)]">{t(emptyTitle)}</p>
          <p className="mt-1 text-sm text-[var(--color-mid-gray)]">{t(emptyDesc)}</p>
        </div>
      ) : (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border-gray)] bg-[var(--color-white)] overflow-hidden">
          <DataTable
            columns={[
              ...columns,
              {
                key: 'actions', header: t('actions'),
                render: (r) => (
                  <Button size="sm" variant="primary"
                    onClick={() => { setSelected(r); setActionType(null); setNotes(''); }}>
                    {t('review')}
                  </Button>
                ),
              },
            ]}
            data={rows}
          />
          {total > limit && (
            <div className="flex items-center justify-between border-t border-[var(--color-border-gray)] px-4 py-3 flex-wrap gap-3">
              <span className="text-sm text-[var(--color-mid-gray)]">
                {t('showingItems', { from: (page - 1) * limit + 1, to: Math.min(page * limit, total), total })}
              </span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" icon={ChevronLeft}
                  onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  {t('previous')}
                </Button>
                <span className="text-sm font-medium px-2">{t('pageOf', { page, total: totalPages })}</span>
                <Button size="sm" variant="ghost" icon={ChevronRight} iconPosition="right"
                  onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>
                  {t('next')}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <Modal
        open={!!selected}
        onClose={closeModal}
        title={t(reviewTitle)}
        footer={
          actionType ? (
            <>
              <Button variant="ghost" onClick={() => setActionType(null)} disabled={processing}>{t('back')}</Button>
              <Button variant={actionType === 'approve' ? 'primary' : 'danger'}
                onClick={handleAction} loading={processing}>
                {t('confirmAction')}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={closeModal}>{t('close')}</Button>
              <div className="flex gap-2">
                <Button variant="danger" icon={XCircle} onClick={() => setActionType('reject')}>{t('reject')}</Button>
                <Button variant="primary" icon={CheckCircle2} onClick={() => setActionType('approve')}>{t('approve')}</Button>
              </div>
            </>
          )
        }
      >
        {selected && !actionType && detailRenderer(selected, t)}
        {actionType && (
          <div className="space-y-4">
            <Alert type={actionType === 'approve' ? 'info' : 'warning'}>
              {actionType === 'approve' ? t(approveWarning) : t(rejectNote)}
            </Alert>
            <Textarea
              label={actionType === 'approve' ? t('approvalNotesOptional') : t('rejectionReasonRequired')}
              required={actionType === 'reject'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder={actionType === 'approve' ? t('approvalNotesPlaceholder') : t('rejectionReasonPlaceholder')}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── Stock Disposal ────────────────────────────────────────────────────────────
function StockDisposalTab({ t }) {
  const columns = [
    { key: 'itemName',        header: t('item'),        render: (r) => <span className="font-semibold">{r.itemId?.name || r.itemName}</span> },
    { key: 'quantityRemoved', header: t('quantity'),    render: (r) => `${r.quantityRemoved} ${t('units')}` },
    { key: 'reason',          header: t('reason'),      render: (r) => <Badge tone={['Damaged','Broken','Lost'].includes(r.reason) ? 'red' : 'amber'}>{r.reason}</Badge> },
    { key: 'requestedBy',     header: t('requestedBy'), render: (r) => r.requestedBy?.fullName || '—' },
    { key: 'createdAt',       header: t('date'),        render: (r) => formatDate(r.createdAt) },
    { key: 'status',          header: t('status'),      render: (r) => <StatusBadge status={r.status} /> },
  ];
  const detail = (r, t_) => (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
      <div><dt className="font-semibold text-[var(--color-mid-gray)]">{t_('item')}</dt><dd className="mt-1">{r.itemId?.name || r.itemName}</dd></div>
      <div><dt className="font-semibold text-[var(--color-mid-gray)]">{t_('quantity')}</dt><dd className="mt-1">{r.quantityRemoved} {t_('units')}</dd></div>
      <div><dt className="font-semibold text-[var(--color-mid-gray)]">{t_('reason')}</dt><dd className="mt-1">{r.reason}</dd></div>
      <div><dt className="font-semibold text-[var(--color-mid-gray)]">{t_('remaining')}</dt><dd className="mt-1">{r.remainingQuantity} {t_('units')}</dd></div>
      <div><dt className="font-semibold text-[var(--color-mid-gray)]">{t_('requestedBy')}</dt><dd className="mt-1">{r.requestedBy?.fullName || '—'}</dd></div>
      <div><dt className="font-semibold text-[var(--color-mid-gray)]">{t_('date')}</dt><dd className="mt-1">{formatDate(r.createdAt)}</dd></div>
      {r.notes && <div className="col-span-2"><dt className="font-semibold text-[var(--color-mid-gray)]">{t_('notes')}</dt><dd className="mt-1">{r.notes}</dd></div>}
    </dl>
  );
  return (
    <ApprovalTab t={t}
      fetchUrl="/stock/disposal-requests/pending"
      approveUrl={(id) => `/stock/disposal-requests/${id}/approve`}
      rejectUrl={(id)  => `/stock/disposal-requests/${id}/reject`}
      emptyTitle="noPendingApprovals" emptyDesc="noPendingApprovalsDescription"
      loadingKey="loadingDisposalRecords" reviewTitle="reviewDisposalRequest"
      approveWarning="approveDisposalGenericWarning" rejectNote="rejectDisposalNote"
      columns={columns} detailRenderer={detail}
    />
  );
}

// ─── Stock Archive ─────────────────────────────────────────────────────────────
function StockArchiveTab({ t }) {
  const columns = [
    { key: 'itemName',    header: t('item'),        render: (r) => <span className="font-semibold">{r.itemName}</span> },
    { key: 'itemCode',    header: t('code'),        render: (r) => <span className="font-mono text-xs">{r.itemCode || '—'}</span> },
    { key: 'reason',      header: t('reason'),      render: (r) => <span className="text-sm">{r.reason}</span> },
    { key: 'requestedBy', header: t('requestedBy'), render: (r) => r.requestedBy?.fullName || '—' },
    { key: 'createdAt',   header: t('date'),        render: (r) => formatDate(r.createdAt) },
    { key: 'status',      header: t('status'),      render: (r) => <StatusBadge status={r.status} /> },
  ];
  const detail = (r, t_) => (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
      <div><dt className="font-semibold text-[var(--color-mid-gray)]">{t_('item')}</dt><dd className="mt-1">{r.itemName}</dd></div>
      <div><dt className="font-semibold text-[var(--color-mid-gray)]">{t_('code')}</dt><dd className="mt-1 font-mono text-xs">{r.itemCode || '—'}</dd></div>
      <div className="col-span-2"><dt className="font-semibold text-[var(--color-mid-gray)]">{t_('reason')}</dt><dd className="mt-1">{r.reason}</dd></div>
      <div><dt className="font-semibold text-[var(--color-mid-gray)]">{t_('requestedBy')}</dt><dd className="mt-1">{r.requestedBy?.fullName || '—'}</dd></div>
      <div><dt className="font-semibold text-[var(--color-mid-gray)]">{t_('date')}</dt><dd className="mt-1">{formatDate(r.createdAt)}</dd></div>
      {r.notes && <div className="col-span-2"><dt className="font-semibold text-[var(--color-mid-gray)]">{t_('notes')}</dt><dd className="mt-1">{r.notes}</dd></div>}
    </dl>
  );
  return (
    <ApprovalTab t={t}
      fetchUrl="/stock/archive-requests"
      approveUrl={(id) => `/stock/archive-requests/${id}/approve`}
      rejectUrl={(id)  => `/stock/archive-requests/${id}/reject`}
      emptyTitle="noPendingApprovals" emptyDesc="noPendingApprovalsDescription"
      loadingKey="loading" reviewTitle="reviewArchiveRequest"
      approveWarning="approveArchiveWarning" rejectNote="rejectArchiveNote"
      columns={columns} detailRenderer={detail}
    />
  );
}

// ─── Equipment Retirement ──────────────────────────────────────────────────────
function EquipmentRetirementTab({ t }) {
  const columns = [
    { key: 'assetNumber',   header: t('assetNumber'), render: (r) => <span className="font-mono text-xs font-semibold">{r.assetNumber}</span> },
    { key: 'equipmentName', header: t('equipment'),   render: (r) => r.equipmentName },
    { key: 'reason',        header: t('reason'),      render: (r) => <span className="text-sm">{r.reason}</span> },
    { key: 'requestedBy',   header: t('requestedBy'), render: (r) => r.requestedBy?.fullName || '—' },
    { key: 'createdAt',     header: t('date'),        render: (r) => formatDate(r.createdAt) },
    { key: 'status',        header: t('status'),      render: (r) => <StatusBadge status={r.status} /> },
  ];
  const detail = (r, t_) => (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
      <div><dt className="font-semibold text-[var(--color-mid-gray)]">{t_('assetNumber')}</dt><dd className="mt-1 font-mono text-xs">{r.assetNumber}</dd></div>
      <div><dt className="font-semibold text-[var(--color-mid-gray)]">{t_('equipment')}</dt><dd className="mt-1">{r.equipmentName}</dd></div>
      <div className="col-span-2"><dt className="font-semibold text-[var(--color-mid-gray)]">{t_('reason')}</dt><dd className="mt-1">{r.reason}</dd></div>
      <div><dt className="font-semibold text-[var(--color-mid-gray)]">{t_('requestedBy')}</dt><dd className="mt-1">{r.requestedBy?.fullName || '—'}</dd></div>
      <div><dt className="font-semibold text-[var(--color-mid-gray)]">{t_('date')}</dt><dd className="mt-1">{formatDate(r.createdAt)}</dd></div>
      {r.notes && <div className="col-span-2"><dt className="font-semibold text-[var(--color-mid-gray)]">{t_('notes')}</dt><dd className="mt-1">{r.notes}</dd></div>}
    </dl>
  );
  return (
    <ApprovalTab t={t}
      fetchUrl="/equipment-retirement"
      approveUrl={(id) => `/equipment-retirement/${id}/approve`}
      rejectUrl={(id)  => `/equipment-retirement/${id}/reject`}
      emptyTitle="noPendingApprovals" emptyDesc="noPendingApprovalsDescription"
      loadingKey="loading" reviewTitle="reviewRetirementRequest"
      approveWarning="approveRetirementGenericWarning" rejectNote="rejectRetirementNote"
      columns={columns} detailRenderer={detail}
    />
  );
}

// ─── Equipment Archive ─────────────────────────────────────────────────────────
function EquipmentArchiveTab({ t }) {
  const columns = [
    { key: 'assetNumber',   header: t('assetNumber'), render: (r) => <span className="font-mono text-xs font-semibold">{r.assetNumber}</span> },
    { key: 'equipmentName', header: t('equipment'),   render: (r) => r.equipmentName },
    { key: 'reason',        header: t('reason'),      render: (r) => <span className="text-sm">{r.reason}</span> },
    { key: 'requestedBy',   header: t('requestedBy'), render: (r) => r.requestedBy?.fullName || '—' },
    { key: 'createdAt',     header: t('date'),        render: (r) => formatDate(r.createdAt) },
    { key: 'status',        header: t('status'),      render: (r) => <StatusBadge status={r.status} /> },
  ];
  const detail = (r, t_) => (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
      <div><dt className="font-semibold text-[var(--color-mid-gray)]">{t_('assetNumber')}</dt><dd className="mt-1 font-mono text-xs">{r.assetNumber}</dd></div>
      <div><dt className="font-semibold text-[var(--color-mid-gray)]">{t_('equipment')}</dt><dd className="mt-1">{r.equipmentName}</dd></div>
      <div className="col-span-2"><dt className="font-semibold text-[var(--color-mid-gray)]">{t_('reason')}</dt><dd className="mt-1">{r.reason}</dd></div>
      <div><dt className="font-semibold text-[var(--color-mid-gray)]">{t_('requestedBy')}</dt><dd className="mt-1">{r.requestedBy?.fullName || '—'}</dd></div>
      <div><dt className="font-semibold text-[var(--color-mid-gray)]">{t_('date')}</dt><dd className="mt-1">{formatDate(r.createdAt)}</dd></div>
      {r.notes && <div className="col-span-2"><dt className="font-semibold text-[var(--color-mid-gray)]">{t_('notes')}</dt><dd className="mt-1">{r.notes}</dd></div>}
    </dl>
  );
  return (
    <ApprovalTab t={t}
      fetchUrl="/equipment-archive-requests"
      approveUrl={(id) => `/equipment-archive-requests/${id}/approve`}
      rejectUrl={(id)  => `/equipment-archive-requests/${id}/reject`}
      emptyTitle="noPendingApprovals" emptyDesc="noPendingApprovalsDescription"
      loadingKey="loading" reviewTitle="reviewEquipmentArchiveRequest"
      approveWarning="approveEquipmentArchiveWarning" rejectNote="rejectArchiveNote"
      columns={columns} detailRenderer={detail}
    />
  );
}

function LibraryBookArchiveTab({ t }) {
  const columns = [
    { key: 'bookTitle', header: t('bookTitle'), render: (request) => <span className="font-semibold">{request.bookTitle}</span> },
    { key: 'bookCode', header: t('bookCode'), render: (request) => <span className="font-mono text-xs">{request.bookCode}</span> },
    { key: 'requestedBy', header: t('requestedBy'), render: (request) => request.requestedBy?.fullName || '—' },
    { key: 'createdAt', header: t('date'), render: (request) => formatDate(request.createdAt) },
  ];
  const detail = (request, translate) => (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
      <div><dt className="font-semibold text-[var(--color-mid-gray)]">{translate('bookTitle')}</dt><dd className="mt-1">{request.bookTitle}</dd></div>
      <div><dt className="font-semibold text-[var(--color-mid-gray)]">{translate('bookCode')}</dt><dd className="mt-1 font-mono text-xs">{request.bookCode}</dd></div>
      <div><dt className="font-semibold text-[var(--color-mid-gray)]">{translate('requestedBy')}</dt><dd className="mt-1">{request.requestedBy?.fullName || '—'}</dd></div>
      <div><dt className="font-semibold text-[var(--color-mid-gray)]">{translate('date')}</dt><dd className="mt-1">{formatDate(request.createdAt)}</dd></div>
    </dl>
  );
  return (
    <ApprovalTab t={t}
      fetchUrl="/library/book-archive-requests"
      approveUrl={(id) => `/library/book-archive-requests/${id}/approve`}
      rejectUrl={(id) => `/library/book-archive-requests/${id}/reject`}
      emptyTitle="noPendingApprovals" emptyDesc="noPendingApprovalsDescription"
      loadingKey="loading" reviewTitle="reviewBookArchiveRequest"
      approveWarning="approveBookArchiveWarning" rejectNote="rejectArchiveNote"
      columns={columns} detailRenderer={detail}
    />
  );
}

// ─── Page root ─────────────────────────────────────────────────────────────────
export default function Approvals() {
  const { t } = useApp();
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState('');

  const visibleTabs = TABS.filter((tab) => hasPermission(tab.permission));

  // Auto-select first visible tab.
  const currentTab = visibleTabs.find((tb) => tb.id === activeTab)
    ? activeTab
    : visibleTabs[0]?.id || '';

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('approvals')}
        description={t('approvalsDescription')}
        breadcrumb={[
          { label: t('managementMenu'), to: '/management' },
          { label: t('approvals') },
        ]}
      />

      {visibleTabs.length === 0 && (
        <EmptyState title={t('accessRestricted')} message={t('noApprovalPermissions')} />
      )}

      {visibleTabs.length > 0 && (
        <>
          {/* Tab bar — only rendered when more than one tab is visible */}
          {visibleTabs.length > 1 && (
            <div className="flex flex-wrap gap-2 border-b border-[var(--color-border-gray)] pb-0">
              {visibleTabs.map(({ id, labelKey, icon: Icon }) => {
                const isActive = currentTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveTab(id)}
                    role="tab"
                    aria-selected={isActive}
                    className={[
                      'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 -mb-px transition-colors',
                      isActive
                        ? 'border-[var(--color-medium-green)] text-[var(--color-medium-green)] bg-[var(--color-white)]'
                        : 'border-transparent text-[var(--color-mid-gray)] hover:text-[var(--color-dark-gray)]',
                    ].join(' ')}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                    <span className="hidden sm:inline">{t(labelKey)}</span>
                    <span className="sm:hidden">{t(labelKey).split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          )}

          {currentTab === 'libraryBookArchive'  && <LibraryBookArchiveTab  t={t} />}
          {currentTab === 'stockDisposal'       && <StockDisposalTab       t={t} />}
          {currentTab === 'stockArchive'         && <StockArchiveTab        t={t} />}
          {currentTab === 'equipmentRetirement'  && <EquipmentRetirementTab t={t} />}
          {currentTab === 'equipmentArchive'     && <EquipmentArchiveTab    t={t} />}
        </>
      )}
    </div>
  );
}
