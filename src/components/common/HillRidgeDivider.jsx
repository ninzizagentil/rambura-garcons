import { cn } from '../../utils/cn';

/**
 * HillRidgeDivider — the signature visual motif of Rambura Garcons.
 * A stylised silhouette of the Nyabihu hill ridges, rendered as a repeating
 * triangular geometry reminiscent of imigongo line-work. Used to divide
 * major sections of the public site and as a quiet accent in the app shell.
 *
 * tone: "deep" | "medium" | "light" | "gold"
 */
export default function HillRidgeDivider({ tone = 'medium', flip = false, className = '' }) {
  const fill = {
    deep: 'var(--color-deep-green)',
    medium: 'var(--color-medium-green)',
    light: 'var(--color-light-green)',
    gold: 'var(--color-gold)',
  }[tone];

  return (
    <div
      className={cn('w-full leading-none select-none', flip && 'rotate-180', className)}
      role="presentation"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1200 60"
        preserveAspectRatio="none"
        className="w-full h-[36px] md:h-[48px]"
      >
        <polygon
          fill={fill}
          points="0,60 0,34 60,10 120,40 180,18 240,44 300,8 360,36 420,14 480,42
                  540,6 600,32 660,12 720,46 780,20 840,38 900,10 960,44 1020,16
                  1080,40 1140,12 1200,34 1200,60"
        />
      </svg>
    </div>
  );
}
