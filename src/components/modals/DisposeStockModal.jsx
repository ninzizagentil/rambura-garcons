import { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from '../common/Button';
import Alert from '../feedback/Alert';
import { Select, Input, Textarea } from '../forms/FormField';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { disposeStock, disposeDamagedItem } from '../../services/stockService';
import { logActivity } from '../../services/activityService';
import { REMOVAL_REASONS, STOCK_TODAY } from '../../data/stock';

/**
 * DisposeStockModal — permanently removes quantity from active/damaged stock
 * and writes a record to the Removed/Disposed log. History is never deleted.
 *
 * Two modes:
 *  - `damagedRecord` supplied: disposing an already-reported damage record
 *    (quantity is fixed to the reported amount).
 *  - `item` supplied instead: direct disposal from active stock (expired,
 *    lost, obsolete, etc.) — quantity and reason are chosen here.
 */
export default function DisposeStockModal({ open, onClose, item, damagedRecord, defaultReason, onDisposed }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isDamagedFlow = !!damagedRecord;
  const target = damagedRecord || item;

  const [form, setForm] = useState({
    quantity: isDamagedFlow ? damagedRecord.quantity : '',
    reason: isDamagedFlow ? 'Damaged' : defaultReason || '',
    date: STOCK_TODAY,
    responsibleUser: user?.fullName || '',
    approvedBy: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        quantity: isDamagedFlow ? damagedRecord.quantity : '',
        reason: isDamagedFlow ? 'Damaged' : defaultReason || '',
        date: STOCK_TODAY,
        responsibleUser: user?.fullName || '',
        approvedBy: '',
        notes: '',
      });
      setErrors({});
      setServerError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, damagedRecord?.id, item?.id]);

  if (!target) return null;

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const next = {};
    if (!isDamagedFlow) {
      const qty = Number(form.quantity);
      if (!form.quantity || Number.isNaN(qty) || qty <= 0) next.quantity = 'Enter a positive quantity.';
      else if (qty > item.quantity) next.quantity = `Only ${item.quantity} ${item.unit} available.`;
      if (!form.reason) next.reason = 'Select a reason.';
      if (!form.responsibleUser?.trim()) next.responsibleUser = 'Responsible user is required.';
    }
    if (!form.approvedBy?.trim()) next.approvedBy = 'Approver is required.';
    if (!form.date) next.date = 'Date is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setServerError('');
    setTimeout(() => {
      const res = isDamagedFlow
        ? disposeDamagedItem({ damagedId: damagedRecord.id, approvedBy: form.approvedBy, notes: form.notes })
        : disposeStock({ itemId: item.id, ...form });
      setSaving(false);
      if (!res.success) {
        setServerError(res.error);
        return;
      }
      const name = target.itemName || target.name;
      showToast(`${name} moved to Removed / Disposed.`, 'success');
      logActivity({
        user: form.approvedBy,
        action: `Disposed stock: ${name} (${isDamagedFlow ? damagedRecord.quantity : form.quantity} ${target.unit})`,
        module: 'Stock',
        status: 'warning',
      });
      onDisposed?.();
      onClose();
    }, 400);
  };

  const name = target.itemName || target.name;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Dispose Stock — ${name}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="danger" onClick={handleSubmit} loading={saving}>Confirm Disposal</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {serverError && <Alert type="error">{serverError}</Alert>}
        <Alert type="warning" title="This action is permanent">
          Disposed stock is removed from usable inventory and recorded in the Removed / Disposed history — it cannot be undone.
        </Alert>

        {isDamagedFlow ? (
          <p className="text-sm text-[var(--color-dark-gray)]">
            Disposing <span className="font-semibold">{damagedRecord.quantity} {damagedRecord.unit}</span> reported as{' '}
            <span className="font-semibold">{damagedRecord.reason}</span> on {damagedRecord.date}.
          </p>
        ) : (
          <>
            <p className="text-sm text-[var(--color-mid-gray)]">
              Currently in stock: <span className="font-semibold text-[var(--color-dark-gray)]">{item.quantity} {item.unit}</span>
            </p>
            <Input
              label="Quantity to Remove"
              type="number"
              min="1"
              required
              value={form.quantity}
              onChange={update('quantity')}
              error={errors.quantity}
            />
            <Select
              label="Reason"
              required
              value={form.reason}
              onChange={update('reason')}
              error={errors.reason}
              options={REMOVAL_REASONS.map((r) => ({ value: r, label: r }))}
            />
            <Input label="Responsible User" required value={form.responsibleUser} onChange={update('responsibleUser')} error={errors.responsibleUser} />
          </>
        )}

        <Input label="Date" type="date" required value={form.date} onChange={update('date')} error={errors.date} />
        <Input label="Approved By" required value={form.approvedBy} onChange={update('approvedBy')} error={errors.approvedBy} placeholder="Name of approving manager" />
        <Textarea label="Notes" value={form.notes} onChange={update('notes')} placeholder="Optional details…" />
      </form>
    </Modal>
  );
}
