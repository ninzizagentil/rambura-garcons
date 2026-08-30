import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, ClipboardEdit } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import { Input, Select, Textarea } from '../../components/forms/FormField';
import Button from '../../components/common/Button';
import Alert from '../../components/feedback/Alert';
import { useToast } from '../../context/ToastContext';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { getItems, stockAdjustment, isLowStock, refreshStock } from '../../services/stockService';
import { STOCK_TODAY as TODAY, ADJUSTMENT_REASONS } from '../../data/stock';
import { logActivity } from '../../services/activityService';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { ROLES } from '../../data/roles';
import ViewOnlyBanner from '../../components/feedback/ViewOnlyBanner';

export default function StockAdjustment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const { viewOnly } = useModuleAccess(ROLES.STOCK_MANAGER);
  const [items, setItems] = useState(() => getItems());

  useEffect(() => {
    const refresh = () => setItems(getItems());
    window.addEventListener('rg:stock-updated', refresh);
    refreshStock().catch(() => {});
    return () => window.removeEventListener('rg:stock-updated', refresh);
  }, []);

  const [step, setStep] = useState('form'); // form | confirm | success
  const [form, setForm] = useState({
    itemId: searchParams.get('item') || '',
    physicalQuantity: '',
    reason: '',
    date: TODAY,
    responsibleUser: user?.fullName || '',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const selectedItem = items.find((i) => i.id === form.itemId) || null;
  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const difference =
    selectedItem && form.physicalQuantity !== '' && !Number.isNaN(Number(form.physicalQuantity))
      ? Number(form.physicalQuantity) - selectedItem.quantity
      : null;

  const validate = () => {
    const next = {};
    if (!form.itemId) next.itemId = 'Select an item.';
    const physical = Number(form.physicalQuantity);
    if (form.physicalQuantity === '' || Number.isNaN(physical) || physical < 0) next.physicalQuantity = 'Enter the counted physical quantity.';
    else if (selectedItem && physical === selectedItem.quantity) next.physicalQuantity = 'Physical quantity matches the system quantity — no adjustment needed.';
    if (!form.reason) next.reason = 'Select a reason for the adjustment.';
    if (!form.date) next.date = 'Date is required.';
    if (!form.responsibleUser?.trim()) next.responsibleUser = 'Responsible user is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleContinue = (e) => {
    e.preventDefault();
    if (validate()) setStep('confirm');
  };

  const handleConfirm = async () => {
    setSaving(true);
    setServerError('');
    const res = await stockAdjustment(form);
    setSaving(false);
    if (!res.success) {
      setServerError(res.error);
      setStep('form');
      return;
    }
      setResult(res);
      setStep('success');
      showToast(`Stock Adjustment recorded for "${selectedItem.name}".`, 'success');
      const nowLow = isLowStock({ ...selectedItem, quantity: res.newQuantity });
      if (nowLow) {
        addNotification({
          type: 'low-stock',
          message: `${selectedItem.name} is below minimum stock level after adjustment (${res.newQuantity} ${selectedItem.unit} left).`,
          to: '/stock/low-stock',
        });
      }
      logActivity({
        user: user?.fullName || 'Stock Manager',
        action: `Recorded Stock Adjustment: ${selectedItem.name} (${res.difference > 0 ? '+' : ''}${res.difference}${selectedItem.unit}) — ${form.reason}`,
        module: 'Stock',
        status: nowLow ? 'warning' : 'success',
      });
    
  };

  const startAnother = () => {
    setForm({ itemId: '', physicalQuantity: '', reason: '', date: TODAY, responsibleUser: user?.fullName || '', notes: '' });
    setErrors({});
    setServerError('');
    setResult(null);
    setStep('form');
  };

  if (viewOnly) {
    return (
      <div>
        <PageHeader title="Stock Adjustment" description="Reconcile system quantity against a physical count." breadcrumb={[{ label: 'Stock', to: '/stock' }, { label: 'Stock Adjustment' }]} />
        <ViewOnlyBanner module="Stock MIS" />
        <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-12 flex flex-col items-center text-center">
          <p className="text-sm text-[var(--color-mid-gray)]">Recording Stock Adjustments is reserved for the Stock Manager account.</p>
          <Button variant="secondary" className="mt-4" onClick={() => navigate('/stock')}>Back to Stock Dashboard</Button>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div>
        <PageHeader title="Stock Adjustment" breadcrumb={[{ label: 'Stock', to: '/stock' }, { label: 'Stock Adjustment' }]} />
        <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-12 flex flex-col items-center text-center">
          <CheckCircle2 className="w-12 h-12 text-[var(--color-status-green)] mb-4" aria-hidden="true" />
          <p className="font-display text-lg font-semibold text-[var(--color-dark-gray)]">Stock Adjustment Recorded</p>
          <p className="text-sm text-[var(--color-mid-gray)] mt-1">
            "{selectedItem?.name}" adjusted by {result?.difference > 0 ? '+' : ''}{result?.difference} {selectedItem?.unit}. New quantity: {result?.newQuantity} {selectedItem?.unit}.
          </p>
          <div className="flex gap-3 mt-6">
            <Button variant="secondary" onClick={() => navigate(`/stock/items/${form.itemId}`)}>View Item Details</Button>
            <Button variant="outline" onClick={() => navigate('/stock/transactions')}>View Transactions</Button>
            <Button variant="primary" onClick={startAnother}>Record Another</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Stock Adjustment" description="Reconcile system quantity against a physical count." breadcrumb={[{ label: 'Stock', to: '/stock' }, { label: 'Stock Adjustment' }]} />

      <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-6 max-w-2xl">
        {step === 'form' ? (
          <form onSubmit={handleContinue} noValidate className="space-y-4">
            {serverError && <Alert type="error">{serverError}</Alert>}
            <Select
              label="Item"
              required
              value={form.itemId}
              onChange={update('itemId')}
              error={errors.itemId}
              options={items.map((i) => ({ value: i.id, label: `${i.name} (${i.quantity} ${i.unit} in system)` }))}
            />
            {selectedItem && (
              <div className="grid sm:grid-cols-2 gap-4 -mt-1">
                <div className="rounded-[var(--radius-control)] bg-[var(--color-off-white)] px-3.5 py-2.5 text-sm">
                  <span className="text-[var(--color-mid-gray)]">System Quantity: </span>
                  <span className="font-semibold text-[var(--color-dark-gray)]">{selectedItem.quantity} {selectedItem.unit}</span>
                </div>
                {difference !== null && (
                  <div className="rounded-[var(--radius-control)] bg-[var(--color-off-white)] px-3.5 py-2.5 text-sm">
                    <span className="text-[var(--color-mid-gray)]">Difference: </span>
                    <span className={`font-semibold ${difference > 0 ? 'text-[var(--color-status-green)]' : difference < 0 ? 'text-[var(--color-status-red)]' : 'text-[var(--color-dark-gray)]'}`}>
                      {difference > 0 ? '+' : ''}{difference} {selectedItem.unit}
                    </span>
                  </div>
                )}
              </div>
            )}
            <Input label="Physical Quantity (Counted)" type="number" min="0" required value={form.physicalQuantity} onChange={update('physicalQuantity')} error={errors.physicalQuantity} />
            <div className="grid sm:grid-cols-2 gap-4">
              <Select label="Reason" required value={form.reason} onChange={update('reason')} error={errors.reason} options={ADJUSTMENT_REASONS.map((r) => ({ value: r, label: r }))} />
              <Input label="Date" type="date" required value={form.date} onChange={update('date')} error={errors.date} />
            </div>
            <Input label="Responsible User" required value={form.responsibleUser} onChange={update('responsibleUser')} error={errors.responsibleUser} />
            <Textarea label="Notes" value={form.notes} onChange={update('notes')} rows={3} />
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => navigate('/stock')}>Cancel</Button>
              <Button type="submit" variant="primary" icon={ClipboardEdit}>Continue</Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            {serverError && <Alert type="error">{serverError}</Alert>}
            <p className="text-sm text-[var(--color-dark-gray)]">Please confirm the details below:</p>
            <dl className="text-sm bg-[var(--color-off-white)] rounded-[var(--radius-control)] p-4 space-y-1.5">
              <div className="flex justify-between"><dt className="text-[var(--color-mid-gray)]">Item</dt><dd className="font-medium">{selectedItem?.name}</dd></div>
              <div className="flex justify-between"><dt className="text-[var(--color-mid-gray)]">System Quantity</dt><dd className="font-medium">{selectedItem?.quantity} {selectedItem?.unit}</dd></div>
              <div className="flex justify-between"><dt className="text-[var(--color-mid-gray)]">Physical Quantity</dt><dd className="font-medium">{form.physicalQuantity} {selectedItem?.unit}</dd></div>
              <div className="flex justify-between"><dt className="text-[var(--color-mid-gray)]">Difference</dt><dd className={`font-medium ${difference > 0 ? 'text-[var(--color-status-green)]' : 'text-[var(--color-status-red)]'}`}>{difference > 0 ? '+' : ''}{difference} {selectedItem?.unit}</dd></div>
              <div className="flex justify-between"><dt className="text-[var(--color-mid-gray)]">Reason</dt><dd className="font-medium">{form.reason}</dd></div>
              <div className="flex justify-between"><dt className="text-[var(--color-mid-gray)]">Responsible User</dt><dd className="font-medium">{form.responsibleUser}</dd></div>
            </dl>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setStep('form')} disabled={saving}>Back</Button>
              <Button variant="primary" onClick={handleConfirm} loading={saving}>Confirm Adjustment</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
