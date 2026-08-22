import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Mail, CheckCircle2 } from 'lucide-react';
import { Input } from '../../components/forms/FormField';
import Button from '../../components/common/Button';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-off-white)] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--color-deep-green)] mb-4">
            <GraduationCap className="w-7 h-7 text-[var(--color-gold)]" aria-hidden="true" />
          </span>
          <h1 className="font-display text-2xl font-semibold text-[var(--color-heading)]">Reset your password</h1>
        </div>

        <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] shadow-card p-7">
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle2 className="w-10 h-10 text-[var(--color-status-green)] mx-auto mb-3" aria-hidden="true" />
              <p className="font-semibold text-[var(--color-dark-gray)]">Check your email</p>
              <p className="text-sm text-[var(--color-mid-gray)] mt-1">
                If an account exists for {email}, password reset instructions have been sent.
              </p>
              <Link to="/login" className="inline-block mt-5 text-sm font-semibold text-[var(--color-medium-green)] hover:underline">
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <p className="text-sm text-[var(--color-mid-gray)]">
                Enter the email associated with your account and we'll send you a link to reset your password.
              </p>
              <Input
                label="Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@ramburagarcons.rw"
              />
              <Button type="submit" variant="primary" size="lg" className="w-full" icon={Mail}>
                Send Reset Link
              </Button>
              <p className="text-center text-sm">
                <Link to="/login" className="text-[var(--color-medium-green)] hover:underline">← Back to login</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
