import { useEffect, useMemo, useState } from 'react';
import { Laptop, UserCheck, UserMinus, Wrench } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/tables/DataTable';
import Button from '../../components/common/Button';
import { StatusBadge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { addMaintenance, assignEquipment, getEquipment, refreshEquipment, returnEquipment } from '../../services/equipmentService';

const inputClass = 'w-full rounded-lg border border-[var(--color-border-gray)] bg-[var(--color-white)] px-3 py-2 text-sm text-[var(--color-dark-gray)]';

function AssignmentPage() {
  const { t } = useApp();
  const { showToast } = useToast();
  const { hasPermission } = useAuth();
  const [items, setItems] = useState([]);
  const [assignee, setAssignee] = useState('');
  const [selected, setSelected] = useState(null);

  const load = () => setItems([...getEquipment()]);
  useEffect(() => {
    refreshEquipment().then(load).catch((error) => showToast(error.message, 'error'));
    window.addEventListener('rg:equipment-updated', load);
    return () => window.removeEventListener('rg:equipment-updated', load);
  }, [showToast]);

  const activeItems = useMemo(() => items.filter((item) => item.status !== 'retired' && item.condition !== 'retired'), [items]);
  const close = () => { setSelected(null); setAssignee(''); };
  const submit = async (event) => {
    event.preventDefault();
    if (!assignee.trim()) return showToast(t('assignedUserRequired'), 'error');
    const result = await assignEquipment(selected.id, { userName: assignee.trim() });
    if (!result.success) return showToast(result.error, 'error');
    showToast(t('equipmentRecordUpdated'), 'success');
    close();
  };
  const columns = [
    { key: 'assetNumber', header: t('assetNumber'), render: (item) => <span className="font-mono text-xs font-semibold">{item.assetNumber}</span> },
    { key: 'name', header: t('equipment') },
    { key: 'location', header: t('location') },
    { key: 'assignedTo', header: t('assignedTo'), render: (item) => item.currentAssignee?.userName || t('unassigned') },
    { key: 'status', header: t('status'), render: (item) => <StatusBadge status={item.status} /> },
    { key: 'actions', header: t('actions'), render: (item) => hasPermission('equipment.assign') && (
      <Button size="sm" variant="secondary" icon={item.status === 'assigned' ? UserMinus : UserCheck} onClick={async () => {
        if (item.status === 'assigned') {
          const result = await returnEquipment(item.id);
          if (!result.success) showToast(result.error, 'error');
          else showToast(t('equipmentRecordUpdated'), 'success');
        } else setSelected(item);
      }}>
        {item.status === 'assigned' ? t('returnEquipment') : t('assignEquipment')}
      </Button>
    ) },
  ];

  return <div className="space-y-6">
    <PageHeader title="Assignment & Return" description="Track equipment issued to people and returned to the school." breadcrumb={[{ label: t('equipmentMis'), to: '/equipment' }, { label: 'Assignment & Return' }]} />
    <div className="rounded-xl border border-[var(--color-border-gray)] bg-[var(--color-white)] p-4">
      <DataTable columns={columns} data={activeItems} emptyState={<div className="p-8 text-center text-sm text-[var(--color-mid-gray)]"><Laptop className="mx-auto mb-2 h-8 w-8" />No equipment assignments found.</div>} />
    </div>
    {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><form onSubmit={submit} className="w-full max-w-lg rounded-xl bg-[var(--color-white)] p-6"><h2 className="mb-4 text-lg font-bold">Assign {selected.name}</h2><label className="space-y-1 text-sm"><span className="font-medium">Assigned user</span><input className={inputClass} value={assignee} onChange={(event) => setAssignee(event.target.value)} autoFocus /></label><div className="mt-5 flex justify-end gap-2"><Button type="button" variant="secondary" onClick={close}>{t('cancel')}</Button><Button type="submit">{t('confirm')}</Button></div></form></div>}
  </div>;
}

function MaintenancePage() {
  const { t } = useApp();
  const { showToast } = useToast();
  const { hasPermission } = useAuth();
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ type: 'inspection', description: '', performedBy: '', cost: '' });

  const load = () => setItems([...getEquipment()]);
  useEffect(() => {
    refreshEquipment().then(load).catch((error) => showToast(error.message, 'error'));
    window.addEventListener('rg:equipment-updated', load);
    return () => window.removeEventListener('rg:equipment-updated', load);
  }, [showToast]);

  const maintenanceCount = items.filter((item) => item.status === 'under_maintenance' || item.condition === 'under_repair').length;
  const close = () => { setSelected(null); setForm({ type: 'inspection', description: '', performedBy: '', cost: '' }); };
  const submit = async (event) => {
    event.preventDefault();
    if (!form.description.trim()) return showToast('Maintenance description is required.', 'error');
    const result = await addMaintenance(selected.id, form);
    if (!result.success) return showToast(result.error, 'error');
    showToast(t('equipmentRecordUpdated'), 'success');
    close();
  };
  const columns = [
    { key: 'assetNumber', header: t('assetNumber'), render: (item) => <span className="font-mono text-xs font-semibold">{item.assetNumber}</span> },
    { key: 'name', header: t('equipment') },
    { key: 'condition', header: t('condition'), render: (item) => <StatusBadge status={item.condition} /> },
    { key: 'status', header: t('status'), render: (item) => <StatusBadge status={item.status} /> },
    { key: 'lastMaintenance', header: 'Last maintenance', render: (item) => item.maintenanceRecords?.at(-1)?.description || 'No record' },
    { key: 'actions', header: t('actions'), render: (item) => hasPermission('equipment.maintenance') && <Button size="sm" variant="secondary" icon={Wrench} onClick={() => setSelected(item)}>Record maintenance</Button> },
  ];

  return <div className="space-y-6">
    <PageHeader title="Maintenance" description="Record repairs, inspections and service work for equipment." breadcrumb={[{ label: t('equipmentMis'), to: '/equipment' }, { label: 'Maintenance' }]} />
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3"><div className="rounded-xl border border-[var(--color-border-gray)] bg-[var(--color-white)] p-4"><p className="text-xs uppercase tracking-[0.12em] text-[var(--color-mid-gray)]">Needs attention</p><p className="mt-2 text-2xl font-bold">{maintenanceCount}</p></div><div className="rounded-xl border border-[var(--color-border-gray)] bg-[var(--color-white)] p-4"><p className="text-xs uppercase tracking-[0.12em] text-[var(--color-mid-gray)]">Total equipment</p><p className="mt-2 text-2xl font-bold">{items.length}</p></div></div>
    <div className="rounded-xl border border-[var(--color-border-gray)] bg-[var(--color-white)] p-4"><DataTable columns={columns} data={items} emptyState={<div className="p-8 text-center text-sm text-[var(--color-mid-gray)]"><Wrench className="mx-auto mb-2 h-8 w-8" />No equipment maintenance records found.</div>} /></div>
    {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><form onSubmit={submit} className="w-full max-w-lg rounded-xl bg-[var(--color-white)] p-6"><h2 className="mb-4 text-lg font-bold">Record maintenance: {selected.name}</h2><div className="space-y-3"><label className="space-y-1 text-sm"><span className="font-medium">Type</span><select className={inputClass} value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>{['inspection', 'repair', 'service', 'upgrade'].map((type) => <option key={type}>{type}</option>)}</select></label><label className="space-y-1 text-sm"><span className="font-medium">Description</span><textarea className={inputClass} rows="3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><label className="space-y-1 text-sm"><span className="font-medium">Performed by</span><input className={inputClass} value={form.performedBy} onChange={(event) => setForm({ ...form, performedBy: event.target.value })} /></label><label className="space-y-1 text-sm"><span className="font-medium">Cost</span><input className={inputClass} type="number" min="0" value={form.cost} onChange={(event) => setForm({ ...form, cost: event.target.value })} /></label></div><div className="mt-5 flex justify-end gap-2"><Button type="button" variant="secondary" onClick={close}>{t('cancel')}</Button><Button type="submit">{t('confirm')}</Button></div></form></div>}
  </div>;
}

export default function EquipmentOperations({ mode }) {
  return mode === 'maintenance' ? <MaintenancePage /> : <AssignmentPage />;
}
