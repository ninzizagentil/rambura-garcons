import { useState, useEffect } from 'react';
import Modal from '../../components/modals/Modal';
import { Input, Select } from '../../components/forms/FormField';
import Button from '../../components/common/Button';
import Alert from '../../components/feedback/Alert';
import { useToast } from '../../context/ToastContext';
import { ROLE_LABELS } from '../../data/roles';
import { createUser, updateUser } from '../../services/userService';

const EMPTY_FORM = { fullName: '', username: '', email: '', role: '', status: 'active', password: '' };

export default function UserFormModal({ open, onClose, user, onSaved }) {
  const { showToast } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);
  const isEdit = !!user;

  useEffect(() => {
    if (open) {
      setForm(user ? { ...user, password: '' } : EMPTY_FORM);
      setErrors({});
      setServerError('');
    }
  }, [open, user]);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const next = {};
    if (!form.fullName?.trim()) next.fullName = 'Full name is required.';
    if (!form.username?.trim()) next.username = 'Username is required.';
    if (!form.email?.trim()) next.email = 'Email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address.';
    if (!form.role) next.role = 'Select a role.';
    if (!isEdit && (!form.password || form.password.length < 6)) next.password = 'Password must be at least 6 characters.';
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
        result = updateUser(user.id, {
          fullName: form.fullName,
          username: form.username,
          email: form.email,
          role: form.role,
          status: form.status,
        });
      } else {
        result = createUser(form);
      }
      setSaving(false);
      if (!result.success) {
        setServerError(result.error);
        return;
      }
      showToast(isEdit ? 'User updated successfully.' : 'User created successfully.', 'success');
      onSaved();
    }, 400);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit User' : 'Add User'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>{isEdit ? 'Save Changes' : 'Create User'}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {serverError && <Alert type="error">{serverError}</Alert>}
        <Input label="Full Name" required value={form.fullName} onChange={update('fullName')} error={errors.fullName} />
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Username" required value={form.username} onChange={update('username')} error={errors.username} />
          <Input label="Email" type="email" required value={form.email} onChange={update('email')} error={errors.email} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Select
            label="Role"
            required
            value={form.role}
            onChange={update('role')}
            error={errors.role}
            options={Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }))}
          />
          <Select
            label="Status"
            required
            value={form.status}
            onChange={update('status')}
            options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
          />
        </div>
        {!isEdit && (
          <Input
            label="Password"
            type="password"
            required
            value={form.password}
            onChange={update('password')}
            error={errors.password}
            hint="At least 6 characters. The user can change this after logging in."
          />
        )}
      </form>
    </Modal>
  );
}
