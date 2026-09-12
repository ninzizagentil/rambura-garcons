import { useState } from 'react';
import { useSiteBranding } from '../../hooks/useSiteBranding';
import { cn } from '../../utils/cn';
import schoolLogo from '../../assets/brand/school-logo.png';

/**
 * BrandMark — the school's real logo (CPEC-Saint Babeth Secondary School
 * emblem), wherever it appears.
 *
 * Drop this in place of every hand-drawn "logo" badge (the GraduationCap
 * icon in a colored box, or the "RG" text monogram). It always shows the
 * actual school crest — bundled with the app as `schoolLogo`, tightly
 * cropped so it renders large and sharp even in small nav badges — and the
 * moment an admin uploads a different one in Settings, every BrandMark on
 * screen swaps to that image automatically, everywhere at once.
 *
 * @param {string} containerClassName - sizing/shape/background classes for the outer badge (e.g. "w-9 h-9 rounded-lg bg-[var(--color-gold)]")
 * @param {string} imgClassName - classes for the <img> itself, defaults to a contained fit so non-square logos never get cropped
 * @param {React.ReactNode} fallback - what to show only if the logo image itself fails to load (defaults to the bundled logo again)
 */
export default function BrandMark({ containerClassName, imgClassName, fallback }) {
  const { logoUrl } = useSiteBranding();
  const [broken, setBroken] = useState(false);
  const src = (!broken && logoUrl) || schoolLogo;

  return (
    <span
      className={cn(
        'brand-mark inline-flex items-center justify-center overflow-hidden shrink-0 rounded-full border border-[var(--border)] bg-white/95 shadow-[0_12px_28px_rgba(23,59,49,0.08)] ring-1 ring-white/80',
        containerClassName
      )}
    >
      {broken && fallback ? (
        fallback
      ) : (
        <img
          src={src}
          alt="CPEC - Saint Babeth Secondary School logo"
          loading="eager"
          decoding="async"
          draggable={false}
          onError={() => setBroken(true)}
          className={cn(
            'brand-mark__image w-full h-full object-contain object-center select-none',
            imgClassName || 'p-0'
          )}
        />
      )}
    </span>
  );
}
