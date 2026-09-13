import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowLeftRight } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import { Input, Select, Textarea } from '../../components/forms/FormField';
import Button from '../../components/common/Button';
import Alert from '../../components/feedback/Alert';
import { useToast } from '../../context/ToastContext';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { getItems, refreshStock, stockTransfer } from '../../services/stockService';
import { STOCK_TODAY as TODAY, STOCK_LOCATIONS, TRANSFER_REASONS } from '../../data/stock';
import { logActivity } from '../../services/activityService';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { ROLES } from '../../data/roles';
import ViewOnlyBanner from '../../components/feedback/ViewOnlyBanner';
import { useApp } from '../../context/AppContext';

export default function StockTransfer() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const { viewOnly } = useModuleAccess(ROLES.STOCK_MANAGER);
  const { t } = useApp();

  const [items, setItems] = useState(() => getItems());
  useEffect(() => {
    const refresh = () => setItems([...getItems()]);
    window.addEventListener('rg:stock-updated', refresh);
    refreshStock().catch(() => {});
    return () => window.removeEventListener('rg:stock-updated', refresh);
  }, []);

  const [step, setStep] = useState('form'); // form | confirm | success
  const [form, setForm] = useState({
    itemId: searchParams.get('item') || '',
    quantity: '',
    fromLocation: '',
    toLocation: '',
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
  const update = (field) => (e) => {
    const value = e.target.value;
    setForm((f) => {
      // Selecting an item defaults "From Location" to where it's currently stored.
      if (field === 'itemId') {
        const item = items.find((i) => i.id === value);
        return { ...f, itemId: value, fromLocation: item?.location || '' };
      }
      return { ...f, [field]: value };
    });
  };

  const validate = () => {
    const next = {};
    if (!form.itemId) next.itemId = t('selectAnItem');
    const qty = Number(form.quantity);
    if (!form.quantity || Number.isNaN(qty) || qty <= 0) next.quantity = t('positiveQuantityRequired');
    else if (selectedItem && qty > selectedItem.quantity) next.quantity = t('insufficientStock', { quantity: selectedItem.quantity, unit: selectedItem.unit });
    if (!form.fromLocation) next.fromLocation = t('sourceLocationRequired');
    if (!form.toLocation) next.toLocation = t('destinationLocationRequired');
    if (form.fromLocation && form.toLocation && form.fromLocation === form.toLocation) next.toLocation = t('destinationMustDiffer');
    if (!form.date) next.date = t('dateRequired');
    if (!form.responsibleUser?.trim()) next.responsibleUser = t('responsibleUserRequired');
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
    const res = await stockTransfer(form);
    setSaving(false);
    if (!res.success) {
      setServerError(res.error);
      setStep('form');
      return;
    }
      setStep('success');
      showToast(t('transferRecordedFor', { name: selectedItem.name }), 'success');
      addNotification({
        type: 'stock',
        message: t('transferNotification', { quantity: form.quantity, unit: t(`stockUnit.${selectedItem.unit}`), name: selectedItem.name, from: t(`stockLocation.${form.fromLocation}`), to: t(`stockLocation.${form.toLocation}`) }),
        to: '/stock/transactions',
      });
      logActivity({
        user: user?.fullName || 'Stock Manager',
        action: t('recordedTransferActivity', { name: selectedItem.name, quantity: form.quantity, unit: t(`stockUnit.${selectedItem.unit}`), from: t(`stockLocation.${form.fromLocation}`), to: t(`stockLocation.${form.toLocation}`) }),
        module: 'Stock',
        status: 'success',
      });
    
  };

  const startAnother = () => {
    setForm({ itemId: '', quantity: '', fromLocation: '', toLocation: '', reason: '', date: TODAY, responsibleUser: user?.fullName || '', notes: '' });
    setErrors({});
    setServerError('');
    setResult(null);
    setStep('form');
  };

  if (viewOnly) {
    return (
      <div>
        <PageHeader title={t('stockTransfer')} description={t('transferDescription')} breadcrumb={[{ label: t('stockManagement'), to: '/stock' }, { label: t('stockTransfer') }]} />
        <ViewOnlyBanner module="Stock MIS" />
        <div className="stock-success-state">
          <p className="text-sm text-[var(--color-mid-gray)]">{t('transferReserved')}</p>
          <Button variant="secondary" className="mt-4" onClick={() => navigate('/stock')}>{t('backToStockDashboard')}</Button>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div>
        <PageHeader title={t('stockTransfer')} breadcrumb={[{ label: t('stockManagement'), to: '/stock' }, { label: t('stockTransfer') }]} />
        <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-12 flex flex-col items-center text-center">
          <CheckCircle2 className="w-12 h-12 text-[var(--color-status-green)] mb-4" aria-hidden="true" />
          <p className="font-display text-lg font-semibold text-[var(--color-dark-gray)]">{t('transferRecorded')}</p>
          <p className="text-sm text-[var(--color-mid-gray)] mt-1">
            {t('transferSuccessMessage', { quantity: form.quantity, unit: t(`stockUnit.${selectedItem?.unit}`), name: selectedItem?.name, from: t(`stockLocation.${form.fromLocation}`), to: t(`stockLocation.${form.toLocation}`) })}
          </p>
          <div className="flex gap-3 mt-6">
            <Button variant="secondary" onClick={() => navigate(`/stock/items/${form.itemId}`)}>{t('viewItemDetails')}</Button>
            <Button variant="outline" onClick={() => navigate('/stock/transactions')}>{t('viewTransactions')}</Button>
            <Button variant="primary" onClick={startAnother}>{t('recordAnother')}</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={t('stockTransfer')} description={t('transferDescription')} breadcrumb={[{ label: t('stockManagement'), to: '/stock' }, { label: t('stockTransfer') }]} />

      <div className="stock-form-container">
        {step === 'form' ? (
          <form onSubmit={handleContinue} noValidate className="space-y-4">
            {serverError && <Alert type="error">{serverError}</Alert>}
            <Select
              label={t('item')}
              required
              value={form.itemId}
              onChange={update('itemId')}
              error={errors.itemId}
              options={items.map((i) => ({ value: i.id, label: t('itemOptionStock', { name: i.name, quantity: i.quantity, unit: i.unit }) }))}
            />
            {selectedItem && <p className="text-xs text-[var(--color-mid-gray)] -mt-2">{t('currentlyStoredAt', { location: selectedItem.location })}</p>}
            <Input label={t('quantity')} type="number" min="1" required value={form.quantity} onChange={update('quantity')} error={errors.quantity} />
            <div className="grid sm:grid-cols-2 gap-4">
              <Select label={t('fromLocation')} required value={form.fromLocation} onChange={update('fromLocation')} error={errors.fromLocation} options={STOCK_LOCATIONS.map((l) => ({ value: l, label: t(`stockLocation.${l}`) }))} />
              <Select label={t('toLocation')} required value={form.toLocation} onChange={update('toLocation')} error={errors.toLocation} options={STOCK_LOCATIONS.map((l) => ({ value: l, label: t(`stockLocation.${l}`) }))} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Select label={t('reason')} value={form.reason} onChange={update('reason')} options={TRANSFER_REASONS.map((r) => ({ value: r, label: t(`transferReason.${r}`) }))} />
              <Input label={t('date')} type="date" required value={form.date} onChange={update('date')} error={errors.date} />
            </div>
            <Input label={t('responsibleUser')} required value={form.responsibleUser} onChange={update('responsibleUser')} error={errors.responsibleUser} />
            <Textarea label={t('notes')} value={form.notes} onChange={update('notes')} rows={3} />
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => navigate('/stock')}>{t('cancel')}</Button>
              <Button type="submit" variant="primary" icon={ArrowLeftRight}>{t('continue')}</Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            {serverError && <Alert type="error">{serverError}</Alert>}
            <p className="text-sm text-[var(--color-dark-gray)]">{t('confirmDetailsBelow')}</p>
            <dl className="text-sm bg-[var(--color-off-white)] rounded-[var(--radius-control)] p-4 space-y-1.5">
              <div className="flex justify-between"><dt className="text-[var(--color-mid-gray)]">{t('item')}</dt><dd className="font-medium">{selectedItem?.name}</dd></div>
              <div className="flex justify-between"><dt className="text-[var(--color-mid-gray)]">{t('quantity')}</dt><dd className="font-medium">{form.quantity} {selectedItem?.unit}</dd></div>
              <div className="flex justify-between"><dt className="text-[var(--color-mid-gray)]">{t('from')}</dt><dd className="font-medium">{t(`stockLocation.${form.fromLocation}`)}</dd></div>
              <div className="flex justify-between"><dt className="text-[var(--color-mid-gray)]">{t('to')}</dt><dd className="font-medium">{t(`stockLocation.${form.toLocation}`)}</dd></div>
              <div className="flex justify-between"><dt className="text-[var(--color-mid-gray)]">{t('date')}</dt><dd className="font-medium">{form.date}</dd></div>
              <div className="flex justify-between"><dt className="text-[var(--color-mid-gray)]">{t('responsibleUser')}</dt><dd className="font-medium">{form.responsibleUser}</dd></div>
            </dl>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setStep('form')} disabled={saving}>{t('back')}</Button>
              <Button variant="primary" onClick={handleConfirm} loading={saving}>{t('confirmTransfer')}</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
