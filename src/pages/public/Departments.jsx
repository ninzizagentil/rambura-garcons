import { useState } from 'react';
import { Users, ArrowRight } from 'lucide-react';
import { getDepartments, getDepartmentsPage, getStaff, useContentVersion } from '../../services/contentService';
import { getSiteImage, useSiteImageVersion } from '../../services/imageService';
import Modal from '../../components/modals/Modal';
import PageHero from '../../components/common/PageHero';

export default function Departments() {
  useContentVersion();
  useSiteImageVersion();
  const [selected, setSelected] = useState(null);
  const departments = getDepartments();
  const page = getDepartmentsPage();
  const staff = getStaff();
  const deptStaff = selected ? staff.filter((s) => s.department.toLowerCase().includes(selected.name.split(' ')[0].toLowerCase())) : [];

  return (
    <div>
      <PageHero title={page.title} image={getSiteImage('pageHeroes.departments')}>
        <p className="text-[var(--text-secondary)] mt-3">{page.intro}</p>
      </PageHero>

      <section className="max-w-6xl mx-auto px-4 md:px-6 py-14">
        <div className="grid sm:grid-cols-2 gap-6">
          {departments.map((d) => (
            <button
              key={d.slug}
              type="button"
              onClick={() => setSelected(d)}
              className="group text-left overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_18px_35px_rgba(0,0,0,0.16)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(0,0,0,0.22)] hover:border-[var(--gold)]/40"
            >
              <div className="aspect-[16/8] overflow-hidden">
                <img
                  src={d.image}
                  alt={d.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="p-6">
                <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">{d.name}</h2>
                <p className="text-sm text-[var(--text-secondary)] mt-2">Head: {d.head}</p>
                <p className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] mt-1">
                  <Users className="w-4 h-4 text-[var(--gold)]" aria-hidden="true" /> {d.staffCount} staff members
                </p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--gold)] mt-4">
                  View Details <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name} size="md">
        {selected && (
          <div>
            <p className="text-sm text-[var(--text-secondary)]">Head of Department: <strong className="text-[var(--text-primary)]">{selected.head}</strong></p>
            <p className="text-sm font-semibold text-[var(--text-primary)] mt-4 mb-2">Staff</p>
            <ul className="space-y-2">
              {deptStaff.length > 0 ? (
                deptStaff.map((s) => (
                  <li key={s.id} className="text-sm text-[var(--text-secondary)]">
                    <span className="text-[var(--text-primary)] font-medium">{s.name}</span> — {s.role}
                  </li>
                ))
              ) : (
                <li className="text-sm text-[var(--text-secondary)]">Staff listing available on the Staff page.</li>
              )}
            </ul>
          </div>
        )}
      </Modal>
    </div>
  );
}
