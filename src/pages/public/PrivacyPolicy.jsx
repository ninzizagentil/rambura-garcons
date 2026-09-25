import PageHero from '../../components/common/PageHero';
import { getSiteImage, useSiteImageVersion } from '../../services/imageService';

export default function PrivacyPolicy() {
  useSiteImageVersion();
  return (
    <div>
      <PageHero title="Privacy Policy" image={getSiteImage('pageHeroes.contact')}>
        <p className="mt-3 text-[var(--text-secondary)]">How Rambura Garçons handles information submitted through this website.</p>
      </PageHero>
      <section className="mx-auto max-w-3xl px-4 py-14 md:px-6">
        <div className="space-y-8 text-sm leading-7 text-[var(--text-secondary)]">
          <div>
            <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">Information we collect</h2>
            <p className="mt-2">When you contact the school or submit an admission application, we collect the details needed to respond to you and process your request.</p>
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">How we use it</h2>
            <p className="mt-2">We use submitted information for admissions follow-up, responding to messages, and operating the school website. We do not sell visitor information.</p>
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">Questions</h2>
            <p className="mt-2">For privacy questions, please use the <a className="font-semibold text-[var(--gold)] hover:underline" href="/contact">Contact Us</a> page.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
