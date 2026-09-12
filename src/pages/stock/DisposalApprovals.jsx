import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Table from '../../components/tables/Table';
import Modal from '../../components/modals/Modal';
import { Input, Select, Textarea } from '../../components/forms/FormField';
import Alert from '../../components/feedback/Alert';
import { logActivity } from '../../services/activityService';

export default function DisposalApprovals() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [disposals, setDisposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedDisposal, setSelectedDisposal] = useState(null);
  const [actionType, setActionType] = useState(null); // 'approve' or 'reject'
  const [actionNotes, setActionNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPendingDisposals();
  }, [page]);

  const fetchPendingDisposals = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/stock/disposal-requests/pending?page=${page}&limit=10`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('rg_access_token')}` }
      });
      const json = await response.json();
      if (json.success) {
        setDisposals(json.data);
        setTotal(json.pagination.total);
      } else {
        showToast('Failed to load disposal requests', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/stock/disposal-requests/${selectedDisposal._id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('rg_access_token')}`
        },
        body: JSON.stringify({ approvalNotes: actionNotes })
      });
      const json = await response.json();
      if (json.success) {
        showToast('Disposal approved successfully', 'success');
        logActivity({
          user: user?.fullName,
          action: `Approved disposal: ${selectedDisposal.itemName}`,
          module: 'Stock',
          status: 'success'
        });
        setSelectedDisposal(null);
        setActionNotes('');
        fetchPendingDisposals();
      } else {
        showToast(json.message || 'Failed to approve disposal', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/stock/disposal-requests/${selectedDisposal._id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('rg_access_token')}`
        },
        body: JSON.stringify({ rejectionReason: actionNotes })
      });
      const json = await response.json();
      if (json.success) {
        showToast('Disposal rejected', 'success');
        logActivity({
          user: user?.fullName,
          action: `Rejected disposal: ${selectedDisposal.itemName}`,
          module: 'Stock',
          status: 'success'
        });
        setSelectedDisposal(null);
        setActionNotes('');
        fetchPendingDisposals();
      } else {
        showToast(json.message || 'Failed to reject disposal', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const columns = [
    { header: 'Item Name', accessor: 'itemName', className: 'font-semibold' },
    { header: 'Quantity', accessor: 'quantityRemoved', render: (row) => `${row.quantityRemoved} units` },
    { header: 'Reason', accessor: 'reason', render: (row) => <Badge variant={row.reason === 'Damaged' ? 'error' : 'warning'}>{row.reason}</Badge> },
    { header: 'Requested By', accessor: 'requestedBy', render: (row) => row.requestedBy?.name || 'Unknown' },
    { header: 'Date', accessor: 'createdAt', render: (row) => new Date(row.createdAt).toLocaleDateString() },
    {
      header: 'Action',
      accessor: 'action',
      render: (row) => (
        <Button size="sm" variant="primary" onClick={() => setSelectedDisposal(row)}>
          Review & Approve
        </Button>
      )
    }
  ];

  if (loading) return <div className="text-center py-8">Loading disposal requests...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-dark-gray)]">Disposal Approvals</h1>
        <p className="mt-2 text-[var(--color-mid-gray)]">Review and approve pending disposal requests. This ensures proper authorization and maintains audit trails.</p>
      </div>

      {disposals.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-[var(--color-mid-gray)] mb-4">No pending disposal requests</p>
            <p className="text-sm text-[var(--color-mid-gray)]">All disposal requests have been reviewed.</p>
          </div>
        </Card>
      ) : (
        <Card>
          <Table columns={columns} data={disposals} />
          {total > 10 && (
            <div className="mt-4 flex justify-between items-center">
              <span className="text-sm text-[var(--color-mid-gray)]">Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, total)} of {total}</span>
              <div className="flex gap-2">
                <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                <Button onClick={() => setPage(p => Math.ceil(total / 10) > p ? p + 1 : p)} disabled={page * 10 >= total}>Next</Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Approval Modal */}
      <Modal
        open={!!selectedDisposal}
        onClose={() => {
          setSelectedDisposal(null);
          setActionType(null);
          setActionNotes('');
        }}
        title="Review Disposal Request"
        footer={
          actionType ? (
            <>
              <Button variant="ghost" onClick={() => setActionType(null)} disabled={processing}>Cancel</Button>
              <Button
                variant={actionType === 'approve' ? 'primary' : 'error'}
                onClick={actionType === 'approve' ? handleApprove : handleReject}
                loading={processing}
              >
                {actionType === 'approve' ? 'Approve Disposal' : 'Reject Request'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setSelectedDisposal(null)}>Close</Button>
              <div className="flex gap-2">
                <Button variant="error" onClick={() => setActionType('reject')}>Reject</Button>
                <Button variant="primary" onClick={() => setActionType('approve')}>Approve</Button>
              </div>
            </>
          )
        }
      >
        {selectedDisposal && !actionType && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-[var(--color-mid-gray)]">Item Name</label>
                <p className="mt-1 text-[var(--color-dark-gray)]">{selectedDisposal.itemName}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-[var(--color-mid-gray)]">Quantity to Remove</label>
                <p className="mt-1 text-[var(--color-dark-gray)]">{selectedDisposal.quantityRemoved} units</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-[var(--color-mid-gray)]">Reason</label>
                <p className="mt-1"><Badge variant={selectedDisposal.reason === 'Damaged' ? 'error' : 'warning'}>{selectedDisposal.reason}</Badge></p>
              </div>
              <div>
                <label className="text-sm font-semibold text-[var(--color-mid-gray)]">Remaining Stock</label>
                <p className="mt-1 text-[var(--color-dark-gray)]">{selectedDisposal.remainingQuantity} units</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-[var(--color-mid-gray)]">Requested By</label>
              <p className="mt-1 text-[var(--color-dark-gray)]">{selectedDisposal.requestedBy?.name || 'Unknown'}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-[var(--color-mid-gray)]">Notes</label>
              <p className="mt-1 text-[var(--color-mid-gray)]">{selectedDisposal.notes || 'No additional notes'}</p>
            </div>
          </div>
        )}

        {actionType && (
          <div className="space-y-4">
            <Alert type="info">
              {actionType === 'approve'
                ? `Are you sure you want to approve the disposal of ${selectedDisposal.quantityRemoved} units of ${selectedDisposal.itemName}? This action cannot be undone.`
                : `Why are you rejecting this disposal request? Provide specific feedback.`}
            </Alert>
            <Textarea
              label={actionType === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason (Required)'}
              required={actionType === 'reject'}
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              rows={4}
              placeholder={actionType === 'approve' ? 'Add any notes about this approval...' : 'Explain why this request is being rejected...'}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
