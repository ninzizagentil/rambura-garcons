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
import { useApp } from '../../context/AppContext';

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
  const { t } = useApp();
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
      if (!form.quantity || Number.isNaN(qty) || qty <= 0) next.quantity = t('positiveQuantityRequired');
      else if (qty > item.quantity) next.quantity = t('insufficientStock', { quantity: item.quantity, unit: item.unit });
      if (!form.reason) next.reason = t('reason');
      if (!form.responsibleUser?.trim()) next.responsibleUser = t('responsibleUserRequired');
    }
    if (!form.approvedBy?.trim()) next.approvedBy = t('responsibleUserRequired');
    if (!form.date) next.date = t('dateRequired');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setServerError('');
    const res = isDamagedFlow
      ? await disposeDamagedItem({ damagedId: damagedRecord.id, approvedBy: form.approvedBy, notes: form.notes })
      : await disposeStock({ itemId: item.id, ...form });
    setSaving(false);
    if (!res.success) {
      setServerError(res.error);
      return;
    }
    const name = target.itemName || target.name;
    showToast(t('removedDisposed'), 'success');
    logActivity({
      user: form.approvedBy,
      action: `Disposed stock: ${name} (${isDamagedFlow ? damagedRecord.quantity : form.quantity} ${target.unit})`,
      module: 'Stock',
      status: 'warning',
    });
    onDisposed?.();
    onClose();
  };

  const name = target.itemName || target.name;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${t('disposeStock')} — ${name}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>{t('cancel')}</Button>
          <Button variant="danger" onClick={handleSubmit} loading={saving}>{t('confirmDisposal')}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {serverError && <Alert type="error">{serverError}</Alert>}
        <Alert type="warning" title={t('permanentAction')}>
          {t('permanentWarning')}
        </Alert>

        {isDamagedFlow ? (
          <p className="text-sm text-[var(--color-dark-gray)]">
            Disposing <span className="font-semibold">{damagedRecord.quantity} {damagedRecord.unit}</span> reported as{' '}
            <span className="font-semibold">{t(`damageReason.${damagedRecord.reason}`)}</span> on {damagedRecord.date}.
          </p>
        ) : (
          <>
            <p className="text-sm text-[var(--color-mid-gray)]">
              {t('currentlyInStock')}: <span className="font-semibold text-[var(--color-dark-gray)]">{item.quantity} {item.unit}</span>
            </p>
            <Input
              label={t('quantityToRemove')}
              type="number"
              min="1"
              required
              value={form.quantity}
              onChange={update('quantity')}
              error={errors.quantity}
            />
            <Select
              label={t('reason')}
              required
              value={form.reason}
              onChange={update('reason')}
              error={errors.reason}
              options={REMOVAL_REASONS.map((r) => ({ value: r, label: t(`removalReason.${r}`) }))}
            />
            <Input label={t('responsibleUser')} required value={form.responsibleUser} onChange={update('responsibleUser')} error={errors.responsibleUser} />
          </>
        )}

        <Input label={t('date')} type="date" required value={form.date} onChange={update('date')} error={errors.date} />
        <Input label={t('approvedBy')} required value={form.approvedBy} onChange={update('approvedBy')} error={errors.approvedBy} placeholder={t('nameOfApprovingManager')} />
        <Textarea label={t('notes')} value={form.notes} onChange={update('notes')} placeholder={t('optionalDetails')} />
      </form>
    </Modal>
  );
}
