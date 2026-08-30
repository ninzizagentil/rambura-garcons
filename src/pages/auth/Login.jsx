import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, EyeOff, GraduationCap, LogIn, ArrowLeft, AlertCircle, User, Lock,
  BookOpen, Users, Trophy, ShieldCheck, Moon, Sun, HelpCircle, X, Smartphone,
  CheckCircle2, Clock, ArrowRight,
} from 'lucide-react';
import { Input } from '../../components/forms/FormField';
import Button from '../../components/common/Button';
import HillRidgeDivider from '../../components/common/HillRidgeDivider';
import BrandMark from '../../components/common/BrandMark';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ROLE_HOME, NAV_BY_ROLE } from '../../data/roles';
import { getSiteImage, useSiteImageVersion } from '../../services/imageService';

const PANEL_HIGHLIGHTS = [
  { Icon: BookOpen, text: 'Learn More' },
  { Icon: Users, text: 'Build Skills' },
  { Icon: Trophy, text: 'Achieve Success' },
];

const SHARED_ROUTES = ['/notifications', '/profile', '/change-password'];

function isPathAllowedForRole(pathname, role) {
  if (!pathname) return false;
  if (SHARED_ROUTES.includes(pathname)) return true;
  const navItems = NAV_BY_ROLE[role] || [];
  return navItems.some((item) => pathname === item.to || pathname.startsWith(`${item.to}/`));
}

const ADMIN_ACCOUNT = { identifier: 'admin', password: 'Admin@123', role: 'Administrator' };
const OTHER_DEMO_ACCOUNTS = [
  { identifier: 'librarian', password: 'Library@123', role: 'Librarian' },
  { identifier: 'stock', password: 'Stock@123', role: 'Stock Manager' },
  { identifier: 'director', password: 'Director@123', role: 'Management' },
];

const REMEMBER_KEY = 'rg_remember_identifier';
const DEMO_2FA_EMAIL = 'ninzizaaime31@gmail.com';

