import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, Star, Wrench, Zap, HardHat, Car, Award,
  UserCheck, Building2, Target, GraduationCap, Users, BookOpen, Play,
} from 'lucide-react';
import Button from '../../components/common/Button';
import { getHero, getPrograms, useContentVersion } from '../../services/contentService';
import { getSiteImage, useSiteImageVersion } from '../../services/imageService';

const HERO_SLIDE_INTERVAL = 6000;

const PROGRAM_ICONS = {
  'electrical-technology': Zap,
  'welding-fabrication': Wrench,
  construction: HardHat,
  'automobile-mechanics': Car,
};

const HERO_HIGHLIGHTS = [
  { Icon: Wrench, title: 'Practical', subtitle: 'Training' },
  { Icon: UserCheck, title: 'Skilled', subtitle: 'Instructors' },
  { Icon: Building2, title: 'Modern', subtitle: 'Facilities' },
  { Icon: Target, title: 'Career', subtitle: 'Focused' },
];

const ABOUT_FEATURES = [
  {
    Icon: GraduationCap,
    title: 'Quality Education',
    description: 'Industry-focused curriculum designed for real-world success.',
  },
  {
    Icon: UserCheck,
    title: 'Experienced Instructors',
    description: 'Skilled and dedicated professionals guiding student excellence.',
  },
  {
    Icon: Award,
    title: 'Career Preparation',
    description: 'Equipping students with skills for employment and entrepreneurship.',
  },
];

const STAT_ICONS = [GraduationCap, Users, BookOpen, Award];

/** Splits the CMS headline into a light first line and a neutral second line,
 *  mirroring the two-tone hero heading, while staying safe if the title
 *  only has a single sentence. */
function splitHeadline(title = '') {
  const parts = title.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (parts.length < 2) return { first: title, rest: '' };
  return { first: parts[0], rest: parts.slice(1).join(' ') };
}

