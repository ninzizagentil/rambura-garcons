import { Link } from 'react-router-dom';
import { History } from 'lucide-react';
import { Badge } from '../common/Badge';
import { cn } from '../../utils/cn';

/**
 * ActivityFeedCard — beautiful-card wrapper for a short "recent activity"
 * list on a module dashboard (Library, Stock, etc.). Mirrors the card used
 * on Website Management so every dashboard in the app shares one polished,
 * professional pattern for showing recent events.
 */
export default function ActivityFeedCard({ title = 'Recent Activity', activity = [], viewAllTo, viewAllLabel = 'View more', emptyLabel = 'No activity recorded yet.', className = '' }) {
  return (
    <div className={cn('bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] shadow-card p-5', className)}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-[var(--color-dark-gray)]">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--color-light-green-100)] text-[var(--color-heading)]">
            <History className="w-3.5 h-3.5" aria-hidden="true" />
          </span>
          {title}
        </h2>
        {viewAllTo && (
          <Link to={viewAllTo} className="text-xs font-semibold text-[var(--color-medium-green)] hover:underline">
            {viewAllLabel}
          </Link>
        )}
      </div>

      {activity.length === 0 ? (
        <p className="text-sm text-[var(--color-mid-gray)]">{emptyLabel}</p>
      ) : (
        <ul className="divide-y divide-[var(--color-border-gray)]">
          {activity.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <div className="min-w-0">
                <span className="font-medium text-[var(--color-dark-gray)]">{a.user}</span>{' '}
                <span className="text-[var(--color-mid-gray)]">{a.action}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge tone={a.status === 'warning' ? 'amber' : 'green'}>{a.status}</Badge>
                <span className="text-xs text-[var(--color-mid-gray)] whitespace-nowrap">
                  {new Date(a.date).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
