import { Link } from 'react-router-dom';
import { ArrowRight, Calendar } from 'lucide-react';
import { getNews, useContentVersion } from '../../services/contentService';
import { getSiteImage, useSiteImageVersion } from '../../services/imageService';
import PageHero from '../../components/common/PageHero';

export default function News() {
  useContentVersion();
  useSiteImageVersion();
  const news = getNews();
  return (
    <div>
      <PageHero title="News" image={getSiteImage('pageHeroes.news')}>
        <p className="text-[var(--text-secondary)] mt-3">Updates from around the Rambura Garçons campus.</p>
      </PageHero>

      <section className="max-w-5xl mx-auto px-4 md:px-6 py-14">
        <div className="space-y-6">
          {news.map((n) => (
            <Link
              key={n.slug}
              to={`/news/${n.slug}`}
              className="group flex flex-col sm:flex-row gap-0 sm:gap-5 overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_18px_35px_rgba(0,0,0,0.16)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(0,0,0,0.22)]"
            >
              <div className="sm:w-56 aspect-video sm:aspect-square shrink-0 overflow-hidden">
                <img
                  src={n.image}
                  alt={n.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="p-6 sm:pl-0">
                <p className="flex items-center gap-1.5 text-xs text-[var(--color-gold)] font-semibold">
                  <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                  {new Date(n.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <h2 className="font-display text-lg font-semibold text-[var(--text-primary)] mt-2">{n.title}</h2>
                <p className="text-sm text-[var(--text-secondary)] mt-2">{n.excerpt}</p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--gold)] mt-4">
                  Read More <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
