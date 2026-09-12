import { useEffect, useState } from 'react';
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
import { getDamagedItems, getItems, refreshStock } from '../../services/stockService';
import { useApp } from '../../context/AppContext';

export default function DamagedItems() {
  const { viewOnly } = useModuleAccess(ROLES.STOCK_MANAGER);
  const { t } = useApp();

  const [records, setRecords] = useState(() => getDamagedItems());
  const [reportItemId, setReportItemId] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [disposeTarget, setDisposeTarget] = useState(null);

  const items = getItems().filter((i) => i.quantity > 0);
  const refresh = () => setRecords(getDamagedItems());

  useEffect(() => {
    window.addEventListener('rg:stock-updated', refresh);
    refreshStock().catch(() => {});
    return () => window.removeEventListener('rg:stock-updated', refresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = [
    { key: 'itemName', header: t('item') },
    { key: 'quantity', header: t('quantity'), render: (d) => `${d.quantity} ${d.unit}` },
    { key: 'reason', header: t('reason'), render: (d) => <Badge tone="orange">{d.reason}</Badge> },
    { key: 'date', header: t('date') }, { key: 'reportedBy', header: t('reportedBy') },
    { key: 'notes', header: t('notes'), render: (d) => <span className="text-[var(--color-mid-gray)]">{d.notes || '—'}</span> },
    { key: 'status', header: t('status'), render: () => <Badge tone="orange">{t('reported')}</Badge> },
  ];
  if (!viewOnly) {
    columns.push({
      key: 'actions',
      header: t('action'),
      render: (d) => (
        <Button size="sm" variant="danger" icon={Trash2} onClick={() => setDisposeTarget(d)}>{t('dispose')}</Button>
      ),
    });
  }

  return (
    <div>
      <PageHeader
        title={t('damagedItems')}
        description={t('damagedItemsDescription')}
        breadcrumb={[{ label: t('stockManagement'), to: '/stock' }, { label: t('damagedItems') }]}
      />
      {viewOnly && <ViewOnlyBanner module="Stock MIS" />}

      {!viewOnly && (
        <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-4 mb-5 flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1 max-w-xs">
            <Select
              label={t('selectDamageItem')}
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
            {t('reportDamage')}
          </Button>
        </div>
      )}

      <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)]">
        <DataTable
          columns={columns}
          data={records}
          emptyState={<EmptyState icon={AlertTriangle} title={t('noDamagedItems')} message={t('noDamageReports')} />}
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
