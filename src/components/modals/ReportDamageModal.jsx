import { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from '../common/Button';
import Alert from '../feedback/Alert';
import { Select, Input, Textarea } from '../forms/FormField';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { reportDamage } from '../../services/stockService';
import { logActivity } from '../../services/activityService';
import { DAMAGE_REASONS, STOCK_TODAY } from '../../data/stock';

/**
 * ReportDamageModal — logs damaged stock against a specific item.
 * `item` must be provided (opened from an item row); quantity is deducted
 * from usable stock immediately and always creates an auditable record.
 */
export default function ReportDamageModal({ open, onClose, item, onReported }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState({ quantity: '', reason: '', date: STOCK_TODAY, reportedBy: user?.fullName || '', notes: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm({ quantity: '', reason: '', date: STOCK_TODAY, reportedBy: user?.fullName || '', notes: '' });
    setErrors({});
    setServerError('');
  }, [open, user]);

  if (!item) return null;

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const next = {};
    const qty = Number(form.quantity);
    if (!form.quantity || Number.isNaN(qty) || qty <= 0) next.quantity = 'Enter a positive quantity.';
    else if (qty > item.quantity) next.quantity = `Only ${item.quantity} ${item.unit} available.`;
    if (!form.reason) next.reason = 'Select a reason.';
    if (!form.date) next.date = 'Date is required.';
    if (!form.reportedBy?.trim()) next.reportedBy = 'Reported by is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setServerError('');
    setTimeout(() => {
      const res = reportDamage({ itemId: item.id, ...form });
      setSaving(false);
      if (!res.success) {
        setServerError(res.error);
        return;
      }
      showToast(`Damage reported for "${item.name}".`, 'success');
      logActivity({
        user: form.reportedBy,
        action: `Reported damage: ${item.name} (${form.quantity} ${item.unit}, ${form.reason})`,
        module: 'Stock',
        status: 'warning',
      });
      onReported?.();
      onClose();
    }, 400);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Report Damage — ${item.name}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="danger" onClick={handleSubmit} loading={saving}>Report Damage</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {serverError && <Alert type="error">{serverError}</Alert>}
        <p className="text-sm text-[var(--color-mid-gray)]">
          Currently in stock: <span className="font-semibold text-[var(--color-dark-gray)]">{item.quantity} {item.unit}</span>
        </p>
        <Input
          label="Quantity Damaged"
          type="number"
          min="1"
          required
          value={form.quantity}
          onChange={update('quantity')}
          error={errors.quantity}
          placeholder={`e.g. 2 ${item.unit}`}
        />
        <Select
          label="Reason"
          required
          value={form.reason}
          onChange={update('reason')}
          error={errors.reason}
          options={DAMAGE_REASONS.map((r) => ({ value: r, label: r }))}
        />
        <Input label="Date" type="date" required value={form.date} onChange={update('date')} error={errors.date} />
        <Input label="Reported By" required value={form.reportedBy} onChange={update('reportedBy')} error={errors.reportedBy} />
        <Textarea label="Notes" value={form.notes} onChange={update('notes')} placeholder="Optional details…" />
      </form>
    </Modal>
  );
}
