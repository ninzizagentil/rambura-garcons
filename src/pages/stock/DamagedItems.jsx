import { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/tables/DataTable';
import { Badge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { Select } from '../../components/forms/FormField';
import { EmptyState } from '../../components/feedback/States';
import ViewOnlyBanner from '../../components/feedback/ViewOnlyBanner';
import ReportDamageModal from '../../components/modals/ReportDamageModal';
import DisposeStockModal from '../../components/modals/DisposeStockModal';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { ROLES } from '../../data/roles';
import { getDamagedItems, getItems } from '../../services/stockService';

export default function DamagedItems() {
  const { viewOnly } = useModuleAccess(ROLES.STOCK_MANAGER);

  const [records, setRecords] = useState(getDamagedItems());
  const [reportItemId, setReportItemId] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [disposeTarget, setDisposeTarget] = useState(null);

  const items = getItems().filter((i) => i.quantity > 0);
  const refresh = () => setRecords(getDamagedItems());

  const columns = [
    { key: 'itemName', header: 'Item' },
    { key: 'quantity', header: 'Quantity', render: (d) => `${d.quantity} ${d.unit}` },
    { key: 'reason', header: 'Reason', render: (d) => <Badge tone="orange">{d.reason}</Badge> },
    { key: 'date', header: 'Date' },
    { key: 'reportedBy', header: 'Reported By' },
    { key: 'notes', header: 'Notes', render: (d) => <span className="text-[var(--color-mid-gray)]">{d.notes || '—'}</span> },
    { key: 'status', header: 'Status', render: () => <Badge tone="orange">Reported</Badge> },
  ];
  if (!viewOnly) {
    columns.push({
      key: 'actions',
      header: 'Action',
      render: (d) => (
        <Button size="sm" variant="danger" icon={Trash2} onClick={() => setDisposeTarget(d)}>Dispose</Button>
      ),
    });
  }

  return (
    <div>
      <PageHeader
        title="Damaged Items"
        description="Stock that has been reported broken, faulty, or otherwise damaged."
        breadcrumb={[{ label: 'Stock', to: '/stock' }, { label: 'Damaged Items' }]}
      />
      {viewOnly && <ViewOnlyBanner module="Stock MIS" />}

      {!viewOnly && (
        <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-4 mb-5 flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1 max-w-xs">
            <Select
              label="Select an item to report damage for"
              value={reportItemId}
              onChange={(e) => setReportItemId(e.target.value)}
              options={items.map((i) => ({ value: i.id, label: `${i.name} (${i.quantity} ${i.unit} in stock)` }))}
            />
          </div>
          <Button
            variant="secondary"
            icon={AlertTriangle}
            disabled={!reportItemId}
            onClick={() => setReportOpen(true)}
          >
            Report Damage
          </Button>
        </div>
      )}

      <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)]">
        <DataTable
          columns={columns}
          data={records}
          emptyState={<EmptyState icon={AlertTriangle} title="No damaged items" message="No damage reports are currently pending." />}
        />
      </div>

      <ReportDamageModal
        open={reportOpen}
        item={items.find((i) => i.id === reportItemId) || null}
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
