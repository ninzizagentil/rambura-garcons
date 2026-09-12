import { Code2, Database, LayoutDashboard, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHero from '../../components/common/PageHero';
import Button from '../../components/common/Button';
import { getDevelopersPage, useContentVersion } from '../../services/contentService';

export default function Developers() {
  useContentVersion();
  const page = getDevelopersPage();
  return (
    <div>
      <PageHero title={page.title}>
        <p className="text-[var(--text-secondary)] mt-3 max-w-2xl">{page.intro}</p>
      </PageHero>

      <section className="max-w-6xl mx-auto px-4 md:px-6 py-14 md:py-18">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] items-start">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-medium-green)]">{page.teamLabel}</span>
            <h2 className="mt-2 font-display text-3xl font-bold text-[var(--text-primary)] md:text-4xl">{page.heading}</h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-[var(--text-secondary)]">{page.description}</p>
            <Link to="/" className="mt-7 inline-flex">
              <Button variant="primary" icon={ArrowRight} iconPosition="right">Back to Rambura Garçons</Button>
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {page.developers.map((developer, index) => (
              <article key={developer.name} className="group relative overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_16px_34px_rgba(23,59,49,0.08)] transition-transform duration-300 hover:-translate-y-1">
                <span className="absolute right-4 top-4 text-xs font-bold text-[var(--color-gold)]">0{index + 1}</span>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-deep-green)] font-display text-xl font-bold text-[var(--color-gold)] shadow-[0_12px_24px_rgba(23,59,49,0.18)]">{developer.name.charAt(0)}</div>
                <h3 className="mt-5 font-display text-base font-semibold leading-snug text-[var(--text-primary)]">{developer.name}</h3>
                <p className="mt-2 text-xs font-medium leading-relaxed text-[var(--text-secondary)]">{developer.role}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-14 grid gap-4 border-t border-[var(--border)] pt-8 md:grid-cols-3">
          {page.capabilities.map(({ label, detail }, index) => {
            const Icon = [LayoutDashboard, Database, Code2][index % 3];
            return (
            <div key={label} className="rounded-[22px] border border-[var(--border)] bg-[var(--color-soft-gray)] p-5 shadow-[0_10px_24px_rgba(23,59,49,0.04)]">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-light-green-100)]"><Icon className="h-5 w-5 text-[var(--color-medium-green)]" aria-hidden="true" /></span>
              <h3 className="mt-4 font-display text-sm font-semibold text-[var(--text-primary)]">{label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{detail}</p>
            </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
