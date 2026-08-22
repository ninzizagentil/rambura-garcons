import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export function Breadcrumb({ items }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center flex-wrap gap-1.5 text-sm text-[var(--color-mid-gray)]">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />}
            {item.to && i < items.length - 1 ? (
              <Link to={item.to} className="hover:text-[var(--color-heading)] hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className="text-[var(--color-dark-gray)] font-medium" aria-current={i === items.length - 1 ? 'page' : undefined}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default function PageHeader({ title, description, breadcrumb, actions }) {
  return (
    <div className="flex flex-col gap-3 mb-6">
      {breadcrumb && <Breadcrumb items={breadcrumb} />}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--color-heading)]">{title}</h1>
          {description && <p className="text-sm text-[var(--color-mid-gray)] mt-1">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
      </div>
    </div>
  );
}
