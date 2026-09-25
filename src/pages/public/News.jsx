import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar } from 'lucide-react';
import { getNews, getNewsPage, useContentVersion } from '../../services/contentService';
import { getSiteImage, useSiteImageVersion } from '../../services/imageService';
import PageHero from '../../components/common/PageHero';

export default function News() {
  useContentVersion();
  useSiteImageVersion();
  const news = getNews();
  const page = getNewsPage();
  const [category, setCategory] = useState('All');
  const categories = ['All', ...new Set(news.map((item) => item.category || 'Announcement'))];
  const visibleNews = category === 'All'
    ? news
    : news.filter((item) => (item.category || 'Announcement') === category);
  return (
    <div>
      <PageHero title={page.title} image={getSiteImage('pageHeroes.news')}>
        <p className="text-[var(--text-secondary)] mt-3">{page.intro}</p>
      </PageHero>

      <section className="max-w-5xl mx-auto px-4 md:px-6 py-14">
        <div className="mb-8 flex flex-wrap items-center gap-2" role="group" aria-label="Filter news by category">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                category === item
                  ? 'border-[var(--button-primary)] bg-[var(--button-primary)] text-white'
                  : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--button-primary)] hover:text-[var(--button-primary)]'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="space-y-6">
          {visibleNews.map((n) => (
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
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--color-gold)]">
                  <span className="rounded-full bg-[rgba(15,108,255,0.10)] px-2.5 py-1">{n.category || 'Announcement'}</span>
                  <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                  {new Date(n.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
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
