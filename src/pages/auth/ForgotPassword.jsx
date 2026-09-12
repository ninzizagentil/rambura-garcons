import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Mail, CheckCircle2, ArrowLeft, ShieldCheck, ArrowRight } from 'lucide-react';
import { Input } from '../../components/forms/FormField';
import Button from '../../components/common/Button';
import BrandMark from '../../components/common/BrandMark';
import { useTheme } from '../../context/ThemeContext';
import { requestPasswordReset } from '../../services/authService';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { isDark, toggleTheme } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Enter your email address.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    setLoading(true); setError('');
    try { await requestPasswordReset(email); setSent(true); }
    catch (requestError) { setError(requestError.message || 'Unable to send reset instructions.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--color-off-white)] px-4 py-10 transition-colors duration-300">
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        className="absolute right-4 top-4 rounded-full border border-[var(--color-border-gray)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--color-medium-green)] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
      >
        {isDark ? 'Light mode' : 'Dark mode'}
      </button>
      <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full border-[28px] border-[var(--gold)]/10" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full border-[32px] border-[var(--color-medium-green)]/10" aria-hidden="true" />
      <div className="relative w-full max-w-md animate-[fadeInUp_.45s_ease-out_both] motion-reduce:animate-none">
        <div className="mb-7 text-center">
          <BrandMark
            containerClassName="mx-auto mb-4 h-16 w-16 rounded-full border-4 border-[var(--surface)] bg-[var(--surface)] shadow-[0_16px_34px_rgba(15,108,255,0.14)]"
            imgClassName="p-1.5"
            fallback={<GraduationCap className="w-7 h-7 text-[var(--color-gold)]" aria-hidden="true" />}
          />
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--color-medium-green)]">Rambura Garçons Campus</p>
          <h1 className="font-display text-3xl font-bold text-[var(--color-heading)]">Reset your password</h1>
          <p className="mt-2 text-sm text-[var(--color-mid-gray)]">Recover access to your school account securely.</p>
        </div>

        <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border-gray)] bg-[var(--color-white)] shadow-[0_20px_48px_rgba(15,108,255,0.12)]">
          {sent ? (
            <div className="animate-[fadeInUp_.35s_ease-out_both] motion-reduce:animate-none px-7 py-9 text-center">
              <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-status-green-bg)] text-[var(--color-status-green)]"><CheckCircle2 className="h-8 w-8" aria-hidden="true" /></span>
              <p className="font-display text-lg font-semibold text-[var(--color-dark-gray)]">Check your email</p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-mid-gray)]">
                If an account exists for {email}, password reset instructions have been sent.
              </p>
              <Link to="/login" className="group mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--color-medium-green)] px-4 py-2.5 text-sm font-semibold text-[var(--color-deep-green)] shadow-[0_10px_22px_rgba(15,108,255,0.2)] transition-all hover:-translate-y-0.5 hover:bg-[var(--color-medium-green-600)]">
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 p-7" noValidate>
              {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
              <div className="flex items-start gap-3 rounded-xl border border-[var(--gold)]/20 bg-[var(--surface-hover)] p-3.5">
                <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--gold)]" aria-hidden="true" />
                <p className="text-xs leading-relaxed text-[var(--color-mid-gray)]">We will send a secure reset link to the email registered with your school account.</p>
              </div>
              <p className="text-sm leading-relaxed text-[var(--color-mid-gray)]">
                Enter the email associated with your account and we'll send you a link to reset your password.
              </p>
              <Input
                label="Email"
                icon={Mail}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@ramburagarcons.rw"
              />
              <Button type="submit" variant="primary" size="lg" className="group w-full" icon={ArrowRight} iconPosition="right" loading={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
              <p className="text-center text-sm">
                <Link to="/login" className="inline-flex items-center gap-1.5 font-semibold text-[var(--color-medium-green)] transition-colors hover:text-[var(--color-deep-green)]"><ArrowLeft className="h-3.5 w-3.5" /> Back to login</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
