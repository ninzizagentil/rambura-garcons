import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, EyeOff, GraduationCap, LogIn, ArrowLeft, AlertCircle, User, Lock,
  BookOpen, Package, Laptop, CalendarDays, ShieldCheck, Moon, Sun, HelpCircle, X,
  ChevronDown, MessageCircle, KeyRound,
} from 'lucide-react';
import { Input } from '../../components/forms/FormField';
import Button from '../../components/common/Button';
import HillRidgeDivider from '../../components/common/HillRidgeDivider';
import BrandMark from '../../components/common/BrandMark';
import { useAuth } from '../../context/AuthContext';
import { verifyLoginTwoFactor } from '../../services/authService';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { getHomePath } from '../../data/roles';
import { getSiteImage, useSiteImageVersion } from '../../services/imageService';
import { persistRememberedIdentifier, readRememberedIdentifier } from '../../utils/rememberMe';

const PANEL_MODULES = [
  { Icon: BookOpen, title: 'Library MIS', text: 'Books and borrowing' },
  { Icon: Package, title: 'Inventory MIS', text: 'Stock and supplies' },
  { Icon: Laptop, title: 'Equipment MIS', text: 'Assets and maintenance' },
  { Icon: CalendarDays, title: 'Events & Website', text: 'Content and events' },
];

// Demo one-click logins exist ONLY for local development (npm run dev) or when a demo site is built
// on purpose with VITE_SHOW_DEMO_ACCOUNTS=true. In a normal production build these constants are
// removed from the JavaScript, so default passwords are never shipped to visitors.
const SHOW_DEMO_ACCOUNTS = import.meta.env.DEV || import.meta.env.VITE_SHOW_DEMO_ACCOUNTS === 'true';
const ADMIN_ACCOUNT = SHOW_DEMO_ACCOUNTS ? { identifier: 'admin', password: 'Admin@123', role: 'Administrator' } : null;
const OTHER_DEMO_ACCOUNTS = SHOW_DEMO_ACCOUNTS ? [
  { identifier: 'librarian', password: 'Library@123', role: 'Librarian', access: 'Library' },
  { identifier: 'stock', password: 'Stock@123', role: 'Stock Manager', access: 'Inventory + Equipment' },
  { identifier: 'equipment', password: 'Equipment@123', role: 'Equipment MIS', access: 'Equipment & maintenance' },
  { identifier: 'director', password: 'Director@123', role: 'Management', access: 'Events + Reports' },
] : [];

