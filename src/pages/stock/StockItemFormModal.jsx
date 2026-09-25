import { useState } from 'react';
import Modal from '../../components/modals/Modal';
import { Input, Select, Textarea } from '../../components/forms/FormField';
import Button from '../../components/common/Button';
import Alert from '../../components/feedback/Alert';
import { useToast } from '../../context/ToastContext';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { STOCK_CATEGORIES, STOCK_UNITS } from '../../data/stock';
import { createItem, updateItem, getSuppliers } from '../../services/stockService';
import { logActivity } from '../../services/activityService';
import { useApp } from '../../context/AppContext';
import { applyKindErrors } from '../../utils/validators';

const EMPTY_FORM = { name: '', category: '', unit: '', quantity: '', minLevel: '', unitPrice: '', description: '', batchNumber: '', serialNumber: '', expiryDate: '', supplierId: '', location: '' };

// What each field may contain (letters only, numbers only, phone, email…) — see utils/validators.js
const FIELD_KINDS = {
  name: 'itemName',
  quantity: 'decimal',
  minLevel: 'decimal',
  unitPrice: 'decimal',
  batchNumber: 'code',
};

export default function StockItemFormModal({ open, onClose, item, onSaved }) {
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const { t } = useApp();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);
  const [suppliers, setSuppliers] = useState(() => getSuppliers());
  const isEdit = !!item;

  // Reset the form when the modal transitions to open (or the target item
  // changes while open), computed during render instead of in an effect —
  // see https://react.dev/learn/you-might-not-need-an-effect
  const [resetKey, setResetKey] = useState(null);
  const nextResetKey = open ? (item?.id ?? item?._id ?? 'new') : null;
  if (open && resetKey !== nextResetKey) {
    setResetKey(nextResetKey);
    setSuppliers(getSuppliers());
    setForm(
      item
        ? { ...EMPTY_FORM, ...item, quantity: String(item.quantity), minLevel: String(item.minLevel), unitPrice: String(item.unitPrice ?? ''), supplierId: item.supplierId || '', location: item.location || '', expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '' }
        : EMPTY_FORM
    );
    setErrors({});
    setServerError('');
  } else if (!open && resetKey !== null) {
    setResetKey(null);
  }

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const next = {};
    if (!form.name?.trim()) next.name = t('itemNameRequired');
    else if (form.name.trim().length > 100) next.name = t('itemNameTooLong');
    if (!STOCK_CATEGORIES.includes(form.category)) next.category = t('categoryRequired');
    if (!STOCK_UNITS.includes(form.unit)) next.unit = t('unitRequired');
    const qty = Number(form.quantity);
    if (form.quantity === '' || Number.isNaN(qty) || qty < 0) next.quantity = t('validQuantityRequired');
    const min = Number(form.minLevel);
    if (form.minLevel === '' || Number.isNaN(min) || min < 0) next.minLevel = t('validMinimumLevelRequired');
    const price = Number(form.unitPrice);
    if (form.unitPrice === '' || Number.isNaN(price) || price < 0) next.unitPrice = t('validUnitValueRequired');
    // NEW: Validate batch number for Foods
    if (form.category === 'Foods' && !form.batchNumber?.trim()) {
      next.batchNumber = t('batchNumberRequired');
    }
    if (form.expiryDate && Number.isNaN(new Date(form.expiryDate).getTime())) {
      next.expiryDate = t('validExpiryDateRequired');
    }
    applyKindErrors(next, form, FIELD_KINDS, t);
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;
    setSaving(true);

    const payload = { 
      ...form, 
      quantity: Number(form.quantity), 
      minLevel: Number(form.minLevel), 
      unitPrice: Number(form.unitPrice),
      expiryDate: form.expiryDate ? new Date(form.expiryDate) : null,
      batchNumber: form.batchNumber?.trim() || null,
      serialNumber: form.serialNumber?.trim() || null,
      supplierId: form.supplierId || null,
      location: form.location || null,
    };
    const result = isEdit ? await updateItem(item.id, payload) : await createItem(payload);
    setSaving(false);
    if (!result.success) {
      setServerError(result.error);
      return;
    }
      showToast(isEdit ? t('stockItemUpdated') : t('stockItemAdded'), 'success');
      logActivity({
        user: user?.fullName || 'Stock Manager',
        action: isEdit
          ? `Updated stock item: ${form.name}`
          : `Added new stock item: ${form.name} (${form.quantity} ${form.unit})`,
        module: 'Stock',
        status: 'success',
      });
      if (!isEdit) {
        addNotification({
          type: 'stock',
          message: `New stock item added: ${form.name} (${form.quantity} ${form.unit}).`,
          to: '/stock/items',
        });
      }
      onSaved(result.item);
    
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t('editStockItem') : t('addStockItem')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>{t('cancel')}</Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>{isEdit ? t('saveChanges') : t('saveItem')}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {serverError && <Alert type="error">{serverError}</Alert>}
        <Input kind="itemName" label={t('itemName')} required maxLength={100} value={form.name} onChange={update('name')} error={errors.name} />
        <div className="grid sm:grid-cols-2 gap-4">
          <Select
            label={t('category')}
            required
            value={form.category}
            onChange={update('category')}
            error={errors.category}
            hint={t('stockCategoryHint')}
            options={STOCK_CATEGORIES.map((c) => ({ value: c, label: t(`stockCategory.${c}`) }))}
          />
          <Select
            label={t('unit')}
            required
            value={form.unit}
            onChange={update('unit')}
            error={errors.unit}
            options={STOCK_UNITS.map((u) => ({ value: u, label: t(`stockUnit.${u}`) }))}
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input kind="decimal"
            label={t('quantity')}
            type="number"
            min="0"
            required
            value={form.quantity}
            onChange={update('quantity')}
            error={errors.quantity}
            disabled={isEdit}
            hint={isEdit ? t('quantityEditHint') : undefined}
          />
          <Input kind="decimal" label={t('minimumLevel')} type="number" min="0" required value={form.minLevel} onChange={update('minLevel')} error={errors.minLevel} />
        </div>
        <Input kind="decimal"
          label={t('unitValuePrice')}
          type="number"
          min="0"
          step="0.01"
          required
          value={form.unitPrice}
          onChange={update('unitPrice')}
          error={errors.unitPrice}
          hint={
            form.quantity !== '' && form.unitPrice !== '' && !Number.isNaN(Number(form.quantity)) && !Number.isNaN(Number(form.unitPrice))
              ? t('totalValueAtQuantity', { value: new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', maximumFractionDigits: 0 }).format(Number(form.quantity) * Number(form.unitPrice)) })
              : t('unitValueHint')
          }
        />
        {/* NEW: Batch Number (Required for Foods) */}
        {form.category === 'Foods' && (
          <Input kind="code"
            label={t('batchNumber')}
            required={form.category === 'Foods'}
            value={form.batchNumber}
            onChange={update('batchNumber')}
            error={errors.batchNumber}
            placeholder={t('batchNumberPlaceholder')}
            hint={t('batchNumberHint')}
          />
        )}
        {/* NEW: Expiry Date (Optional, useful for Foods) */}
        {form.category === 'Foods' && (
          <Input
            label={t('expiryDate')}
            type="date"
            value={form.expiryDate}
            onChange={update('expiryDate')}
            error={errors.expiryDate}
            hint={t('expiryDateHint')}
          />
        )}
        <Textarea label={t('descriptionNotes')} value={form.description} onChange={update('description')} rows={3} />

        {/* Supplier & Location */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Select
            label={t('supplier')}
            value={form.supplierId}
            onChange={update('supplierId')}
            hint={t('sourceSupplier')}
            options={[
              { value: '', label: `— ${t('selectAnOption')} —` },
              ...suppliers.map((s) => ({ value: s.id, label: s.name })),
            ]}
          />
          <Select
            label={t('location')}
            value={form.location}
            onChange={update('location')}
            options={[
              { value: '', label: `— ${t('selectAnOption')} —` },
              ...['Main Store', 'Kitchen Store', 'ICT Lab Store', 'Admin Store'].map((location) => ({ value: location, label: t(`stockLocation.${location}`) })),
            ]}
          />
        </div>
      </form>
    </Modal>
  );
}