const generateTwoFACode = () => String(Math.floor(100000 + Math.random() * 900000));

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
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFAEmailCode, setTwoFAEmailCode] = useState('');
  const [twoFAError, setTwoFAError] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark-public', isDark);
    root.classList.toggle('dark', isDark);
    root.style.colorScheme = isDark ? 'dark' : 'light';

    return () => {
      root.classList.remove('dark-public', 'dark');
      root.style.colorScheme = '';
    };
  }, [isDark]);

  useEffect(() => {
    const saved = window.localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      setIdentifier(saved);
      setRememberMe(true);
    }
  }, []);

  const persistRememberedIdentifier = (id, remember) => {
    if (remember) {
      window.localStorage.setItem(REMEMBER_KEY, id);
    } else {
      window.localStorage.removeItem(REMEMBER_KEY);
    }
  };

  const fillDemoAccount = (account) => {
    setError('');
    setIdentifier(account.identifier);
    setPassword(account.password);
  };

  const redirectAfterLogin = (user) => {
    const from = location.state?.from?.pathname;
    const redirectTo = isPathAllowedForRole(from, user.role) ? from : ROLE_HOME[user.role] || '/';
    navigate(redirectTo, { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!identifier || !password) {
      setError('Please enter your username or email and your password.');
      return;
    }
    setLoading(true);
    const result = await login({ identifier, password });
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }

    persistRememberedIdentifier(identifier, rememberMe);
    redirectAfterLogin(result.user);
  };

  const handleVerify2FA = async () => {
    setTwoFAError('');
    if (!twoFACode || twoFACode.length !== 6 || !/^\d+$/.test(twoFACode)) {
      setTwoFAError('Please enter a valid 6-digit code.');
      return;
    }
    if (twoFACode !== twoFAEmailCode) {
      setTwoFAError(`Incorrect code. Use the verification code sent to ${DEMO_2FA_EMAIL}.`);
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    setLoading(false);

    const result = await login({ identifier, password });
    if (result.success) {
      persistRememberedIdentifier(identifier, rememberMe);
      redirectAfterLogin(result.user);
    }
  };

  const handleAdminLogin = async () => {
    setError('');
    setAdminLoading(true);
    const result = await login({ identifier: ADMIN_ACCOUNT.identifier, password: ADMIN_ACCOUNT.password });
    setAdminLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }

    persistRememberedIdentifier(ADMIN_ACCOUNT.identifier, rememberMe);
    redirectAfterLogin(result.user);
  };

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
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-off-white)] p-0 lg:p-4 overflow-y-auto overflow-x-hidden"
        >
          {/* Theme & Help Buttons */}
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowHelp(true)}
              aria-label="Help & FAQ"
              className="p-2.5 rounded-full bg-white/80 hover:bg-white text-[var(--color-mid-gray)] hover:text-[var(--color-deep-green)] transition-all duration-200 shadow-sm hover:shadow-md backdrop-blur-sm"
            >
              <HelpCircle className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2.5 rounded-full bg-white/80 hover:bg-white text-[var(--color-mid-gray)] hover:text-[var(--color-deep-green)] transition-all duration-200 shadow-sm hover:shadow-md backdrop-blur-sm"
            >
              {isDark ? <Sun className="w-5 h-5" aria-hidden="true" /> : <Moon className="w-5 h-5" aria-hidden="true" />}
            </button>
          </div>

          <div className="relative w-full max-w-6xl max-h-[92vh] min-h-0 grid lg:grid-cols-2 bg-[var(--color-white)] lg:rounded-[2rem] overflow-y-auto overflow-x-hidden lg:shadow-card-hover">

            <div className="relative hidden lg:block overflow-hidden order-1">
              <img
                src={getSiteImage('home.hero')}
                alt="Rambura Garçons campus, Nyabihu"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-navy-900)]/98 via-[var(--color-navy-800)]/90 to-[var(--color-navy-900)]/75" />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-navy-900)]/100 via-[var(--color-navy-900)]/20 to-transparent" />

              <div className="relative h-full flex flex-col justify-between p-10 xl:p-14 pb-20">
                <div className="flex items-center gap-3">
                  <BrandMark
                    containerClassName="w-14 h-14 rounded-full bg-white shadow-lg shrink-0"
                    fallback={<GraduationCap className="w-7 h-7 text-[var(--color-deep-green)]" aria-hidden="true" />}
                  />
                  <div className="leading-tight">
                    <p className="font-display text-base font-extrabold text-white uppercase tracking-wide">Rambura Garçons</p>
                    <p className="text-[11px] font-semibold text-white/70 uppercase tracking-[0.2em] mt-0.5">TVET School</p>
                  </div>
                </div>

                <div>
                  <h2 className="font-display text-4xl xl:text-[2.75rem] font-bold leading-[1.05] max-w-md text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.75)]">
                    Welcome <span className="text-[var(--color-light-green)] drop-shadow-[0_4px_18px_rgba(0,0,0,0.8)]">Back!</span>
                  </h2>
                  <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/95 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                    Sign in to access your School Management System
                  </p>

                  <blockquote className="mt-6 pl-4 border-l-2 border-[var(--color-light-green)] text-white/95 font-display font-semibold italic text-lg max-w-xs leading-snug drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                    "Quality Education for a Brighter Tomorrow"
                  </blockquote>

                  <div className="flex flex-wrap gap-x-7 gap-y-4 mt-9">
                    {PANEL_HIGHLIGHTS.map(({ Icon, text }) => (
                      <div key={text} className="flex flex-col items-center gap-2 w-16 text-center">
                        <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--color-medium-green)] text-white shrink-0 shadow-md">
                          <Icon className="w-5 h-5" aria-hidden="true" />
                        </span>
                        <span className="text-white text-xs font-semibold leading-tight">{text}</span>
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

            {/* Diagonal hill-ridge wave sash across the bottom of the whole
                card — the Nyabihu motif standing in for the wave in the
                reference layout. Desktop only (mobile uses its own strip). */}
            <svg
              className="hidden lg:block absolute bottom-0 left-0 w-full h-24 z-20 pointer-events-none"
              viewBox="0 0 1400 220"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M0,220 L0,120 C160,60 320,150 500,100 C660,55 820,170 980,120 C1120,80 1240,190 1400,150 L1400,220 Z"
                fill="var(--color-medium-green)"
              />
              <path
                d="M0,220 L0,150 C170,105 330,175 510,140 C670,105 830,190 990,155 C1130,120 1250,205 1400,175 L1400,220 Z"
                fill="var(--color-light-green)"
                opacity="0.55"
              />
            </svg>

            {/* Right — login form panel, now with the campus itself as the
                backdrop instead of flat white: a soft white wash keeps the
                form easy to read while the photo shows through around it */}
            <div className="relative z-30 flex flex-col items-center justify-center px-5 py-8 sm:px-8 lg:px-10 lg:py-6 order-2">
              <img
                src={getSiteImage('about.campus')}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-[var(--color-white)]/92" />

              {/* Mobile-only compact hero strip */}
              <div className="relative z-10 lg:hidden w-full max-w-md mb-8 rounded-2xl overflow-hidden h-40 shrink-0">
                <img
                  src={getSiteImage('home.hero')}
                  alt="Rambura Garçons campus, Nyabihu"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-navy-900)] via-[var(--color-navy-900)]/60 to-[var(--color-navy-900)]/20" />
                <div className="relative h-full flex flex-col justify-end p-4">
                  <h2 className="font-display text-lg font-bold text-white leading-tight">
                    Welcome <span className="text-[var(--color-light-green)]">Back!</span>
                  </h2>
                </div>
                <div className="absolute bottom-0 left-0 right-0">
                  <HillRidgeDivider tone="light" />
                </div>
              </div>

              <div className="relative z-10 w-full max-w-sm">
                <button
                  type="button"
                  onClick={handleBackToWebsite}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-mid-gray)] hover:text-[var(--color-deep-green)] transition-colors duration-200 mb-5 group"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" aria-hidden="true" />
                  Back to school website
                </button>

                {/* Premium header section with brand */}
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="mb-6 transform transition-transform duration-300 hover:scale-110">
                    <BrandMark
                      containerClassName="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--color-light-green)] to-[var(--color-medium-green)] border-4 border-white shadow-lg shrink-0"
                      fallback={<GraduationCap className="w-10 h-10 text-white" aria-hidden="true" />}
                    />
                  </div>
                  <div className="mb-4">
                    <p className="font-display text-2xl font-black text-[var(--color-deep-green)] uppercase tracking-wider">Rambura Garçons</p>
                    <p className="text-xs font-bold text-[var(--color-medium-green)] uppercase tracking-[0.3em] mt-1">TVET School · Nyabihu</p>
                  </div>
                  <h1 className="font-display text-3xl font-bold text-[var(--color-dark-gray)] mb-2">Welcome back</h1>
                  <p className="text-sm text-[var(--color-mid-gray)] leading-relaxed">Sign in to your School Management System</p>
                </div>

                {/* Elevated form card */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/40 p-5 sm:p-6 mb-5 shadow-lg">
                  <AnimatePresence mode="wait">
                    {!twoFAEnabled ? (
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

                            {/* Username/Email Field */}
                            <div>
                              <label className="block text-xs font-bold text-[var(--color-dark-gray)] uppercase tracking-wider mb-2.5">
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
                                  onChange={(e) => setIdentifier(e.target.value)}
                                  placeholder="john.doe or john@school.edu"
                                  className="!bg-[var(--color-off-white)] !border-[var(--color-border-gray)] !focus:border-[var(--color-medium-green)]"
                                />
                              </div>
                            </div>

                            {/* Password Field */}
                            <div>
                              <label className="block text-xs font-bold text-[var(--color-dark-gray)] uppercase tracking-wider mb-2.5">
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
                                  onChange={(e) => setPassword(e.target.value)}
                                  placeholder="••••••••"
                                  className="!bg-[var(--color-off-white)] !border-[var(--color-border-gray)] !focus:border-[var(--color-medium-green)]"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword((v) => !v)}
                                  className="absolute right-3 top-10 text-[var(--color-mid-gray)] hover:text-[var(--color-deep-green)] transition-colors duration-200"
                                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>

                            {/* Remember & Forgot */}
                            <div className="flex items-center justify-between pt-2">
                              <label className="inline-flex items-center gap-2.5 text-sm text-[var(--color-dark-gray)] cursor-pointer select-none group">
                                <input
                                  type="checkbox"
                                  checked={rememberMe}
                                  onChange={(e) => setRememberMe(e.target.checked)}
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

                            {/* Login Button */}
                            <Button
                              type="submit"
                              variant="primary"
                              size="lg"
                              className="w-full !bg-gradient-to-r !from-[var(--color-deep-green)] !via-[var(--color-medium-green)] !to-[var(--color-deep-green-600)] shadow-lg hover:shadow-xl !border-0 !text-white font-bold uppercase tracking-wide transition-all duration-200 group"
                              loading={loading}
                              icon={LogIn}
                            >
                              {loading ? 'Signing in...' : 'Sign In'}
                            </Button>
                          </div>
                        </form>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="2fa-form"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex min-h-[320px] items-center justify-center"
                      >
                        <form onSubmit={(e) => { e.preventDefault(); handleVerify2FA(); }} className="w-full max-w-sm mx-auto">
                          <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--color-light-green-100)] mb-4">
                              <Smartphone className="w-7 h-7 text-[var(--color-medium-green)]" aria-hidden="true" />
                            </div>
                            <h2 className="font-display text-2xl font-bold text-[var(--color-dark-gray)] mb-2">Two-Factor Authentication</h2>
                            <p className="text-sm text-[var(--color-mid-gray)]">Verification code sent to {DEMO_2FA_EMAIL}</p>
                          </div>

                          <div className="space-y-5">
                            <div className="rounded-xl border border-[var(--color-border-gray)] bg-[var(--color-light-green-100)] p-3 text-center">
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-mid-gray)]">Email Verification Code</p>
                              <div className="mt-2 text-3xl font-black tracking-[0.35em] text-[var(--color-deep-green)]">{twoFAEmailCode || '••••••'}</div>
                            </div>
                            {twoFAError && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                role="alert"
                                className="flex items-start gap-3 rounded-xl border border-[var(--color-status-red)]/40 bg-gradient-to-r from-[var(--color-status-red)]/5 to-[var(--color-status-red)]/10 p-4 text-sm text-[var(--color-status-red)]"
                              >
                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
                                <span className="font-medium">{twoFAError}</span>
                              </motion.div>
                            )}

                            <div>
                              <label className="block text-xs font-bold text-[var(--color-dark-gray)] uppercase tracking-wider mb-2.5 text-center">
                                Verification Code
                              </label>
                              <input
                                type="text"
                                maxLength="6"
                                inputMode="numeric"
                                value={twoFACode}
                                onChange={(e) => {
                                  const next = e.target.value.replace(/\D/g, '').slice(0, 6);
                                  setTwoFACode(next);
                                  if (next.length === 6) {
                                    setTimeout(() => handleVerify2FA(), 120);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleVerify2FA();
                                  }
                                }}
                                placeholder="000000"
                                className="w-full px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] rounded-lg border-2 border-[var(--color-border-gray)] bg-[var(--color-off-white)] text-[var(--color-dark-gray)] placeholder-[var(--color-mid-gray)] focus:outline-none focus:border-[var(--color-medium-green)] focus:ring-2 focus:ring-[var(--color-medium-green)]/20 transition-all"
                              />
                            </div>

                            <Button
                              type="submit"
                              variant="primary"
                              size="lg"
                              className="w-full !bg-gradient-to-r !from-[var(--color-deep-green)] !via-[var(--color-medium-green)] !to-[var(--color-deep-green-600)] shadow-lg hover:shadow-xl !border-0 !text-white font-bold uppercase tracking-wide transition-all duration-200"
                              loading={loading}
                              icon={CheckCircle2}
                            >
                              {loading ? 'Verifying...' : 'Verify & Sign In'}
                            </Button>

                            <button
                              type="button"
                              onClick={() => setTwoFAEnabled(false)}
                              className="w-full py-2.5 text-sm font-semibold text-[var(--color-medium-green)] hover:text-[var(--color-deep-green)] transition-colors"
                            >
                              Back to Sign In
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--color-border-gray)] to-transparent" />
                  <span className="text-xs font-bold text-[var(--color-mid-gray)] uppercase tracking-wider">Or try demo</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--color-border-gray)] to-transparent" />
                </div>

                {/* Demo Accounts Section */}
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
                        className="px-4 py-3 rounded-lg text-xs font-bold text-white uppercase tracking-wide bg-gradient-to-br from-[var(--color-mid-gray)] to-[var(--color-dark-gray)] hover:from-[var(--color-deep-green)] hover:to-[var(--color-medium-green)] transition-all duration-200 border border-white/10 shadow-md hover:shadow-lg"
                      >
                        {account.role.split(' ')[0]}
                      </motion.button>
                    ))}
                  </div>

                  <p className="text-center text-xs text-[var(--color-mid-gray)] mt-4">
                    Demo accounts: use the role name as username
                  </p>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-[var(--color-mid-gray)]">
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
              <div className="pointer-events-auto w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-[var(--color-white)] rounded-2xl shadow-xl border border-[var(--color-border-gray)]">
                {/* Header */}
                <div className="sticky top-0 flex items-center justify-between px-6 py-5 border-b border-[var(--color-border-gray)] bg-gradient-to-r from-[var(--color-light-green-100)] to-[var(--color-off-white)]">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-6 h-6 text-[var(--color-medium-green)]" aria-hidden="true" />
                    <h2 className="font-display text-xl font-bold text-[var(--color-dark-gray)]">Help & FAQ</h2>
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

                {/* Content */}
                <div className="p-6 space-y-6">
                  {/* Getting Started */}
                  <div>
                    <h3 className="font-semibold text-[var(--color-dark-gray)] mb-3 flex items-center gap-2">
                      <span className="text-lg">🚀</span> Getting Started
                    </h3>
                    <div className="space-y-2 text-sm text-[var(--color-mid-gray)] ml-7">
                      <p>
                        <strong>Demo Accounts:</strong> You can quickly test the system using the demo account buttons below the login form. No password needed — just click the role.
                      </p>
                      <p>
                        <strong>Admin Access:</strong> Use "Administrator Access" button to log in as the admin user (admin / Admin@123).
                      </p>
                    </div>
                  </div>

                  {/* Credentials */}
                  <div className="border-t border-[var(--color-border-gray)] pt-6">
                    <h3 className="font-semibold text-[var(--color-dark-gray)] mb-3 flex items-center gap-2">
                      <span className="text-lg">👤</span> Login Credentials
                    </h3>
                    <div className="space-y-2 text-sm text-[var(--color-mid-gray)] ml-7">
                      <p>
                        <strong>Username/Email:</strong> Enter your username or email address associated with your account.
                      </p>
                      <p>
                        <strong>Password:</strong> Your secure password. Use "Forgot password?" if you need to reset it.
                      </p>
                      <p>
                        <strong>Remember Me:</strong> Keep you signed in on this device (secure browsers only).
                      </p>
                    </div>
                  </div>

                  {/* 2FA */}
                  <div className="border-t border-[var(--color-border-gray)] pt-6">
                    <h3 className="font-semibold text-[var(--color-dark-gray)] mb-3 flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-[var(--color-medium-green)]" /> Two-Factor Authentication
                    </h3>
                    <div className="space-y-2 text-sm text-[var(--color-mid-gray)] ml-7">
                      <p>
                        <strong>What is 2FA?</strong> An extra security layer that requires a 6-digit code from your authenticator app or SMS.
                      </p>
                      <p>
                        <strong>How it works:</strong> After entering your password, you'll see a screen asking for your 2FA code. Enter the code from your authenticator app.
                      </p>
                      <p>
                        <strong>For testing:</strong> Use any 6-digit number (e.g., 000000) in demo mode.
                      </p>
                    </div>
                  </div>

                  {/* Security */}
                  <div className="border-t border-[var(--color-border-gray)] pt-6">
                    <h3 className="font-semibold text-[var(--color-dark-gray)] mb-3 flex items-center gap-2">
                      <span className="text-lg">🔒</span> Security Tips
                    </h3>
                    <ul className="space-y-2 text-sm text-[var(--color-mid-gray)] ml-7">
                      <li>• Never share your password or 2FA codes with anyone</li>
                      <li>• Use a strong, unique password for your account</li>
                      <li>• Log out when using shared computers</li>
                      <li>• Report suspicious activity immediately</li>
                    </ul>
                  </div>

                  {/* Support */}
                  <div className="border-t border-[var(--color-border-gray)] pt-6 bg-[var(--color-light-green-100)] rounded-lg p-4">
                    <h3 className="font-semibold text-[var(--color-dark-gray)] mb-2 flex items-center gap-2">
                      <span className="text-lg">💬</span> Still Need Help?
                    </h3>
                    <p className="text-sm text-[var(--color-mid-gray)]">
                      Contact your system administrator or email{' '}
                      <a href="mailto:support@school.edu" className="font-semibold text-[var(--color-medium-green)] hover:text-[var(--color-deep-green)]">
                        support@school.edu
                      </a>
                    </p>
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
