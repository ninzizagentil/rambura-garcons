import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Clock, GraduationCap, ArrowRight, X } from 'lucide-react';
import { getAcademicsPage, getPrograms, useContentVersion } from '../../services/contentService';
import { getSiteImage, useSiteImageVersion } from '../../services/imageService';
import Modal from '../../components/modals/Modal';
import Button from '../../components/common/Button';
import PageHero from '../../components/common/PageHero';

export default function Academics() {
  useContentVersion();
  useSiteImageVersion();
  const [selected, setSelected] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const programs = getPrograms();
  const page = getAcademicsPage();

  // Deep link support: /academics?program=<slug> (used by the footer's
  // Programs list) opens straight to that program's details modal.
  useEffect(() => {
    const slug = searchParams.get('program');
    if (!slug) return;
    const match = getPrograms().find((p) => p.slug === slug);
    if (match) setSelected(match);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const closeModal = () => {
    setSelected(null);
    if (searchParams.get('program')) {
      searchParams.delete('program');
      setSearchParams(searchParams, { replace: true });
    }
  };

  return (
    <div>
      <PageHero title={page.title} image={getSiteImage('pageHeroes.academics')}>
        <p className="text-[var(--text-secondary)] mt-3">{page.intro}</p>
      </PageHero>

      <section className="max-w-6xl mx-auto px-4 md:px-6 py-14">
        <div className="grid sm:grid-cols-2 gap-6">
          {programs.map((p) => (
            <div key={p.slug} className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_18px_35px_rgba(0,0,0,0.16)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(0,0,0,0.22)] hover:border-[var(--gold)]/40">
              <div className="aspect-[16/9] overflow-hidden">
                <img
                  src={p.image}
                  alt={p.title}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="p-6">
                <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">{p.title}</h2>
                <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)] mt-2">
                  <span className="flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5 text-[var(--gold)]" /> {p.level}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-[var(--gold)]" /> {p.duration}</span>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mt-3">{p.summary}</p>
                <div className="flex gap-4 mt-5">
                  <button
                    type="button"
                    onClick={() => setSelected(p)}
                    className="text-sm font-semibold text-[var(--gold)] hover:underline flex items-center gap-1"
                  >
                    Learn More <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <Link to="/admissions" className="text-sm font-semibold text-[var(--gold)] hover:underline">
                    Apply
                  </Link>
                  <Link to="/contact" className="text-sm font-semibold text-[var(--text-secondary)] hover:underline">
                    Contact
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Modal open={!!selected} onClose={closeModal} title={selected?.title} size="md">
        {selected && (
          <div>
            <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)] mb-4">
              <span className="flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5 text-[var(--gold)]" /> {selected.level}</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-[var(--gold)]" /> {selected.duration}</span>
            </div>
            <p className="text-sm text-[var(--text-primary)] leading-relaxed">{selected.details}</p>
            <div className="flex gap-3 mt-6">
              <Link to="/admissions"><Button variant="primary">Apply Now</Button></Link>
              <Button variant="ghost" onClick={closeModal} icon={X}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
