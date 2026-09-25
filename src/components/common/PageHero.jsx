import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { getSiteImage, useSiteImageVersion } from '../../services/imageService';
import HillRidgeDivider from './HillRidgeDivider';

/**
 * PageHero — the standard header banner used at the top of every public page
 * (About, Academics, Departments, Staff, News, Gallery, Admissions, Contact).
 *
 * Each page passes its own `image` (see IMAGE_SLOTS / IMAGES.pageHeroes) so
 * every menu page shows a different banner photo instead of all of them
 * reusing the homepage hero photo.
 *
 * Usage:
 *   <PageHero title="Departments" image={getSiteImage('pageHeroes.departments')}>
 *     <p className="text-white/80 mt-3 max-w-2xl mx-auto">
 *       Four departments, each led by an experienced trade professional.
 *     </p>
 *   </PageHero>
 */
export default function PageHero({ title, image, children, withDivider = false }) {
  useSiteImageVersion();
  const bannerImage = image || getSiteImage('about.campus');
  const heroCardRef = useRef(null);
  const [heroTravel, setHeroTravel] = useState(0);

  useEffect(() => {
    const measureHeroCard = () => {
      const card = heroCardRef.current;
      if (!card) return;
      const bounds = card.getBoundingClientRect();
      setHeroTravel(Math.max(window.innerWidth - bounds.right - 16, 0));
    };

    measureHeroCard();
    window.addEventListener('resize', measureHeroCard);
    return () => window.removeEventListener('resize', measureHeroCard);
  }, []);

  return (
    <section className="relative overflow-hidden py-16 md:py-20">
      <div className="absolute inset-0" aria-hidden="true">
        <img src={bannerImage} alt="" className="w-full h-full object-cover" loading="lazy" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 md:px-6 flex justify-start">
        <motion.div
          ref={heroCardRef}
          className="inline-block max-w-3xl rounded-[var(--radius-card)] border border-[var(--color-border-gray)] bg-[var(--surface)]/65 px-6 py-6 text-left shadow-[0_20px_48px_rgba(0,0,0,0.14)] backdrop-blur-md md:px-10 md:py-8"
          animate={{ x: [0, heroTravel, 0] }}
          transition={{ duration: 18, ease: 'easeInOut', repeat: Infinity }}
        >
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-[0.02em] text-[var(--text-primary)]">{title}</h1>
          {children}
        </motion.div>
      </div>

      {withDivider && <HillRidgeDivider tone="gold" className="relative" />}
    </section>
  );
}
