import { useState, useCallback, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getGallery, getGalleryPage, useContentVersion } from '../../services/contentService';
import { getSiteImage, useSiteImageVersion } from '../../services/imageService';
import PageHero from '../../components/common/PageHero';

export default function Gallery() {
  useContentVersion();
  useSiteImageVersion();
  const [index, setIndex] = useState(null);
  const [category, setCategory] = useState('All');
  const gallery = getGallery();
  const page = getGalleryPage();
  const categories = ['All', ...new Set(gallery.map((img) => img.category || 'General'))];
  const visibleGallery = category === 'All' ? gallery : gallery.filter((img) => (img.category || 'General') === category);
  const open = index !== null;

  const close = useCallback(() => setIndex(null), []);
  const prev = useCallback(() => setIndex((i) => (i - 1 + visibleGallery.length) % visibleGallery.length), [visibleGallery.length]);
  const next = useCallback(() => setIndex((i) => (i + 1) % visibleGallery.length), [visibleGallery.length]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, close, prev, next]);

  return (
    <div>
      <PageHero title={page.title} image={getSiteImage('pageHeroes.gallery')}>
        <p className="text-[var(--text-secondary)] mt-3">{page.intro}</p>
      </PageHero>

      <section className="max-w-6xl mx-auto px-4 md:px-6 py-14">
        <div className="mb-8" aria-label="Gallery categories">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Browse by category</p>
          <div className="flex flex-wrap gap-2.5">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => { setCategory(item); setIndex(null); }}
              aria-pressed={category === item}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 ${category === item ? 'border-[var(--button-primary)] bg-[var(--button-primary)] text-white shadow-[0_8px_20px_rgba(15,108,255,0.2)] ring-2 ring-[var(--button-primary)]/15' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:-translate-y-0.5 hover:border-[var(--button-primary)] hover:text-[var(--button-primary)] hover:shadow-sm'}`}
            >
              {item}
            </button>
          ))}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {visibleGallery.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setIndex(i)}
              className="group relative aspect-square overflow-hidden rounded-[24px] border border-[var(--color-border-gray)] bg-[var(--surface)] shadow-[0_18px_35px_rgba(15,108,255,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(15,108,255,0.12)]"
              aria-label={`View photo: ${img.caption}`}
            >
              <img
                src={img.image}
                alt={img.caption}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />

              <span className="absolute left-3 top-3 rounded-full border border-white/30 bg-black/45 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-sm">
                {img.category || 'General'}
              </span>

              <span className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.72))] text-white px-3 py-2.5 text-left opacity-90">
                <span className="block text-[10px] uppercase tracking-[0.14em] text-white/70">{img.category || 'General'}</span>
                <span className="mt-1 block text-xs sm:text-sm font-medium">{img.caption}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {open && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Image lightbox">
          <button type="button" onClick={close} aria-label="Close" className="absolute top-4 right-4 z-10 text-white/80 hover:text-white p-2">
            <X className="w-7 h-7" />
          </button>
          <button type="button" onClick={prev} aria-label="Previous image" className="absolute left-2 sm:left-6 z-10 text-white/80 hover:text-white p-2">
            <ChevronLeft className="w-9 h-9" />
          </button>

          <img
            src={visibleGallery[index].image}
            alt={visibleGallery[index].caption}
            className="w-screen h-screen object-contain"
          />

          {visibleGallery[index].caption && (
            <p className="absolute bottom-6 inset-x-0 text-center text-white/85 text-sm px-16">
              <span className="block text-[10px] uppercase tracking-[0.18em] text-white/60">{visibleGallery[index].category || 'General'}</span>
              {visibleGallery[index].caption}
            </p>
          )}

          <button type="button" onClick={next} aria-label="Next image" className="absolute right-2 sm:right-6 z-10 text-white/80 hover:text-white p-2">
            <ChevronRight className="w-9 h-9" />
          </button>
        </div>
      )}
    </div>
  );
}
