import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, GraduationCap, LogIn, ArrowLeft } from 'lucide-react';
import { Input } from '../../components/forms/FormField';
import Button from '../../components/common/Button';
import Alert from '../../components/feedback/Alert';
import { useAuth } from '../../context/AuthContext';
import { ROLE_HOME } from '../../data/roles';
import { getSiteImage } from '../../services/imageService';

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
  const [showForm, setShowForm] = useState(false);

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
      const redirectTo = location.state?.from?.pathname || ROLE_HOME[result.user.role] || '/';
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
          className="fixed inset-0 z-50 overflow-y-auto grid lg:grid-cols-2 bg-[var(--color-off-white)]"
        >
      {/* Left — login form */}
      <div className="flex items-center justify-center px-4 py-10 lg:py-16 order-2 lg:order-1">
        <div className="w-full max-w-md">
          <button
            type="button"
            onClick={handleBackToWebsite}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-mid-gray)] hover:text-[var(--color-deep-green)] mb-8"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to school website
          </button>

          <div className="mb-8">
            <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--color-deep-green)] mb-4">
              <GraduationCap className="w-7 h-7 text-[var(--color-gold)]" aria-hidden="true" />
            </span>
            <h1 className="font-display text-2xl font-semibold text-[var(--color-deep-green)]">Rambura Garçons</h1>
            <p className="text-sm text-[var(--color-mid-gray)] mt-1">School Management System</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-[var(--radius-card)] border border-[var(--color-border-gray)] shadow-card p-7"
            noValidate
          >
            <motion.h2
              layout="position"
              className="font-display text-lg font-semibold text-[var(--color-dark-gray)]"
            >
              Sign in to your account
            </motion.h2>

            <motion.div layout className="overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                {!showForm ? (
                  <motion.div
                    key="reveal-prompt"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="pt-5"
                  >
                    <p className="text-sm text-[var(--color-mid-gray)] mb-5">
                      Sign in to access the library, stock, staff, and school records.
                    </p>
                    <Button
                      type="button"
                      variant="primary"
                      size="lg"
                      className="w-full"
                      icon={LogIn}
                      onClick={() => setShowForm(true)}
                    >
                      Login
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="login-fields"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="pt-5 space-y-5"
                  >
                    {error && <Alert type="error">{error}</Alert>}

                    <Input
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
                        className="absolute right-3 top-[38px] text-[var(--color-mid-gray)] hover:text-[var(--color-dark-gray)]"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="flex justify-end">
                      <Link to="/forgot-password" className="text-sm font-medium text-[var(--color-medium-green)] hover:underline">
                        Forgot password?
                      </Link>
                    </div>

                    <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading} icon={LogIn}>
                      Login
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </form>

          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                className="mt-6 bg-[var(--color-light-green-100)] rounded-[var(--radius-card)] p-4 text-xs text-[var(--color-dark-gray)]"
              >
                <p className="font-semibold mb-1.5">Demo accounts</p>
                <p className="text-[var(--color-mid-gray)] mb-2">Tap an account to fill in the form.</p>
                <ul className="space-y-1">
                  {DEMO_ACCOUNTS.map((account) => (
                    <li key={account.identifier}>
                      <button
                        type="button"
                        onClick={() => fillDemoAccount(account)}
                        className="w-full flex items-center justify-between gap-2 rounded-[var(--radius-control)] px-2 py-1.5 -mx-2 text-left text-[var(--color-mid-gray)] hover:bg-white hover:text-[var(--color-dark-gray)] transition-colors"
                      >
                        <span>
                          <span className="font-medium text-[var(--color-dark-gray)]">{account.identifier}</span>
                          {' / '}
                          {account.password}
                        </span>
                        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-medium-green)]">
                          {account.role}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right — same campus photo used on the home page background, image only */}
      <div className="relative hidden lg:block order-1 lg:order-2 overflow-hidden">
        <img
          src={getSiteImage('home.hero')}
          alt="Rambura Garçons campus, Nyabihu"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative h-full flex flex-col justify-end p-10">
          <div className="bg-[var(--color-deep-green)]/70 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl p-7 text-white">
            <span className="inline-block text-xs font-semibold tracking-wide uppercase text-[var(--color-gold)] mb-3">
              Nyabihu District · TVET School
            </span>
            <h2 className="font-display text-3xl font-semibold leading-tight max-w-md">
              Skilled hands. Disciplined minds. Built on Nyabihu's hills.
            </h2>
            <p className="text-white/85 mt-4 max-w-sm text-sm">
              Sign in to manage the library, stock, staff, and school records.
            </p>
          </div>
        </div>
      </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
