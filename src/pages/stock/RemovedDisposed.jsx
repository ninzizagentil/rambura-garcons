import { useState } from 'react';
import { Archive } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/tables/DataTable';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/feedback/States';
import { getRemovedItems } from '../../services/stockService';

const REASON_TONE = {
  Damaged: 'orange',
  Expired: 'purple',
  Lost: 'red',
  Broken: 'orange',
  Obsolete: 'gray',
  Other: 'gray',
};

export default function RemovedDisposed() {
  const [records] = useState(getRemovedItems());

  const columns = [
    { key: 'itemName', header: 'Item' },
    { key: 'quantityRemoved', header: 'Quantity Removed', render: (r) => `${r.quantityRemoved} ${r.unit}` },
    { key: 'remainingQuantity', header: 'Remaining Quantity', render: (r) => `${r.remainingQuantity} ${r.unit}` },
    { key: 'reason', header: 'Reason', render: (r) => <Badge tone={REASON_TONE[r.reason] || 'gray'}>{r.reason}</Badge> },
    { key: 'date', header: 'Date' },
    { key: 'responsibleUser', header: 'Responsible User' },
    { key: 'approvedBy', header: 'Approved By' },
    { key: 'notes', header: 'Notes', render: (r) => <span className="text-[var(--color-mid-gray)]">{r.notes || '—'}</span> },
  ];

  return (
    <div>
      <PageHeader
        title="Removed / Disposed"
        description="Permanent record of stock that has left the system. This history is never deleted."
        breadcrumb={[{ label: 'Stock', to: '/stock' }, { label: 'Removed / Disposed' }]}
      />
      <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)]">
        <DataTable
          columns={columns}
          data={records}
          emptyState={<EmptyState icon={Archive} title="Nothing disposed yet" message="Items removed from stock will appear here permanently." />}
        />
      </div>
    </div>
  );
}
