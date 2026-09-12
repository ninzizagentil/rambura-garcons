import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Eye, EyeOff, KeyRound, ArrowLeft } from 'lucide-react';
import Button from '../../components/common/Button';
import { Input } from '../../components/forms/FormField';
import { resetPassword } from '../../services/authService';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [visible, setVisible] = useState({ password: false, confirmation: false });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const toggleVisibility = (field) => setVisible((state) => ({ ...state, [field]: !state[field] }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmation) { setError('Passwords do not match.'); return; }
    setStatus('loading'); setError('');
    try {
      await resetPassword(params.get('token'), password);
      setStatus('success');
    } catch (requestError) {
      setStatus('idle'); setError(requestError.message || 'This reset link is invalid or expired.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-off-white)] px-4 py-10">
      <div className="w-full max-w-md rounded-[var(--radius-card)] border border-[var(--color-border-gray)] bg-[var(--color-white)] p-7 shadow-card">
        {status === 'success' ? (
          <div className="text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-[var(--color-status-green)]" aria-hidden="true" />
            <h1 className="mt-4 font-display text-2xl font-bold text-[var(--color-heading)]">Password updated</h1>
            <p className="mt-2 text-sm text-[var(--color-mid-gray)]">Your password has been changed securely.</p>
            <Link to="/login" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-medium-green)]"><ArrowLeft className="h-4 w-4" /> Back to login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="text-center"><KeyRound className="mx-auto h-10 w-10 text-[var(--color-medium-green)]" aria-hidden="true" /><h1 className="mt-3 font-display text-2xl font-bold text-[var(--color-heading)]">Create a new password</h1><p className="mt-2 text-sm text-[var(--color-mid-gray)]">Use at least 8 characters for your new password.</p></div>
            {error && <p role="alert" className="rounded-lg border border-[var(--color-status-red)]/30 bg-[var(--color-status-red-bg)] px-3 py-2 text-sm text-[var(--color-status-red)]">{error}</p>}
            <Input
              label="New password"
              type={visible.password ? 'text' : 'password'}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              trailing={<button type="button" onClick={() => toggleVisibility('password')} aria-label={visible.password ? 'Hide password' : 'Show password'} className="text-[var(--color-mid-gray)] hover:text-[var(--color-gold)]">{visible.password ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>}
            />
            <Input
              label="Confirm password"
              type={visible.confirmation ? 'text' : 'password'}
              required
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="new-password"
              trailing={<button type="button" onClick={() => toggleVisibility('confirmation')} aria-label={visible.confirmation ? 'Hide confirmation password' : 'Show confirmation password'} className="text-[var(--color-mid-gray)] hover:text-[var(--color-gold)]">{visible.confirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>}
            />
            <Button type="submit" className="w-full" loading={status === 'loading'}>{status === 'loading' ? 'Updating...' : 'Update password'}</Button>
            <p className="text-center"><Link to="/login" className="text-sm font-semibold text-[var(--color-medium-green)]">Back to login</Link></p>
          </form>
        )}
      </div>
    </div>
  );
}
