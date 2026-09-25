import { Link } from 'react-router-dom';
import { Target, Eye, HeartHandshake, Building2, ArrowRight } from 'lucide-react';
import PageHero from '../../components/common/PageHero';
import Button from '../../components/common/Button';
import { getSiteImage, useSiteImageVersion } from '../../services/imageService';
import { getAbout, useContentVersion } from '../../services/contentService';

export default function About() {
  useContentVersion();
  useSiteImageVersion();
  const about = getAbout();
  return (
    <div>
      <PageHero title={about.heroTitle} image={getSiteImage('about.campus')}>
        <p className="text-[var(--text-secondary)] mt-3 max-w-2xl">
          {about.heroIntro}
        </p>
      </PageHero>

      <section id="history" className="max-w-5xl mx-auto px-4 md:px-6 py-14">
        <div className="mb-8 overflow-hidden rounded-[32px] shadow-[0_22px_60px_rgba(0,0,0,0.18)] ring-1 ring-[var(--border)] aspect-[16/8]">
          <img src={getSiteImage('about.campus')} alt="Rambura Garçons campus grounds" className="w-full h-full object-cover" loading="lazy" />
        </div>

        <div className="rounded-[30px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_18px_35px_rgba(0,0,0,0.14)] md:p-8">
          <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)] mb-4">{about.historyTitle}</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            {about.history}
          </p>
          <Link to="/academics" className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--gold)] hover:underline mt-4">
            View Programs <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <section className="bg-[var(--dark-bg)] py-14">
        <div className="max-w-5xl mx-auto px-4 md:px-6 grid sm:grid-cols-2 gap-6">
          <div id="mission" className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_18px_35px_rgba(0,0,0,0.14)]">
            <Target className="w-7 h-7 text-[var(--text-primary)] mb-3" aria-hidden="true" />
            <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">{about.missionTitle}</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-2">
              {about.mission}
            </p>
          </div>
          <div id="vision" className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_18px_35px_rgba(0,0,0,0.14)]">
            <Eye className="w-7 h-7 text-[var(--text-primary)] mb-3" aria-hidden="true" />
            <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">{about.visionTitle}</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-2">
              {about.vision}
            </p>
          </div>
        </div>
      </section>

      <section id="values" className="max-w-5xl mx-auto px-4 md:px-6 py-14">
        <div className="flex items-center gap-2 mb-6">
          <HeartHandshake className="w-6 h-6 text-[var(--text-primary)]" aria-hidden="true" />
          <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)]">{about.valuesTitle}</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {about.values.map((v) => (
            <div key={v} className="text-center rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_12px_28px_rgba(0,0,0,0.12)]">
              <p className="font-display font-semibold text-[var(--text-primary)]">{v}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="leadership" className="bg-[var(--color-off-white)] py-14">
        <div className="max-w-5xl mx-auto px-4 md:px-6 grid sm:grid-cols-2 gap-8 items-center">
          <div className="overflow-hidden rounded-[32px] aspect-square shadow-[0_22px_50px_rgba(31,41,55,0.10)] ring-1 ring-[rgba(31,41,55,0.06)]">
            <img src={getSiteImage('about.leadership')} alt="Rambura Garçons school leadership" className="w-full h-full object-cover" loading="lazy" />
          </div>
          <div className="rounded-[30px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_18px_35px_rgba(0,0,0,0.14)]">
            <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)] mb-2">{about.leadershipTitle}</h2>
            <p className="text-[var(--text-secondary)] mb-6">{about.leadershipIntro}</p>
            <Button
              as={Link}
              to="/staff"
              variant="primary"
              size="sm"
              icon={ArrowRight}
              iconPosition="right"
            >
              Meet Staff
            </Button>
          </div>
        </div>
      </section>

      <section id="facilities" className="max-w-5xl mx-auto px-4 md:px-6 py-14">
        <div className="flex items-center gap-2 mb-6">
          <Building2 className="w-6 h-6 text-[var(--text-primary)]" aria-hidden="true" />
          <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)]">{about.facilitiesTitle}</h2>
        </div>
        <ul className="grid sm:grid-cols-2 gap-4 text-sm text-[var(--text-secondary)]">
          {about.facilities.map((f) => (
            <li key={f.key} className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_12px_28px_rgba(0,0,0,0.12)]">
              <div className="aspect-[16/9] overflow-hidden">
                <img src={getSiteImage(`about.facilities.${f.key}`)} alt={f.label} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" loading="lazy" />
              </div>
              <p className="p-4 font-medium text-[var(--text-primary)]">{f.label}</p>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-3 mt-8">
          <Link to="/contact" className="text-sm font-semibold text-[var(--text-primary)] hover:underline flex items-center gap-1">
            Contact School <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/" className="text-sm font-semibold text-[var(--text-secondary)] hover:underline">
            ← Back to Home
          </Link>
        </div>
      </section>
    </div>
  );
}
