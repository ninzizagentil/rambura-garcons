import { useState } from 'react';
import { Users, ArrowRight } from 'lucide-react';
import { getDepartments, getStaff } from '../../services/contentService';
import Modal from '../../components/modals/Modal';
import PageHero from '../../components/common/PageHero';

export default function Departments() {
  const [selected, setSelected] = useState(null);
  const departments = getDepartments();
  const staff = getStaff();
  const deptStaff = selected ? staff.filter((s) => s.department.toLowerCase().includes(selected.name.split(' ')[0].toLowerCase())) : [];

  return (
    <div>
      <PageHero title="Departments">
        <p className="text-white/80 mt-3">Four departments, each led by an experienced trade professional.</p>
      </PageHero>

      <section className="max-w-6xl mx-auto px-4 md:px-6 py-14">
        <div className="grid sm:grid-cols-2 gap-6">
          {departments.map((d) => (
            <button
              key={d.slug}
              type="button"
              onClick={() => setSelected(d)}
              className="text-left rounded-[var(--radius-card)] border border-[var(--color-border-gray)] overflow-hidden hover:shadow-card-hover transition-shadow"
            >
              <div className="aspect-[16/8]">
                <img
                  src={d.image}
                  alt={d.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-6">
              <h2 className="font-display text-lg font-semibold text-[var(--color-dark-gray)]">{d.name}</h2>
              <p className="text-sm text-[var(--color-mid-gray)] mt-2">Head: {d.head}</p>
              <p className="flex items-center gap-1.5 text-sm text-[var(--color-mid-gray)] mt-1">
                <Users className="w-4 h-4" aria-hidden="true" /> {d.staffCount} staff members
              </p>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-medium-green)] mt-4">
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
            <p className="text-sm text-[var(--color-mid-gray)]">Head of Department: <strong className="text-[var(--color-dark-gray)]">{selected.head}</strong></p>
            <p className="text-sm font-semibold text-[var(--color-dark-gray)] mt-4 mb-2">Staff</p>
            <ul className="space-y-2">
              {deptStaff.length > 0 ? (
                deptStaff.map((s) => (
                  <li key={s.id} className="text-sm text-[var(--color-mid-gray)]">
                    <span className="text-[var(--color-dark-gray)] font-medium">{s.name}</span> — {s.role}
                  </li>
                ))
              ) : (
                <li className="text-sm text-[var(--color-mid-gray)]">Staff listing available on the Staff page.</li>
              )}
            </ul>
          </div>
        )}
      </Modal>
    </div>
  );
}
