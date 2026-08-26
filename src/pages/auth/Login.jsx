import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, EyeOff, GraduationCap, LogIn, ArrowLeft, AlertCircle, User, Lock,
  BookOpen, Users, Trophy, ShieldCheck,
} from 'lucide-react';
import { Input } from '../../components/forms/FormField';
import Button from '../../components/common/Button';
import HillRidgeDivider from '../../components/common/HillRidgeDivider';
import BrandMark from '../../components/common/BrandMark';
import { useAuth } from '../../context/AuthContext';
import { ROLE_HOME, NAV_BY_ROLE } from '../../data/roles';
import { getSiteImage } from '../../services/imageService';

// Same highlight-strip icons used on the public Home hero, so the login
// screen reads as the same site rather than a bolted-on admin tool.
const PANEL_HIGHLIGHTS = [
  { Icon: BookOpen, text: 'Learn More' },
  { Icon: Users, text: 'Build Skills' },
  { Icon: Trophy, text: 'Achieve Success' },
];

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

const ADMIN_ACCOUNT = { identifier: 'admin', password: 'Admin@123', role: 'Administrator' };
const OTHER_DEMO_ACCOUNTS = [
  { identifier: 'librarian', password: 'Library@123', role: 'Librarian' },
  { identifier: 'stock', password: 'Stock@123', role: 'Stock Manager' },
  { identifier: 'director', password: 'Director@123', role: 'Management' },
];

const REMEMBER_KEY = 'rg_remember_identifier';

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
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // Restore a remembered username on mount, if one was saved.
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

  // "Login with Administrator" — a one-tap shortcut straight into the
  // admin demo account, without the person needing to type credentials.
  const handleAdminLogin = async () => {
    setError('');
    setAdminLoading(true);
    const result = await login({ identifier: ADMIN_ACCOUNT.identifier, password: ADMIN_ACCOUNT.password });
    setAdminLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    redirectAfterLogin(result.user);
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
          className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-[var(--color-off-white)] p-0 lg:p-6"
        >
          <div className="relative w-full lg:max-w-6xl lg:min-h-[720px] grid lg:grid-cols-2 bg-[var(--color-white)] lg:rounded-[2rem] overflow-hidden lg:shadow-card-hover">

            {/* Left — campus photo hero with curved seam + hill-ridge wave,
                hidden on mobile in favour of the compact strip below */}
            <div className="relative hidden lg:block overflow-hidden order-1">
              <img
                src={getSiteImage('home.hero')}
                alt="Rambura Garçons campus, Nyabihu"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-navy-900)]/95 via-[var(--color-navy-800)]/85 to-[var(--color-navy-900)]/60" />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-navy-900)]/95 via-[var(--color-navy-900)]/10 to-transparent" />

              <div className="relative h-full flex flex-col justify-between p-10 xl:p-14 pb-20">
                {/* Logo lockup, echoing the shield + name pairing of a
                    school letterhead */}
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
                  <h2 className="font-display text-4xl xl:text-[2.75rem] font-bold leading-[1.05] max-w-md text-white">
                    Welcome <span className="text-[var(--color-light-green)]">Back!</span>
                  </h2>
                  <p className="text-white/80 mt-3 max-w-sm text-sm leading-relaxed">
                    Sign in to access your School Management System
                  </p>

                  <blockquote className="mt-6 pl-4 border-l-2 border-[var(--color-light-green)] text-white font-display font-semibold italic text-lg max-w-xs leading-snug">
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

            {/* Curved white seam along the panel boundary — a wavy vertical
                strip that "carves" the join between photo and form panels,
                instead of a hard straight line. Desktop only. */}
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
            <div className="relative z-30 flex flex-col items-center justify-center px-5 py-10 sm:px-8 lg:px-12 lg:py-14 order-2 overflow-hidden">
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
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-mid-gray)] hover:text-[var(--color-deep-green)] transition-colors mb-6"
                >
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  Back to school website
                </button>

                {/* Logo lockup + heading — same circular badge and stacked
                    name/subtitle used in the public site header, so the
                    logo reads clearly and consistently everywhere */}
                <div className="flex flex-col items-center text-center mb-7">
                  <div className="flex items-center gap-3 mb-5">
                    <BrandMark
                      containerClassName="w-16 h-16 rounded-full bg-white border border-[var(--color-border-gray)] shadow-sm shrink-0"
                      fallback={<GraduationCap className="w-8 h-8 text-[var(--color-deep-green)]" aria-hidden="true" />}
                    />
                    <div className="text-left leading-tight">
                      <p className="font-display text-xl font-extrabold text-[var(--color-deep-green)] uppercase tracking-wide">Rambura Garçons</p>
                      <p className="text-xs font-semibold text-[var(--color-mid-gray)] uppercase tracking-[0.2em] mt-0.5">TVET School</p>
                    </div>
                  </div>
                  <h1 className="font-display text-[1.5rem] font-bold text-[var(--color-dark-gray)]">Welcome back</h1>
                  <p className="text-sm text-[var(--color-mid-gray)] mt-1">Sign in to access your account</p>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                  <div className="space-y-5">
                    {error && (
                      <div
                        role="alert"
                        className="flex items-start gap-2.5 rounded-[var(--radius-control)] border border-[var(--color-status-red)]/30 bg-[var(--color-status-red-bg)] p-3.5 text-sm text-[var(--color-status-red)]"
                      >
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{error}</span>
                      </div>
                    )}

                    <Input
                      icon={User}
                      label="Username or Email"
                      required
                      autoComplete="username"
                      autoFocus
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Enter your username or email"
                    />

                    <div className="relative">
                      <Input
                        icon={Lock}
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-[38px] text-[var(--color-mid-gray)] hover:text-[var(--color-deep-green)] transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="inline-flex items-center gap-2 text-sm text-[var(--color-dark-gray)] cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 rounded border-[var(--color-border-gray)] text-[var(--color-medium-green)] focus:ring-[var(--color-medium-green)]"
                        />
                        Remember me
                      </label>
                      <Link to="/forgot-password" className="text-sm font-medium text-[var(--color-medium-green)] hover:underline">
                        Forgot password?
                      </Link>
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="w-full !bg-gradient-to-r !from-[var(--color-deep-green)] !via-[var(--color-medium-green)] !to-[var(--color-deep-green-600)] shadow-md"
                      loading={loading}
                      icon={LogIn}
                    >
                      Login
                    </Button>
                  </div>
                </form>

                <div className="flex items-center gap-3 my-6">
                  <span className="flex-1 h-px bg-[var(--color-border-gray)]" />
                  <span className="text-xs font-medium text-[var(--color-mid-gray)]">or</span>
                  <span className="flex-1 h-px bg-[var(--color-border-gray)]" />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full !bg-[var(--color-light-green-100)] !border-transparent"
                  loading={adminLoading}
                  icon={ShieldCheck}
                  onClick={handleAdminLogin}
                >
                  Login with Administrator
                </Button>

                {/* Quick access to the other demo roles, kept compact so it
                    doesn't compete with the main form */}
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {OTHER_DEMO_ACCOUNTS.map((account) => (
                    <button
                      key={account.identifier}
                      type="button"
                      onClick={() => fillDemoAccount(account)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium text-[var(--color-mid-gray)] border border-[var(--color-border-gray)] hover:border-[var(--color-medium-green)] hover:text-[var(--color-medium-green)] transition-colors"
                    >
                      {account.role}
                    </button>
                  ))}
                </div>

                <p className="text-center text-xs text-[var(--color-mid-gray)] mt-8">
                  © 2026 Rambura Garçons TVET Secondary School · Nyabihu, Rwanda
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
