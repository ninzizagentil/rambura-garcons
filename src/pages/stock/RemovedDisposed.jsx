import { useEffect, useState } from 'react';
import { Archive } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/tables/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { EmptyState } from '../../components/feedback/States';
import { useToast } from '../../context/ToastContext';
import { refreshStock } from '../../services/stockService';

const REASON_TONE = {
  Damaged: 'error',
  Expired: 'warning',
  Lost: 'error',
  Broken: 'error',
  Obsolete: 'warning',
  Other: 'info',
};

const STATUS_CONFIG = {
  pending: { variant: 'warning', label: 'Pending Approval' },
  approved: { variant: 'success', label: 'Approved' },
  rejected: { variant: 'error', label: 'Rejected' }
};

export default function RemovedDisposed() {
  const { showToast } = useToast();
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
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });

      if (!response.ok) {
        let message = 'Failed to load disposed records';
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
        throw new Error(json.message || 'Failed to load disposed records');
      }

      setRecords(json.data);
      setTotal(json.pagination?.total || 0);
    } catch (err) {
      showToast(err.message || 'Failed to load disposed records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'itemName', header: 'Item', render: (r) => r.itemId?.name || r.itemName },
    { key: 'quantityRemoved', header: 'Quantity', render: (r) => `${r.quantityRemoved} units` },
    { key: 'reason', header: 'Reason', render: (r) => <Badge variant={REASON_TONE[r.reason] || 'info'}>{r.reason}</Badge> },
    { key: 'status', header: 'Status', render: (r) => {
      const config = STATUS_CONFIG[r.status] || STATUS_CONFIG.approved;
      return <Badge variant={config.variant}>{config.label}</Badge>;
    }},
    { key: 'requestedBy', header: 'Requested By', render: (r) => r.requestedBy?.name || 'System' },
    { key: 'approvedBy', header: 'Approved By', render: (r) => r.approvedBy?.name || '—' },
    { key: 'date', header: 'Date', render: (r) => new Date(r.date || r.createdAt).toLocaleDateString() },
  ];

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <PageHeader
        title="Removed / Disposed Stock"
        description="Complete history of items removed from inventory. Includes pending approvals and approved disposals."
        breadcrumb={[{ label: 'Stock', to: '/stock' }, { label: 'Removed/Disposed' }]}
      />
      
      {/* Filter Tabs */}
      <Card className="mb-6 border-[var(--border)] bg-[var(--surface)]">
        <div className="p-4 border-b border-[var(--border)] flex gap-2 flex-wrap">
          {[
            { value: 'all', label: 'All' },
            { value: 'pending', label: 'Pending Approval' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' }
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => {
                setFilter(tab.value);
                setPage(1);
              }}
              className={`px-4 py-2 rounded font-medium transition border ${
                filter === tab.value
                  ? 'bg-[var(--gold)] text-white border-[var(--gold)] shadow-[0_8px_20px_rgba(15,108,255,0.18)]'
                  : 'bg-[var(--surface)] text-[var(--text-primary)] border-[var(--border)] hover:bg-[var(--surface-hover)] hover:border-[var(--gold)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Data Table */}
      <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)]">
        {loading ? (
          <div className="p-8 text-center text-[var(--color-dark-gray)]">Loading disposal records...</div>
        ) : records.length === 0 ? (
          <EmptyState icon={Archive} title="No disposed items" message="Removed/disposed items will appear here." />
        ) : (
          <>
            <DataTable columns={columns} data={records} />

            {/* Pagination */}
            <div className="p-4 border-t border-[var(--border)] flex justify-between items-center gap-3 flex-wrap">
              <span className="text-sm text-[var(--color-mid-gray)]">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
              </span>
              <div className="flex gap-2 items-center flex-wrap">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="px-4 py-2 text-sm font-medium text-[var(--color-dark-gray)]">
                  Page {page} of {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
