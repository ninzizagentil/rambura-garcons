import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, GraduationCap } from 'lucide-react';
import { cn } from '../../utils/cn';
import { getSiteImage } from '../../services/imageService';

const LINKS = [
  { label: 'About', to: '/about' },
  { label: 'Academics', to: '/academics' },
  { label: 'Departments', to: '/departments' },
  { label: 'Staff', to: '/staff' },
  { label: 'News', to: '/news' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Admissions', to: '/admissions' },
  { label: 'Contact', to: '/contact' },
];

export default function PublicNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 relative overflow-hidden">
      {/* Same campus photo used across the primary/nav background — image only, no colour overlay */}
      <div className="absolute inset-0" aria-hidden="true">
        <img src={getSiteImage('home.hero')} alt="" className="w-full h-full object-cover" />
      </div>

      {/* Content sits inside a glass card so it stays clearly readable over the photo */}
      <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-3">
        <div className="flex items-center justify-between h-14 px-4 md:px-5 rounded-2xl bg-[var(--color-deep-green)]/75 backdrop-blur-md border border-white/10 shadow-lg">
        <Link to="/" className="flex items-center gap-2.5 text-white" onClick={() => setOpen(false)}>
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[var(--color-gold)]">
            <GraduationCap className="w-5 h-5" aria-hidden="true" />
          </span>
          <span className="font-display font-semibold leading-tight">
            Rambura Garçons
            <span className="block text-[11px] font-sans font-normal text-white/60">TVET School · Nyabihu</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1" aria-label="Primary">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive ? 'text-white bg-white/10' : 'text-white/75 hover:text-white hover:bg-white/10'
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden lg:block">
          <Link
            to="/login"
            className="inline-flex items-center px-4 py-2 rounded-[var(--radius-control)] bg-[var(--color-gold)] text-white text-sm font-semibold hover:opacity-90"
          >
            Login
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          className="lg:hidden p-2 text-white"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        </div>

        {open && (
          <nav
            className="lg:hidden mt-2 px-4 py-3 space-y-0.5 rounded-2xl bg-[var(--color-deep-green)]/85 backdrop-blur-md border border-white/10 shadow-lg"
            aria-label="Primary mobile"
          >
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'block px-3 py-2.5 rounded-md text-sm font-medium',
                    isActive ? 'text-white bg-white/10' : 'text-white/80 hover:text-white hover:bg-white/10'
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="block mt-2 text-center px-4 py-2.5 rounded-[var(--radius-control)] bg-[var(--color-gold)] text-white text-sm font-semibold"
            >
              Login
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
