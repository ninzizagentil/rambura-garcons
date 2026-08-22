import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, GraduationCap, LogIn, ArrowLeft, AlertCircle, User, Lock } from 'lucide-react';
import { Input } from '../../components/forms/FormField';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { ROLE_HOME, NAV_BY_ROLE } from '../../data/roles';
import { getSiteImage } from '../../services/imageService';

// Shared, non-role-specific routes any authenticated user may return to.
const SHARED_ROUTES = ['/notifications', '/profile', '/change-password'];

// Guards against redirecting back to a page the freshly-logged-in role
// can't actually see (e.g. a director who was previously bounced off an
// admin-only URL would otherwise be sent right back into another bounce,
// landing on Access Restricted immediately after logging in).
function isPathAllowedForRole(pathname, role) {
  if (!pathname) return false;
  if (SHARED_ROUTES.includes(pathname)) return true;
  const navItems = NAV_BY_ROLE[role] || [];
  return navItems.some((item) => pathname === item.to || pathname.startsWith(`${item.to}/`));
}

const DEMO_ACCOUNTS = [
  { identifier: 'admin', password: 'Admin@123', role: 'Administrator' },
  { identifier: 'librarian', password: 'Library@123', role: 'Librarian' },
  { identifier: 'stock', password: 'Stock@123', role: 'Stock Manager' },
  { identifier: 'director', password: 'Director@123', role: 'Management' },
];

// Smooth, elegant slide-in-from-left + fade. Applied only to the Login page.
const pageVariants = {
  initial: { x: '-100%', opacity: 0 },
  animate: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    x: '-100%',
    opacity: 0,
    transition: { duration: 0.6, ease: [0.65, 0, 0.35, 1] },
  },
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const fillDemoAccount = (account) => {
    setError('');
    setIdentifier(account.identifier);
    setPassword(account.password);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!identifier || !password) {
      setError('Please enter your username or email and your password.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const result = login({ identifier, password });
      setLoading(false);
      if (!result.success) {
        setError(result.error);
        return;
      }
      const from = location.state?.from?.pathname;
      const redirectTo = isPathAllowedForRole(from, result.user.role)
        ? from
        : ROLE_HOME[result.user.role] || '/';
      navigate(redirectTo, { replace: true });
    }, 400);
  };

  // Play the slide-out/fade-out exit animation, then leave the page.
  const handleBackToWebsite = (e) => {
    e.preventDefault();
    setIsLeaving(true);
  };

  return (
    <AnimatePresence onExitComplete={() => navigate('/')}>
      {!isLeaving && (
        <motion.div
          key="login-page"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="fixed inset-0 z-50 overflow-y-auto grid lg:grid-cols-2 bg-gradient-to-b from-[var(--color-navy-800)] to-[var(--color-navy-900)]"
        >
          {/* Left — campus photo, dark overlay (hidden on mobile) */}
          <div className="relative hidden lg:block overflow-hidden order-1">
            <img
              src={getSiteImage('home.hero')}
              alt="Rambura Garçons campus, Nyabihu"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-navy-900)] via-[var(--color-navy-900)]/50 to-[var(--color-navy-900)]/20" />
            <div className="relative h-full flex flex-col justify-end p-10 xl:p-14">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl p-7">
                <span className="inline-block text-xs font-semibold tracking-wide uppercase text-[var(--color-gold)] mb-3">
                  Nyabihu District · TVET School
                </span>
                <h2 className="font-display text-3xl font-semibold leading-tight max-w-md text-white">
                  Skilled hands. Disciplined minds. Built on Nyabihu's hills.
                </h2>
                <p className="text-white/70 mt-4 max-w-sm text-sm">
                  Sign in to manage the library, stock, staff, and school records.
                </p>
              </div>
            </div>
          </div>

          {/* Right — login form, dark panel to match the Admission form styling */}
          <div className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10 lg:py-16 order-2">
            <div className="w-full max-w-md">
              <button
                type="button"
                onClick={handleBackToWebsite}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-white/60 hover:text-white transition-colors mb-8"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                Back to school website
              </button>

              <div className="mb-8">
                <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--color-gold)] mb-4">
                  <GraduationCap className="w-7 h-7 text-white" aria-hidden="true" />
                </span>
                <h1 className="font-display text-2xl font-semibold text-white">Rambura Garçons</h1>
                <p className="text-sm text-white/60 mt-1">School Management System</p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="bg-white/[0.04] backdrop-blur-sm rounded-2xl border border-white/10 shadow-xl p-6 sm:p-8"
                noValidate
              >
                <h2 className="font-display text-xl font-semibold text-white">Sign in to your account</h2>
                <span className="block w-10 h-1 rounded-full bg-[var(--color-gold)] mt-2 mb-6" aria-hidden="true" />

                <div className="space-y-5">
                  {error && (
                    <div
                      role="alert"
                      className="flex items-start gap-2.5 rounded-[var(--radius-control)] border border-red-500/30 bg-red-500/10 p-3.5 text-sm text-red-300"
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{error}</span>
                    </div>
                  )}

                  <Input
                    dark
                    icon={User}
                    label="Username or Email"
                    required
                    autoComplete="username"
                    autoFocus
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. librarian"
                  />

                  <div className="relative">
                    <Input
                      dark
                      icon={Lock}
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-[38px] text-white/45 hover:text-white transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex justify-end">
                    <Link to="/forgot-password" className="text-sm font-medium text-[var(--color-gold)] hover:underline">
                      Forgot password?
                    </Link>
                  </div>

                  <Button type="submit" variant="gold" size="lg" className="w-full" loading={loading} icon={LogIn}>
                    Login
                  </Button>
                </div>
              </form>

              <div className="mt-6 bg-white/[0.04] backdrop-blur-sm border border-white/10 rounded-2xl p-4 text-xs text-white/70">
                <p className="font-semibold text-white mb-1.5">Demo accounts</p>
                <p className="text-white/50 mb-2">Tap an account to fill in the form.</p>
                <ul className="space-y-1">
                  {DEMO_ACCOUNTS.map((account) => (
                    <li key={account.identifier}>
                      <button
                        type="button"
                        onClick={() => fillDemoAccount(account)}
                        className="w-full flex items-center justify-between gap-2 rounded-[var(--radius-control)] px-2 py-1.5 -mx-2 text-left text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        <span>
                          <span className="font-medium text-white">{account.identifier}</span>
                          {' / '}
                          {account.password}
                        </span>
                        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-gold)]">
                          {account.role}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
