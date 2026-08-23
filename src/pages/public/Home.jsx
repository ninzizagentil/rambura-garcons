import { Link } from 'react-router-dom';
import {
  ArrowRight, Star, Wrench, Zap, HardHat, Car, Award,
  UserCheck, Building2, Target, GraduationCap, Users, BookOpen, Play,
} from 'lucide-react';
import Button from '../../components/common/Button';
import { getHero, getPrograms } from '../../services/contentService';
import { getSiteImage } from '../../services/imageService';

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

/** Splits the CMS headline into a light first line and a green second line,
 *  mirroring the two-tone hero heading, while staying safe if the title
 *  only has a single sentence. */
function splitHeadline(title = '') {
  const parts = title.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (parts.length < 2) return { first: title, rest: '' };
  return { first: parts[0], rest: parts.slice(1).join(' ') };
}

export default function Home() {
  const hero = getHero();
  const programs = getPrograms().slice(0, 4);
  const heroImage = getSiteImage('home.hero');
  const aboutImage = getSiteImage('about.campus');
  const { first: headlineFirst, rest: headlineRest } = splitHeadline(hero.title);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" aria-hidden="true">
          <img src={heroImage} alt="" className="w-full h-full object-cover" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-deep-green)]/95 via-[var(--color-deep-green)]/75 to-[var(--color-deep-green)]/20" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 md:px-6 flex flex-col justify-between min-h-[560px] md:min-h-[620px] pb-0">
          <div className="max-w-xl pt-16 md:pt-24">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-[var(--color-deep-green)] text-xs font-semibold">
              <Star className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
              {hero.eyebrow}
            </span>

            <h1 className="font-display text-4xl md:text-[3.25rem] leading-[1.08] font-bold mt-5 text-white">
              {headlineFirst}
              {headlineRest && (
                <span className="block text-[var(--color-light-green)]">{headlineRest}</span>
              )}
            </h1>

            <p className="text-white/85 mt-6 text-base md:text-lg max-w-lg leading-relaxed">
              {hero.subtitle}
            </p>

            <div className="flex flex-wrap gap-3 mt-8">
              <Link to="/academics">
                <Button variant="secondary" size="lg" icon={ArrowRight} iconPosition="right">
                  Discover More
                </Button>
              </Link>
              <Link to="/about">
                <Button
                  variant="secondary"
                  size="lg"
                  icon={ArrowRight}
                  iconPosition="right"
                  className="!bg-transparent !text-white !border-white/40 hover:!bg-white/10"
                >
                  Learn About Us
                </Button>
              </Link>
            </div>
          </div>

          {/* Highlights strip */}
          <div className="bg-[var(--color-deep-green)]/85 backdrop-blur-sm -mx-4 md:-mx-6 px-4 md:px-6 py-6 mt-12">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {HERO_HIGHLIGHTS.map(({ Icon, title, subtitle }) => (
                <div key={title} className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 text-[var(--color-gold)] shrink-0">
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </span>
                  <span className="text-white text-sm font-semibold leading-tight">
                    {title}
                    <span className="block font-normal text-white/70">{subtitle}</span>
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
          <div className="relative rounded-2xl overflow-hidden shadow-card-hover aspect-[4/3]">
            <img src={aboutImage} alt="Students training in the workshop" className="w-full h-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            <Link
              to="/about"
              aria-label="Learn more about Rambura Garçons"
              className="absolute bottom-5 right-5 inline-flex items-center justify-center w-12 h-12 rounded-full bg-white text-[var(--color-deep-green)] shadow-lg hover:scale-105 transition-transform"
            >
              <Play className="w-5 h-5 fill-current ml-0.5" aria-hidden="true" />
            </Link>
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
                <div key={title}>
                  <span className="inline-flex items-center justify-center w-11 h-11 rounded-lg bg-[var(--color-light-green-100)] text-[var(--color-medium-green)] mb-3">
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
            <Button variant="secondary" size="md" icon={ArrowRight} iconPosition="right">
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
                className="group rounded-[var(--radius-card)] bg-white border border-[var(--color-border-gray)] overflow-hidden hover:shadow-card-hover hover:border-[var(--color-medium-green)] transition-all"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={p.image}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <span className="absolute left-4 -bottom-5 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--color-deep-green)] text-white shadow-card-hover">
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </span>
                </div>
                <div className="p-5 pt-8">
                  <h3 className="font-display font-semibold text-[var(--color-dark-gray)]">{p.title}</h3>
                  <p className="text-sm text-[var(--color-mid-gray)] mt-1.5 leading-relaxed">{p.summary}</p>
                  <span className="text-sm font-semibold text-[var(--color-medium-green)] mt-4 inline-flex items-center gap-1">
                    Learn More <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 bg-[var(--color-off-white)] rounded-2xl p-6 md:p-8">
          {hero.stats.map((s, i) => {
            const Icon = STAT_ICONS[i % STAT_ICONS.length];
            return (
              <div key={s.label} className="flex items-center gap-3 justify-center md:justify-start">
                <span className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-[var(--color-light-green-100)] text-[var(--color-medium-green)] shrink-0">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-display text-xl md:text-2xl font-bold text-[var(--color-deep-green)]">{s.value}</span>
                  <span className="block text-xs md:text-sm text-[var(--color-mid-gray)]">{s.label}</span>
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA banner */}
      <section className="pb-16 max-w-7xl mx-auto px-4 md:px-6">
        <div className="relative overflow-hidden rounded-2xl bg-[var(--color-deep-green)] px-6 py-8 md:px-10 md:py-10 flex flex-col md:flex-row items-center md:items-center justify-between gap-6">
          <GraduationCap className="hidden md:block absolute right-6 top-1/2 -translate-y-1/2 w-32 h-32 text-white/5" aria-hidden="true" />
          <div className="relative text-center md:text-left">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-white">Ready to Start Your Journey?</h2>
            <p className="text-white/70 mt-2 max-w-md">
              Join Rambura Garçons TVET School and build the skills for a better future.
            </p>
          </div>
          <div className="relative shrink-0">
            <Link to="/admissions">
              <Button variant="secondary" size="lg" icon={ArrowRight} iconPosition="right">
                Apply Now
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
