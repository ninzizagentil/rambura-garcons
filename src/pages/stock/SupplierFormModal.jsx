import { useState } from 'react';
import Modal from '../../components/modals/Modal';
import { Input, Textarea } from '../../components/forms/FormField';
import Button from '../../components/common/Button';
import Alert from '../../components/feedback/Alert';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { createSupplier, updateSupplier } from '../../services/stockService';
import { logActivity } from '../../services/activityService';
import { useApp } from '../../context/AppContext';
import { applyKindErrors } from '../../utils/validators';

const EMPTY_FORM = { name: '', contactPerson: '', phone: '', email: '', address: '', notes: '' };

// What each field may contain (letters only, numbers only, phone, email…) — see utils/validators.js
const FIELD_KINDS = {
  name: 'alnum',
  contactPerson: 'name',
  phone: 'phone',
  email: 'email',
  address: 'alnum',
};

export default function SupplierFormModal({ open, onClose, supplier, onSaved }) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { t } = useApp();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);
  const isEdit = !!supplier;

  // Reset the form when the modal transitions to open (or the target
  // supplier changes while open), computed during render instead of in an
  // effect — see https://react.dev/learn/you-might-not-need-an-effect
  const [resetKey, setResetKey] = useState(null);
  const nextResetKey = open ? (supplier?.id ?? supplier?._id ?? 'new') : null;
  if (open && resetKey !== nextResetKey) {
    setResetKey(nextResetKey);
    setForm(supplier ? { ...EMPTY_FORM, ...supplier } : EMPTY_FORM);
    setErrors({});
    setServerError('');
  } else if (!open && resetKey !== null) {
    setResetKey(null);
  }

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const next = {};
    if (!form.name?.trim()) next.name = 'Supplier name is required.';
    if (!form.contactPerson?.trim()) next.contactPerson = 'Contact person is required.';
    if (!form.phone?.trim()) next.phone = 'Phone number is required.';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email address.';
    applyKindErrors(next, form, FIELD_KINDS, t);
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
        <Input kind="alnum" label={t('supplier')} required value={form.name} onChange={update('name')} error={errors.name} placeholder={t('sourceSupplierPlaceholder')} />
        <div className="grid sm:grid-cols-2 gap-4">
          <Input kind="name" label={t('fullName')} required value={form.contactPerson} onChange={update('contactPerson')} error={errors.contactPerson} />
          <Input kind="phone" label={t('phone')} required value={form.phone} onChange={update('phone')} error={errors.phone} placeholder="+250 7xx xxx xxx" />
        </div>
        <Input kind="email" label={t('email')} type="email" value={form.email} onChange={update('email')} error={errors.email} />
        <Input kind="alnum" label={t('address')} value={form.address} onChange={update('address')} />
        <Textarea label={t('notes')} value={form.notes} onChange={update('notes')} rows={3} />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>{t('cancel')}</Button>
          <Button type="submit" variant="primary" loading={saving}>{isEdit ? t('saveChanges') : t('addSupplier')}</Button>
        </div>
      </form>
    </Modal>
  );
}
