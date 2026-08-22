import { useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import { Input } from '../../components/forms/FormField';
import Button from '../../components/common/Button';
import Alert from '../../components/feedback/Alert';
import { useToast } from '../../context/ToastContext';

export default function ChangePassword() {
  const { showToast } = useToast();
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [errors, setErrors] = useState({});

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = {};
    if (!form.current) next.current = 'Enter your current password.';
    if (!form.next || form.next.length < 8) next.next = 'New password must be at least 8 characters.';
    if (form.confirm !== form.next) next.confirm = 'Passwords do not match.';
    setErrors(next);
    if (Object.keys(next).length === 0) {
      showToast('Password updated successfully.', 'success');
      setForm({ current: '', next: '', confirm: '' });
    }
  };

  return (
    <div>
      <PageHeader title="Change Password" description="Update your account password." />
      <form onSubmit={handleSubmit} noValidate className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-6 max-w-md space-y-5">
        <Alert type="info">This is a demo — password changes are not persisted to a real backend.</Alert>
        <Input label="Current Password" type="password" required value={form.current} onChange={update('current')} error={errors.current} />
        <Input label="New Password" type="password" required value={form.next} onChange={update('next')} error={errors.next} hint="At least 8 characters." />
        <Input label="Confirm New Password" type="password" required value={form.confirm} onChange={update('confirm')} error={errors.confirm} />
        <Button type="submit" variant="primary" className="w-full">Save Changes</Button>
      </form>
    </div>
  );
}
