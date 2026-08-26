import { GraduationCap } from 'lucide-react';
import { useSiteBranding } from '../../hooks/useSiteBranding';
import { cn } from '../../utils/cn';

/**
 * BrandMark — the school's logo, wherever it appears.
 *
 * Drop this in place of every hand-drawn "logo" badge (the GraduationCap
 * icon in a colored box, or the "RG" text monogram). While no logo has
 * been uploaded it renders exactly what used to be hard-coded there
 * (pass that as `fallback`); the moment an admin uploads one in Settings,
 * every BrandMark on screen swaps to the real image automatically.
 *
 * @param {string} containerClassName - sizing/shape/background classes for the outer badge (e.g. "w-9 h-9 rounded-lg bg-[var(--color-gold)]")
 * @param {string} imgClassName - classes for the <img> itself, defaults to a contained fit so non-square logos never get cropped
 * @param {React.ReactNode} fallback - what to show when no custom logo is set (defaults to a GraduationCap icon)
 */
export default function BrandMark({ containerClassName, imgClassName, fallback }) {
  const { logoUrl } = useSiteBranding();

  return (
    <span className={cn('inline-flex items-center justify-center overflow-hidden shrink-0', containerClassName)}>
      {logoUrl ? (
        <img
          src={logoUrl}
          alt="Rambura Garçons logo"
          className={imgClassName || 'w-full h-full object-contain p-1'}
        />
      ) : (
        fallback || <GraduationCap className="w-5 h-5 text-white" aria-hidden="true" />
      )}
    </span>
  );
}
