import { getSiteImage } from '../../services/imageService';
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
  return (
    <section className="relative text-white overflow-hidden py-14">
      {/* Same campus photo used on the Home hero + navbar — image only, no colour overlay */}
      <div className="absolute inset-0" aria-hidden="true">
        <img src={getSiteImage('home.hero')} alt="" className="w-full h-full object-cover" loading="lazy" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 md:px-6 flex justify-center">
        <div className="inline-block bg-[var(--color-deep-green)]/70 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl px-6 py-6 md:px-10 md:py-8 text-center">
          <h1 className="font-display text-3xl md:text-4xl font-semibold">{title}</h1>
          {children}
        </div>
      </div>

      {withDivider && <HillRidgeDivider tone="gold" className="relative" />}
    </section>
  );
}
