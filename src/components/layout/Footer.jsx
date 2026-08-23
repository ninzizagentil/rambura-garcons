import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

function FacebookGlyph(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13.5 21v-7.5h2.5l.5-3h-3V8.5c0-.87.24-1.46 1.49-1.46H16.5V4.36C16.24 4.32 15.36 4.25 14.33 4.25c-2.15 0-3.63 1.31-3.63 3.72V10.5H8.2v3h2.5V21h2.8z" />
    </svg>
  );
}
function TwitterGlyph(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M20.9 7.06c.01.18.01.36.01.54 0 5.48-4.17 11.8-11.8 11.8-2.35 0-4.53-.69-6.36-1.87.33.04.65.05.99.05a8.32 8.32 0 0 0 5.15-1.77 4.16 4.16 0 0 1-3.88-2.88c.26.04.51.07.79.07.38 0 .75-.05 1.1-.14a4.15 4.15 0 0 1-3.33-4.08v-.05c.56.31 1.21.5 1.89.52a4.15 4.15 0 0 1-1.85-3.46c0-.77.2-1.48.56-2.09a11.8 11.8 0 0 0 8.56 4.34 4.15 4.15 0 0 1 7.07-3.79 8.3 8.3 0 0 0 2.64-1 4.16 4.16 0 0 1-1.83 2.3 8.28 8.28 0 0 0 2.38-.65 8.6 8.6 0 0 1-2.09 2.16z" />
    </svg>
  );
}
function InstagramGlyph(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}
function YoutubeGlyph(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M21.6 7.5a2.9 2.9 0 0 0-2.05-2.06C17.8 5 12 5 12 5s-5.8 0-7.55.44A2.9 2.9 0 0 0 2.4 7.5 30.6 30.6 0 0 0 2 12a30.6 30.6 0 0 0 .4 4.5 2.9 2.9 0 0 0 2.05 2.06C6.2 19 12 19 12 19s5.8 0 7.55-.44a2.9 2.9 0 0 0 2.05-2.06A30.6 30.6 0 0 0 22 12a30.6 30.6 0 0 0-.4-4.5zM10 15V9l5.2 3-5.2 3z" />
    </svg>
  );
}

const SOCIALS = [
  { Icon: FacebookGlyph, label: 'Facebook', href: '#' },
  { Icon: TwitterGlyph, label: 'Twitter', href: '#' },
  { Icon: InstagramGlyph, label: 'Instagram', href: '#' },
  { Icon: YoutubeGlyph, label: 'YouTube', href: '#' },
];

const QUICK_LINKS = [
  ['Home', '/'],
  ['About Us', '/about'],
  ['Academics', '/academics'],
  ['Admissions', '/admissions'],
  ['News & Events', '/news'],
  ['Gallery', '/gallery'],
];

const PROGRAM_LINKS = [
  'Software Development',
  'Multimedia Production',
  'Electrical Installation',
  'Welding & Fabrication',
];

export default function Footer() {
  return (
    <footer className="bg-[var(--color-deep-green)] text-white/80">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2.5 text-white mb-4">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-[var(--color-gold)] font-display font-bold">
              RG
            </span>
            <span className="leading-tight">
              <span className="block font-display font-bold text-sm uppercase tracking-wide">Rambura Garçons</span>
              <span className="block text-[10px] font-semibold tracking-[0.2em] text-white/60 uppercase">TVET School</span>
            </span>
          </div>
          <p className="text-sm leading-relaxed">
            Building skills. Creating futures.
            <br />
            Empowering youth through quality technical education.
          </p>
          <div className="flex items-center gap-3 mt-5">
            {SOCIALS.map(({ Icon, label, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-white hover:bg-[var(--color-gold)] hover:text-white transition-colors"
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <p className="text-white font-semibold text-sm mb-4">Quick Links</p>
          <ul className="space-y-2.5 text-sm">
            {QUICK_LINKS.map(([label, to]) => (
              <li key={to}>
                <Link to={to} className="hover:text-white hover:underline">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-white font-semibold text-sm mb-4">Programs</p>
          <ul className="space-y-2.5 text-sm">
            {PROGRAM_LINKS.map((label) => (
              <li key={label}>
                <Link to="/academics" className="hover:text-white hover:underline">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-white font-semibold text-sm mb-4">Contact Us</p>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-[var(--color-gold)]" aria-hidden="true" />
              Nyabihu District, Rwanda
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 flex-shrink-0 text-[var(--color-gold)]" aria-hidden="true" />
              +250 788 123 456
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 flex-shrink-0 text-[var(--color-gold)]" aria-hidden="true" />
              info@ramburagarcons.rw
            </li>
            <li className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 flex-shrink-0 text-[var(--color-gold)]" aria-hidden="true" />
              Mon – Fri: 8:00 AM – 5:00 PM
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-4">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/50">
          <span>© {new Date().getFullYear()} Rambura Garçons TVET School. All Rights Reserved.</span>
          <span className="flex items-center gap-4">
            <Link to="/contact" className="hover:text-white">Privacy Policy</Link>
            <Link to="/contact" className="hover:text-white">Terms of Use</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
