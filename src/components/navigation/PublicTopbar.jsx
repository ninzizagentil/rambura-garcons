import { Phone, Mail, MapPin, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';
import { getContactInfo, useContentVersion } from '../../services/contentService';

const PORTAL_LINKS = [
  { label: 'Student Portal', to: '/login' },
  { label: 'Staff Portal', to: '/login' },
  { label: 'E-Learning', to: '/login' },
  { label: 'Contact Us', to: '/contact' },
];

const SOCIALS = [
  { icon: Facebook, label: 'Facebook', href: '#' },
  { icon: Twitter, label: 'Twitter', href: '#' },
  { icon: Instagram, label: 'Instagram', href: '#' },
  { icon: Youtube, label: 'YouTube', href: '#' },
];

export default function PublicTopbar() {
  useContentVersion();
  const contact = getContactInfo();

  return (
    <div className="hidden md:block bg-[var(--color-deep-green)] text-white/90 text-xs">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-9 flex items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <a href={`tel:${contact.phone.replace(/\s+/g, '')}`} className="flex items-center gap-1.5 hover:text-white">
            <Phone className="w-3.5 h-3.5 text-[var(--color-light-green)]" aria-hidden="true" />
            {contact.phone}
          </a>
          <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 hover:text-white">
            <Mail className="w-3.5 h-3.5 text-[var(--color-light-green)]" aria-hidden="true" />
            {contact.email}
          </a>
          <span className="hidden lg:flex items-center gap-1.5 text-white/75">
            <MapPin className="w-3.5 h-3.5 text-[var(--color-light-green)]" aria-hidden="true" />
            Nyabihu District, Rwanda
          </span>
        </div>

        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-4" aria-label="Portals">
            {PORTAL_LINKS.map((link, i) => (
              <span key={link.label} className="flex items-center gap-4">
                <a href={link.to} className="text-white/80 hover:text-white">
                  {link.label}
                </a>
                {i < PORTAL_LINKS.length - 1 && <span className="w-px h-3 bg-white/20" aria-hidden="true" />}
              </span>
            ))}
          </nav>
          <span className="w-px h-3 bg-white/20" aria-hidden="true" />
          <div className="flex items-center gap-2.5">
            {SOCIALS.map(({ icon: Icon, label, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="text-white/80 hover:text-white"
              >
                <Icon className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
