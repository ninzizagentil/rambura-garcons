import { useState, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, ChevronDown, Phone, Mail, MapPin, Moon, Sun } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useTheme } from '../../context/ThemeContext';
import BrandMark from '../common/BrandMark';
import SocialLinks from '../common/SocialLinks';

const NAV = [
  { label: 'Home', to: '/' },
  {
    label: 'About Us',
    to: '/about',
    children: [
      { label: 'About Us', to: '/about' },
      { label: 'Our Staff', to: '/staff' },
    ],
  },
  {
    label: 'Academics',
    to: '/academics',
    children: [
      { label: 'Programs', to: '/academics' },
      { label: 'Departments', to: '/departments' },
    ],
  },
  { label: 'Admissions', to: '/admissions' },
  { label: 'News & Events', to: '/news' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Contact Us', to: '/contact' },
];

function DesktopItem({ item }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef(null);

  const show = () => {
    clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const hide = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  if (!item.children) {
    return (
      <NavLink
        to={item.to}
        end={item.to === '/'}
        className={({ isActive }) =>
          cn(
            'group relative px-3.5 py-2.5 text-sm font-semibold tracking-[0.02em] transition-all duration-200',
            'before:absolute before:inset-x-2 before:-bottom-1 before:h-[2px] before:rounded-full before:bg-[var(--button-primary)] before:origin-left before:scale-x-0 before:transition-transform before:duration-200',
            isActive
              ? 'text-[var(--button-primary)] before:scale-x-100'
              : 'text-[var(--text-primary)] hover:text-[var(--button-primary)] hover:before:scale-x-100'
          )
        }
      >
        {item.label}
      </NavLink>
    );
  }

  return (
    <div className="relative" onMouseEnter={show} onMouseLeave={hide}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="group relative flex items-center gap-1 px-3.5 py-2.5 text-sm font-semibold tracking-[0.02em] text-[var(--text-primary)] transition-all duration-200 hover:text-[var(--button-primary)]"
      >
        <span className="relative after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-full after:rounded-full after:bg-[var(--button-primary)] after:origin-left after:scale-x-0 after:transition-transform after:duration-200 group-hover:after:scale-x-100">
          {item.label}
        </span>
        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', open && 'rotate-180')} aria-hidden="true" />
      </button>
      {open && (
        <div className="absolute left-0 top-full pt-2 min-w-[190px] z-40">
          <div className="bg-[var(--surface)] rounded-xl shadow-card-hover border border-[var(--border)] py-2 overflow-hidden">
            {item.children.map((child) => (
              <NavLink
                key={child.to}
                to={child.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'block px-4 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'text-[var(--button-primary)] bg-[var(--button-primary-soft)]'
                      : 'text-[var(--text-primary)] hover:bg-[var(--button-primary-soft)] hover:text-[var(--button-primary)]'
                  )
                }
              >
                {child.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MobileItem({ item, onNavigate }) {
  const [open, setOpen] = useState(false);

  if (!item.children) {
    return (
      <NavLink
        to={item.to}
        end={item.to === '/'}
        onClick={onNavigate}
        className={({ isActive }) =>
          cn(
            'block px-3 py-2.5 rounded-md text-sm font-medium',
            isActive
              ? 'text-[var(--button-primary)] bg-[var(--button-primary-soft)]'
              : 'text-[var(--text-primary)] hover:bg-[var(--button-primary-soft)] hover:text-[var(--button-primary)]'
          )
        }
      >
        {item.label}
      </NavLink>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--button-primary-soft)] hover:text-[var(--button-primary)]"
      >
        {item.label}
        <ChevronDown className={cn('w-4 h-4 transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>
      {open && (
        <div className="pl-4 space-y-0.5 pb-1">
          {item.children.map((child) => (
            <NavLink
              key={child.to}
              to={child.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'block px-3 py-2 rounded-md text-sm',
                  isActive
                    ? 'text-[var(--button-primary)] bg-[var(--button-primary-soft)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--button-primary-soft)] hover:text-[var(--button-primary)]'
                )
              }
            >
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--header-nav-border)] bg-[var(--navbar)] backdrop-blur-xl shadow-[0_8px_20px_rgba(0,0,0,0.1)]">
      <div className="hidden md:block bg-[var(--header-top-bg)] text-[var(--header-top-text)] text-xs shadow-[inset_0_-1px_0_rgba(0,0,0,0.04)]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-8 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <a href="tel:+250788123456" className="flex items-center gap-1.5 hover:text-[var(--gold)] transition-colors">
              <Phone className="w-3.5 h-3.5 text-[var(--gold)]" aria-hidden="true" />
              +250 788 123 456
            </a>
            <a href="mailto:info@ramburagarcons.rw" className="flex items-center gap-1.5 hover:text-[var(--gold)] transition-colors">
              <Mail className="w-3.5 h-3.5 text-[var(--gold)]" aria-hidden="true" />
              info@ramburagarcons.rw
            </a>
            <span className="hidden lg:flex items-center gap-1.5 text-[var(--text-secondary)]">
              <MapPin className="w-3.5 h-3.5 text-[var(--gold)]" aria-hidden="true" />
              Nyabihu District, Rwanda
            </span>
          </div>
          <SocialLinks size="sm" />
        </div>
      </div>

      <div className="bg-transparent">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-[76px] flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 shrink-0 rounded-full px-2 py-1.5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[rgba(255,255,255,0.03)]" onClick={() => setOpen(false)}>
            <BrandMark
              containerClassName="w-14 h-14 rounded-full border border-[var(--border)] bg-white shadow-[0_12px_26px_rgba(15,108,255,0.08)]"
              imgClassName="p-1.5"
              fallback="RG"
            />
            <span className="leading-[1.05]">
              <span className="block font-display font-black text-[15px] tracking-[0.12em] text-[var(--text-primary)] uppercase">
                Rambura Garçons
              </span>
              <span className="mt-0.5 block text-[9.5px] font-semibold tracking-[0.28em] text-[var(--text-secondary)] uppercase">
                TVET Secondary School
              </span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 rounded-full border border-[var(--header-nav-border)] bg-[var(--header-nav-bg)] px-2 py-1.5 shadow-[0_8px_16px_rgba(0,0,0,0.1)] backdrop-blur-xl" aria-label="Primary">
            {NAV.map((item) => (
              <DesktopItem key={item.label} item={item} />
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--gold)] shadow-[0_8px_18px_rgba(0,0,0,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--gold)]"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <Link
              to="/login"
              className="inline-flex items-center px-5 py-2.5 rounded-full border border-[var(--button-primary)] bg-transparent text-[var(--text-primary)] text-sm font-semibold shadow-[0_10px_20px_rgba(0,0,0,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--button-primary)] hover:text-white"
            >
              Login
            </Link>
          </div>

          <div className="lg:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 text-[var(--gold)] hover:bg-[var(--surface)] rounded-lg transition-colors"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              className="p-2 text-[var(--text-primary)]"
            >
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <nav
          className="lg:hidden bg-[var(--navbar)] border-t border-[var(--border)] px-4 py-3 space-y-0.5 shadow-lg max-h-[75vh] overflow-y-auto"
          aria-label="Primary mobile"
        >
          {NAV.map((item) => (
            <MobileItem key={item.label} item={item} onNavigate={() => setOpen(false)} />
          ))}
          <Link
            to="/login"
            onClick={() => setOpen(false)}
            className="block mt-2 text-center px-4 py-2.5 rounded-full border border-[var(--button-primary)] bg-[rgba(255,255,255,0.8)] text-[var(--color-dark-gray)] text-sm font-semibold shadow-[0_10px_20px_rgba(31,41,55,0.08)] backdrop-blur-xl transition-colors hover:bg-[var(--button-primary)] hover:text-white"
          >
            Login
          </Link>
        </nav>
      )}
    </header>
  );
}
