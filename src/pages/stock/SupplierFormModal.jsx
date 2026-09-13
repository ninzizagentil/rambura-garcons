import { useState, useEffect } from 'react';
import Modal from '../../components/modals/Modal';
import { Input, Textarea } from '../../components/forms/FormField';
import Button from '../../components/common/Button';
import Alert from '../../components/feedback/Alert';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { createSupplier, updateSupplier } from '../../services/stockService';
import { logActivity } from '../../services/activityService';
import { useApp } from '../../context/AppContext';

const EMPTY_FORM = { name: '', contactPerson: '', phone: '', email: '', address: '', notes: '' };

export default function SupplierFormModal({ open, onClose, supplier, onSaved }) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { t } = useApp();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);
  const isEdit = !!supplier;

  useEffect(() => {
    if (open) {
      setForm(supplier ? { ...EMPTY_FORM, ...supplier } : EMPTY_FORM);
      setErrors({});
      setServerError('');
    }
  }, [open, supplier]);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const next = {};
    if (!form.name?.trim()) next.name = 'Supplier name is required.';
    if (!form.contactPerson?.trim()) next.contactPerson = 'Contact person is required.';
    if (!form.phone?.trim()) next.phone = 'Phone number is required.';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email address.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;
    setSaving(true);

    const result = isEdit ? await updateSupplier(supplier.id, form) : await createSupplier(form);
    setSaving(false);
    if (!result.success) {
      setServerError(result.error);
      return;
    }
      showToast(isEdit ? t('saveChanges') : t('addSupplier'), 'success');
      logActivity({
        user: user?.fullName || 'Stock Manager',
        action: `${isEdit ? 'Updated' : 'Added'} supplier: ${form.name}`,
        module: 'Stock',
        status: 'success',
      });
      onSaved?.();
    
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? t('edit') : t('addSupplier')} size="md">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {serverError && <Alert type="error">{serverError}</Alert>}
        <Input label={t('supplier')} required value={form.name} onChange={update('name')} error={errors.name} placeholder={t('sourceSupplierPlaceholder')} />
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label={t('fullName')} required value={form.contactPerson} onChange={update('contactPerson')} error={errors.contactPerson} />
          <Input label={t('phone')} required value={form.phone} onChange={update('phone')} error={errors.phone} placeholder="+250 7xx xxx xxx" />
        </div>
        <Input label={t('email')} type="email" value={form.email} onChange={update('email')} error={errors.email} />
        <Input label={t('address')} value={form.address} onChange={update('address')} />
        <Textarea label={t('notes')} value={form.notes} onChange={update('notes')} rows={3} />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>{t('cancel')}</Button>
          <Button type="submit" variant="primary" loading={saving}>{isEdit ? t('saveChanges') : t('addSupplier')}</Button>
        </div>
      </form>
    </Modal>
  );
}
