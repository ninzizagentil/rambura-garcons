import { SOCIALS } from './socialIcons';
import { cn } from '../../utils/cn';

const SIZES = {
  sm: { button: 'w-6 h-6', icon: 'w-3 h-3' },
  md: { button: 'w-9 h-9', icon: 'w-4 h-4' },
};

/**
 * SocialLinks — the school's social media icons, each filled with that
 * platform's own real brand color (Facebook blue, YouTube red, Instagram's
 * gradient, etc.) rather than one shared site color. Used in both the
 * public navbar's top info bar and the site footer, so update `SOCIALS`
 * in socialIcons.jsx once and both places stay in sync.
 */
export default function SocialLinks({ size = 'md', className = '' }) {
  const dims = SIZES[size] || SIZES.md;

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      {SOCIALS.map(({ Icon, label, href, background }) => (
        <a
          key={label}
          href={href}
          aria-label={label}
          target="_blank"
          rel="noopener noreferrer"
          style={{ background }}
          className={cn(
            'inline-flex items-center justify-center rounded-full text-white shrink-0',
            'transition-transform duration-150 hover:scale-110 hover:brightness-110',
            dims.button
          )}
        >
          <Icon className={dims.icon} aria-hidden="true" />
        </a>
      ))}
    </div>
  );
}
