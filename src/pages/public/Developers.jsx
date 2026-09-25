import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Search, X } from 'lucide-react';
import PageHero from '../../components/common/PageHero';
import { getDevelopersPage, useContentVersion } from '../../services/contentService';

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
  const [activeDeveloper, setActiveDeveloper] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [skillFilter, setSkillFilter] = useState('All skills');
  const allSkills = [...new Set(page.developers.flatMap((developer) => developer.skills || []))].sort();
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredDevelopers = page.developers.filter((developer) => {
    const matchesSearch = !normalizedSearch || `${developer.name} ${developer.role}`.toLowerCase().includes(normalizedSearch);
    const matchesSkill = skillFilter === 'All skills' || developer.skills?.includes(skillFilter);
    return matchesSearch && matchesSkill;
  });
  const selectedDeveloper = activeDeveloper ? page.developers.find((developer) => developer.name === activeDeveloper) : null;

  const closeDeveloper = () => setActiveDeveloper(null);

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

          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 sm:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">Search developers</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" aria-hidden="true" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search developers..."
                className="w-full rounded-xl border border-[var(--border)] bg-transparent py-2.5 pl-9 pr-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold)]/20"
              />
            </label>
            <label>
              <span className="sr-only">Filter by skill</span>
              <select value={skillFilter} onChange={(event) => setSkillFilter(event.target.value)} className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold)]/20 sm:min-w-44">
                <option>All skills</option>
                {allSkills.map((skill) => <option key={skill}>{skill}</option>)}
              </select>
            </label>
          </div>

          <div className="mb-4 flex items-center justify-between gap-3 text-sm text-[var(--text-secondary)]">
            <span>{filteredDevelopers.length} developer{filteredDevelopers.length === 1 ? '' : 's'}</span>
            {(searchTerm || skillFilter !== 'All skills') && <button type="button" onClick={() => { setSearchTerm(''); setSkillFilter('All skills'); }} className="font-semibold text-[var(--color-gold)] hover:underline">Clear filters</button>}
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {filteredDevelopers.map((developer, index) => (
              <motion.article
                key={developer.name}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className="group flex h-full flex-col overflow-hidden rounded-[26px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_18px_40px_rgba(23,59,49,0.14)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-gold)]/60 hover:shadow-[0_24px_48px_rgba(23,59,49,0.2)]"
              >
                <div className="relative h-64 shrink-0 overflow-hidden border-b border-[var(--border)] bg-[var(--surface-hover)]">
                  {developer.photo ? (
                    <img src={developer.photo} alt={developer.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[var(--surface-hover)] font-display text-6xl font-bold text-[var(--color-gold)]">
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
                  <button
                    type="button"
                    onClick={() => setActiveDeveloper(developer.name)}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-gold)]/45 px-4 py-2.5 text-sm font-semibold text-[var(--color-gold)] transition hover:bg-[var(--color-gold)] hover:text-[var(--color-deep-green)] focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] focus:ring-offset-2 focus:ring-offset-[var(--surface)]"
                  >
                    View profile <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </motion.article>
            ))}
          </div>

          {filteredDevelopers.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[var(--border)] px-6 py-12 text-center text-sm text-[var(--text-secondary)]">
              No developers match your search.
            </div>
          )}

          <AnimatePresence>
            {selectedDeveloper && (
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(6,27,23,0.72)] p-4 backdrop-blur-sm"
                role="presentation"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onMouseDown={(event) => { if (event.target === event.currentTarget) closeDeveloper(); }}
              >
                <motion.div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="developer-dialog-title"
                  initial={{ opacity: 0, y: 18, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.98 }}
                  transition={{ duration: 0.22 }}
                  className="relative w-full max-w-xl overflow-hidden rounded-[28px] border border-[var(--color-gold)]/35 bg-[var(--surface)] shadow-[0_28px_80px_rgba(0,0,0,0.38)]"
                >
                  <button
                    type="button"
                    onClick={closeDeveloper}
                    aria-label="Close developer profile"
                    className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)]/80 text-[var(--text-primary)] transition hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
                  >
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <div className="grid sm:grid-cols-[180px_minmax(0,1fr)]">
                    <div className="h-56 bg-[var(--surface-hover)] sm:h-full">
                      {selectedDeveloper.photo ? (
                        <img src={selectedDeveloper.photo} alt={selectedDeveloper.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center font-display text-6xl font-bold text-[var(--color-gold)]">
                          {selectedDeveloper.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="p-6 sm:p-8">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-gold)]">Developer profile</p>
                      <h2 id="developer-dialog-title" className="mt-2 font-display text-2xl font-bold text-[var(--text-primary)]">{selectedDeveloper.name}</h2>
                      <p className="mt-2 text-sm font-medium text-[var(--text-secondary)]">{selectedDeveloper.role}</p>
                      {selectedDeveloper.bio && <p className="mt-5 text-sm leading-relaxed text-[var(--text-secondary)]">{selectedDeveloper.bio}</p>}
                      {selectedDeveloper.skills?.length > 0 && (
                        <div className="mt-5 flex flex-wrap gap-2">
                          {selectedDeveloper.skills.map((skill) => <span key={skill} className="rounded-full border border-[var(--color-gold)]/30 bg-[var(--color-gold)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-gold)]">{skill}</span>)}
                        </div>
                      )}
                      <div className="mt-6 flex flex-wrap gap-2">
                        {Object.entries(selectedDeveloper.socials || {}).filter(([, link]) => link).map(([platform, link]) => (
                          <a key={platform} href={link} target="_blank" rel="noreferrer" className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold capitalize text-[var(--text-secondary)] transition hover:border-[var(--color-gold)] hover:text-[var(--color-gold)]">
                            {platform}
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </section>
    </div>
  );
}
