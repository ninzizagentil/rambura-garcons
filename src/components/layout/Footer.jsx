import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, GraduationCap } from 'lucide-react';
import HillRidgeDivider from '../common/HillRidgeDivider';

export default function Footer() {
  return (
    <footer className="bg-[var(--color-deep-green)] text-white/80">
      <HillRidgeDivider tone="gold" />
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2.5 text-white mb-3">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[var(--color-gold)]">
              <GraduationCap className="w-5 h-5" aria-hidden="true" />
            </span>
            <span className="font-display font-semibold">Rambura Garçons</span>
          </div>
          <p className="text-sm leading-relaxed">
            A Technical and Vocational Education and Training school in Nyabihu District, forming skilled,
            disciplined graduates for Rwanda's growing trades.
          </p>
        </div>

        <div>
          <p className="text-white font-semibold text-sm mb-3">Quick Links</p>
          <ul className="space-y-2 text-sm">
            {[
              ['About', '/about'],
              ['Academics', '/academics'],
              ['Admissions', '/admissions'],
              ['News', '/news'],
              ['Gallery', '/gallery'],
            ].map(([label, to]) => (
              <li key={to}>
                <Link to={to} className="hover:text-white hover:underline">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-white font-semibold text-sm mb-3">Programs</p>
          <ul className="space-y-2 text-sm">
            <li>Electrical Technology</li>
            <li>Welding &amp; Fabrication</li>
            <li>Construction</li>
            <li>Automobile Mechanics</li>
          </ul>
        </div>

        <div>
          <p className="text-white font-semibold text-sm mb-3">Contact</p>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-[var(--color-gold)]" aria-hidden="true" />
              Rambura Sector, Nyabihu District, Western Province
            </li>
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4 flex-shrink-0 text-[var(--color-gold)]" aria-hidden="true" />
              +250 788 000 000
            </li>
            <li className="flex items-center gap-2">
              <Mail className="w-4 h-4 flex-shrink-0 text-[var(--color-gold)]" aria-hidden="true" />
              info@ramburagarcons.rw
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} Rambura Garçons TVET School. All rights reserved.
      </div>
    </footer>
  );
}
