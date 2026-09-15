import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import BrandMark from '../common/BrandMark';
import SocialLinks from '../common/SocialLinks';
import { getContactPage, getPrograms, useContentVersion } from '../../services/contentService';

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
  const contactPage = getContactPage();

  return (
    <footer className="relative mt-14 overflow-hidden border-t border-[var(--footer-border)] bg-[var(--footer-bg)] text-[var(--text-primary)] shadow-[0_-12px_35px_rgba(0,0,0,0.08)]">
      <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,transparent,var(--button-primary),transparent)] opacity-70" aria-hidden="true" />

      <div className="relative px-4 py-12 md:px-6 lg:px-8 lg:py-14">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col gap-6 border-b border-[var(--footer-border)] pb-8 md:flex-row md:items-end md:justify-between">
            <div className="flex items-center gap-3 rounded-2xl border border-[var(--footer-border)] bg-[var(--footer-surface)] p-4 text-[var(--text-primary)] shadow-[0_12px_28px_rgba(23,59,49,0.06)]">
              <BrandMark
                containerClassName="w-11 h-11 rounded-full border border-[var(--footer-border)] bg-white/95 shadow-[0_12px_26px_rgba(23,59,49,0.08)]"
                imgClassName="p-1.5"
                fallback="RG"
              />
              <div className="leading-tight">
                <div className="font-display text-base font-bold uppercase tracking-[0.16em]">Rambura Garçons</div>
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--text-secondary)]">TVET Secondary School · Nyabihu</div>
              </div>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--footer-border)] bg-[var(--button-primary-soft)] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-primary)] backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-[var(--button-primary)]" aria-hidden="true" />
              Shaping Future-Ready Skills
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            <div className="rounded-2xl border border-[var(--footer-border)] bg-[var(--footer-surface)] p-5 shadow-[0_12px_28px_rgba(23,59,49,0.06)] transition-transform duration-200 hover:-translate-y-1">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[var(--button-primary)]">About the school</p>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                Building skills. Creating futures.
                <br />
                Empowering youth through quality technical education.
              </p>
              <div className="mt-5">
                <SocialLinks />
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--footer-border)] bg-[var(--footer-surface)] p-5 shadow-[0_12px_28px_rgba(23,59,49,0.06)] transition-transform duration-200 hover:-translate-y-1">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[var(--button-primary)]">Explore</p>
              <ul className="space-y-2.5 text-sm text-[var(--text-secondary)]">
                {QUICK_LINKS.map(([label, to]) => (
                  <li key={to}>
                    <Link to={to} className="inline-flex items-center transition-colors hover:text-[var(--button-primary)] hover:translate-x-0.5">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-[var(--footer-border)] bg-[var(--footer-surface)] p-5 shadow-[0_12px_28px_rgba(23,59,49,0.06)] transition-transform duration-200 hover:-translate-y-1">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[var(--button-primary)]">Programs</p>
              <ul className="space-y-2.5 text-sm">
                {programs.length > 0 ? (
                  programs.map((p) => (
                    <li key={p.slug}>
                      <Link to={`/academics?program=${p.slug}`} className="inline-flex items-center transition-colors text-[var(--text-secondary)] hover:text-[var(--button-primary)] hover:translate-x-0.5">
                        {p.title}
                      </Link>
                    </li>
                  ))
                ) : (
                  <li className="text-[var(--text-secondary)]">Loading programs...</li>
                )}
              </ul>
            </div>

            <div className="rounded-2xl border border-[var(--footer-border)] bg-[var(--footer-surface)] p-5 shadow-[0_12px_28px_rgba(23,59,49,0.06)] transition-transform duration-200 hover:-translate-y-1">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[var(--button-primary)]">Contact the school</p>
              <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
                <li className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 w-4 h-4 flex-shrink-0 text-[var(--button-primary)]" aria-hidden="true" />
                  <span>Nyabihu District, Rwanda</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 flex-shrink-0 text-[var(--button-primary)]" aria-hidden="true" />
                  <a href="tel:+250788123456" className="transition-colors hover:text-[var(--button-primary)]">+250 788 123 456</a>
                </li>
                <li className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 flex-shrink-0 text-[var(--button-primary)]" aria-hidden="true" />
                  <a href="mailto:info@ramburagarcons.rw" className="break-all transition-colors hover:text-[var(--button-primary)]">info@ramburagarcons.rw</a>
                </li>
                <li className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 flex-shrink-0 text-[var(--button-primary)]" aria-hidden="true" />
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
          <span className="flex flex-wrap items-center justify-center gap-4 sm:justify-end">
            <Link to="/contact" className="transition-colors hover:text-[var(--button-primary)]">Privacy Policy</Link>
            <Link to="/contact" className="transition-colors hover:text-[var(--button-primary)]">Terms of Use</Link>
            <Link to={contactPage.developerUrl || '/developers'} className="transition-colors hover:text-[var(--button-primary)]" title="Website developers">
              Developed by {contactPage.developerName}
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
