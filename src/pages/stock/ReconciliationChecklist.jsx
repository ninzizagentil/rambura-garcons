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

const LOCATIONS = ['Main Store', 'Kitchen Store', 'ICT Lab Store', 'Admin Store'];

export default function ReconciliationChecklist() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [reconciliations, setReconciliations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newReconciliation, setNewReconciliation] = useState({
    title: '',
    location: '',
    scheduledDate: ''
  });
  const [selectedReconciliation, setSelectedReconciliation] = useState(null);
  const [itemsData, setItemsData] = useState([]);
  const [editingItemIndex, setEditingItemIndex] = useState(null);

  useEffect(() => {
    fetchReconciliations();
  }, []);

  const fetchReconciliations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stock/reconciliations', {
        headers: { Authorization: `Bearer ${localStorage.getItem('rg_access_token')}` }
      });
      if (response.ok) {
        const json = await response.json();
        setReconciliations(json.success ? json.data : []);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReconciliation = async (e) => {
    e.preventDefault();
    if (!newReconciliation.title || !newReconciliation.location || !newReconciliation.scheduledDate) {
      showToast('All fields are required', 'error');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/stock/reconciliations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('rg_access_token')}`
        },
        body: JSON.stringify({
          ...newReconciliation,
          scheduledDate: new Date(newReconciliation.scheduledDate)
        })
      });
      const json = await response.json();
      if (json.success) {
        showToast('Reconciliation checklist created', 'success');
        logActivity({
          user: user?.fullName,
          action: `Created reconciliation: ${newReconciliation.title}`,
          module: 'Stock',
          status: 'success'
        });
        setNewReconciliation({ title: '', location: '', scheduledDate: '' });
        fetchReconciliations();
      } else {
        showToast(json.message || 'Failed to create reconciliation', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleStartReconciliation = (reconciliation) => {
    setSelectedReconciliation(reconciliation);
    setItemsData([]);
    setEditingItemIndex(null);
  };

  const handleAddItem = () => {
    setItemsData([...itemsData, { itemId: '', systemQuantity: 0, physicalQuantity: 0, notes: '' }]);
  };

  const handleUpdateItem = (index, field, value) => {
    const updated = [...itemsData];
    updated[index][field] = value;
    if (field === 'systemQuantity' || field === 'physicalQuantity') {
      updated[index].variance = updated[index].physicalQuantity - updated[index].systemQuantity;
      updated[index].variancePercentage = updated[index].systemQuantity > 0 
        ? ((updated[index].variance / updated[index].systemQuantity) * 100).toFixed(2)
        : 0;
      updated[index].adjustmentNeeded = updated[index].variance !== 0;
    }
    setItemsData(updated);
  };

  const handleRemoveItem = (index) => {
    setItemsData(itemsData.filter((_, i) => i !== index));
  };

  const handleCompleteReconciliation = async () => {
    if (itemsData.length === 0) {
      showToast('Add at least one item to the reconciliation', 'error');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch(`/api/stock/reconciliations/${selectedReconciliation._id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('rg_access_token')}`
        },
        body: JSON.stringify({
          items: itemsData,
          totalItems: itemsData.length,
          totalVariances: itemsData.filter(i => i.adjustmentNeeded).length
        })
      });
      const json = await response.json();
      if (json.success) {
        showToast('Reconciliation completed and submitted for approval', 'success');
        logActivity({
          user: user?.fullName,
          action: `Completed reconciliation: ${selectedReconciliation.title}`,
          module: 'Stock',
          status: 'success'
        });
        setSelectedReconciliation(null);
        setItemsData([]);
        fetchReconciliations();
      } else {
        showToast(json.message || 'Failed to complete reconciliation', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCreating(false);
    }
  };

  const columns = [
    { header: 'Title', accessor: 'title', className: 'font-semibold' },
    { header: 'Location', accessor: 'location' },
    { header: 'Status', accessor: 'status', render: (row) => {
      const statusConfig = {
        'planned': { variant: 'info', label: 'Planned' },
        'in-progress': { variant: 'warning', label: 'In Progress' },
        'completed': { variant: 'success', label: 'Completed' },
        'pending-approval': { variant: 'warning', label: 'Pending Approval' }
      };
      const config = statusConfig[row.status] || statusConfig.planned;
      return <Badge variant={config.variant}>{config.label}</Badge>;
    }},
    { header: 'Scheduled Date', accessor: 'scheduledDate', render: (row) => new Date(row.scheduledDate).toLocaleDateString() },
    { header: 'Items', accessor: 'items', render: (row) => row.items?.length || 0 },
    {
      header: 'Action',
      accessor: 'action',
      render: (row) => (
        <Button
          size="sm"
          variant={row.status === 'planned' ? 'primary' : 'ghost'}
          onClick={() => handleStartReconciliation(row)}
          disabled={row.status !== 'planned'}
        >
          {row.status === 'planned' ? 'Start' : 'View'}
        </Button>
      )
    }
  ];

  if (loading) return <div className="text-center py-8">Loading reconciliation records...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-dark-gray)]">Stock Reconciliation</h1>
        <p className="mt-2 text-[var(--color-mid-gray)]">Conduct scheduled physical counts and reconcile with system records to maintain inventory accuracy.</p>
      </div>

      {/* Create New Reconciliation */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Schedule New Reconciliation</h2>
          <form onSubmit={handleCreateReconciliation} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Reconciliation Title"
                value={newReconciliation.title}
                onChange={(e) => setNewReconciliation({ ...newReconciliation, title: e.target.value })}
                placeholder="e.g., Monthly Inventory Count - September"
                required
              />
              <Select
                label="Location"
                value={newReconciliation.location}
                onChange={(e) => setNewReconciliation({ ...newReconciliation, location: e.target.value })}
                options={LOCATIONS.map(loc => ({ value: loc, label: loc }))}
                required
              />
              <Input
                label="Scheduled Date"
                type="date"
                value={newReconciliation.scheduledDate}
                onChange={(e) => setNewReconciliation({ ...newReconciliation, scheduledDate: e.target.value })}
                required
              />
            </div>
            <Button type="submit" variant="primary" loading={creating}>
              Create Reconciliation
            </Button>
          </form>
        </div>
      </Card>

      {/* Reconciliation List */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Reconciliation Records</h2>
          {reconciliations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[var(--color-mid-gray)]">No reconciliation records yet</p>
            </div>
          ) : (
            <Table columns={columns} data={reconciliations} />
          )}
        </div>
      </Card>

      {/* Reconciliation Detail Modal */}
      <Modal
        open={!!selectedReconciliation}
        onClose={() => {
          setSelectedReconciliation(null);
          setItemsData([]);
        }}
        title={selectedReconciliation?.title}
        footer={
          selectedReconciliation?.status === 'planned' ? (
            <>
              <Button variant="ghost" onClick={() => setSelectedReconciliation(null)}>Close</Button>
              <Button variant="primary" onClick={handleCompleteReconciliation} loading={creating}>
                Complete & Submit
              </Button>
            </>
          ) : (
            <Button variant="ghost" onClick={() => setSelectedReconciliation(null)}>Close</Button>
          )
        }
      >
        {selectedReconciliation && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-[var(--color-mid-gray)]">Location</label>
                <p className="mt-1 text-[var(--color-dark-gray)]">{selectedReconciliation.location}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-[var(--color-mid-gray)]">Status</label>
                <p className="mt-1">
                  <Badge variant={selectedReconciliation.status === 'planned' ? 'info' : 'warning'}>
                    {selectedReconciliation.status === 'planned' ? 'Planned' : 'In Progress'}
                  </Badge>
                </p>
              </div>
            </div>

            {selectedReconciliation.status === 'planned' && (
              <div className="space-y-4 border-t pt-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900">Physical Count Items</h3>
                  <Button size="sm" variant="primary" onClick={handleAddItem}>
                    + Add Item
                  </Button>
                </div>

                {itemsData.length === 0 ? (
                  <Alert type="info">
                    Click "Add Item" to start recording physical counts
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    {itemsData.map((item, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-3">
                        <div className="flex justify-between items-start">
                          <h4 className="font-semibold text-gray-900">Item {index + 1}</h4>
                          <Button
                            size="sm"
                            variant="error"
                            onClick={() => handleRemoveItem(index)}
                          >
                            Remove
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <Input
                            label="System Qty"
                            type="number"
                            min="0"
                            value={item.systemQuantity}
                            onChange={(e) => handleUpdateItem(index, 'systemQuantity', Number(e.target.value))}
                          />
                          <Input
                            label="Physical Qty"
                            type="number"
                            min="0"
                            value={item.physicalQuantity}
                            onChange={(e) => handleUpdateItem(index, 'physicalQuantity', Number(e.target.value))}
                          />
                          <div>
                            <label className="text-sm font-semibold text-gray-700">Variance</label>
                            <p className="mt-2 text-lg font-bold" style={{ color: item.variance === 0 ? '#10b981' : '#ef4444' }}>
                              {item.variance > 0 ? '+' : ''}{item.variance}
                            </p>
                            <p className="text-xs text-gray-500">{item.variancePercentage}%</p>
                          </div>
                        </div>
                        <Textarea
                          label="Notes"
                          value={item.notes}
                          onChange={(e) => handleUpdateItem(index, 'notes', e.target.value)}
                          rows={2}
                          placeholder="Record any discrepancies or observations..."
                        />
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
