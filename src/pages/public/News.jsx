import { Link } from 'react-router-dom';
import { ArrowRight, Calendar } from 'lucide-react';
import { getNews } from '../../services/contentService';
import PageHero from '../../components/common/PageHero';

export default function News() {
  const news = getNews();
  return (
    <div>
      <PageHero title="News">
        <p className="text-white/80 mt-3">Updates from around the Rambura Garçons campus.</p>
      </PageHero>

      <section className="max-w-5xl mx-auto px-4 md:px-6 py-14">
        <div className="space-y-6">
          {news.map((n) => (
            <Link
              key={n.slug}
              to={`/news/${n.slug}`}
              className="flex flex-col sm:flex-row gap-0 sm:gap-5 rounded-[var(--radius-card)] border border-[var(--color-border-gray)] overflow-hidden hover:shadow-card-hover transition-shadow"
            >
              <div className="sm:w-56 aspect-video sm:aspect-square shrink-0">
                <img
                  src={n.image}
                  alt={n.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-6 sm:pl-0">
              <p className="flex items-center gap-1.5 text-xs text-[var(--color-gold)] font-semibold">
                <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                {new Date(n.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <h2 className="font-display text-lg font-semibold text-[var(--color-dark-gray)] mt-2">{n.title}</h2>
              <p className="text-sm text-[var(--color-mid-gray)] mt-2">{n.excerpt}</p>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-medium-green)] mt-4">
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
