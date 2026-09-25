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
  { label: 'Events Calendar', to: '/events' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Contact Us', to: '/contact' },
  { label: 'Developers', to: '/developers' },
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
            'group relative px-3 py-2 text-[13px] font-semibold tracking-[0.01em] transition-all duration-200',
            'before:absolute before:inset-x-3 before:-bottom-0.5 before:h-0.5 before:bg-[var(--button-primary)] before:origin-left before:scale-x-0 before:transition-transform before:duration-200',
            item.featured
              ? cn(
                  'rounded-full border border-[var(--button-primary)]/35 px-3.5 text-[var(--button-primary)] hover:border-[var(--button-primary)] hover:bg-[var(--button-primary)] hover:text-white',
                  isActive && 'bg-[var(--button-primary)] text-white'
                )
              : isActive
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
        <div className="absolute left-0 top-full pt-2 min-w-[240px] w-max max-w-[320px] z-40">
          <div className="bg-[var(--surface)] rounded-xl shadow-card-hover border border-[var(--border)] py-2 overflow-hidden">
            {item.children.map((child) => (
              <NavLink
                key={child.to}
                to={child.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'block px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
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
            'block rounded-lg px-3 py-2.5 text-sm font-medium',
            item.featured
              ? 'font-semibold text-[var(--button-primary)] hover:bg-[var(--button-primary-soft)]'
              : isActive
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
    <header className="sticky top-0 z-30 border-b border-white/20 bg-[color-mix(in_srgb,var(--navbar)_72%,transparent)] shadow-[0_8px_30px_rgba(23,59,49,0.12)] backdrop-blur-2xl">
      <div className="hidden border-b border-white/15 bg-[color-mix(in_srgb,var(--header-top-bg)_68%,transparent)] text-xs text-[var(--header-top-text)] shadow-[inset_0_-1px_0_rgba(255,255,255,0.18)] backdrop-blur-xl md:block">
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

      <div className="bg-[color-mix(in_srgb,var(--navbar)_62%,transparent)]">
        <div className="mx-auto flex h-[68px] max-w-[1440px] items-center justify-between gap-4 px-4 md:px-8">
          <Link to="/" className="flex shrink-0 items-center gap-2.5 rounded-xl px-1.5 py-1 transition-all duration-200 hover:bg-[var(--button-primary-soft)]" onClick={() => setOpen(false)}>
            <BrandMark
              containerClassName="h-11 w-11 rounded-xl border border-[var(--border)] bg-white shadow-[0_8px_18px_rgba(23,59,49,0.08)]"
              imgClassName="p-1"
              fallback="RG"
            />
            <span className="leading-[1.05]">
              <span className="block font-display text-[13px] font-black uppercase tracking-[0.1em] text-[var(--text-primary)]">
                Rambura Garçons
              </span>
              <span className="mt-1 block text-[8px] font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                TVET Secondary School
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-0.5 rounded-2xl border border-white/30 bg-white/20 px-1.5 py-1 shadow-[0_10px_26px_rgba(23,59,49,0.12),inset_0_1px_0_rgba(255,255,255,0.35)] backdrop-blur-xl xl:flex" aria-label="Primary">
            {NAV.map((item) => (
              <DesktopItem key={item.label} item={item} />
            ))}
          </nav>

          <div className="hidden shrink-0 items-center gap-2.5 xl:flex">
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
              className="inline-flex items-center rounded-lg border border-[var(--button-primary)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--button-primary)] hover:text-white"
            >
              Login
            </Link>
          </div>

          <div className="flex items-center gap-2 xl:hidden">
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
          className="xl:hidden max-h-[75vh] space-y-0.5 overflow-y-auto border-t border-white/20 bg-[color-mix(in_srgb,var(--navbar)_82%,transparent)] px-4 py-3 shadow-lg backdrop-blur-2xl"
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
