import { useState, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, ChevronDown, Phone, Mail, MapPin, User, ShieldCheck } from 'lucide-react';
import { cn } from '../../utils/cn';

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
            'px-3.5 py-2 text-sm font-medium transition-colors border-b-2',
            isActive
              ? 'text-[var(--color-deep-green)] border-[var(--color-medium-green)]'
              : 'text-[var(--color-dark-gray)] border-transparent hover:text-[var(--color-deep-green)]'
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
        className="flex items-center gap-1 px-3.5 py-2 text-sm font-medium text-[var(--color-dark-gray)] hover:text-[var(--color-deep-green)] transition-colors"
      >
        {item.label}
        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>
      {open && (
        <div className="absolute left-0 top-full pt-2 min-w-[190px] z-40">
          <div className="bg-white rounded-xl shadow-card-hover border border-[var(--color-border-gray)] py-2 overflow-hidden">
            {item.children.map((child) => (
              <NavLink
                key={child.to}
                to={child.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'block px-4 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'text-[var(--color-deep-green)] bg-[var(--color-light-green-100)]'
                      : 'text-[var(--color-dark-gray)] hover:bg-[var(--color-off-white)] hover:text-[var(--color-deep-green)]'
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
              ? 'text-[var(--color-deep-green)] bg-[var(--color-light-green-100)]'
              : 'text-[var(--color-dark-gray)] hover:bg-[var(--color-off-white)]'
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
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium text-[var(--color-dark-gray)] hover:bg-[var(--color-off-white)]"
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
                    ? 'text-[var(--color-deep-green)] bg-[var(--color-light-green-100)]'
                    : 'text-[var(--color-mid-gray)] hover:bg-[var(--color-off-white)]'
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

  return (
    <header className="sticky top-0 z-30 shadow-sm">
      {/* Minimal top info bar */}
      <div className="hidden md:block bg-[var(--color-deep-green)] text-white/85 text-xs">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-8 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <a href="tel:+250788123456" className="flex items-center gap-1.5 hover:text-white">
              <Phone className="w-3.5 h-3.5 text-[var(--color-gold)]" aria-hidden="true" />
              +250 788 123 456
            </a>
            <a href="mailto:info@ramburagarcons.rw" className="flex items-center gap-1.5 hover:text-white">
              <Mail className="w-3.5 h-3.5 text-[var(--color-gold)]" aria-hidden="true" />
              info@ramburagarcons.rw
            </a>
            <span className="hidden lg:flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[var(--color-gold)]" aria-hidden="true" />
              Nyabihu District, Rwanda
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold"
            >
              <ShieldCheck className="w-3 h-3" aria-hidden="true" />
              Login
            </Link>
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/15 text-white">
              <User className="w-3.5 h-3.5" aria-hidden="true" />
            </span>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-[72px] flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 shrink-0" onClick={() => setOpen(false)}>
            <span className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-[var(--color-deep-green)] text-[var(--color-gold)] font-display font-bold text-lg">
              RG
            </span>
            <span className="leading-tight">
              <span className="block font-display font-bold text-[15px] tracking-wide text-[var(--color-deep-green)] uppercase">
                Rambura Garçons
              </span>
              <span className="block text-[11px] font-semibold tracking-[0.2em] text-[var(--color-mid-gray)] uppercase">
                TVET School
              </span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center" aria-label="Primary">
            {NAV.map((item) => (
              <DesktopItem key={item.label} item={item} />
            ))}
          </nav>

          <div className="hidden lg:block shrink-0">
            <Link
              to="/login"
              className="inline-flex items-center px-6 py-2.5 rounded-[var(--radius-control)] bg-[var(--color-deep-green)] text-white text-sm font-semibold hover:bg-[var(--color-deep-green-600)] transition-colors"
            >
              Login
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="lg:hidden p-2 text-[var(--color-deep-green)]"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav
          className="lg:hidden bg-white border-t border-[var(--color-border-gray)] px-4 py-3 space-y-0.5 shadow-lg max-h-[75vh] overflow-y-auto"
          aria-label="Primary mobile"
        >
          {NAV.map((item) => (
            <MobileItem key={item.label} item={item} onNavigate={() => setOpen(false)} />
          ))}
          <Link
            to="/contact"
            onClick={() => setOpen(false)}
            className="block px-3 py-2.5 rounded-md text-sm font-medium text-[var(--color-dark-gray)] hover:bg-[var(--color-off-white)]"
          >
            Contact Us
          </Link>
          <Link
            to="/login"
            onClick={() => setOpen(false)}
            className="block mt-2 text-center px-4 py-2.5 rounded-[var(--radius-control)] bg-[var(--color-deep-green)] text-white text-sm font-semibold"
          >
            Login
          </Link>
        </nav>
      )}
    </header>
  );
}
