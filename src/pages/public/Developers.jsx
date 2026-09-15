import { ArrowUpRight, Mail, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHero from '../../components/common/PageHero';
import { getDevelopersPage, getContactInfo, useContentVersion } from '../../services/contentService';

function FacebookGlyph(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M13.5 22v-8h2.8l.4-3.2h-3.2V7.5c0-.9.3-1.5 1.6-1.5H17V2.9c-.3-.1-1.4-.2-2.7-.2-2.6 0-4.4 1.6-4.4 4.5V10.8H7.5V14h2.4v8h3.6Z" />
    </svg>
  );
}

function InstagramGlyph(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function WhatsAppGlyph(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12.04 2.4A9.6 9.6 0 0 0 4 17.16L2.7 21.3l4.25-1.45A9.6 9.6 0 1 0 12.04 2.4Zm5.1 13.08c-.17.49-1 .76-1.64.78-.44.02-.96.02-2.92-.78-1.62-.68-2.72-2.13-2.8-2.23-.08-.1-1.06-1.4-1.06-2.66 0-1.26.67-1.88 1.1-2.1.2-.1.42-.08.55-.08h.4a.5.5 0 0 1 .38.18l.45.67c.14.2.48.56.51.6a.4.4 0 0 1-.1.46l-.3.28c-.15.14-.25.24-.12.48.24.45.78 1.13 1.54 1.79.7.62 1.27.82 1.52.9.25.08.43.02.59-.15l.42-.47c.12-.13.29-.17.46-.12l1.14.35c.2.06.38.22.42.42.08.35.06.89-.1 1.28Z" />
    </svg>
  );
}

function TwitterGlyph(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M18.9 2h3.35l-7.3 8.34 8.6 11.66H16.6l-5.57-7.53-6.35 7.53H1.33L9.16 12.8 1 2h7.3l5.04 6.8L18.9 2Zm-1.17 15.14h1.85L7.35 3.7H5.4l12.33 13.44Z" />
    </svg>
  );
}

function GitHubGlyph(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.76.6-3.33-1.17-3.33-1.17-.45-1.15-1.1-1.46-1.1-1.46-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.88 1.5 2.3 1.07 2.87.82.09-.64.35-1.07.63-1.31-2.2-.25-4.51-1.1-4.51-4.9 0-1.08.38-1.97 1.02-2.66-.1-.25-.44-1.27.1-2.64 0 0 .83-.27 2.72 1.01A9.32 9.32 0 0 1 12 6.8c.84 0 1.68.11 2.47.33 1.89-1.29 2.72-1.01 2.72-1.01.55 1.37.21 2.39.11 2.64.64.69 1.01 1.58 1.01 2.66 0 3.81-2.31 4.64-4.52 4.89.36.31.68.92.68 1.87v2.77c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
    </svg>
  );
}

