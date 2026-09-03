import { useState } from 'react';
import { CheckCircle2, Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react';
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
  const [visible, setVisible] = useState({ current: false, next: false, confirm: false });

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const toggleVisibility = (field) => setVisible((state) => ({ ...state, [field]: !state[field] }));
  const strength = form.next.length >= 12 ? 'Strong password' : form.next.length >= 8 ? 'Good password' : 'Use 8 or more characters';
  const strengthColor = form.next.length >= 12 ? 'bg-[var(--color-status-green)]' : form.next.length >= 8 ? 'bg-[var(--color-status-amber)]' : 'bg-[var(--color-border-gray)]';

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
    <div className="mx-auto max-w-xl">
      <PageHeader title="Change Password" description="Update your account password." />
      <form onSubmit={handleSubmit} noValidate className="animate-[fadeInUp_.45s_ease-out_both] motion-reduce:animate-none overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border-gray)] bg-[var(--color-white)] shadow-[0_16px_40px_rgba(15,108,255,0.08)]">
        <div className="flex animate-[fadeInUp_.45s_.08s_ease-out_both] motion-reduce:animate-none items-center gap-3 border-b border-[var(--color-border-gray)] bg-[linear-gradient(135deg,var(--surface-hover),var(--color-white))] px-6 py-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--gold)]/10 text-[var(--gold)]"><ShieldCheck className="h-5 w-5" aria-hidden="true" /></span>
          <div><p className="font-display text-base font-semibold text-[var(--color-heading)]">Secure your account</p><p className="text-xs text-[var(--color-mid-gray)]">Use a password you do not reuse elsewhere.</p></div>
        </div>
        <div className="animate-[fadeInUp_.45s_.16s_ease-out_both] motion-reduce:animate-none space-y-5 p-6">
        {serverError && <Alert type="error">{serverError}</Alert>}
        <Input label="Current Password" type={visible.current ? 'text' : 'password'} required value={form.current} onChange={update('current')} error={errors.current} trailing={<button type="button" onClick={() => toggleVisibility('current')} aria-label={visible.current ? 'Hide current password' : 'Show current password'} className="text-[var(--color-mid-gray)] hover:text-[var(--gold)]">{visible.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>} />
        <div>
          <Input label="New Password" type={visible.next ? 'text' : 'password'} required value={form.next} onChange={update('next')} error={errors.next} hint="At least 8 characters." trailing={<button type="button" onClick={() => toggleVisibility('next')} aria-label={visible.next ? 'Hide new password' : 'Show new password'} className="text-[var(--color-mid-gray)] hover:text-[var(--gold)]">{visible.next ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>} />
          <div className="mt-2 flex items-center gap-2" aria-live="polite"><span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-border-gray)]"><span className={`block h-full rounded-full transition-all ${strengthColor}`} style={{ width: form.next.length >= 12 ? '100%' : form.next.length >= 8 ? '66%' : form.next ? '33%' : '0%' }} /></span><span className="text-[11px] text-[var(--color-mid-gray)]">{strength}</span></div>
        </div>
        <Input label="Confirm New Password" type={visible.confirm ? 'text' : 'password'} required value={form.confirm} onChange={update('confirm')} error={errors.confirm} trailing={<button type="button" onClick={() => toggleVisibility('confirm')} aria-label={visible.confirm ? 'Hide confirmation password' : 'Show confirmation password'} className="text-[var(--color-mid-gray)] hover:text-[var(--gold)]">{visible.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>} />
        {form.confirm && form.confirm === form.next && <p className="-mt-2 flex items-center gap-1.5 text-xs font-medium text-[var(--color-status-green)]"><CheckCircle2 className="h-4 w-4" /> Passwords match</p>}
        <Button type="submit" variant="primary" icon={KeyRound} className="w-full" loading={saving}>Save Changes</Button>
        </div>
      </form>
    </div>
  );
}
