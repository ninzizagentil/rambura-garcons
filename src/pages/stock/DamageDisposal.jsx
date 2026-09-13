/**
 * DamageDisposal — Activity hub for damage, disposal and reconciliation.
 *
 * Tabs:
 *   damaged    — Report and dispose of damaged items (was DamagedItems.jsx)
 *   disposed   — Full removal / disposal history with status filters (was RemovedDisposed.jsx)
 *   approvals  — Approve / reject pending disposal requests (was DisposalApprovals.jsx)
 *   reconciliation — Physical stock count checklists (was ReconciliationChecklist.jsx)
 */
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle, Archive, CheckCircle2, ChevronLeft, ChevronRight, Clock3,
  Filter, ShieldAlert, Trash2, ClipboardList, Plus,
} from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/tables/DataTable';
import { Badge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { Select, Input, Textarea } from '../../components/forms/FormField';
import { EmptyState } from '../../components/feedback/States';
import ViewOnlyBanner from '../../components/feedback/ViewOnlyBanner';
import ReportDamageModal from '../../components/modals/ReportDamageModal';
import DisposeStockModal from '../../components/modals/DisposeStockModal';
import Modal from '../../components/modals/Modal';
import Alert from '../../components/feedback/Alert';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../data/roles';
import { getDamagedItems, getItems, refreshStock } from '../../services/stockService';
import { logActivity } from '../../services/activityService';
import { useApp } from '../../context/AppContext';

// ── constants ──────────────────────────────────────────────────────────────

const TABS = [
  { id: 'damaged',        label: 'Damaged Items',    icon: ShieldAlert   },
  { id: 'disposed',       label: 'Removal History',  icon: Archive       },
  { id: 'approvals',      label: 'Disposal Approvals', icon: CheckCircle2 },
  { id: 'reconciliation', label: 'Reconciliation',   icon: ClipboardList },
];

const REASON_TONE = {
  Damaged: 'error', Expired: 'warning', Lost: 'error',
  Broken: 'error', Obsolete: 'warning', Other: 'info',
};

const STATUS_FILTER_OPTIONS = [
  { value: 'all',      label: 'All',              icon: Archive      },
  { value: 'pending',  label: 'Pending Approval', icon: Clock3       },
  { value: 'approved', label: 'Approved',         icon: CheckCircle2 },
  { value: 'rejected', label: 'Rejected',         icon: ShieldAlert  },
];

const LOCATIONS = ['Main Store', 'Kitchen Store', 'ICT Lab Store', 'Admin Store'];

// ── helpers ────────────────────────────────────────────────────────────────

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem('rg_access_token')}` };
}

// ── main component ─────────────────────────────────────────────────────────

export default function DamageDisposal() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { viewOnly } = useModuleAccess(ROLES.STOCK_MANAGER);
  const { showToast } = useToast();
  const { user } = useAuth();
  const { t, language } = useApp();

  const initialTab = TABS.find((tb) => tb.id === searchParams.get('tab'))?.id ?? 'damaged';
  const [activeTab, setActiveTab] = useState(initialTab);

  const switchTab = (id) => {
    setActiveTab(id);
    setSearchParams({ tab: id }, { replace: true });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Damage & Disposal"
        description="Track damaged items, disposal records, approval workflows and inventory reconciliation."
        breadcrumb={[
          { label: t('stockManagement'), to: '/stock' },
          { label: 'Activity', to: '/stock/transactions' },
          { label: 'Damage & Disposal' },
        ]}
      />

      {viewOnly && <ViewOnlyBanner module="Stock MIS" />}

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2 border-b border-[var(--color-border-gray)] pb-0">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => switchTab(id)}
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
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'damaged'        && <DamagedTab viewOnly={viewOnly} t={t} />}
      {activeTab === 'disposed'       && <DisposedTab showToast={showToast} t={t} language={language} />}
      {activeTab === 'approvals'      && <ApprovalsTab viewOnly={viewOnly} showToast={showToast} user={user} />}
      {activeTab === 'reconciliation' && <ReconciliationTab viewOnly={viewOnly} showToast={showToast} user={user} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: Damaged Items
// ─────────────────────────────────────────────────────────────────────────────

function DamagedTab({ viewOnly, t }) {
  const [records, setRecords] = useState(() => getDamagedItems());
  const [reportItemId, setReportItemId] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [disposeTarget, setDisposeTarget] = useState(null);

  const availableItems = getItems().filter((i) => i.quantity > 0);
  const refresh = () => setRecords(getDamagedItems());

  useEffect(() => {
    window.addEventListener('rg:stock-updated', refresh);
    refreshStock().catch(() => {});
    return () => window.removeEventListener('rg:stock-updated', refresh);
  }, []);

  const columns = [
    { key: 'itemName',    header: t('item') },
    { key: 'quantity',    header: t('quantity'),    render: (d) => `${d.quantity} ${d.unit}` },
    { key: 'reason',      header: t('reason'),      render: (d) => <Badge tone="orange">{d.reason}</Badge> },
    { key: 'date',        header: t('date') },
    { key: 'reportedBy',  header: t('reportedBy') },
    { key: 'notes',       header: t('notes'),       render: (d) => <span className="text-[var(--color-mid-gray)]">{d.notes || '—'}</span> },
    { key: 'status',      header: t('status'),      render: () => <Badge tone="orange">{t('reported')}</Badge> },
    ...(!viewOnly
      ? [{
          key: 'actions',
          header: t('action'),
          render: (d) => (
            <Button size="sm" variant="danger" icon={Trash2} onClick={() => setDisposeTarget(d)}>
              {t('dispose')}
            </Button>
          ),
        }]
      : []),
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-mid-gray)]">
        Active damage reports that have not yet been disposed of. Report new damage or move a record to disposal.
      </p>

      {!viewOnly && (
        <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-4 flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1 max-w-xs">
            <Select
              label={t('selectDamageItem')}
              value={reportItemId}
              onChange={(e) => setReportItemId(e.target.value)}
              options={availableItems.map((i) => ({ value: i.id, label: `${i.name} (${i.quantity} ${i.unit} in stock)` }))}
            />
          </div>
          <Button
            variant="secondary"
            icon={AlertTriangle}
            disabled={!reportItemId}
            onClick={() => setReportOpen(true)}
          >
            {t('reportDamage')}
          </Button>
        </div>
      )}

      <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)]">
        <DataTable
          columns={columns}
          data={records}
          emptyState={
            <EmptyState icon={AlertTriangle} title={t('noDamagedItems')} message={t('noDamageReports')} />
          }
        />
      </div>

      <ReportDamageModal
        open={reportOpen}
        item={availableItems.find((i) => i.id === reportItemId) || null}
        onClose={() => setReportOpen(false)}
        onReported={refresh}
      />
      <DisposeStockModal
        open={!!disposeTarget}
        damagedRecord={disposeTarget}
        onClose={() => setDisposeTarget(null)}
        onDisposed={refresh}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: Removal / Disposed history
// ─────────────────────────────────────────────────────────────────────────────

function DisposedTab({ showToast, t, language }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('all');
  const limit = 20;

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const statusParam = filter !== 'all' ? `&status=${filter}` : '';
      const res = await fetch(`/api/stock/disposed?page=${page}&limit=${limit}${statusParam}`, {
        headers: authHeader(),
      });
      if (!res.ok) throw new Error(t('failedLoadDisposedRecords'));
      const json = await res.json();
      if (!json.success) throw new Error(json.message || t('failedLoadDisposedRecords'));
      setRecords(json.data);
      setTotal(json.pagination?.total || 0);
    } catch (err) {
      showToast(err.message || t('failedLoadDisposedRecords'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, [page, filter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onUpdate = () => fetchRecords();
    window.addEventListener('rg:stock-updated', onUpdate);
    return () => window.removeEventListener('rg:stock-updated', onUpdate);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const STATUS_CONFIG = {
    pending:  { variant: 'warning', label: t('pendingApproval') },
    approved: { variant: 'success', label: t('approved')        },
    rejected: { variant: 'error',   label: t('rejected')        },
  };

  const columns = [
    { key: 'itemName',        header: t('item'),        render: (r) => r.itemId?.name || r.itemName },
    { key: 'quantityRemoved', header: t('quantity'),    render: (r) => `${r.quantityRemoved} ${t('units')}` },
    { key: 'reason',          header: t('reason'),      render: (r) => <Badge variant={REASON_TONE[r.reason] || 'info'}>{r.reason}</Badge> },
    { key: 'status',          header: t('status'),
      render: (r) => {
        const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.approved;
        return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
      },
    },
    { key: 'requestedBy', header: t('requestedBy'), render: (r) => r.requestedBy?.name || t('system') },
    { key: 'approvedBy',  header: t('approvedBy'),  render: (r) => r.approvedBy?.name  || '—' },
    { key: 'date',        header: t('date'),
      render: (r) => new Date(r.date || r.createdAt).toLocaleDateString(
        language === 'fr' ? 'fr-FR' : language === 'rw' ? 'rw-RW' : 'en-GB'
      ),
    },
  ];

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--color-mid-gray)]">
          Complete record of every item removed from active inventory.
        </p>
        <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border-gray)] bg-[var(--color-white)] px-3 py-2 text-sm font-semibold text-[var(--color-mid-gray)]">
          <Filter className="h-4 w-4 text-[var(--color-medium-green)]" />
          <span>{total} records</span>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTER_OPTIONS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => { setFilter(value); setPage(1); }}
            className={[
              'inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all',
              filter === value
                ? 'border-[var(--color-medium-green)] bg-[var(--color-medium-green)] text-white'
                : 'border-[var(--color-border-gray)] bg-[var(--color-white)] text-[var(--color-mid-gray)] hover:border-[var(--color-medium-green)] hover:text-[var(--color-medium-green)]',
            ].join(' ')}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border-gray)] bg-[var(--color-white)] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-[var(--color-mid-gray)]">{t('loadingDisposalRecords')}</div>
        ) : records.length === 0 ? (
          <EmptyState icon={Archive} title={t('noDisposedItems')} message={t('disposedItemsAppearHere')} />
        ) : (
          <>
            <DataTable columns={columns} data={records} />
            <div className="p-4 border-t border-[var(--color-border-gray)] flex justify-between items-center gap-3 flex-wrap">
              <span className="text-sm text-[var(--color-mid-gray)]">
                {t('showingItems', { from: (page - 1) * limit + 1, to: Math.min(page * limit, total), total })}
              </span>
              <div className="flex gap-2 items-center">
                <Button size="sm" variant="ghost" icon={ChevronLeft}
                  onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  {t('previous')}
                </Button>
                <span className="px-3 py-1 text-sm font-medium">{t('pageOf', { page, total: totalPages })}</span>
                <Button size="sm" variant="ghost" icon={ChevronRight} iconPosition="right"
                  onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>
                  {t('next')}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: Disposal Approvals
// ─────────────────────────────────────────────────────────────────────────────

function ApprovalsTab({ viewOnly, showToast, user }) {
  const [disposals, setDisposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [actionNotes, setActionNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stock/disposal-requests/pending?page=${page}&limit=10`, { headers: authHeader() });
      const json = await res.json();
      if (json.success) { setDisposals(json.data); setTotal(json.pagination?.total || 0); }
      else showToast('Failed to load disposal requests', 'error');
    } catch (err) { showToast(err.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPending(); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAction = async () => {
    setProcessing(true);
    const endpoint = `/api/stock/disposal-requests/${selected._id}/${actionType}`;
    const body = actionType === 'approve'
      ? { approvalNotes: actionNotes }
      : { rejectionReason: actionNotes };
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        showToast(actionType === 'approve' ? 'Disposal approved' : 'Disposal rejected', 'success');
        logActivity({ user: user?.fullName, action: `${actionType} disposal: ${selected.itemName}`, module: 'Stock', status: 'success' });
        setSelected(null); setActionType(null); setActionNotes('');
        fetchPending();
      } else {
        showToast(json.message || 'Action failed', 'error');
      }
    } catch (err) { showToast(err.message, 'error'); }
    finally { setProcessing(false); }
  };

  const columns = [
    { key: 'itemName',        header: 'Item',        render: (r) => <span className="font-semibold">{r.itemName}</span> },
    { key: 'quantityRemoved', header: 'Quantity',    render: (r) => `${r.quantityRemoved} units` },
    { key: 'reason',          header: 'Reason',
      render: (r) => <Badge variant={r.reason === 'Damaged' ? 'error' : 'warning'}>{r.reason}</Badge> },
    { key: 'requestedBy',     header: 'Requested By', render: (r) => r.requestedBy?.name || 'Unknown' },
    { key: 'createdAt',       header: 'Date',         render: (r) => new Date(r.createdAt).toLocaleDateString() },
    ...(!viewOnly
      ? [{
          key: 'action', header: 'Action',
          render: (r) => (
            <Button size="sm" variant="primary" onClick={() => setSelected(r)}>Review</Button>
          ),
        }]
      : []),
  ];

  if (loading) return <div className="py-8 text-center text-sm text-[var(--color-mid-gray)]">Loading approval requests…</div>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-mid-gray)]">
        Review and approve pending disposal requests before stock is permanently removed.
      </p>

      {disposals.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border-gray)] bg-[var(--color-white)] py-12 text-center">
          <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-[var(--color-status-green)]" />
          <p className="font-semibold text-[var(--color-dark-gray)]">No pending requests</p>
          <p className="mt-1 text-sm text-[var(--color-mid-gray)]">All disposal requests have been reviewed.</p>
        </div>
      ) : (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border-gray)] bg-[var(--color-white)]">
          <DataTable columns={columns} data={disposals} />
          {total > 10 && (
            <div className="p-4 border-t border-[var(--color-border-gray)] flex justify-between items-center">
              <span className="text-sm text-[var(--color-mid-gray)]">
                Showing {(page - 1) * 10 + 1}–{Math.min(page * 10, total)} of {total}
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                <Button size="sm" variant="ghost" onClick={() => setPage((p) => p + 1)} disabled={page * 10 >= total}>Next</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Review modal */}
      <Modal
        open={!!selected}
        onClose={() => { setSelected(null); setActionType(null); setActionNotes(''); }}
        title="Review Disposal Request"
        footer={
          actionType ? (
            <>
              <Button variant="ghost" onClick={() => setActionType(null)} disabled={processing}>Back</Button>
              <Button
                variant={actionType === 'approve' ? 'primary' : 'danger'}
                onClick={handleAction}
                loading={processing}
              >
                {actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setSelected(null)}>Close</Button>
              <div className="flex gap-2">
                <Button variant="danger" onClick={() => setActionType('reject')}>Reject</Button>
                <Button variant="primary" onClick={() => setActionType('approve')}>Approve</Button>
              </div>
            </>
          )
        }
      >
        {selected && !actionType && (
          <div className="space-y-4">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-[var(--color-mid-gray)] font-semibold">Item</dt><dd className="mt-1">{selected.itemName}</dd></div>
              <div><dt className="text-[var(--color-mid-gray)] font-semibold">Quantity</dt><dd className="mt-1">{selected.quantityRemoved} units</dd></div>
              <div><dt className="text-[var(--color-mid-gray)] font-semibold">Reason</dt><dd className="mt-1"><Badge variant={selected.reason === 'Damaged' ? 'error' : 'warning'}>{selected.reason}</Badge></dd></div>
              <div><dt className="text-[var(--color-mid-gray)] font-semibold">Remaining Stock</dt><dd className="mt-1">{selected.remainingQuantity} units</dd></div>
              <div><dt className="text-[var(--color-mid-gray)] font-semibold">Requested By</dt><dd className="mt-1">{selected.requestedBy?.name || 'Unknown'}</dd></div>
              {selected.notes && <div className="col-span-2"><dt className="text-[var(--color-mid-gray)] font-semibold">Notes</dt><dd className="mt-1">{selected.notes}</dd></div>}
            </dl>
          </div>
        )}
        {actionType && (
          <div className="space-y-4">
            <Alert type="info">
              {actionType === 'approve'
                ? `Approve disposal of ${selected.quantityRemoved} units of "${selected.itemName}"? This cannot be undone.`
                : 'Provide a reason for rejecting this disposal request.'}
            </Alert>
            <Textarea
              label={actionType === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason (Required)'}
              required={actionType === 'reject'}
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              rows={4}
              placeholder={actionType === 'approve' ? 'Add notes about this approval…' : 'Explain why this request is rejected…'}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: Reconciliation
// ─────────────────────────────────────────────────────────────────────────────

function ReconciliationTab({ viewOnly, showToast, user }) {
  const [reconciliations, setReconciliations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', location: '', scheduledDate: '' });
  const [selected, setSelected] = useState(null);
  const [itemsData, setItemsData] = useState([]);

  const fetch_ = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stock/reconciliations', { headers: authHeader() });
      if (res.ok) { const json = await res.json(); setReconciliations(json.success ? json.data : []); }
    } catch (err) { showToast(err.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch_(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title || !form.location || !form.scheduledDate) { showToast('All fields are required', 'error'); return; }
    setCreating(true);
    try {
      const res = await fetch('/api/stock/reconciliations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ ...form, scheduledDate: new Date(form.scheduledDate) }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('Reconciliation scheduled', 'success');
        logActivity({ user: user?.fullName, action: `Created reconciliation: ${form.title}`, module: 'Stock', status: 'success' });
        setForm({ title: '', location: '', scheduledDate: '' });
        fetch_();
      } else {
        showToast(json.message || 'Failed to create', 'error');
      }
    } catch (err) { showToast(err.message, 'error'); }
    finally { setCreating(false); }
  };

  const handleAddItem = () => setItemsData([...itemsData, { itemId: '', systemQuantity: 0, physicalQuantity: 0, notes: '' }]);
  const handleRemoveItem = (idx) => setItemsData(itemsData.filter((_, i) => i !== idx));
  const handleUpdateItem = (idx, field, value) => {
    const updated = [...itemsData];
    updated[idx][field] = value;
    if (field === 'systemQuantity' || field === 'physicalQuantity') {
      updated[idx].variance = updated[idx].physicalQuantity - updated[idx].systemQuantity;
      updated[idx].variancePercentage = updated[idx].systemQuantity > 0
        ? ((updated[idx].variance / updated[idx].systemQuantity) * 100).toFixed(2)
        : 0;
      updated[idx].adjustmentNeeded = updated[idx].variance !== 0;
    }
    setItemsData(updated);
  };

  const handleComplete = async () => {
    if (!itemsData.length) { showToast('Add at least one item', 'error'); return; }
    setCreating(true);
    try {
      const res = await fetch(`/api/stock/reconciliations/${selected._id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ items: itemsData, totalItems: itemsData.length, totalVariances: itemsData.filter((i) => i.adjustmentNeeded).length }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('Reconciliation completed and submitted for approval', 'success');
        logActivity({ user: user?.fullName, action: `Completed reconciliation: ${selected.title}`, module: 'Stock', status: 'success' });
        setSelected(null); setItemsData([]); fetch_();
      } else {
        showToast(json.message || 'Failed', 'error');
      }
    } catch (err) { showToast(err.message, 'error'); }
    finally { setCreating(false); }
  };

  const STATUS_BADGE = {
    'planned':          { variant: 'info',    label: 'Planned'           },
    'in-progress':      { variant: 'warning', label: 'In Progress'       },
    'completed':        { variant: 'success', label: 'Completed'         },
    'pending-approval': { variant: 'warning', label: 'Pending Approval'  },
  };

  const columns = [
    { key: 'title',         header: 'Title',          render: (r) => <span className="font-semibold">{r.title}</span> },
    { key: 'location',      header: 'Location' },
    { key: 'status',        header: 'Status',
      render: (r) => {
        const cfg = STATUS_BADGE[r.status] || STATUS_BADGE.planned;
        return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
      },
    },
    { key: 'scheduledDate', header: 'Scheduled',  render: (r) => new Date(r.scheduledDate).toLocaleDateString() },
    { key: 'items',         header: 'Items',      render: (r) => r.items?.length || 0 },
    ...(!viewOnly ? [{
      key: 'action', header: 'Action',
      render: (r) => (
        <Button size="sm" variant={r.status === 'planned' ? 'primary' : 'ghost'}
          onClick={() => { setSelected(r); setItemsData([]); }}
          disabled={r.status !== 'planned'}>
          {r.status === 'planned' ? 'Start' : 'View'}
        </Button>
      ),
    }] : []),
  ];

  if (loading) return <div className="py-8 text-center text-sm text-[var(--color-mid-gray)]">Loading reconciliation records…</div>;

  return (
    <div className="space-y-5">
      <p className="text-sm text-[var(--color-mid-gray)]">
        Schedule physical inventory counts and compare against system records to identify discrepancies.
      </p>

      {/* Schedule new */}
      {!viewOnly && (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border-gray)] bg-[var(--color-white)] p-5">
          <h3 className="font-semibold text-[var(--color-dark-gray)] mb-4">Schedule New Reconciliation</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Title" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Monthly Count – Main Store" required />
              <Select label="Location" value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                options={LOCATIONS.map((l) => ({ value: l, label: l }))} required />
              <Input label="Scheduled Date" type="date" value={form.scheduledDate}
                onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} required />
            </div>
            <Button type="submit" variant="primary" icon={Plus} loading={creating}>Create Reconciliation</Button>
          </form>
        </div>
      )}

      {/* List */}
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border-gray)] bg-[var(--color-white)]">
        {reconciliations.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No reconciliation records" message="Schedule a physical count to get started." />
        ) : (
          <DataTable columns={columns} data={reconciliations} />
        )}
      </div>

      {/* Start / view modal */}
      <Modal
        open={!!selected}
        onClose={() => { setSelected(null); setItemsData([]); }}
        title={selected?.title || ''}
        footer={
          selected?.status === 'planned' ? (
            <>
              <Button variant="ghost" onClick={() => setSelected(null)}>Close</Button>
              <Button variant="primary" onClick={handleComplete} loading={creating}>Complete & Submit</Button>
            </>
          ) : (
            <Button variant="ghost" onClick={() => setSelected(null)}>Close</Button>
          )
        }
      >
        {selected && (
          <div className="space-y-5">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div><dt className="font-semibold text-[var(--color-mid-gray)]">Location</dt><dd className="mt-1">{selected.location}</dd></div>
              <div><dt className="font-semibold text-[var(--color-mid-gray)]">Status</dt><dd className="mt-1"><Badge variant={STATUS_BADGE[selected.status]?.variant || 'info'}>{STATUS_BADGE[selected.status]?.label || selected.status}</Badge></dd></div>
            </dl>

            {selected.status === 'planned' && (
              <div className="space-y-4 border-t pt-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-[var(--color-dark-gray)]">Physical Count Items</h3>
                  <Button size="sm" variant="primary" icon={Plus} onClick={handleAddItem}>Add Item</Button>
                </div>
                {itemsData.length === 0 ? (
                  <Alert type="info">Click "Add Item" to start recording physical counts.</Alert>
                ) : (
                  <div className="space-y-3">
                    {itemsData.map((item, idx) => (
                      <div key={idx} className="rounded-lg border border-[var(--color-border-gray)] p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="font-semibold text-sm">Item {idx + 1}</span>
                          <Button size="sm" variant="danger" onClick={() => handleRemoveItem(idx)}>Remove</Button>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <Input label="System Qty" type="number" min="0" value={item.systemQuantity}
                            onChange={(e) => handleUpdateItem(idx, 'systemQuantity', Number(e.target.value))} />
                          <Input label="Physical Qty" type="number" min="0" value={item.physicalQuantity}
                            onChange={(e) => handleUpdateItem(idx, 'physicalQuantity', Number(e.target.value))} />
                          <div>
                            <label className="text-sm font-semibold text-[var(--color-mid-gray)]">Variance</label>
                            <p className="mt-2 text-lg font-bold" style={{ color: item.variance === 0 ? '#10b981' : '#ef4444' }}>
                              {item.variance > 0 ? '+' : ''}{item.variance || 0}
                            </p>
                            <p className="text-xs text-[var(--color-mid-gray)]">{item.variancePercentage || 0}%</p>
                          </div>
                        </div>
                        <Textarea label="Notes" value={item.notes} rows={2} placeholder="Discrepancies or observations…"
                          onChange={(e) => handleUpdateItem(idx, 'notes', e.target.value)} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
