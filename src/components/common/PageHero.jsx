import { getSiteImage, useSiteImageVersion } from '../../services/imageService';
import HillRidgeDivider from './HillRidgeDivider';

/**
 * PageHero — the standard header banner used at the top of every public page
 * (About, Academics, Departments, Staff, News, Gallery, Admissions, Contact).
 *
 * It always shows the same campus photo used on the Home hero and the navbar,
 * so the whole public site feels like one connected design instead of each
 * page having its own plain green bar.
 *
 * Usage:
 *   <PageHero title="Departments">
 *     <p className="text-white/80 mt-3 max-w-2xl mx-auto">
 *       Four departments, each led by an experienced trade professional.
 *     </p>
 *   </PageHero>
 */
export default function PageHero({ title, children, withDivider = false }) {
  useSiteImageVersion();
  return (
    <section className="relative overflow-hidden py-16 md:py-20 text-[var(--text-primary)]">
      <div className="absolute inset-0" aria-hidden="true">
        <img src={getSiteImage('home.hero')} alt="" className="w-full h-full object-cover opacity-90" loading="lazy" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,31,26,0.92),rgba(10,48,40,0.82),rgba(6,31,26,0.52))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(217,164,65,0.18),transparent_28%)]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 md:px-6 flex justify-center">
        <div className="inline-block max-w-3xl border border-[var(--border)] bg-[rgba(10,48,40,0.7)] backdrop-blur-xl rounded-[28px] shadow-[0_22px_50px_rgba(0,0,0,0.18)] px-6 py-6 md:px-10 md:py-8 text-center">
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-[0.02em] text-[var(--text-primary)] drop-shadow-[0_10px_20px_rgba(0,0,0,0.12)]">{title}</h1>
          {children}
        </div>
      </div>

      {withDivider && <HillRidgeDivider tone="gold" className="relative" />}
    </section>
  );
}
