import { useParams, Link, Navigate } from 'react-router-dom';
import { Calendar, ArrowLeft } from 'lucide-react';
import { getNews } from '../../services/contentService';

export default function NewsDetails() {
  const { slug } = useParams();
  const news = getNews();
  const article = news.find((n) => n.slug === slug);
  const related = news.filter((n) => n.slug !== slug).slice(0, 2);

  if (!article) return <Navigate to="/news" replace />;

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-14">
      <Link to="/news" className="inline-flex items-center gap-1 text-sm text-[var(--color-mid-gray)] hover:text-[var(--color-dark-gray)] mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to News
      </Link>
      <p className="flex items-center gap-1.5 text-xs text-[var(--color-gold)] font-semibold">
        <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
        {new Date(article.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
      <h1 className="font-display text-2xl md:text-3xl font-semibold text-[var(--color-heading)] mt-2">{article.title}</h1>
      <div className="aspect-video rounded-[var(--radius-card)] overflow-hidden my-6">
        <img
          src={article.image}
          alt={article.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <p className="text-[var(--color-dark-gray)] leading-relaxed">{article.content}</p>

      {related.length > 0 && (
        <div className="mt-12 border-t border-[var(--color-border-gray)] pt-8">
          <p className="font-display font-semibold text-[var(--color-dark-gray)] mb-4">Related News</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {related.map((n) => (
              <Link key={n.slug} to={`/news/${n.slug}`} className="rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-4 hover:shadow-card-hover">
                <p className="text-sm font-semibold text-[var(--color-dark-gray)]">{n.title}</p>
                <p className="text-xs text-[var(--color-mid-gray)] mt-1">{new Date(n.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
