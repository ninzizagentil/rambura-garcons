import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, PackagePlus, ClipboardList } from 'lucide-react';
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
import { useApp } from '../../context/AppContext';



export default function StockIn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const { viewOnly } = useModuleAccess(ROLES.STOCK_MANAGER);
  const { t, language } = useApp();
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
    if (!form.itemId) next.itemId = t('selectAnItem');
    const qty = Number(form.quantity);
    if (!form.quantity || Number.isNaN(qty) || qty <= 0) next.quantity = t('positiveQuantityRequired');
    if (!form.date) next.date = t('dateRequired');
    if (!form.party?.trim()) next.party = t('sourceSupplierRequired');
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
    const res = await stockIn(form);
    setSaving(false);
    if (!res.success) {
      setServerError(res.error);
      setStep('form');
      return;
    }
      setResult(res);
      setStep('success');
      showToast(t('stockInRecordedFor', { name: selectedItem.name }), 'success');
      addNotification({
        type: 'stock',
        message: t('stockInNotification', { quantity: form.quantity, unit: selectedItem.unit, name: selectedItem.name }),
        to: '/stock/transactions',
      });
      logActivity({
        user: user?.fullName || 'Stock Manager',
        action: t('recordedStockInActivity', { name: selectedItem.name, quantity: form.quantity, unit: selectedItem.unit }),
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
        <PageHeader title={t('stockIn')} description={t('recordIncomingStock')} breadcrumb={[{ label: t('stockManagement'), to: '/stock' }, { label: t('stockIn') }]} />
        <ViewOnlyBanner module="Stock MIS" />
        <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-12 flex flex-col items-center text-center">
          <p className="text-sm text-[var(--color-mid-gray)]">{t('stockInReserved')}</p>
          <Button variant="secondary" className="mt-4" onClick={() => navigate('/stock')}>{t('backToStockDashboard')}</Button>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div>
        <PageHeader title={t('stockIn')} breadcrumb={[{ label: t('stockManagement'), to: '/stock' }, { label: t('stockIn') }]} />
        <div className="stock-success-state">
          <CheckCircle2 className="stock-success-icon" aria-hidden="true" />
          <h3 className="stock-success-title">{t('stockInSuccessful')}</h3>
          <p className="stock-success-message">
            {t('stockInSuccessMessage', { quantity: form.quantity, unit: selectedItem?.unit, name: selectedItem?.name })}
          </p>
          <div className="stock-success-details">
            <div className="stock-success-detail-row">
              <span className="stock-success-detail-label">{t('item')}</span>
              <span className="stock-success-detail-value">{selectedItem?.name}</span>
            </div>
            <div className="stock-success-detail-row">
              <span className="stock-success-detail-label">{t('quantityAdded')}</span>
              <span className="stock-success-detail-value">+{form.quantity} {selectedItem?.unit}</span>
            </div>
            <div className="stock-success-detail-row">
              <span className="stock-success-detail-label">{t('newTotal')}</span>
              <span className="stock-success-detail-value">{result?.newQuantity} {selectedItem?.unit}</span>
            </div>
            <div className="stock-success-detail-row">
              <span className="stock-success-detail-label">{t('date')}</span>
              <span className="stock-success-detail-value">{new Date(form.date).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            <Button variant="secondary" onClick={() => navigate(`/stock/items/${form.itemId}`)}>{t('viewItem')}</Button>
            <Button variant="outline" onClick={() => navigate('/stock/transactions')}>{t('viewTransactions')}</Button>
            <Button variant="primary" onClick={startAnother}>{t('recordAnother')}</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={t('stockIn')} description={t('recordIncomingStock')} breadcrumb={[{ label: t('stockManagement'), to: '/stock' }, { label: t('stockIn') }]} />

      <div className="stock-form-container">
        {step === 'form' ? (
          <form onSubmit={handleContinue} noValidate className="space-y-4">
            <h3 className="stock-form-title">{t('recordStockIn')}</h3>
            {serverError && <Alert type="error">{serverError}</Alert>}
            
            <div className="stock-form-section">
              <label className="stock-form-section-title">{t('itemAndQuantity')}</label>
              <div className="stock-form-grid full">
                <Select
                  label={t('item')}
                  required
                  value={form.itemId}
                  onChange={update('itemId')}
                  error={errors.itemId}
                  options={items.map((i) => ({ value: i.id, label: `${i.name} (${i.quantity} ${i.unit} in stock)` }))}
                />
              </div>
            </div>

            <div className="stock-form-section">
              <label className="stock-form-section-title">{t('transactionDetails')}</label>
              <div className="stock-form-grid">
                <Input label={t('quantity')} type="number" min="1" required value={form.quantity} onChange={update('quantity')} error={errors.quantity} />
                <Input label={t('date')} type="date" required value={form.date} onChange={update('date')} error={errors.date} />
              </div>
              <div className="stock-form-grid full">
                <Input label={t('sourceSupplier')} required value={form.party} onChange={update('party')} error={errors.party} placeholder={t('sourceSupplierPlaceholder')} />
              </div>
              <div className="stock-form-grid full">
                <Input label={t('responsibleUser')} required value={form.responsibleUser} onChange={update('responsibleUser')} error={errors.responsibleUser} />
              </div>
              <div className="stock-form-grid full">
                <Textarea label={t('notes')} value={form.notes} onChange={update('notes')} rows={3} />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => navigate('/stock')}>{t('cancel')}</Button>
              <Button type="submit" variant="primary" icon={PackagePlus}>{t('continue')}</Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            {serverError && <Alert type="error">{serverError}</Alert>}
            <h3 className="stock-form-title flex items-center gap-2"><ClipboardList className="w-5 h-5" /> {t('confirmStockIn')}</h3>
            <p className="text-sm text-[var(--color-dark-gray)]">{t('confirmDetailsBelow')}</p>
            <dl className="text-sm bg-[var(--color-off-white)] rounded-[var(--radius-control)] p-4 space-y-1.5">
              <div className="flex justify-between"><dt className="text-[var(--color-mid-gray)]">{t('item')}</dt><dd className="font-medium">{selectedItem?.name}</dd></div>
              <div className="flex justify-between"><dt className="text-[var(--color-mid-gray)]">{t('quantity')}</dt><dd className="font-medium">+{form.quantity} {selectedItem?.unit}</dd></div>
              <div className="flex justify-between"><dt className="text-[var(--color-mid-gray)]">{t('date')}</dt><dd className="font-medium">{form.date}</dd></div>
              <div className="flex justify-between"><dt className="text-[var(--color-mid-gray)]">{t('sourceSupplier')}</dt><dd className="font-medium">{form.party}</dd></div>
              <div className="flex justify-between"><dt className="text-[var(--color-mid-gray)]">{t('responsibleUser')}</dt><dd className="font-medium">{form.responsibleUser}</dd></div>
              <div className="flex justify-between"><dt className="text-[var(--color-mid-gray)]">{t('newQuantity')}</dt><dd className="font-medium">{(selectedItem?.quantity || 0) + Number(form.quantity)} {selectedItem?.unit}</dd></div>
            </dl>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setStep('form')} disabled={saving}>{t('back')}</Button>
              <Button variant="primary" onClick={handleConfirm} loading={saving}>{t('confirmStockIn')}</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
