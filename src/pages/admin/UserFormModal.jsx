import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Modal from '../../components/modals/Modal';
import { Input, Select } from '../../components/forms/FormField';
import Button from '../../components/common/Button';
import Alert from '../../components/feedback/Alert';
import { useToast } from '../../context/ToastContext';
import { useApp } from '../../context/AppContext';
import { ROLE_LABELS } from '../../data/roles';
import { createUser, updateUser } from '../../services/userService';
import { applyKindErrors } from '../../utils/validators';

const EMPTY_FORM = { fullName: '', username: '', email: '', role: '', status: 'active', password: '' };

// What each field may contain (letters only, numbers only, phone, email…) — see utils/validators.js
const FIELD_KINDS = {
  fullName: 'name',
  username: 'username',
  email: 'email',
};

export default function UserFormModal({ open, onClose, user, onSaved }) {
  const { showToast } = useToast();
  const { t } = useApp();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isEdit = !!user;
  const formId = 'user-form';

  // Reset the form when the modal transitions to open (or the target user
  // changes while open), computed during render instead of in an effect —
  // see https://react.dev/learn/you-might-not-need-an-effect
  const [resetKey, setResetKey] = useState(null);
  const nextResetKey = open ? (user?.id ?? user?._id ?? 'new') : null;
  if (open && resetKey !== nextResetKey) {
    setResetKey(nextResetKey);
    setForm(user ? { ...user, password: '' } : EMPTY_FORM);
    setErrors({});
    setServerError('');
    setShowPassword(false);
  } else if (!open && resetKey !== null) {
    setResetKey(null);
  }

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const next = {};
    if (!form.fullName?.trim()) next.fullName = t('fullNameRequired');
    if (!form.username?.trim()) next.username = t('usernameRequired');
    if (!form.email?.trim()) next.email = t('emailRequired');
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = t('validEmailRequired');
    if (!form.role) next.role = t('roleRequired');
    if (!isEdit && (!form.password || form.password.length < 6)) next.password = t('passwordMinSix');
    applyKindErrors(next, form, FIELD_KINDS, t);
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setErrors({});
    if (!validate()) return;
    setSaving(true);

    const result = isEdit
      ? await updateUser(user.id, { fullName: form.fullName, username: form.username, email: form.email, role: form.role, status: form.status })
      : await createUser(form);
    setSaving(false);
    if (!result.success) {
      const fieldErrors = Object.fromEntries(
        (result.errors || []).filter((item) => item.field).map((item) => [item.field, item.message])
      );
      setErrors(fieldErrors);
      setServerError(Object.keys(fieldErrors).length ? '' : result.error);
      return;
    }
    showToast(isEdit ? t('userUpdated') : t('userCreated'), 'success');
    onSaved();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t('editUser') : t('addUser')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>{t('cancel')}</Button>
          <Button variant="primary" type="submit" form={formId} loading={saving}>{isEdit ? t('saveChanges') : t('createUser')}</Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-4">
        {serverError && <Alert type="error">{serverError}</Alert>}
        <Input kind="name" label={t('fullName')} required autoComplete="name" value={form.fullName} onChange={update('fullName')} error={errors.fullName} />
        <div className="grid sm:grid-cols-2 gap-4">
          <Input kind="username" label={t('username')} required autoComplete="off" value={form.username} onChange={update('username')} error={errors.username} />
          <Input kind="email" label={t('email')} type="email" required autoComplete="off" value={form.email} onChange={update('email')} error={errors.email} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Select
            label={t('role')}
            required
            value={form.role}
            onChange={update('role')}
            error={errors.role}
            options={Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }))}
          />
          {!isEdit && (
            <Select
              label={t('status')}
              required
              value={form.status}
              onChange={update('status')}
              options={[{ value: 'active', label: t('active') }, { value: 'inactive', label: t('inactive') }]}
            />
          )}
        </div>
        {isEdit && (
          <p className="text-xs text-[var(--color-mid-gray)]">
            {t('useUsersStatusAction')}
          </p>
        )}
        {!isEdit && (
          <Input
            label={t('password')}
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="new-password"
            value={form.password}
            onChange={update('password')}
            error={errors.password}
            hint={t('passwordHint')}
            trailing={(
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? t('hideNewPassword') : t('showNewPassword')}
                className="text-[var(--color-mid-gray)] hover:text-[var(--color-gold)]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            )}
          />
        )}
      </form>
    </Modal>
  );
}
