import { getStaff } from '../../services/contentService';
import PageHero from '../../components/common/PageHero';

export default function Staff() {
  const staff = getStaff();
  return (
    <div>
      <PageHero title="Our Staff">
        <p className="text-white/80 mt-3">The instructors and leaders behind Rambura Garçons.</p>
      </PageHero>

      <section className="max-w-6xl mx-auto px-4 md:px-6 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {staff.map((s) => (
            <div key={s.id} className="rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-6">
              <img
                src={s.photo}
                alt={s.name}
                className="w-16 h-16 rounded-full object-cover mb-4"
                loading="lazy"
              />
              <h2 className="font-display font-semibold text-[var(--color-dark-gray)]">{s.name}</h2>
              <p className="text-sm text-[var(--color-gold)] font-medium">{s.role}</p>
              <p className="text-xs text-[var(--color-mid-gray)] mt-1">{s.department}</p>
              <p className="text-sm text-[var(--color-mid-gray)] mt-3">{s.bio}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
