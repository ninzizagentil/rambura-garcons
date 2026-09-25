import { useState } from 'react';
import Modal from './Modal';
import Button from '../common/Button';
import Alert from '../feedback/Alert';
import { Select, Input, Textarea } from '../forms/FormField';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { reportDamage } from '../../services/stockService';
import { logActivity } from '../../services/activityService';
import { DAMAGE_REASONS, STOCK_TODAY } from '../../data/stock';
import { useApp } from '../../context/AppContext';
import { applyKindErrors } from '../../utils/validators';

/**
 * ReportDamageModal — logs damaged stock against a specific item.
 * `item` must be provided (opened from an item row); quantity is deducted
 * from usable stock immediately and always creates an auditable record.
 */
// What each field may contain (letters only, numbers only, phone, email…) — see utils/validators.js
const FIELD_KINDS = {
  quantity: 'decimal',
  reportedBy: 'name',
};

export default function ReportDamageModal({ open, onClose, item, onReported }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { t } = useApp();

  const [form, setForm] = useState({ quantity: '', reason: '', date: STOCK_TODAY, reportedBy: user?.fullName || '', notes: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  // Reset the form each time the modal opens (or is opened for another item).
  // Done during render instead of in an effect — see
  // https://react.dev/learn/you-might-not-need-an-effect
  const [resetKey, setResetKey] = useState(null);
  const nextResetKey = open ? (item?.id ?? item?._id ?? 'item') : null;
  if (open && resetKey !== nextResetKey) {
    setResetKey(nextResetKey);
    setForm({ quantity: '', reason: '', date: STOCK_TODAY, reportedBy: user?.fullName || '', notes: '' });
    setErrors({});
    setServerError('');
  } else if (!open && resetKey !== null) {
    setResetKey(null);
  }

  if (!item) return null;

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const next = {};
    const qty = Number(form.quantity);
    if (!form.quantity || Number.isNaN(qty) || qty <= 0) next.quantity = t('positiveQuantityRequired');
    else if (qty > item.quantity) next.quantity = t('insufficientStock', { quantity: item.quantity, unit: item.unit });
    if (!form.reason) next.reason = t('reason');
    if (!form.date) next.date = t('dateRequired');
    if (!form.reportedBy?.trim()) next.reportedBy = t('responsibleUserRequired');
    applyKindErrors(next, form, FIELD_KINDS, t);
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setServerError('');
    const res = await reportDamage({ itemId: item.id, ...form });
    setSaving(false);
    if (!res.success) {
      setServerError(res.error);
      return;
    }
    showToast(t('reportDamage'), 'success');
    logActivity({
      user: form.reportedBy,
      action: `Reported damage: ${item.name} (${form.quantity} ${item.unit}, ${form.reason})`,
      module: 'Stock',
      status: 'warning',
    });
    onReported?.();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${t('reportDamage')} — ${item.name}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>{t('cancel')}</Button>
          <Button variant="danger" onClick={handleSubmit} loading={saving}>{t('reportDamage')}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {serverError && <Alert type="error">{serverError}</Alert>}
        <p className="text-sm text-[var(--color-mid-gray)]">
          {t('currentlyInStock')}: <span className="font-semibold text-[var(--color-dark-gray)]">{item.quantity} {item.unit}</span>
        </p>
        <Input kind="decimal"
          label={t('quantityDamaged')}
          type="number"
          min="1"
          required
          value={form.quantity}
          onChange={update('quantity')}
          error={errors.quantity}
          placeholder={`e.g. 2 ${item.unit}`}
        />
        <Select
          label={t('reason')}
          required
          value={form.reason}
          onChange={update('reason')}
          error={errors.reason}
          options={DAMAGE_REASONS.map((r) => ({ value: r, label: t(`damageReason.${r}`) }))}
        />
        <Input label={t('date')} type="date" required value={form.date} onChange={update('date')} error={errors.date} />
        <Input kind="name" label={t('reportedBy')} required value={form.reportedBy} onChange={update('reportedBy')} error={errors.reportedBy} />
        <Textarea label={t('notes')} value={form.notes} onChange={update('notes')} placeholder={t('optionalDetails')} />
      </form>
    </Modal>
  );
}
