import { useEffect, useState } from 'react';
import { Archive, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Filter, RotateCcw, XCircle } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/tables/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { EmptyState } from '../../components/feedback/States';
import { useToast } from '../../context/ToastContext';
import { refreshStock } from '../../services/stockService';
import { useApp } from '../../context/AppContext';

const REASON_TONE = {
  Damaged: 'error',
  Expired: 'warning',
  Lost: 'error',
  Broken: 'error',
  Obsolete: 'warning',
  Other: 'info',
};

const STATUS_CONFIG = {
  pending: { variant: 'warning', key: 'pendingApproval' },
  approved: { variant: 'success', key: 'approved' },
  rejected: { variant: 'error', key: 'rejected' }
};

export default function RemovedDisposed() {
  const { showToast } = useToast();
  const { t, language } = useApp();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('all'); // all, approved, pending, rejected
  const limit = 20;

  useEffect(() => {
    fetchRecords();
  }, [page, filter]);

  useEffect(() => {
    const refresh = () => fetchRecords();
    window.addEventListener('rg:stock-updated', refresh);
    refreshStock().catch(() => {});
    return () => window.removeEventListener('rg:stock-updated', refresh);
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const statusParam = filter !== 'all' ? `&status=${filter}` : '';
      const response = await fetch(`/api/stock/disposed?page=${page}&limit=${limit}${statusParam}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('rg_access_token')}` }
      });

      if (!response.ok) {
        let message = t('failedLoadDisposedRecords');
        try {
          const errorPayload = await response.json();
          message = errorPayload.message || message;
        } catch {
          const text = await response.text();
          if (text) message = text;
        }
        throw new Error(message);
      }

      const json = await response.json();
      if (!json.success) {
        throw new Error(json.message || t('failedLoadDisposedRecords'));
      }

      setRecords(json.data);
      setTotal(json.pagination?.total || 0);
    } catch (err) {
      showToast(err.message || t('failedLoadDisposedRecords'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'itemName', header: t('item'), render: (r) => r.itemId?.name || r.itemName },
    { key: 'quantityRemoved', header: t('quantity'), render: (r) => `${r.quantityRemoved} ${t('units')}` },
    { key: 'reason', header: t('reason'), render: (r) => <Badge variant={REASON_TONE[r.reason] || 'info'}>{r.reason}</Badge> },
    { key: 'status', header: t('status'), render: (r) => {
      const config = STATUS_CONFIG[r.status] || STATUS_CONFIG.approved;
      return <Badge variant={config.variant}>{t(config.key)}</Badge>;
    }},
    { key: 'requestedBy', header: t('requestedBy'), render: (r) => r.requestedBy?.name || t('system') },
    { key: 'approvedBy', header: t('approvedBy'), render: (r) => r.approvedBy?.name || '—' },
    { key: 'date', header: t('date'), render: (r) => new Date(r.date || r.createdAt).toLocaleDateString(language === 'fr' ? 'fr-FR' : language === 'rw' ? 'rw-RW' : 'en-GB') },
  ];

  const totalPages = Math.ceil(total / limit);
  const filterOptions = [
    { value: 'all', label: t('all'), icon: Archive },
    { value: 'pending', label: t('pendingApproval'), icon: Clock3 },
    { value: 'approved', label: t('approved'), icon: CheckCircle2 },
    { value: 'rejected', label: t('rejected'), icon: XCircle },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('removedDisposedStock')}
        description={t('removedDisposedDescription')}
        breadcrumb={[{ label: t('stockManagement'), to: '/stock' }, { label: t('removedDisposed') }]}
      />

      <Card className="overflow-hidden border-[var(--border)] bg-[linear-gradient(135deg,var(--surface),var(--sidebar-nav-hover-bg))] shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--button-primary)] text-white shadow-[0_10px_22px_rgba(23,59,49,0.24)]">
              <Archive className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--button-primary)]">Stock audit workspace</p>
              <h2 className="mt-1 font-display text-xl font-semibold text-[var(--text-primary)]">Removal history</h2>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-[var(--text-secondary)]">Review every item removed from active inventory, including its reason, approval status, and responsible users.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-[var(--text-secondary)]">
            <Filter className="h-4 w-4 text-[var(--button-primary)]" aria-hidden="true" />
            <span>{total} {t('records') || 'records'}</span>
          </div>
        </div>
        <div className="border-t border-[var(--border)] bg-[var(--surface)]/70 p-4">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter removal records">
          {filterOptions.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => {
                setFilter(value);
                setPage(1);
              }}
              role="tab"
              aria-selected={filter === value}
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all ${
                filter === value
                  ? 'border-[var(--button-primary)] bg-[var(--button-primary)] text-white shadow-[0_8px_18px_rgba(23,59,49,0.2)]'
                  : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:-translate-y-0.5 hover:border-[var(--button-primary)] hover:text-[var(--button-primary)]'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </button>
          ))}
          </div>
        </div>
      </Card>

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
        {loading ? (
          <div className="p-8 text-center text-[var(--color-dark-gray)]">{t('loadingDisposalRecords')}</div>
        ) : records.length === 0 ? (
          <EmptyState icon={Archive} title={t('noDisposedItems')} message={t('disposedItemsAppearHere')} />
        ) : (
          <>
            <DataTable columns={columns} data={records} />

            {/* Pagination */}
            <div className="p-4 border-t border-[var(--border)] flex justify-between items-center gap-3 flex-wrap">
              <span className="text-sm text-[var(--color-mid-gray)]">
                {t('showingItems', { from: (page - 1) * limit + 1, to: Math.min(page * limit, total), total })}
              </span>
              <div className="flex gap-2 items-center flex-wrap">
                <Button
                  size="sm"
                  variant="ghost"
                  icon={ChevronLeft}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  {t('previous')}
                </Button>
                <span className="px-4 py-2 text-sm font-medium text-[var(--color-dark-gray)]">
                  {t('pageOf', { page, total: totalPages })}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={ChevronRight}
                  iconPosition="right"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= totalPages}
                >
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
