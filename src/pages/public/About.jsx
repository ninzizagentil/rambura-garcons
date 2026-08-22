import { Link } from 'react-router-dom';
import { Target, Eye, HeartHandshake, Building2, ArrowRight } from 'lucide-react';
import PageHero from '../../components/common/PageHero';
import { getSiteImage } from '../../services/imageService';

const FACILITIES = [
  { key: 'electrical', label: 'Electrical wiring workshop' },
  { key: 'welding', label: 'Welding & fabrication bay' },
  { key: 'construction', label: 'Construction training yard' },
  { key: 'automobile', label: 'Automobile mechanics garage' },
  { key: 'library', label: 'School library and reading hall' },
  { key: 'dormitories', label: 'Boarding dormitories' },
];

const VALUES = ['Discipline', 'Craftsmanship', 'Integrity', 'Service to Community'];

export default function About() {
  return (
    <div>
      <PageHero title="About Rambura Garçons" withDivider>
        <p className="text-white/80 mt-3 max-w-2xl mx-auto">
          A technical and vocational education and training school formed to serve Nyabihu District and beyond.
        </p>
      </PageHero>

      <section id="history" className="max-w-4xl mx-auto px-4 md:px-6 py-14">
        <div className="rounded-[var(--radius-card)] overflow-hidden aspect-[16/8] mb-8">
          <img src={getSiteImage('about.campus')} alt="Rambura Garçons campus grounds" className="w-full h-full object-cover" loading="lazy" />
        </div>
        <h2 className="font-display text-2xl font-semibold text-[var(--color-heading)] mb-4">School History</h2>
        <p className="text-[var(--color-mid-gray)] leading-relaxed">
          Rambura Garçons was founded to answer a clear need in Nyabihu District: skilled tradespeople trained to a
          professional standard, close to home. Since opening, the school has grown from a single workshop to four
          full trade departments, graduating classes of electricians, welders, builders, and mechanics who now work
          across Rwanda's growing construction and industrial sectors.
        </p>
        <Link to="/academics" className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-medium-green)] hover:underline mt-4">
          View Programs <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      <section className="bg-[var(--color-light-green-100)] py-14">
        <div className="max-w-5xl mx-auto px-4 md:px-6 grid sm:grid-cols-2 gap-6">
          <div id="mission" className="bg-[var(--color-white)] rounded-[var(--radius-card)] p-6">
            <Target className="w-7 h-7 text-[var(--color-medium-green)] mb-3" aria-hidden="true" />
            <h3 className="font-display text-lg font-semibold text-[var(--color-dark-gray)]">Mission</h3>
            <p className="text-sm text-[var(--color-mid-gray)] mt-2">
              To equip young Rwandans with practical trade skills, professional discipline, and the confidence to
              build sustainable livelihoods.
            </p>
          </div>
          <div id="vision" className="bg-[var(--color-white)] rounded-[var(--radius-card)] p-6">
            <Eye className="w-7 h-7 text-[var(--color-medium-green)] mb-3" aria-hidden="true" />
            <h3 className="font-display text-lg font-semibold text-[var(--color-dark-gray)]">Vision</h3>
            <p className="text-sm text-[var(--color-mid-gray)] mt-2">
              To be the leading TVET institution in Western Province, known for graduates who set the standard in
              their trades.
            </p>
          </div>
        </div>
      </section>

      <section id="values" className="max-w-5xl mx-auto px-4 md:px-6 py-14">
        <div className="flex items-center gap-2 mb-6">
          <HeartHandshake className="w-6 h-6 text-[var(--color-medium-green)]" aria-hidden="true" />
          <h2 className="font-display text-2xl font-semibold text-[var(--color-heading)]">Core Values</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {VALUES.map((v) => (
            <div key={v} className="text-center bg-[var(--color-off-white)] rounded-[var(--radius-card)] p-5">
              <p className="font-display font-semibold text-[var(--color-dark-gray)]">{v}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="leadership" className="bg-[var(--color-off-white)] py-14">
        <div className="max-w-5xl mx-auto px-4 md:px-6 grid sm:grid-cols-2 gap-8 items-center">
          <div className="rounded-[var(--radius-card)] overflow-hidden aspect-square">
            <img src={getSiteImage('about.leadership')} alt="Rambura Garçons school leadership" className="w-full h-full object-cover" loading="lazy" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold text-[var(--color-heading)] mb-2">Leadership</h2>
            <p className="text-[var(--color-mid-gray)] mb-6">Meet the people guiding Rambura Garçons.</p>
            <Link
              to="/staff"
              className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-medium-green)] hover:underline"
            >
              Meet Staff <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <section id="facilities" className="max-w-5xl mx-auto px-4 md:px-6 py-14">
        <div className="flex items-center gap-2 mb-6">
          <Building2 className="w-6 h-6 text-[var(--color-medium-green)]" aria-hidden="true" />
          <h2 className="font-display text-2xl font-semibold text-[var(--color-heading)]">Facilities</h2>
        </div>
        <ul className="grid sm:grid-cols-2 gap-4 text-sm text-[var(--color-mid-gray)]">
          {FACILITIES.map((f) => (
            <li key={f.key} className="bg-[var(--color-white)] border border-[var(--color-border-gray)] rounded-[var(--radius-control)] overflow-hidden">
              <div className="aspect-[16/9]">
                <img src={getSiteImage(`about.facilities.${f.key}`)} alt={f.label} className="w-full h-full object-cover" loading="lazy" />
              </div>
              <p className="p-4">{f.label}</p>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-3 mt-8">
          <Link to="/contact" className="text-sm font-semibold text-[var(--color-medium-green)] hover:underline flex items-center gap-1">
            Contact School <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/" className="text-sm font-semibold text-[var(--color-mid-gray)] hover:underline">
            ← Back to Home
          </Link>
        </div>
      </section>
    </div>
  );
}
