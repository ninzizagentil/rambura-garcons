import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, PackagePlus } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import { Input, Select, Textarea } from '../../components/forms/FormField';
import Button from '../../components/common/Button';
import Alert from '../../components/feedback/Alert';
import { useToast } from '../../context/ToastContext';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { getItems, stockIn, refreshStock } from '../../services/stockService';
import { STOCK_TODAY as TODAY } from '../../data/stock';
import { logActivity } from '../../services/activityService';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { ROLES } from '../../data/roles';
import ViewOnlyBanner from '../../components/feedback/ViewOnlyBanner';



export default function StockIn() {
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
    quantity: '',
    date: TODAY,
    party: '',
    responsibleUser: user?.fullName || '',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const selectedItem = items.find((i) => i.id === form.itemId) || null;
  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const next = {};
    if (!form.itemId) next.itemId = 'Select an item.';
    const qty = Number(form.quantity);
    if (!form.quantity || Number.isNaN(qty) || qty <= 0) next.quantity = 'Enter a positive quantity.';
    if (!form.date) next.date = 'Date is required.';
    if (!form.party?.trim()) next.party = 'Source / Supplier is required.';
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
    const res = await stockIn(form);
    setSaving(false);
    if (!res.success) {
      setServerError(res.error);
      setStep('form');
      return;
    }
      setResult(res);
      setStep('success');
      showToast(`Stock In recorded for "${selectedItem.name}".`, 'success');
      addNotification({
        type: 'stock',
        message: `Stock In recorded: ${form.quantity} ${selectedItem.unit} of ${selectedItem.name}.`,
        to: '/stock/transactions',
      });
      logActivity({
        user: user?.fullName || 'Stock Manager',
        action: `Recorded Stock In: ${selectedItem.name} (+${form.quantity}${selectedItem.unit})`,
        module: 'Stock',
        status: 'success',
      });
    
  };

  const startAnother = () => {
    setForm({ itemId: '', quantity: '', date: TODAY, party: '', responsibleUser: user?.fullName || '', notes: '' });
    setErrors({});
    setServerError('');
    setResult(null);
    setStep('form');
  };

  if (viewOnly) {
    return (
      <div>
        <PageHeader title="Stock In" description="Record incoming stock for an item." breadcrumb={[{ label: 'Stock', to: '/stock' }, { label: 'Stock In' }]} />
        <ViewOnlyBanner module="Stock MIS" />
        <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-12 flex flex-col items-center text-center">
          <p className="text-sm text-[var(--color-mid-gray)]">Recording Stock In is reserved for the Stock Manager account.</p>
          <Button variant="secondary" className="mt-4" onClick={() => navigate('/stock')}>Back to Stock Dashboard</Button>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div>
        <PageHeader title="Stock In" breadcrumb={[{ label: 'Stock', to: '/stock' }, { label: 'Stock In' }]} />
        <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-12 flex flex-col items-center text-center">
          <CheckCircle2 className="w-12 h-12 text-[var(--color-status-green)] mb-4" aria-hidden="true" />
          <p className="font-display text-lg font-semibold text-[var(--color-dark-gray)]">Stock In Successful</p>
          <p className="text-sm text-[var(--color-mid-gray)] mt-1">
            +{form.quantity} {selectedItem?.unit} added to "{selectedItem?.name}". New quantity: {result?.newQuantity} {selectedItem?.unit}.
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
      <PageHeader title="Stock In" description="Record incoming stock for an item." breadcrumb={[{ label: 'Stock', to: '/stock' }, { label: 'Stock In' }]} />

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
              options={items.map((i) => ({ value: i.id, label: `${i.name} (${i.quantity} ${i.unit} in stock)` }))}
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Quantity" type="number" min="1" required value={form.quantity} onChange={update('quantity')} error={errors.quantity} />
              <Input label="Date" type="date" required value={form.date} onChange={update('date')} error={errors.date} />
            </div>
            <Input label="Source / Supplier" required value={form.party} onChange={update('party')} error={errors.party} placeholder="e.g. Kigali Grain Suppliers Ltd" />
            <Input label="Responsible User" required value={form.responsibleUser} onChange={update('responsibleUser')} error={errors.responsibleUser} />
            <Textarea label="Notes" value={form.notes} onChange={update('notes')} rows={3} />
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => navigate('/stock')}>Cancel</Button>
              <Button type="submit" variant="primary" icon={PackagePlus}>Continue</Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            {serverError && <Alert type="error">{serverError}</Alert>}
            <p className="text-sm text-[var(--color-dark-gray)]">Please confirm the details below:</p>
            <dl className="text-sm bg-[var(--color-off-white)] rounded-[var(--radius-control)] p-4 space-y-1.5">
              <div className="flex justify-between"><dt className="text-[var(--color-mid-gray)]">Item</dt><dd className="font-medium">{selectedItem?.name}</dd></div>
              <div className="flex justify-between"><dt className="text-[var(--color-mid-gray)]">Quantity</dt><dd className="font-medium">+{form.quantity} {selectedItem?.unit}</dd></div>
              <div className="flex justify-between"><dt className="text-[var(--color-mid-gray)]">Date</dt><dd className="font-medium">{form.date}</dd></div>
              <div className="flex justify-between"><dt className="text-[var(--color-mid-gray)]">Source / Supplier</dt><dd className="font-medium">{form.party}</dd></div>
              <div className="flex justify-between"><dt className="text-[var(--color-mid-gray)]">Responsible User</dt><dd className="font-medium">{form.responsibleUser}</dd></div>
              <div className="flex justify-between"><dt className="text-[var(--color-mid-gray)]">New Quantity</dt><dd className="font-medium">{(selectedItem?.quantity || 0) + Number(form.quantity)} {selectedItem?.unit}</dd></div>
            </dl>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setStep('form')} disabled={saving}>Back</Button>
              <Button variant="primary" onClick={handleConfirm} loading={saving}>Confirm Stock In</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