export default function Developers() {
  useContentVersion();
  const page = getDevelopersPage();
  const contact = getContactInfo();
  return (
    <div>
      <PageHero title={page.title}>
        <p className="mt-3 max-w-2xl text-[var(--text-secondary)]">{page.intro}</p>
      </PageHero>

      <section className="max-w-6xl mx-auto px-4 md:px-6 py-14 md:py-18">
        <div className="space-y-10">
          <div className="max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-medium-green)]">Meet the team</span>
            <h2 className="mt-2 font-display text-3xl font-bold text-[var(--text-primary)] md:text-4xl">{page.heading}</h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--text-secondary)]">{page.description}</p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {page.developers.map((developer, index) => (
              <article key={developer.name} className="group flex h-full flex-col overflow-hidden rounded-[26px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(11,45,38,0.95),rgba(10,26,24,0.98))] shadow-[0_18px_40px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-gold)]/60">
                <div className="relative h-64 shrink-0 overflow-hidden border-b border-white/10 bg-[var(--color-deep-green)]">
                  {developer.photo ? (
                    <img src={developer.photo} alt={developer.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,var(--color-deep-green),var(--color-deep-green-600))] font-display text-6xl font-bold text-[var(--color-gold)]">
                      {developer.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-display text-[1.55rem] font-bold leading-tight text-[var(--text-primary)]">{developer.name}</h3>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-[var(--text-secondary)]">{developer.role}</p>
                  {developer.bio && <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">{developer.bio}</p>}
                  {developer.skills?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {developer.skills.map((skill) => <span key={skill} className="rounded-full border border-[var(--color-gold)]/25 bg-[var(--color-gold)]/10 px-2.5 py-1 text-[10px] font-semibold text-[var(--color-gold)]">{skill}</span>)}
                    </div>
                  )}

                  <div className="mt-auto flex items-center gap-2.5 pt-6">
                    {developer.socials?.facebook && (
                      <a href={developer.socials.facebook} target="_blank" rel="noreferrer" aria-label={`${developer.name} Facebook`} title="Facebook" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[#1877F2]/10 text-[#1877F2] transition hover:border-[#1877F2]/60 hover:bg-[#1877F2]/15">
                        <FacebookGlyph className="h-4 w-4" />
                      </a>
                    )}
                    {developer.socials?.instagram && (
                      <a href={developer.socials.instagram} target="_blank" rel="noreferrer" aria-label={`${developer.name} Instagram`} title="Instagram" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[radial-gradient(circle_at_top,#feda75_0%,#f58529_20%,#dd2a7b_45%,#8134af_70%,#515bd4_100%)] text-white transition hover:opacity-90">
                        <InstagramGlyph className="h-4 w-4" />
                      </a>
                    )}
                    {developer.socials?.whatsapp && (
                      <a href={developer.socials.whatsapp} target="_blank" rel="noreferrer" aria-label={`${developer.name} WhatsApp`} title="WhatsApp" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[#25D366]/10 text-[#25D366] transition hover:border-[#25D366]/60 hover:bg-[#25D366]/15">
                        <WhatsAppGlyph className="h-4 w-4" />
                      </a>
                    )}
                    {developer.socials?.twitter && (
                      <a href={developer.socials.twitter} target="_blank" rel="noreferrer" aria-label={`${developer.name} Twitter`} title="Twitter" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[#1DA1F2]/10 text-[#1DA1F2] transition hover:border-[#1DA1F2]/60 hover:bg-[#1DA1F2]/15">
                        <TwitterGlyph className="h-4 w-4" />
                      </a>
                    )}
                    {developer.socials?.github && (
                      <a href={developer.socials.github} target="_blank" rel="noreferrer" aria-label={`${developer.name} GitHub`} title="GitHub" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[#181717]/40 text-[#f5f5f5] transition hover:border-white/30 hover:bg-[#181717]/60">
                        <GitHubGlyph className="h-4 w-4" />
                      </a>
                    )}
                    {(developer.socials?.facebook || developer.socials?.instagram || developer.socials?.whatsapp || developer.socials?.twitter || developer.socials?.github) && (
                      <ArrowUpRight className="ml-1 h-4 w-4 text-[var(--color-gold)]" aria-hidden="true" />
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-16 border-t border-[var(--border)] pt-12">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-medium-green)]">How we support the school</span>
            <h2 className="mt-2 font-display text-3xl font-bold text-[var(--text-primary)] md:text-4xl">Practical tools for everyday school life.</h2>
            <p className="mt-3 text-base leading-relaxed text-[var(--text-secondary)]">A connected digital experience that helps students, families, staff, and school leaders find information and get work done.</p>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {(page.capabilities || []).map((capability, index) => (
              <article key={capability.label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_12px_28px_rgba(23,59,49,0.07)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-gold)]/50 hover:shadow-[0_18px_34px_rgba(23,59,49,0.12)]">
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-deep-green)] font-display text-sm font-bold text-[var(--color-gold)]">0{index + 1}</span>
                  <ArrowUpRight className="h-5 w-5 text-[var(--color-gold)]" aria-hidden="true" />
                </div>
                <h3 className="mt-6 font-display text-lg font-bold text-[var(--text-primary)]">{capability.label}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{capability.detail}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_16px_34px_rgba(23,59,49,0.08)] sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-deep-green)] text-[var(--color-gold)]">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">Need help with the school website?</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Contact the school team for questions, updates, or technical support.</p>
            </div>
          </div>
          <Link to="/contact" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[var(--color-deep-green)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-deep-green-600)]">
            <Mail className="h-4 w-4" aria-hidden="true" />
            {contact.email || 'Contact the school'}
          </Link>
        </div>
      </section>
    </div>
  );
}
