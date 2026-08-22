import { Link } from 'react-router-dom';
import { ArrowRight, Wrench, Zap, HardHat, Car, Award } from 'lucide-react';
import HillRidgeDivider from '../../components/common/HillRidgeDivider';
import Button from '../../components/common/Button';
import { getHero, getPrograms, getNews } from '../../services/contentService';
import { getSiteImage } from '../../services/imageService';

const PROGRAM_ICONS = {
  'electrical-technology': Zap,
  'welding-fabrication': Wrench,
  construction: HardHat,
  'automobile-mechanics': Car,
};

export default function Home() {
  const hero = getHero();
  const programs = getPrograms().slice(0, 4);
  const latestNews = getNews().slice(0, 3);
  const heroImage = getSiteImage('home.hero');
  const previewImages = [0, 1, 2, 3].map((i) => getSiteImage(`home.gallery.${i}`));

  return (
    <div>
      {/* Hero */}
      <section className="relative text-white overflow-hidden">
        {/* Full-bleed background photo — image only, no colour overlay */}
        <div className="absolute inset-0" aria-hidden="true">
          <img
            src={heroImage}
            alt=""
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-20 md:py-32">
          <div className="max-w-xl bg-[var(--color-deep-green)]/70 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl p-6 md:p-9">
            <span className="inline-block text-xs font-semibold tracking-wide uppercase text-[var(--color-gold)] mb-4">
              {hero.eyebrow}
            </span>
            <h1 className="font-display text-4xl md:text-5xl font-semibold leading-tight">
              {hero.title}
            </h1>
            <p className="text-white/85 mt-5 text-base md:text-lg max-w-lg">
              {hero.subtitle}
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link to="/about">
                <Button variant="gold" size="lg" icon={ArrowRight} iconPosition="right">Learn More</Button>
              </Link>
              <Link to="/admissions">
                <Button variant="secondary" size="lg" className="!bg-white/10 !text-white !border-white/20 hover:!bg-white/20">
                  Admissions
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <HillRidgeDivider tone="gold" className="relative" />
      </section>

      {/* Stats */}
      <section className="bg-[var(--color-off-white)] py-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {hero.stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-3xl md:text-4xl font-semibold text-[var(--color-heading)]">{s.value}</p>
              <p className="text-sm text-[var(--color-mid-gray)] mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Programs */}
      <section className="py-16 max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-semibold text-[var(--color-heading)]">
              Trade Programs
            </h2>
            <p className="text-[var(--color-mid-gray)] mt-1">Four core trades, taught by practicing professionals.</p>
          </div>
          <Link to="/academics" className="text-sm font-semibold text-[var(--color-medium-green)] hover:underline flex items-center gap-1">
            View all programs <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {programs.map((p) => {
            const Icon = PROGRAM_ICONS[p.slug] || Wrench;
            return (
            <Link
              key={p.slug}
              to="/academics"
              className="group rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-5 hover:shadow-card-hover hover:border-[var(--color-medium-green)] transition-all"
            >
              <span className="inline-flex items-center justify-center w-11 h-11 rounded-lg bg-[var(--color-light-green-100)] text-[var(--color-medium-green)] mb-4">
                <Icon className="w-5 h-5" aria-hidden="true" />
              </span>
              <h3 className="font-display font-semibold text-[var(--color-dark-gray)]">{p.title}</h3>
              <p className="text-sm text-[var(--color-mid-gray)] mt-1.5">{p.summary}</p>
            </Link>
            );
          })}
        </div>
      </section>

      {/* News */}
      <section className="bg-[var(--color-light-green-100)] py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
            <h2 className="font-display text-2xl md:text-3xl font-semibold text-[var(--color-heading)]">Latest News</h2>
            <Link to="/news" className="text-sm font-semibold text-[var(--color-medium-green)] hover:underline flex items-center gap-1">
              All news <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {latestNews.map((n) => (
              <Link key={n.slug} to={`/news/${n.slug}`} className="bg-[var(--color-white)] rounded-[var(--radius-card)] p-5 hover:shadow-card-hover transition-shadow">
                <p className="text-xs text-[var(--color-gold)] font-semibold">
                  {new Date(n.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                <h3 className="font-display font-semibold text-[var(--color-dark-gray)] mt-2">{n.title}</h3>
                <span className="text-sm font-medium text-[var(--color-medium-green)] mt-3 inline-flex items-center gap-1">
                  Read more <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery preview */}
      <section className="py-16 max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-[var(--color-heading)]">Campus Gallery</h2>
          <Link to="/gallery" className="text-sm font-semibold text-[var(--color-medium-green)] hover:underline flex items-center gap-1">
            View gallery <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {previewImages.map((src, i) => (
            <Link key={i} to="/gallery" className="aspect-square rounded-[var(--radius-card)] overflow-hidden block hover:opacity-85 transition-opacity">
              <img src={src} alt={`Campus photo ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[var(--color-deep-green)] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <Award className="w-9 h-9 mx-auto mb-4 text-[var(--color-gold)]" aria-hidden="true" />
          <h2 className="font-display text-2xl md:text-3xl font-semibold">Ready to build your future in a trade?</h2>
          <p className="text-white/70 mt-3 max-w-xl mx-auto">
            Applications for the 2027 intake open soon. Review requirements and start your application today.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-7">
            <Link to="/admissions"><Button variant="gold" size="lg">Start Admissions</Button></Link>
            <Link to="/contact">
              <Button variant="secondary" size="lg" className="!bg-transparent !text-white !border-white/30 hover:!bg-white/10">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
