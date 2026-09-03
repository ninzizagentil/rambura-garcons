import { useState, useCallback, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getGallery, useContentVersion } from '../../services/contentService';
import { getSiteImage, useSiteImageVersion } from '../../services/imageService';
import PageHero from '../../components/common/PageHero';

export default function Gallery() {
  useContentVersion();
  useSiteImageVersion();
  const [index, setIndex] = useState(null);
  const gallery = getGallery();
  const open = index !== null;

  const close = useCallback(() => setIndex(null), []);
  const prev = useCallback(() => setIndex((i) => (i - 1 + gallery.length) % gallery.length), [gallery.length]);
  const next = useCallback(() => setIndex((i) => (i + 1) % gallery.length), [gallery.length]);

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
      <PageHero title="Gallery" image={getSiteImage('pageHeroes.gallery')}>
        <p className="text-[var(--text-secondary)] mt-3">Life at Rambura Garçons, in and out of the workshop.</p>
      </PageHero>

      <section className="max-w-6xl mx-auto px-4 md:px-6 py-14">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {gallery.map((img, i) => (
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
              <span className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.72))] text-white text-xs px-2 py-1.5 text-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                {img.caption}
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
            src={gallery[index].image}
            alt={gallery[index].caption}
            className="w-screen h-screen object-contain"
          />

          {gallery[index].caption && (
            <p className="absolute bottom-6 inset-x-0 text-center text-white/85 text-sm px-16">
              {gallery[index].caption}
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
