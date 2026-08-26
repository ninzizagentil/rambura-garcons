import { useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import { Input } from '../../components/forms/FormField';
import Button from '../../components/common/Button';
import Alert from '../../components/feedback/Alert';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';

export default function ChangePassword() {
  const { showToast } = useToast();
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const next = {};
    if (!form.current) next.current = 'Enter your current password.';
    if (!form.next || form.next.length < 8) next.next = 'New password must be at least 8 characters.';
    if (form.confirm !== form.next) next.confirm = 'Passwords do not match.';
    setErrors(next);
    if (Object.keys(next).length === 0) {
      setSaving(true);
      try {
        await api.post('/auth/change-password', { currentPassword: form.current, newPassword: form.next });
        showToast('Password updated successfully.', 'success');
        setForm({ current: '', next: '', confirm: '' });
      } catch (error) {
        setServerError(error.message);
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div>
      <PageHeader title="Change Password" description="Update your account password." />
      <form onSubmit={handleSubmit} noValidate className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-6 max-w-md space-y-5">
        {serverError && <Alert type="error">{serverError}</Alert>}
        <Input label="Current Password" type="password" required value={form.current} onChange={update('current')} error={errors.current} />
        <Input label="New Password" type="password" required value={form.next} onChange={update('next')} error={errors.next} hint="At least 8 characters." />
        <Input label="Confirm New Password" type="password" required value={form.confirm} onChange={update('confirm')} error={errors.confirm} />
        <Button type="submit" variant="primary" className="w-full" loading={saving}>Save Changes</Button>
      </form>
    </div>
  );
}
