import { useState, useEffect } from 'react';
import Modal from '../../components/modals/Modal';
import { Input, Select, Textarea } from '../../components/forms/FormField';
import Button from '../../components/common/Button';
import Alert from '../../components/feedback/Alert';
import { useToast } from '../../context/ToastContext';
import { STOCK_CATEGORIES, STOCK_UNITS } from '../../data/stock';
import { createItem, updateItem } from '../../services/stockService';

const EMPTY_FORM = { name: '', category: '', unit: '', quantity: '', minLevel: '', description: '' };

export default function StockItemFormModal({ open, onClose, item, onSaved }) {
  const { showToast } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);
  const isEdit = !!item;

  useEffect(() => {
    if (open) {
      setForm(
        item
          ? { ...item, quantity: String(item.quantity), minLevel: String(item.minLevel) }
          : EMPTY_FORM
      );
      setErrors({});
      setServerError('');
    }
  }, [open, item]);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const next = {};
    if (!form.name?.trim()) next.name = 'Item name is required.';
    if (!form.category) next.category = 'Select a category.';
    if (!form.unit) next.unit = 'Select a unit.';
    const qty = Number(form.quantity);
    if (form.quantity === '' || Number.isNaN(qty) || qty < 0) next.quantity = 'Enter a valid quantity.';
    const min = Number(form.minLevel);
    if (form.minLevel === '' || Number.isNaN(min) || min < 0) next.minLevel = 'Enter a valid minimum stock level.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;
    setSaving(true);

    setTimeout(() => {
      let result;
      if (isEdit) {
        result = updateItem(item.id, { ...form, quantity: Number(form.quantity), minLevel: Number(form.minLevel) });
      } else {
        result = createItem(form);
      }
      setSaving(false);
      if (!result.success) {
        setServerError(result.error);
        return;
      }
      showToast(isEdit ? 'Stock item updated successfully.' : 'Stock item added.', 'success');
      onSaved(result.item);
    }, 400);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Stock Item' : 'Add Stock Item'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>{isEdit ? 'Save Changes' : 'Save Item'}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {serverError && <Alert type="error">{serverError}</Alert>}
        <Input label="Item Name" required value={form.name} onChange={update('name')} error={errors.name} />
        <div className="grid sm:grid-cols-2 gap-4">
          <Select
            label="Category"
            required
            value={form.category}
            onChange={update('category')}
            error={errors.category}
            hint="Stock items are limited to Foods or Electronic Devices."
            options={STOCK_CATEGORIES.map((c) => ({ value: c, label: c }))}
          />
          <Select
            label="Unit"
            required
            value={form.unit}
            onChange={update('unit')}
            error={errors.unit}
            options={STOCK_UNITS.map((u) => ({ value: u, label: u }))}
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Quantity" type="number" min="0" required value={form.quantity} onChange={update('quantity')} error={errors.quantity} />
          <Input label="Minimum Stock Level" type="number" min="0" required value={form.minLevel} onChange={update('minLevel')} error={errors.minLevel} />
        </div>
        <Textarea label="Description / Notes" value={form.description} onChange={update('description')} rows={3} />
      </form>
    </Modal>
  );
}
