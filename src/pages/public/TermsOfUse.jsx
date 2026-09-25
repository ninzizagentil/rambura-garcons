import PageHero from '../../components/common/PageHero';
import { getSiteImage, useSiteImageVersion } from '../../services/imageService';

export default function TermsOfUse() {
  useSiteImageVersion();
  return (
    <div>
      <PageHero title="Terms of Use" image={getSiteImage('pageHeroes.contact')}>
        <p className="mt-3 text-[var(--text-secondary)]">Terms for using the Rambura Garçons public website.</p>
      </PageHero>
      <section className="mx-auto max-w-3xl px-4 py-14 md:px-6">
        <div className="space-y-8 text-sm leading-7 text-[var(--text-secondary)]">
          <div>
            <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">Website content</h2>
            <p className="mt-2">The information on this website is provided to help students, families, and partners learn about Rambura Garçons and its services. Details may change as school programmes and dates are updated.</p>
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">Applications and messages</h2>
            <p className="mt-2">You are responsible for providing accurate information in forms. Submitting an application does not by itself guarantee admission.</p>
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">Contact</h2>
            <p className="mt-2">Please contact the school directly if you need clarification about any information published here.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
