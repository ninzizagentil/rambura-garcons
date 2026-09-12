import { useState, useEffect } from 'react';
import Modal from '../../components/modals/Modal';
import { Input, Select, Textarea } from '../../components/forms/FormField';
import Button from '../../components/common/Button';
import Alert from '../../components/feedback/Alert';
import { useToast } from '../../context/ToastContext';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { STOCK_CATEGORIES, STOCK_UNITS } from '../../data/stock';
import { createItem, updateItem } from '../../services/stockService';
import { logActivity } from '../../services/activityService';
import { useApp } from '../../context/AppContext';

const EMPTY_FORM = { name: '', category: '', unit: '', quantity: '', minLevel: '', unitPrice: '', description: '', batchNumber: '', serialNumber: '', expiryDate: '' };

export default function StockItemFormModal({ open, onClose, item, onSaved }) {
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const { t } = useApp();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);
  const isEdit = !!item;

  useEffect(() => {
    if (open) {
      setForm(
        item
          ? { ...item, quantity: String(item.quantity), minLevel: String(item.minLevel), unitPrice: String(item.unitPrice ?? ''), expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '' }
          : EMPTY_FORM
      );
      setErrors({});
      setServerError('');
    }
  }, [open, item]);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const next = {};
    if (!form.name?.trim()) next.name = t('itemNameRequired');
    if (!form.category) next.category = t('categoryRequired');
    if (!form.unit) next.unit = t('unitRequired');
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
    // NEW: Validate serial number for Electronics
    if (form.category === 'Electronic Devices' && !form.serialNumber?.trim()) {
      next.serialNumber = t('serialNumberRequired');
    }
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
      serialNumber: form.serialNumber?.trim() || null
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
        <Input label={t('itemName')} required value={form.name} onChange={update('name')} error={errors.name} />
        <div className="grid sm:grid-cols-2 gap-4">
          <Select
            label={t('category')}
            required
            value={form.category}
            onChange={update('category')}
            error={errors.category}
            hint={t('stockCategoryHint')}
            options={STOCK_CATEGORIES.map((c) => ({ value: c, label: c }))}
          />
          <Select
            label={t('unit')}
            required
            value={form.unit}
            onChange={update('unit')}
            error={errors.unit}
            options={STOCK_UNITS.map((u) => ({ value: u, label: u }))}
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input
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
          <Input label={t('minimumLevel')} type="number" min="0" required value={form.minLevel} onChange={update('minLevel')} error={errors.minLevel} />
        </div>
        <Input
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
          <Input
            label={t('batchNumber')}
            required={form.category === 'Foods'}
            value={form.batchNumber}
            onChange={update('batchNumber')}
            error={errors.batchNumber}
            placeholder={t('batchNumberPlaceholder')}
            hint={t('batchNumberHint')}
          />
        )}
        {/* NEW: Serial Number (Required for Electronics) */}
        {form.category === 'Electronic Devices' && (
          <Input
            label={t('serialNumber')}
            required={form.category === 'Electronic Devices'}
            value={form.serialNumber}
            onChange={update('serialNumber')}
            error={errors.serialNumber}
            placeholder={t('serialNumberPlaceholder')}
            hint={t('serialNumberHint')}
          />
        )}
        {/* NEW: Expiry Date (Optional, useful for Foods) */}
        {form.category === 'Foods' && (
          <Input
            label={t('expiryDate')}
            type="date"
            value={form.expiryDate}
            onChange={update('expiryDate')}
            hint={t('expiryDateHint')}
          />
        )}
        <Textarea label={t('descriptionNotes')} value={form.description} onChange={update('description')} rows={3} />
      </form>
    </Modal>
  );
}
