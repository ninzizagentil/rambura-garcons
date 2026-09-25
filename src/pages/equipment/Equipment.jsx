import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, FileBarChart, Laptop, Plus, Pencil, Printer, Trash2, UserCheck, UserMinus, Wrench } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import DataTable from '../../components/tables/DataTable';
import RowActionMenu from '../../components/tables/RowActionMenu';
import { StatusBadge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { KIND_INPUT_PROPS, applyKindErrors, sanitize, validateField } from '../../utils/validators';
import { getEquipment, refreshEquipment, createEquipment, updateEquipment, deleteEquipment, assignEquipment, returnEquipment, addMaintenance } from '../../services/equipmentService';
import { exportToCSV } from '../../utils/export';
import { printReport } from '../../utils/print';
import { useNavigate } from 'react-router-dom';

// What each equipment field may contain — see utils/validators.js
const EQUIPMENT_KINDS = { assetNumber: 'code', name: 'alnum', brand: 'alnum', model: 'alnum', serialNumber: 'code', location: 'alnum' };
const EMPTY = { assetNumber: '', name: '', type: 'laptop', brand: '', model: '', serialNumber: '', location: '', condition: 'good', purchaseDate: '', warrantyExpiry: '', notes: '' };
const types = ['laptop', 'desktop', 'printer', 'projector', 'network', 'electrical_material', 'other'];
const conditions = ['new', 'good', 'fair', 'damaged', 'under_repair', 'retired'];
const inputClass = 'w-full rounded-lg border border-[var(--color-border-gray)] bg-[var(--color-white)] px-3 py-2 text-sm text-[var(--color-dark-gray)]';

function Field({ label, value, onChange, type = 'text', options, kind, required = false, maxLength }) {
  return <label className="space-y-1 text-sm"><span className="font-medium text-[var(--color-dark-gray)]">{label}{required && <span className="ml-1 text-[var(--color-status-red)]">*</span>}</span>{options ? <select required={required} className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>{options.map((option) => <option key={option} value={option}>{option.replace('_', ' ')}</option>)}</select> : <input required={required} maxLength={maxLength} className={inputClass} type={kind ? KIND_INPUT_PROPS[kind].type : type} inputMode={kind ? KIND_INPUT_PROPS[kind].inputMode : undefined} value={value || ''} onChange={(e) => onChange(kind ? sanitize(kind, e.target.value) : e.target.value)} />}</label>;
}

export default function Equipment() {
  const { showToast } = useToast();
  const { t } = useApp();
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const canOperate = (permission) => hasPermission(permission);
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [openForm, setOpenForm] = useState(searchParams.get('new') === '1');
  const statusFilter = searchParams.get('status');
  const conditionFilter = searchParams.get('condition');
  const [actionItem, setActionItem] = useState(null);
  const [action, setAction] = useState('assign');
  const [assignee, setAssignee] = useState('');
  const [maintenance, setMaintenance] = useState({ type: 'inspection', description: '', cost: '', performedBy: '', nextDueDate: '' });

  const load = () => setItems([...getEquipment()]);
  useEffect(() => { refreshEquipment().then(load).catch((error) => showToast(error.message, 'error')); const handler = () => load(); window.addEventListener('rg:equipment-updated', handler); return () => window.removeEventListener('rg:equipment-updated', handler); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const stats = useMemo(() => {
    const total = items.length;
    const assigned = items.filter((item) => item.status === 'assigned').length;
    const available = items.filter((item) => item.status === 'available').length;
    const maintenance = items.filter((item) => item.status === 'under_maintenance' || item.condition === 'under_repair').length;
    return { total, assigned, available, maintenance };
  }, [items]);
  const closeForm = () => { setOpenForm(false); setEditing(null); setForm(EMPTY); if (searchParams.get('new')) { const next = new URLSearchParams(searchParams); next.delete('new'); setSearchParams(next, { replace: true }); } };
  const submit = async (event) => {
    event.preventDefault();
    const requiredFields = ['assetNumber', 'name', 'type', 'location'];
    const missingField = requiredFields.find((field) => !String(form[field] || '').trim());
    if (missingField) return showToast(t('equipmentRequiredFields'), 'error');
    const problem = Object.values(applyKindErrors({}, form, EQUIPMENT_KINDS, t))[0];
    if (problem) return showToast(problem, 'error');
    if (form.purchaseDate && Number.isNaN(new Date(form.purchaseDate).getTime())) return showToast(t('validPurchaseDate'), 'error');
    if (form.warrantyExpiry && Number.isNaN(new Date(form.warrantyExpiry).getTime())) return showToast(t('validWarrantyExpiry'), 'error');
    if (form.purchaseDate && form.warrantyExpiry && new Date(form.warrantyExpiry) < new Date(form.purchaseDate)) return showToast(t('warrantyBeforePurchase'), 'error');
    const result = editing ? await updateEquipment(editing.id, form) : await createEquipment(form);
    if (!result.success) return showToast(result.error, 'error');
    showToast(editing ? t('equipmentUpdated') : t('equipmentRegistered'), 'success');
    closeForm();
  };
  const openEdit = (item) => { setEditing(item); setForm({ ...EMPTY, ...item, purchaseDate: item.purchaseDate?.slice(0, 10) || '', warrantyExpiry: item.warrantyExpiry?.slice(0, 10) || '' }); setOpenForm(true); };
  const runAction = async (event) => { event.preventDefault(); const actionProblem = action === 'assign' ? validateField('name', assignee, t) : action === 'maintenance' ? Object.values(applyKindErrors({}, maintenance, { performedBy: 'name', cost: 'decimal' }, t))[0] : ''; if (actionProblem) return showToast(actionProblem, 'error'); let result; if (action === 'assign') result = await assignEquipment(actionItem.id, { userName: assignee }); else if (action === 'return') result = await returnEquipment(actionItem.id); else result = await addMaintenance(actionItem.id, maintenance); if (!result.success) return showToast(result.error, 'error'); showToast(t('equipmentRecordUpdated'), 'success'); setActionItem(null); setAssignee(''); setMaintenance({ type: 'inspection', description: '', cost: '', performedBy: '', nextDueDate: '' }); };
  const activeFilter = statusFilter ? { key: 'status', value: statusFilter } : conditionFilter ? { key: 'condition', value: conditionFilter } : null;
  const clearFilter = () => { const next = new URLSearchParams(searchParams); next.delete('status'); next.delete('condition'); setSearchParams(next, { replace: true }); };
  // Note: `statusFilter`/`conditionFilter` are plain strings read from
  // `searchParams` (a mutable URLSearchParams instance from react-router).
  // The React Compiler can't prove that a mutable object's derived values
  // stay stable, so it skips memoizing this hook — the memoization itself
  // is still correct and safe since we never mutate `searchParams` here.
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const filteredItems = useMemo(() => {
    if (statusFilter) return items.filter((item) => item.status === statusFilter);
    if (conditionFilter) return items.filter((item) => item.condition === conditionFilter);
    return items;
  }, [items, statusFilter, conditionFilter]); // eslint-disable-line react-hooks/preserve-manual-memoization -- see note above; searchParams-derived strings, never mutated here
  const reportColumns = [
    { key: 'assetNumber', header: t('assetNumber') },
    { key: 'name', header: t('equipment') },
    { key: 'type', header: t('type'), value: (item) => item.type?.replaceAll('_', ' ') || 'other' },
    { key: 'location', header: t('location') },
    { key: 'condition', header: t('condition') },
    { key: 'status', header: t('status') },
    { key: 'assignedTo', header: t('assignedTo'), value: (item) => item.currentAssignee?.userName || t('unassigned') },
  ];
  const handleExport = () => {
    exportToCSV('equipment-records', reportColumns, filteredItems);
    showToast(t('exportCsv'), 'success');
  };
  const handlePrint = () => {
    const opened = printReport(t('equipmentReport'), reportColumns, filteredItems);
    if (opened) showToast(t('printReportOpened'), 'success');
    else showToast(t('enablePopupsToPrint'), 'error');
  };
  const columns = [
    { key: 'assetNumber', header: t('assetNumber') },
    { key: 'name', header: t('equipment') },
    { key: 'type', header: t('type') },
    { key: 'location', header: t('location') },
    { key: 'condition', header: t('condition'), render: (item) => <StatusBadge status={item.condition} /> },
    { key: 'status', header: t('status'), render: (item) => <StatusBadge status={item.status} /> },
    { key: 'currentAssignee', header: t('assignedTo'), render: (item) => item.currentAssignee?.userName || t('unassigned') },
    { key: 'actions', header: t('actions'), render: (item) => (
      <RowActionMenu
        label={t('actions')}
        items={[
          canOperate('equipment.update') && { label: t('editEquipmentAria'), icon: Pencil, onClick: () => openEdit(item) },
          canOperate('equipment.assign') && { label: item.status === 'assigned' ? t('returnEquipment') : t('assignEquipment'), icon: item.status === 'assigned' ? UserMinus : UserCheck, onClick: () => { setActionItem(item); setAction(item.status === 'assigned' ? 'return' : 'assign'); } },
          canOperate('equipment.maintenance') && { label: t('recordMaintenance'), icon: Wrench, onClick: () => { setActionItem(item); setAction('maintenance'); } },
          canOperate('equipment.delete') && { label: t('archiveEquipment'), icon: Trash2, tone: 'danger', onClick: async () => { const result = await deleteEquipment(item.id); if (!result.success) showToast(result.error, 'error'); else showToast(t('equipmentArchived'), 'success'); } },
        ]}
      />
    ) },
  ];
  return <div className="space-y-6"><PageHeader title={t('equipmentMis')} description={t('equipmentMisDescription')} breadcrumb={[{ label: t('schoolModules'), to: '/equipment' }, { label: t('equipmentMis') }]} actions={<div className="flex flex-wrap gap-2">
    <Button variant="secondary" icon={Download} onClick={handleExport} disabled={!filteredItems.length}>{t('csv')}</Button>
    <Button variant="secondary" icon={Printer} onClick={handlePrint} disabled={!filteredItems.length}>{t('print')}</Button>
    <Button variant="secondary" icon={FileBarChart} onClick={() => navigate('/equipment/reports')}>{t('reports')}</Button>
    {canOperate('equipment.create') && <Button icon={Plus} onClick={() => { setEditing(null); setForm(EMPTY); setOpenForm(true); }}>{t('registerEquipment')}</Button>}
  </div>} />
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[[t('total'), stats.total], [t('available'), stats.available], [t('assigned'), stats.assigned], [t('maintenance'), stats.maintenance]].map(([label, value]) => <div key={label} className="rounded-xl border border-[var(--color-border-gray)] bg-[var(--color-white)] p-4"><p className="text-xs uppercase tracking-[0.12em] text-[var(--color-mid-gray)]">{label}</p><p className="mt-2 text-2xl font-bold text-[var(--color-dark-gray)]">{value}</p></div>)}</div>
    <div className="rounded-xl border border-[var(--color-border-gray)] bg-[var(--color-white)] p-4"><div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-mid-gray)]">{t('assetRegister')}</p><h3 className="mt-1 text-lg font-bold text-[var(--color-dark-gray)]">{t('equipmentList')}</h3></div>{activeFilter && <button type="button" onClick={clearFilter} className="flex items-center gap-1.5 rounded-full border border-[var(--color-border-gray)] bg-[var(--color-soft-gray)] px-3 py-1 text-xs font-semibold text-[var(--color-dark-gray)]">{t('filtered')}: {activeFilter.value.replace('_', ' ')} <span aria-hidden="true">×</span></button>}</div><DataTable columns={columns} data={filteredItems} emptyState={<div className="p-8 text-center text-sm text-[var(--color-mid-gray)]"><Laptop className="mx-auto mb-2 h-8 w-8" />{activeFilter ? t('noEquipmentWithStatus', { status: activeFilter.value.replace('_', ' ') }) : t('noEquipmentRegistered')}</div>} /></div>
    {openForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><form onSubmit={submit} className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-[var(--color-white)] p-6"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-bold">{editing ? t('editEquipment') : t('registerEquipment')}</h2><button type="button" onClick={closeForm} aria-label={t('closeModal')}>X</button></div><div className="grid gap-4 sm:grid-cols-2">{[[t('assetNumber'),'assetNumber','code', true, 120],[t('name'),'name','alnum', true, 160],[t('brand'),'brand','alnum', false, 100],[t('model'),'model','alnum', false, 100],[t('serialNumber'),'serialNumber','code', false, 120],[t('location'),'location','alnum', true, 160]].map(([label, key, kind, required, maxLength]) => <Field key={key} kind={kind} required={required} maxLength={maxLength} label={label} value={form[key]} onChange={(value) => setForm({ ...form, [key]: value })} />)}<Field label={t('type')} required value={form.type} options={types} onChange={(value) => setForm({ ...form, type: value })} /><Field label={t('condition')} value={form.condition} options={conditions} onChange={(value) => setForm({ ...form, condition: value })} /><Field label={t('purchaseDate')} type="date" value={form.purchaseDate} onChange={(value) => setForm({ ...form, purchaseDate: value })} /><Field label={t('warrantyExpiry')} type="date" value={form.warrantyExpiry} onChange={(value) => setForm({ ...form, warrantyExpiry: value })} /></div><label className="mt-4 block text-sm font-medium">{t('notes')}<textarea maxLength={2000} className={`${inputClass} mt-1`} rows="3" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label><div className="mt-5 flex justify-end gap-2"><Button type="button" variant="secondary" onClick={closeForm}>{t('cancel')}</Button><Button type="submit">{t('saveEquipment')}</Button></div></form></div>}
    {actionItem && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><form onSubmit={runAction} className="w-full max-w-lg rounded-xl bg-[var(--color-white)] p-6"><h2 className="mb-4 text-lg font-bold">{action === 'assign' ? t('assignEquipment') : action === 'return' ? t('returnEquipment') : t('recordMaintenance')}</h2>{action === 'assign' && <Field label={t('assignedUser')} kind="name" value={assignee} onChange={setAssignee} />}{action === 'maintenance' && <div className="space-y-3"><Field label={t('type')} value={maintenance.type} options={['inspection', 'repair', 'service', 'upgrade']} onChange={(value) => setMaintenance({ ...maintenance, type: value })} /><Field label={t('description')} value={maintenance.description} onChange={(value) => setMaintenance({ ...maintenance, description: value })} /><Field label={t('performedBy')} kind="name" value={maintenance.performedBy} onChange={(value) => setMaintenance({ ...maintenance, performedBy: value })} /><Field label={t('cost')} kind="decimal" value={maintenance.cost} onChange={(value) => setMaintenance({ ...maintenance, cost: value })} /></div>}<div className="mt-5 flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setActionItem(null)}>{t('cancel')}</Button><Button type="submit">{t('confirm')}</Button></div></form></div>}
  </div>;
}
