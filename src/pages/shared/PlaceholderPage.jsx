import { Construction } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader';

/**
 * Standard placeholder used for routes that are wired up (navigable, no dead
 * links) but whose full functionality lands in a later development phase.
 */
export default function PlaceholderPage({ title, phase, breadcrumb, backTo, backLabel = 'Back to Dashboard' }) {
  return (
    <div>
      {breadcrumb && <PageHeader title={title} breadcrumb={breadcrumb} />}
      {!breadcrumb && (
        <h1 className="font-display text-2xl font-semibold text-[var(--color-heading)] mb-6">{title}</h1>
      )}
      <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-dashed border-[var(--color-border-gray)] p-12 flex flex-col items-center text-center">
        <span className="w-14 h-14 rounded-full bg-[var(--color-light-green-100)] flex items-center justify-center mb-4">
          <Construction className="w-6 h-6 text-[var(--color-medium-green)]" aria-hidden="true" />
        </span>
        <p className="font-display text-base font-semibold text-[var(--color-dark-gray)]">
          {title} is coming in {phase}
        </p>
        <p className="text-sm text-[var(--color-mid-gray)] mt-1 max-w-sm">
          This route is wired up and reachable. Full functionality for this screen is built out in {phase} of the
          development plan.
        </p>
        {backTo && (
          <Link
            to={backTo}
            className="mt-5 inline-flex items-center px-4 py-2 rounded-[var(--radius-control)] bg-[var(--color-medium-green)] text-white text-sm font-semibold hover:bg-[var(--color-deep-green-600)]"
          >
            {backLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
