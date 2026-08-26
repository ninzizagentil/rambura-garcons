import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import BrandMark from '../common/BrandMark';
import SocialLinks from '../common/SocialLinks';
import { getPrograms } from '../../services/contentService';

const QUICK_LINKS = [
  ['Home', '/'],
  ['About Us', '/about'],
  ['Academics', '/academics'],
  ['Admissions', '/admissions'],
  ['News & Events', '/news'],
  ['Gallery', '/gallery'],
];

export default function Footer() {
  const programs = getPrograms();

  return (
    <footer className="bg-[var(--color-deep-green)] text-white/80">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2.5 text-white mb-4">
            <BrandMark
              containerClassName="w-10 h-10 rounded-full bg-white/10 text-[var(--color-gold)] font-display font-bold"
              fallback="RG"
            />
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
            <SocialLinks />
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
            {programs.map((p) => (
              <li key={p.slug}>
                <Link to={`/academics?program=${p.slug}`} className="hover:text-white hover:underline">
                  {p.title}
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
