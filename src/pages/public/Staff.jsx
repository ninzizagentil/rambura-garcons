import { getStaff, useContentVersion } from '../../services/contentService';
import { getSiteImage, useSiteImageVersion } from '../../services/imageService';
import PageHero from '../../components/common/PageHero';

export default function Staff() {
  useContentVersion();
  useSiteImageVersion();
  const staff = getStaff();
  return (
    <div>
      <PageHero title="Our Staff" image={getSiteImage('pageHeroes.staff')}>
        <p className="text-[var(--text-secondary)] mt-3">The instructors and leaders behind Rambura Garçons.</p>
      </PageHero>

      <section className="max-w-6xl mx-auto px-4 md:px-6 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {staff.map((s) => (
            <div key={s.id} className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_18px_35px_rgba(0,0,0,0.14)]">
              <img
                src={s.photo}
                alt={s.name}
                className="w-16 h-16 rounded-full object-cover mb-4 ring-4 ring-[rgba(15,108,255,0.18)]"
                loading="lazy"
              />
              <h2 className="font-display font-semibold text-[var(--text-primary)]">{s.name}</h2>
              <p className="text-sm text-[var(--gold)] font-medium">{s.role}</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">{s.department}</p>
              <p className="text-sm text-[var(--text-secondary)] mt-3">{s.bio}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
