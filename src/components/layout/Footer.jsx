import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import BrandMark from '../common/BrandMark';
import SocialLinks from '../common/SocialLinks';
import { getPrograms, useContentVersion } from '../../services/contentService';

const QUICK_LINKS = [
  ['Home', '/'],
  ['About Us', '/about'],
  ['Academics', '/academics'],
  ['Admissions', '/admissions'],
  ['News & Events', '/news'],
  ['Gallery', '/gallery'],
  ['Contact Us', '/contact'],
];

export default function Footer() {
  useContentVersion();
  const programs = getPrograms();

  return (
    <footer className="relative mt-14 overflow-hidden border-t border-[var(--footer-border)] bg-[var(--footer-bg)] text-[var(--text-primary)] shadow-[0_-12px_35px_rgba(0,0,0,0.08)]">
      <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,rgba(217,164,65,0.08),rgba(217,164,65,0.4),rgba(217,164,65,0.08))]" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(217,164,65,0.08),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(22,75,62,0.18),transparent_22%)]" aria-hidden="true" />

      <div className="relative px-4 py-10 md:px-6 lg:px-8 lg:py-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-5 border-b border-[var(--footer-border)] pb-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 text-[var(--text-primary)]">
              <BrandMark
                containerClassName="w-11 h-11 rounded-full bg-white/10 text-[var(--color-gold)] font-display font-bold shadow-inner shadow-white/10"
                fallback="RG"
              />
              <div className="leading-tight">
                <div className="font-display text-sm font-bold uppercase tracking-[0.16em]">Rambura Garçons</div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/60">TVET School</div>
              </div>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--footer-border)] bg-[rgba(44,103,84,0.06)] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--text-primary)] backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-[var(--gold)]" aria-hidden="true" />
              Shaping Future-Ready Skills
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-[28px] border border-[var(--footer-border)] bg-[var(--footer-surface)] p-5 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)]">About</p>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                Building skills. Creating futures.
                <br />
                Empowering youth through quality technical education.
              </p>
              <div className="mt-5">
                <SocialLinks />
              </div>
            </div>

            <div className="rounded-[28px] border border-[var(--footer-border)] bg-[var(--footer-surface)] p-5 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)]">Quick Links</p>
              <ul className="space-y-2.5 text-sm text-[var(--text-secondary)]">
                {QUICK_LINKS.map(([label, to]) => (
                  <li key={to}>
                    <Link to={to} className="inline-flex items-center transition-colors hover:text-[var(--gold)] hover:translate-x-0.5">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[28px] border border-[var(--footer-border)] bg-[var(--footer-surface)] p-5 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)]">Programs</p>
              <ul className="space-y-2.5 text-sm text-[var(--text-secondary)]">
                {programs.map((p) => (
                  <li key={p.slug}>
                    <Link to={`/academics?program=${p.slug}`} className="inline-flex items-center transition-colors hover:text-[var(--gold)] hover:translate-x-0.5">
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[28px] border border-[var(--footer-border)] bg-[var(--footer-surface)] p-5 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)]">Contact Us</p>
              <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
                <li className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 w-4 h-4 flex-shrink-0 text-[var(--color-gold)]" aria-hidden="true" />
                  <span>Nyabihu District, Rwanda</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 flex-shrink-0 text-[var(--color-gold)]" aria-hidden="true" />
                  <span>+250 788 123 456</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 flex-shrink-0 text-[var(--color-gold)]" aria-hidden="true" />
                  <span>info@ramburagarcons.rw</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 flex-shrink-0 text-[var(--color-gold)]" aria-hidden="true" />
                  <span>Mon – Fri: 8:00 AM – 5:00 PM</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--footer-border)] px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 text-xs text-[var(--text-secondary)] sm:flex-row">
          <span>© {new Date().getFullYear()} Rambura Garçons TVET School. All Rights Reserved.</span>
          <span className="flex items-center gap-4">
            <Link to="/contact" className="transition-colors hover:text-[var(--gold)]">Privacy Policy</Link>
            <Link to="/contact" className="transition-colors hover:text-[var(--gold)]">Terms of Use</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