export default function Home() {
  useContentVersion();
  useSiteImageVersion();
  const hero = getHero();
  const programs = getPrograms().slice(0, 4);
  const heroSlides = [0, 1, 2]
    .map((index) => getSiteImage(`home.heroSlides.${index}`))
    .filter(Boolean);
  const aboutImage = getSiteImage('about.campus');
  const { first: headlineFirst, rest: headlineRest } = splitHeadline(hero.title);

  const [activeSlide, setActiveSlide] = useState(0);
  const heroCardRef = useRef(null);
  const [heroTravel, setHeroTravel] = useState(0);

  useEffect(() => {
    if (heroSlides.length < 2) return undefined;
    const timer = setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, HERO_SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

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
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" aria-hidden="true">
          {heroSlides.map((src, index) => (
            <img
              key={src}
              src={src}
              alt=""
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[1500ms] ease-in-out ${
                index === activeSlide ? 'opacity-100' : 'opacity-0'
              }`}
              loading={index === 0 ? 'eager' : 'lazy'}
            />
          ))}
        </div>

        {heroSlides.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2" role="tablist" aria-label="Hero photos">
            {heroSlides.map((src, index) => (
              <button
                key={src}
                type="button"
                role="tab"
                aria-selected={index === activeSlide}
                aria-label={`Show hero photo ${index + 1}`}
                onClick={() => setActiveSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === activeSlide ? 'w-6 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        )}

        <div className="relative max-w-7xl mx-auto px-4 md:px-6 flex flex-col justify-between min-h-[560px] md:min-h-[620px] pb-0">
          <div className="max-w-xl pt-16 md:pt-24">
            <motion.div
              ref={heroCardRef}
              className="max-w-xl rounded-[var(--radius-card)] border border-[var(--color-border-gray)] bg-[var(--surface)]/65 px-6 py-6 shadow-[0_20px_48px_rgba(0,0,0,0.14)] backdrop-blur-md md:px-8 md:py-8"
              animate={{ x: [0, heroTravel, 0] }}
              transition={{ duration: 18, ease: 'easeInOut', repeat: Infinity }}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-gray)] bg-[var(--surface-hover)] px-3.5 py-1.5 text-[var(--color-medium-green)] text-xs font-semibold shadow-sm">
                <Star className="w-3.5 h-3.5 fill-[var(--color-gold)] text-[var(--color-gold)]" aria-hidden="true" />
                {hero.eyebrow}
              </span>

              <h1 className="font-display text-4xl md:text-[3.25rem] leading-[1.08] font-bold mt-5 text-[var(--text-primary)]">
                {headlineFirst}
                {headlineRest && (
                  <span className="block text-[var(--color-medium-green)]">{headlineRest}</span>
                )}
              </h1>

              <p className="text-[var(--text-secondary)] mt-6 text-base md:text-lg max-w-lg leading-relaxed">
                {hero.subtitle}
              </p>

              <div className="flex flex-wrap gap-3 mt-8">
                <Link to="/academics">
                  <Button variant="primary" size="lg" icon={ArrowRight} iconPosition="right">
                    Discover More
                  </Button>
                </Link>
                <Link to="/about">
                  <Button
                    variant="secondary"
                    size="lg"
                    icon={ArrowRight}
                    iconPosition="right"
                  >
                    Learn About Us
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>

          <div className="-mx-4 mt-12 border-t border-white/10 bg-[rgba(11,19,39,0.38)] px-4 py-6 shadow-[0_-8px_30px_rgba(0,0,0,0.10)] backdrop-blur-md md:-mx-6 md:px-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {HERO_HIGHLIGHTS.map(({ Icon, title, subtitle }) => (
                <div key={title} className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/[0.08] px-4 py-3.5 shadow-[0_12px_30px_rgba(0,0,0,0.12)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.14] hover:shadow-[0_18px_45px_rgba(0,0,0,0.18)] hover:border-white/30">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[linear-gradient(135deg,rgba(15,108,255,0.28),rgba(15,108,255,0.12))] text-[var(--color-gold)] ring-1 ring-white/20 shadow-[0_8px_16px_rgba(15,108,255,0.15)]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-semibold leading-tight text-white">
                    {title}
                    <span className="block font-normal text-white/75 text-xs">{subtitle}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* About Us */}
      <section className="py-16 md:py-20 max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="relative overflow-hidden rounded-[32px] shadow-[0_22px_60px_rgba(15,108,255,0.12)] aspect-[4/3] ring-1 ring-[rgba(15,108,255,0.08)]">
            <img src={aboutImage} alt="Students training in the workshop" className="w-full h-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(11,19,39,0.42)] via-transparent to-transparent" />
            <div className="absolute inset-x-6 bottom-6 flex items-center justify-between rounded-2xl border border-white/20 bg-[rgba(17,31,59,0.45)] px-4 py-3 backdrop-blur-sm">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">Hands-on learning</p>
                <p className="mt-1 text-sm font-medium text-white">Industry-ready practical training</p>
              </div>
              <Link
                to="/about"
                aria-label="Learn more about Rambura Garçons"
                className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white text-[var(--color-medium-green)] shadow-[0_16px_30px_rgba(15,108,255,0.18)] hover:scale-105 transition-transform"
              >
                <Play className="w-5 h-5 fill-current ml-0.5" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div>
            <span className="text-xs font-bold tracking-[0.15em] uppercase text-[var(--color-medium-green)]">
              About Us
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mt-2 text-[var(--color-dark-gray)]">
              Empowering Youth Through
              <span className="block text-[var(--color-medium-green)]">Quality Technical Education</span>
            </h2>
            <p className="text-[var(--color-mid-gray)] mt-5 leading-relaxed max-w-lg">
              We are committed to providing industry-relevant training, modern facilities and a supportive
              learning environment that prepares students for successful careers and lifelong impact.
            </p>

            <div className="grid sm:grid-cols-3 gap-6 mt-8">
              {ABOUT_FEATURES.map(({ Icon, title, description }) => (
                <div key={title} className="rounded-[24px] border border-[var(--color-border-gray)] bg-[var(--color-soft-gray)] p-4 shadow-[0_12px_24px_rgba(15,61,46,0.04)] backdrop-blur-sm">
                  <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-[var(--color-light-green-100)] text-[var(--color-medium-green)] mb-3">
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </span>
                  <h3 className="font-display font-semibold text-sm text-[var(--color-dark-gray)]">{title}</h3>
                  <p className="text-xs text-[var(--color-mid-gray)] mt-1.5 leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="pb-16 max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <span className="text-xs font-bold tracking-[0.15em] uppercase text-[var(--color-medium-green)]">
              Our Programs
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mt-2 text-[var(--color-dark-gray)]">
              Programs We Offer
            </h2>
          </div>
          <Link to="/academics">
            <Button variant="primary" size="md" icon={ArrowRight} iconPosition="right">
              View All Programs
            </Button>
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {programs.map((p) => {
            const Icon = PROGRAM_ICONS[p.slug] || Wrench;
            return (
              <Link
                key={p.slug}
                to="/academics"
                className="group overflow-hidden rounded-[28px] border border-[var(--color-border-gray)] bg-[var(--color-soft-gray)] shadow-[0_18px_35px_rgba(15,108,255,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(15,108,255,0.12)] hover:border-[rgba(15,108,255,0.28)]"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={p.image}
                    alt={p.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <span className="absolute left-4 -bottom-5 inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[linear-gradient(135deg,#0F6CFF,#0B5BD8)] text-white shadow-[0_16px_30px_rgba(15,108,255,0.22)]">
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </span>
                </div>
                <div className="p-5 pt-8">
                  <h3 className="font-display font-semibold text-[var(--color-dark-gray)]">{p.title}</h3>
                  <p className="text-sm text-[var(--color-mid-gray)] mt-1.5 leading-relaxed">{p.summary}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-medium-green)]">
                    Learn More <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Stats strip */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 rounded-[30px] border border-[var(--color-border-gray)] bg-[var(--color-soft-gray)] p-6 md:p-8 shadow-[0_18px_40px_rgba(15,108,255,0.05)]">
          {hero.stats.map((s, i) => {
            const Icon = STAT_ICONS[i % STAT_ICONS.length];
            return (
              <div key={s.label} className="flex items-center gap-3 justify-center rounded-[22px] bg-[var(--color-white)] p-3 ring-1 ring-[rgba(15,108,255,0.04)] shadow-[0_8px_20px_rgba(15,108,255,0.03)] transition-transform duration-200 hover:-translate-y-0.5 md:justify-start">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-light-green-100)] text-[var(--color-medium-green)]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-display text-xl md:text-2xl font-bold text-[var(--color-medium-green)]">{s.value}</span>
                  <span className="block text-xs md:text-sm text-[var(--color-mid-gray)]">{s.label}</span>
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA banner */}
      <section className="pb-16 max-w-7xl mx-auto px-4 md:px-6">
        <div className="relative overflow-hidden rounded-[32px] border border-[var(--color-border-gray)] bg-[var(--surface)] px-6 py-8 md:px-10 md:py-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_18px_40px_rgba(15,108,255,0.08)]">
          <div className="absolute -right-10 top-1/2 hidden h-40 w-40 -translate-y-1/2 rounded-full border border-[var(--color-border-gray)] bg-[var(--color-soft-gray)] md:block" aria-hidden="true" />
          <GraduationCap className="hidden md:block absolute right-8 top-1/2 -translate-y-1/2 w-28 h-28 text-[var(--color-mid-gray)]/20" aria-hidden="true" />
          <div className="relative text-center md:text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-mid-gray)]">Admissions open</p>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-dark-gray)]">Ready to Start Your Journey?</h2>
            <p className="text-[var(--color-mid-gray)] mt-2 max-w-md">
              Join Rambura Garçons TVET School and build the skills for a better future.
            </p>
          </div>
          <div className="relative shrink-0">
            <Link to="/admissions">
              <Button variant="primary" size="lg" icon={ArrowRight} iconPosition="right" className="!bg-[var(--color-medium-green)] !text-white !border-[var(--color-medium-green)] shadow-[0_18px_35px_rgba(15,108,255,0.18)] hover:!bg-[var(--color-medium-green-600)] hover:!text-white">
                Apply Now
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