const LOGIN_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const LOGIN_USERNAME_PATTERN = /^[A-Za-z0-9._-]+$/;
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
  useSiteImageVersion();
  const { login } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState(readRememberedIdentifier);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => !!readRememberedIdentifier());
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ identifier: '', password: '', verificationCode: '' });
  const [loading, setLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [challengeToken, setChallengeToken] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLeaving, setIsLeaving] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [openFaq, setOpenFaq] = useState('getting-started');

  const handleRememberToggle = (nextValue) => {
    setRememberMe(nextValue);
    if (nextValue) {
      persistRememberedIdentifier(identifier.trim() || '', true);
    } else {
      persistRememberedIdentifier('', false);
    }
  };

  const fillDemoAccount = (account) => {
    setError('');
    setIdentifier(account.identifier);
    setPassword(account.password);
    showToast(`${account.role} demo credentials filled in (${account.access}). Click Sign In to continue.`, 'info');
  };

  const redirectAfterLogin = (user) => {
    const redirectTo = getHomePath(user);
    navigate(redirectTo, { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const nextFieldErrors = { identifier: '', password: '', verificationCode: '' };
    if (twoFactorRequired && !/^\d{6}$/.test(verificationCode) && !/^[A-Fa-f0-9]{8}-[A-Fa-f0-9]{8}$/.test(verificationCode)) {
      nextFieldErrors.verificationCode = 'Enter a 6-digit authenticator code or a recovery code.';
    } else {
      const trimmedIdentifier = identifier.trim();
      const identifierIsEmail = trimmedIdentifier.includes('@');
      const validIdentifier = identifierIsEmail
        ? LOGIN_EMAIL_PATTERN.test(trimmedIdentifier)
        : LOGIN_USERNAME_PATTERN.test(trimmedIdentifier);
      if (!trimmedIdentifier) nextFieldErrors.identifier = 'Enter your username or email.';
      else if (!validIdentifier) nextFieldErrors.identifier = 'Enter a valid username or email address.';
      if (!password) nextFieldErrors.password = 'Enter your password.';
      else if (password.length < 8) nextFieldErrors.password = 'Password must be at least 8 characters.';
      if (identifier.length > 120) nextFieldErrors.identifier = 'Username or email must be 120 characters or fewer.';
      if (password.length > 200) nextFieldErrors.password = 'Password must be 200 characters or fewer.';
    }
    setFieldErrors(nextFieldErrors);
    if (Object.values(nextFieldErrors).some(Boolean)) {
      setError(twoFactorRequired ? 'Check the verification code and try again.' : 'Please enter your username or email and your password.');
      return;
    }
    setLoading(true);
    if (twoFactorRequired) {
      setLoading(true);
      const result = await verifyLoginTwoFactor(challengeToken, verificationCode);
      setLoading(false);
      if (!result.success) {
        setFieldErrors((current) => ({ ...current, verificationCode: result.error }));
        setError(result.error);
        return;
      }
      showToast('Welcome back, Administrator!', 'success');
      redirectAfterLogin(result.user);
      return;
    }
    const result = await login({ identifier: identifier.trim(), password });
    setLoading(false);
    if (result.requiresTwoFactor) {
      setChallengeToken(result.challengeToken);
      setTwoFactorRequired(true);
      setError('Enter the 6-digit code from your authenticator app or use a recovery code.');
      return;
    }
    if (!result.success) {
      if (result.errors?.length) {
        setFieldErrors((current) => result.errors.reduce((next, item) => ({ ...next, [item.field]: item.message }), current));
      }
      setError(result.error);
      showToast(result.error || 'Sign in failed. Please try again.', 'error');
      return;
    }

    showToast(`Welcome back, ${result.user?.name || result.user?.role || 'there'}!`, 'success');
    persistRememberedIdentifier(identifier, rememberMe);
    redirectAfterLogin(result.user);
  };

  const handleAdminLogin = async () => {
    if (!ADMIN_ACCOUNT) return;
    setError('');
    setAdminLoading(true);
    const result = await login({ identifier: ADMIN_ACCOUNT.identifier, password: ADMIN_ACCOUNT.password });
    setAdminLoading(false);
    if (result.requiresTwoFactor) {
      setChallengeToken(result.challengeToken);
      setTwoFactorRequired(true);
      setError('Enter the 6-digit code from your authenticator app or use a recovery code.');
      return;
    }
    if (!result.success) {
      setError(result.error);
      showToast(result.error || 'Administrator sign in failed.', 'error');
      return;
    }

    showToast('Signed in as Administrator.', 'success');
    persistRememberedIdentifier(ADMIN_ACCOUNT.identifier, rememberMe);
    redirectAfterLogin(result.user);
  };

  const handleBackToWebsite = (e) => {
    e.preventDefault();
    setIsLeaving(true);
  };

  const handleToggleTheme = () => {
    toggleTheme();
    showToast(isDark ? 'Light mode on' : 'Dark mode on', 'info', 2000);
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-off-white)] p-0 lg:p-4 overflow-y-auto overflow-x-hidden"
        >
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowHelp(true)}
              aria-label="Help & FAQ"
              className="p-2.5 rounded-full bg-[var(--surface)]/80 hover:bg-[var(--surface)] text-[var(--color-mid-gray)] hover:text-[var(--color-deep-green)] transition-all duration-200 shadow-sm hover:shadow-md backdrop-blur-sm"
            >
              <HelpCircle className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleToggleTheme}
              className="p-2.5 rounded-full bg-[var(--surface)]/80 hover:bg-[var(--surface)] text-[var(--color-mid-gray)] hover:text-[var(--color-deep-green)] transition-all duration-200 shadow-sm hover:shadow-md backdrop-blur-sm"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-5 h-5" aria-hidden="true" /> : <Moon className="w-5 h-5" aria-hidden="true" />}
            </button>
          </div>

          <div className="relative w-full max-w-6xl max-h-[92vh] min-h-0 grid lg:grid-cols-2 bg-[var(--surface)] lg:rounded-[2rem] overflow-y-auto overflow-x-hidden lg:shadow-card-hover">
            <div className="relative hidden lg:block overflow-hidden order-1">
              <img
                src={getSiteImage('login.background')}
                alt="Rambura Garçons campus, Nyabihu"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="relative h-full flex flex-col justify-between p-10 xl:p-14 pb-20">
                <div className="flex items-center gap-3 self-start rounded-2xl border border-white/30 bg-black/25 p-3 shadow-[0_12px_30px_rgba(0,0,0,0.16)] backdrop-blur-md dark:border-[#D5A24A]/35 dark:bg-[#0B2D26]/70">
                  <BrandMark
                    containerClassName="w-14 h-14 rounded-full bg-white shadow-lg shrink-0"
                    fallback={<GraduationCap className="w-7 h-7 text-[var(--color-deep-green)]" aria-hidden="true" />}
                  />
                  <div className="leading-tight">
                    <p className="font-display text-base font-extrabold text-white uppercase tracking-wide">Rambura Garçons</p>
                    <p className="text-[11px] font-semibold text-white/70 uppercase tracking-[0.2em] mt-0.5">TVET School</p>
                  </div>
                </div>

                <motion.div
                  className="rounded-2xl border border-[#D5A24A]/35 bg-[linear-gradient(135deg,rgba(12,44,37,0.92),rgba(15,65,56,0.82))] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.18)] backdrop-blur-md motion-reduce:animate-none"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4.5, ease: 'easeInOut', repeat: Infinity }}
                >
                  <div>
                    <h2 className="font-display text-4xl xl:text-[2.75rem] font-bold leading-[1.05] max-w-md text-[#F3F7F4] drop-shadow-[0_3px_12px_rgba(0,0,0,0.75)]">
                      Welcome <span className="text-[var(--color-light-green)] drop-shadow-[0_3px_12px_rgba(0,0,0,0.8)]">Back!</span>
                    </h2>
                    <p className="mt-3 text-sm font-black uppercase tracking-[0.18em] text-[var(--color-light-green)] drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                      Rambura Garçons Campus
                    </p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-[#E9F7F2] drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                      Nyabihu District, Rwanda
                    </p>
                    <p className="mt-3 max-w-sm text-sm font-semibold leading-relaxed text-[#F3F7F4] drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)]">
                      Sign in to access your School Management System
                    </p>

                    <blockquote className="mt-6 max-w-xs rounded-xl border border-[#D5A24A]/40 bg-[rgba(12,26,23,0.72)] px-4 py-3 font-display text-lg font-semibold italic leading-snug text-[#F9F6E8] shadow-[0_8px_24px_rgba(0,0,0,0.16)] drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                      "Quality Education for a Brighter Tomorrow"
                    </blockquote>
                  </div>
                </motion.div>

                <div className="mt-9 rounded-2xl border border-[#D5A24A]/35 bg-[rgba(12,26,23,0.62)] p-4 shadow-[0_12px_30px_rgba(0,0,0,0.16)] backdrop-blur-md">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#F2C66D]">School Management Modules</p>
                  <div className="grid grid-cols-2 gap-2.5">
                  {PANEL_MODULES.map(({ Icon, title, text }) => (
                    <div
                      key={title}
                      className={`flex items-center gap-2 rounded-xl border p-2.5 text-left transition-all duration-200 ${
                        isDark
                          ? 'border-[#D5A24A]/25 bg-[rgba(11,45,38,0.82)] text-[#F3F7F4]'
                          : 'border-white/20 bg-white/10 text-[#F3F7F4]'
                      }`}
                    >
                      <span
                        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-md ${
                          isDark ? 'bg-[linear-gradient(135deg,#D5A24A,#F2C66D)] text-[#0B2D26]' : 'bg-[linear-gradient(135deg,#0f766e,#22c55e)] text-white'
                        }`}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0"><span className="block text-[10px] font-bold uppercase tracking-[0.08em] leading-tight">{title}</span><span className="mt-0.5 block truncate text-[10px] text-white/65">{text}</span></span>
                    </div>
                  ))}
                  </div>
                </div>
              </div>
            </div>

            <svg
              className="hidden lg:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-28 h-full z-10 pointer-events-none"
              viewBox="0 0 100 900"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M100,0 C55,90 88,190 42,300 C82,410 34,520 78,630 C40,730 86,830 100,900 L100,900 Z"
                fill="var(--color-white)"
              />
            </svg>

            <div className="relative z-30 flex flex-col items-center justify-center px-5 py-8 sm:px-8 lg:px-10 lg:py-6 order-2">
              <img
                src={getSiteImage('login.form')}
                alt="Rambura Garçons campus"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="relative z-10 lg:hidden w-full max-w-md mb-8 rounded-2xl overflow-hidden h-40 shrink-0">
                <img
                  src={getSiteImage('login.background')}
                  alt="Rambura Garçons campus, Nyabihu"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="relative h-full flex flex-col justify-end p-4">
                  <h2 className="font-display text-lg font-bold text-white leading-tight">
                    Welcome <span className="text-[var(--color-light-green)]">Back!</span>
                  </h2>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-light-green)]">
                    Rambura Garçons Campus · Nyabihu
                  </p>
                </div>
                <div className="absolute bottom-0 left-0 right-0">
                  <HillRidgeDivider tone="light" />
                </div>
              </div>

              <div className="relative z-10 w-full max-w-sm rounded-3xl border border-white/70 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,33,63,0.18)] backdrop-blur-xl animate-[fadeInUp_.45s_ease-out_both] motion-reduce:animate-none dark:border-[#2B5448] dark:bg-[#103D34]/90 dark:shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:p-7">
                <button
                  type="button"
                  onClick={handleBackToWebsite}
                  className="group mb-5 inline-flex items-center gap-2 rounded-xl border border-[var(--color-medium-green)]/25 bg-white/70 px-3 py-2 text-sm font-bold text-[var(--color-deep-green)] shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-medium-green)]/50 hover:bg-[var(--color-light-green)]/80 hover:shadow-[0_8px_20px_rgba(15,108,255,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-medium-green)] focus-visible:ring-offset-2 active:translate-y-0 dark:border-[#D5A24A]/40 dark:bg-[#174C40]/80 dark:text-[#F3F7F4] dark:hover:bg-[#184D3C]"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" aria-hidden="true" />
                  Back to school website
                </button>

                <div className="flex animate-[fadeInUp_.45s_.08s_ease-out_both] motion-reduce:animate-none flex-col items-center text-center mb-6">
                  <div className="mb-6 transform transition-transform duration-300 hover:scale-110">
                    <BrandMark
                      containerClassName="w-20 h-20 rounded-full border-4 border-white bg-white shadow-[0_18px_42px_rgba(15,108,255,0.12)] shrink-0 dark:border-[#2B5448] dark:bg-[#174C40]"
                      imgClassName="p-2"
                      fallback={<GraduationCap className="w-10 h-10 text-[var(--color-deep-green)]" aria-hidden="true" />}
                    />
                  </div>
                  <div className="mb-4">
                    <p className="font-display text-2xl font-black text-[var(--color-deep-green)] uppercase tracking-wider dark:text-[#F3F7F4]">Rambura Garçons</p>
                    <p className="text-xs font-bold text-[var(--color-medium-green)] uppercase tracking-[0.3em] mt-1">TVET School · Nyabihu</p>
                  </div>
                  <h1 className="font-display text-3xl font-bold text-[var(--color-dark-gray)] mb-2 dark:text-[#F3F7F4]">Welcome back</h1>
                  <p className="text-sm text-[var(--color-mid-gray)] leading-relaxed dark:text-[#A9C0B9]">Sign in to your School Management System</p>
                </div>

                <div className="animate-[fadeInUp_.45s_.16s_ease-out_both] motion-reduce:animate-none mb-5 rounded-2xl border border-[var(--color-medium-green)]/20 bg-[var(--color-light-green)]/70 p-5 shadow-[0_10px_30px_rgba(15,108,255,0.08)] dark:border-[#D5A24A]/35 dark:bg-[#174C40]/80 dark:shadow-[0_10px_30px_rgba(0,0,0,0.22)] sm:p-6">
                  <AnimatePresence mode="wait">
                    <motion.div key="login-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <form onSubmit={handleSubmit} noValidate>
                          <div className="space-y-5">
                            {error && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                role="alert"
                                className="flex items-start gap-3 rounded-xl border border-[var(--color-status-red)]/40 bg-gradient-to-r from-[var(--color-status-red)]/5 to-[var(--color-status-red)]/10 p-4 text-sm text-[var(--color-status-red)] backdrop-blur-sm"
                              >
                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
                                <span className="font-medium">{error}</span>
                              </motion.div>
                            )}

                            {!twoFactorRequired && <>
                            <div>
                              <label className="block text-xs font-bold text-[var(--color-dark-gray)] uppercase tracking-wider mb-2.5 dark:text-[#F3F7F4]">
                                Username or Email
                              </label>
                              <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-light-green)] to-[var(--color-medium-green)] rounded-lg opacity-0 group-focus-within:opacity-5 transition-opacity duration-200" />
                                <Input
                                  icon={User}
                                  required
                                  autoComplete="username"
                                  autoFocus
                                  value={identifier}
                                  onChange={(e) => { setIdentifier(e.target.value); setFieldErrors((current) => ({ ...current, identifier: '' })); }}
                                  error={fieldErrors.identifier}
                                  placeholder="john.doe or john@school.edu"
                                  className="!bg-[var(--color-off-white)] !border-[var(--color-border-gray)] !focus:border-[var(--color-medium-green)]"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-[var(--color-dark-gray)] uppercase tracking-wider mb-2.5 dark:text-[#F3F7F4]">
                                Password
                              </label>
                              <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-light-green)] to-[var(--color-medium-green)] rounded-lg opacity-0 group-focus-within:opacity-5 transition-opacity duration-200" />
                                <Input
                                  icon={Lock}
                                  type={showPassword ? 'text' : 'password'}
                                  required
                                  autoComplete="current-password"
                                  value={password}
                                  onChange={(e) => { setPassword(e.target.value); setFieldErrors((current) => ({ ...current, password: '' })); }}
                                  error={fieldErrors.password}
                                  placeholder="••••••••"
                                  trailing={(
                                    <button
                                      type="button"
                                      onClick={() => setShowPassword((v) => !v)}
                                      className="rounded-md p-1 text-[var(--color-mid-gray)] transition-colors duration-200 hover:bg-[var(--color-light-green)]/30 hover:text-[var(--color-deep-green)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-medium-green)]"
                                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                  )}
                                  className="!bg-[var(--color-off-white)] !border-[var(--color-border-gray)] !focus:border-[var(--color-medium-green)]"
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                              <label className="inline-flex items-center gap-2.5 text-sm text-[var(--color-dark-gray)] cursor-pointer select-none group dark:text-[#F3F7F4]">
                                <input
                                  type="checkbox"
                                  checked={rememberMe}
                                  onChange={(e) => handleRememberToggle(e.target.checked)}
                                  className="w-4 h-4 rounded border-[var(--color-border-gray)] text-[var(--color-medium-green)] focus:ring-2 focus:ring-[var(--color-medium-green)] focus:ring-offset-1 transition-all"
                                />
                                <span className="font-medium">Remember me</span>
                              </label>
                              <Link
                                to="/forgot-password"
                                className="text-sm font-semibold text-[var(--color-medium-green)] hover:text-[var(--color-deep-green)] transition-colors duration-200 hover:underline underline-offset-2"
                              >
                                Forgot password?
                              </Link>
                            </div>
                            </>}

                            {twoFactorRequired && (
                              <div>
                                <label className="block text-xs font-bold text-[var(--color-dark-gray)] uppercase tracking-wider mb-2.5 dark:text-[#F3F7F4]">Authenticator code</label>
                                <Input
                                  icon={ShieldCheck}
                                  inputMode="numeric"
                                  autoComplete="one-time-code"
                                  maxLength={6}
                                  required
                                  autoFocus
                                  value={verificationCode}
                                  onChange={(e) => { setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setFieldErrors((current) => ({ ...current, verificationCode: '' })); }}
                                  error={fieldErrors.verificationCode}
                                  placeholder="123456"
                                  className="!bg-[var(--color-off-white)] !border-[var(--color-border-gray)]"
                                />
                                <button type="button" onClick={() => { setTwoFactorRequired(false); setChallengeToken(''); setVerificationCode(''); setError(''); }} className="mt-2 text-xs font-semibold text-[var(--color-medium-green)] hover:underline">Back to password sign in</button>
                              </div>
                            )}

                            {/* Login Button */}
                            <Button
                              type="submit"
                              variant="primary"
                              size="lg"
                              className="w-full !bg-gradient-to-r !from-[var(--button-primary)] !via-[var(--button-primary-hover)] !to-[var(--button-primary)] hover:!from-[var(--button-primary-hover)] hover:!via-[var(--button-primary)] hover:!to-[var(--button-primary-hover)] shadow-lg hover:shadow-xl !border-0 !text-white font-bold uppercase tracking-wide transition-all duration-200 group"
                              loading={loading}
                              icon={LogIn}
                            >
                              {loading ? 'Signing in...' : twoFactorRequired ? 'Verify code' : 'Sign In'}
                            </Button>
                          </div>
                        </form>
                      </motion.div>
                  </AnimatePresence>
                </div>

                {SHOW_DEMO_ACCOUNTS && (
                  <>
                {/* Divider */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--color-border-gray)] to-transparent" />
                  <span className="text-xs font-bold text-[var(--color-mid-gray)] uppercase tracking-wider">Or try demo</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--color-border-gray)] to-transparent" />
                </div>

                <div className="space-y-3 mb-6">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="w-full !border-2 !border-[var(--color-medium-green)] !bg-[var(--color-light-green-100)] !text-[var(--color-deep-green)] hover:!bg-[var(--color-medium-green)] hover:!text-white font-bold uppercase tracking-wide transition-all duration-200 group"
                    loading={adminLoading}
                    icon={ShieldCheck}
                    onClick={handleAdminLogin}
                  >
                    {adminLoading ? 'Signing in...' : 'Administrator Access'}
                  </Button>

                  <div className="grid grid-cols-3 gap-2">
                    {OTHER_DEMO_ACCOUNTS.map((account) => (
                      <motion.button
                        key={account.identifier}
                        type="button"
                        onClick={() => fillDemoAccount(account)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-3 rounded-lg text-xs font-bold text-white uppercase tracking-wide bg-gradient-to-br from-[var(--color-navy-800)] to-[var(--color-navy-900)] hover:from-[var(--color-deep-green)] hover:to-[var(--color-medium-green)] transition-all duration-200 border border-white/10 shadow-md hover:shadow-lg"
                      >
                        <span className="block leading-tight">{account.role.split(' ')[0]}<span className="mt-1 block text-[9px] font-medium normal-case tracking-normal text-white/75">{account.access}</span></span>
                      </motion.button>
                    ))}
                  </div>

                  <p className="text-center text-xs text-[var(--color-mid-gray)] mt-4 dark:text-[#A9C0B9]">
                    Demo accounts: use the role name as username
                  </p>
                </div>
                  </>
                )}

                {/* Footer */}
                <p className="text-center text-xs text-[var(--color-mid-gray)] dark:text-[#A9C0B9]">
                  © 2026 Rambura Garçons TVET Secondary School · Nyabihu, Rwanda
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Help & FAQ Modal */}
      <AnimatePresence>
        {showHelp && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHelp(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="pointer-events-auto w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-[var(--surface)] rounded-2xl shadow-xl border border-[var(--color-border-gray)]">
                {/* Header */}
                <div className="sticky top-0 flex items-center justify-between px-6 py-5 border-b border-[var(--color-border-gray)] bg-gradient-to-r from-[var(--color-light-green-100)] to-[var(--color-off-white)]">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-6 h-6 text-[var(--color-medium-green)]" aria-hidden="true" />
                    <h2 className="font-display text-xl font-bold text-[var(--color-dark-gray)] dark:text-[#F3F7F4]">Help & FAQ</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowHelp(false)}
                    className="p-1.5 rounded-lg hover:bg-[var(--color-off-white)] text-[var(--color-mid-gray)] hover:text-[var(--color-dark-gray)] transition-colors"
                    aria-label="Close help"
                  >
                    <X className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>

                <div className="space-y-3 p-5 sm:p-6">
                  {[
                    { id: 'getting-started', Icon: BookOpen, title: 'Getting started', content: <><p>Enter the username and password given to you by the school administrator.</p><p className="mt-2">If you forgot your password, use the "Forgot password" link on this page.</p></> },
                    { id: 'credentials', Icon: KeyRound, title: 'Login credentials', content: <><p>Enter the username or email address associated with your account, followed by your secure password.</p><p className="mt-2">Use <strong className="text-[var(--color-dark-gray)] dark:text-[#F3F7F4]">Forgot password?</strong> if you need to recover access.</p></> },
                    { id: 'security', Icon: ShieldCheck, title: 'Security tips', content: <ul className="space-y-2"><li>Never share your password or verification codes.</li><li>Use a strong, unique password.</li><li>Log out when using a shared computer.</li></ul> },
                  ].map(({ id, Icon, title, content }) => {
                    const expanded = openFaq === id;
                    return (
                      <div key={id} className="overflow-hidden rounded-xl border border-[var(--color-border-gray)] bg-[var(--surface-hover)] transition-colors">
                        <button type="button" onClick={() => setOpenFaq(expanded ? '' : id)} aria-expanded={expanded} aria-controls={`faq-${id}`} className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm font-semibold text-[var(--color-dark-gray)] hover:bg-[var(--color-light-green-100)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--gold)] dark:text-[#F3F7F4]">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-light-green-100)] text-[var(--color-medium-green)]"><Icon className="h-4 w-4" aria-hidden="true" /></span>
                          <span className="flex-1">{title}</span>
                          <ChevronDown className={`h-4 w-4 text-[var(--color-mid-gray)] transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
                        </button>
                        {expanded && <div id={`faq-${id}`} className="border-t border-[var(--color-border-gray)] px-4 pb-4 pt-3 text-sm leading-relaxed text-[var(--color-mid-gray)] dark:text-[#A9C0B9]">{content}</div>}
                      </div>
                    );
                  })}
                  <div className="mt-4 flex items-start gap-3 rounded-xl border border-[var(--gold)]/20 bg-[var(--color-light-green-100)] p-4">
                    <MessageCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--color-medium-green)]" aria-hidden="true" />
                    <div><h3 className="font-semibold text-[var(--color-dark-gray)] dark:text-[#F3F7F4]">Still need help?</h3><p className="mt-1 text-sm text-[var(--color-mid-gray)] dark:text-[#A9C0B9]">Contact your system administrator or email <a href="mailto:info@ramburagarcons.rw" className="font-semibold text-[var(--color-medium-green)] hover:text-[var(--color-deep-green)]">info@ramburagarcons.rw</a>.</p></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}
