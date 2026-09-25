import { useEffect, useMemo, useState } from 'react';
import { Download, FileBarChart, Printer } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/tables/DataTable';
import Button from '../../components/common/Button';
import { StatusBadge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';
import { useApp } from '../../context/AppContext';
import { getEquipment, refreshEquipment } from '../../services/equipmentService';
import { exportToCSV } from '../../utils/export';
import { printReport } from '../../utils/print';

const inputClass = 'rounded-lg border border-[var(--color-border-gray)] bg-[var(--color-white)] px-3 py-2 text-sm text-[var(--color-dark-gray)]';
const reportTypes = [
  { value: 'inventory', key: 'inventory' },
  { value: 'assignments', key: 'assignments' },
  { value: 'maintenance', key: 'maintenance' },
  { value: 'condition', key: 'condition' },
];

function reportValue(item, key, t) {
  if (key === 'assignedTo') return item.currentAssignee?.userName || t('unassigned');
  if (key === 'lastMaintenance') return item.maintenanceRecords?.at(-1)?.description || t('noDataAvailable');
  if (key === 'maintenanceDate') return item.maintenanceRecords?.at(-1)?.date || '';
  if (key === 'maintenanceCost') return item.maintenanceRecords?.at(-1)?.cost || 0;
  return item[key];
}

export default function EquipmentReports() {
  const { t } = useApp();
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [type, setType] = useState('inventory');
  const [status, setStatus] = useState('');
  const [condition, setCondition] = useState('');

  useEffect(() => {
    refreshEquipment().then(() => setItems([...getEquipment()])).catch((error) => showToast(error.message, 'error'));
  }, [showToast]);

  const filteredItems = useMemo(() => items.filter((item) => {
    if (status && item.status !== status) return false;
    if (condition && item.condition !== condition) return false;
    if (type === 'assignments' && item.status !== 'assigned') return false;
    if (type === 'maintenance' && item.status !== 'under_maintenance' && item.condition !== 'under_repair' && !item.maintenanceRecords?.length) return false;
    return true;
  }), [condition, items, status, type]);

  const columns = useMemo(() => {
    const common = [
      { key: 'assetNumber', header: t('assetNumber') },
      { key: 'name', header: t('equipment') },
      { key: 'type', header: t('type'), value: (item) => item.type?.replaceAll('_', ' ') || 'Other' },
    ];
    if (type === 'assignments') return [...common, { key: 'assignedTo', header: t('assignedTo'), value: (item) => reportValue(item, 'assignedTo', t) }, { key: 'location', header: t('location') }, { key: 'status', header: t('status') }];
    if (type === 'maintenance') return [...common, { key: 'condition', header: t('condition') }, { key: 'status', header: t('status') }, { key: 'lastMaintenance', header: t('lastMaintenance'), value: (item) => reportValue(item, 'lastMaintenance', t) }, { key: 'maintenanceCost', header: t('cost'), value: (item) => reportValue(item, 'maintenanceCost', t) }];
    if (type === 'condition') return [...common, { key: 'condition', header: t('condition') }, { key: 'status', header: t('status') }, { key: 'location', header: t('location') }];
    return [...common, { key: 'serialNumber', header: t('serialNumber') }, { key: 'location', header: t('location') }, { key: 'condition', header: t('condition') }, { key: 'status', header: t('status') }, { key: 'purchaseDate', header: t('purchaseDate') }];
  }, [t, type]);

  const reportLabels = { inventory: t('inventory'), assignments: t('assigned'), maintenance: t('maintenance'), condition: t('condition') };
  const title = reportLabels[type] || t('equipmentReport');
  const summary = [
    [t('records'), filteredItems.length],
    [t('available'), filteredItems.filter((item) => item.status === 'available').length],
    [t('assigned'), filteredItems.filter((item) => item.status === 'assigned').length],
    [t('maintenance'), filteredItems.filter((item) => item.status === 'under_maintenance' || item.condition === 'under_repair').length],
  ];
  const handleExport = () => { exportToCSV(`equipment-${type}-report`, columns, filteredItems); showToast(t('equipmentReportExported'), 'success'); };
  const handlePrint = () => { if (printReport(title, columns, filteredItems, { summary: summary.map(([label, value]) => ({ label, value })) })) showToast(t('equipmentReportOpened'), 'success'); else showToast(t('enablePopupsForReport'), 'error'); };

  return <div className="space-y-6">
    <PageHeader title={t('equipmentReports')} description={t('equipmentReportDescription')} breadcrumb={[{ label: t('equipmentMis'), to: '/equipment' }, { label: t('equipmentReports') }]} actions={<div className="flex flex-wrap gap-2"><Button variant="secondary" icon={Printer} onClick={handlePrint} disabled={!filteredItems.length}>{t('print')}</Button><Button icon={Download} onClick={handleExport} disabled={!filteredItems.length}>{t('csv')}</Button></div>} />
    <div className="grid gap-4 rounded-xl border border-[var(--color-border-gray)] bg-[var(--color-white)] p-4 md:grid-cols-3"><label className="space-y-1 text-sm"><span className="font-medium">{t('reportType')}</span><select className={`${inputClass} w-full`} value={type} onChange={(event) => setType(event.target.value)}>{reportTypes.map((report) => <option key={report.value} value={report.value}>{reportLabels[report.value]}</option>)}</select></label><label className="space-y-1 text-sm"><span className="font-medium">{t('status')}</span><select className={`${inputClass} w-full`} value={status} onChange={(event) => setStatus(event.target.value)}><option value="">{t('allStatuses')}</option>{['available', 'assigned', 'under_maintenance', 'retired'].map((value) => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}</select></label><label className="space-y-1 text-sm"><span className="font-medium">{t('condition')}</span><select className={`${inputClass} w-full`} value={condition} onChange={(event) => setCondition(event.target.value)}><option value="">{t('allConditions')}</option>{['new', 'good', 'fair', 'damaged', 'under_repair', 'retired'].map((value) => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}</select></label></div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{summary.map(([label, value]) => <div key={label} className="rounded-xl border border-[var(--color-border-gray)] bg-[var(--color-white)] p-4"><p className="text-xs uppercase tracking-[0.12em] text-[var(--color-mid-gray)]">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>)}</div>
    <div className="rounded-xl border border-[var(--color-border-gray)] bg-[var(--color-white)] p-4"><div className="mb-4 flex items-center gap-2"><FileBarChart className="h-5 w-5 text-[var(--color-heading)]" /><div><h2 className="font-display text-base font-semibold">{title}</h2><p className="text-xs text-[var(--color-mid-gray)]">{filteredItems.length} {t('records').toLowerCase()}</p></div></div><DataTable columns={columns.map((column) => ({ ...column, render: column.key === 'condition' || column.key === 'status' ? (item) => <StatusBadge status={item[column.key]} /> : undefined }))} data={filteredItems} emptyState={<div className="p-8 text-center text-sm text-[var(--color-mid-gray)]">{t('noMatchingReportRecords')}</div>} /></div>
  </div>;
}
