import { cn } from '../../utils/cn';

export function Badge({ children, tone = 'neutral', className = '' }) {
  const tones = {
    neutral: 'bg-[var(--color-soft-gray)] text-[var(--color-dark-gray)]',
    green: 'bg-[var(--color-status-green-bg)] text-[var(--color-status-green)]',
    red: 'bg-[var(--color-status-red-bg)] text-[var(--color-status-red)]',
    amber: 'bg-[var(--color-status-amber-bg)] text-[var(--color-status-amber)]',
    blue: 'bg-[var(--color-status-blue-bg)] text-[var(--color-status-blue)]',
    gold: 'bg-[var(--color-gold-100)] text-[var(--color-gold)]',
    orange: 'bg-[var(--color-status-orange-bg)] text-[var(--color-status-orange)]',
    purple: 'bg-[var(--color-status-purple-bg)] text-[var(--color-status-purple)]',
    gray: 'bg-[var(--color-status-gray-bg)] text-[var(--color-status-gray)]',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * StatusBadge — maps common domain statuses to a consistent tone + dot.
 */
const STATUS_MAP = {
  active: { tone: 'green', label: 'Active' },
  inactive: { tone: 'neutral', label: 'Inactive' },
  available: { tone: 'green', label: 'Available' },
  borrowed: { tone: 'blue', label: 'Borrowed' },
  overdue: { tone: 'red', label: 'Overdue' },
  'low-stock': { tone: 'amber', label: 'Low Stock' },
  'out-of-stock': { tone: 'red', label: 'Out of Stock' },
  normal: { tone: 'green', label: 'Normal' },
  pending: { tone: 'amber', label: 'Pending' },
  returned: { tone: 'green', label: 'Returned' },
  suspended: { tone: 'red', label: 'Suspended' },
  damaged: { tone: 'orange', label: 'Damaged' },
  expired: { tone: 'purple', label: 'Expired' },
  'expiring-soon': { tone: 'amber', label: 'Expiring Soon' },
  valid: { tone: 'green', label: 'Valid' },
  removed: { tone: 'gray', label: 'Removed' },
  disposed: { tone: 'gray', label: 'Disposed' },
  reported: { tone: 'orange', label: 'Reported' },
};

export function StatusBadge({ status, label, className = '' }) {
  const config = STATUS_MAP[status] || { tone: 'neutral', label: label || status };
  return (
    <Badge tone={config.tone} className={cn('gap-1.5', className)}>
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full',
          config.tone === 'green' && 'bg-[var(--color-status-green)]',
          config.tone === 'red' && 'bg-[var(--color-status-red)]',
          config.tone === 'amber' && 'bg-[var(--color-status-amber)]',
          config.tone === 'blue' && 'bg-[var(--color-status-blue)]',
          config.tone === 'orange' && 'bg-[var(--color-status-orange)]',
          config.tone === 'purple' && 'bg-[var(--color-status-purple)]',
          config.tone === 'gray' && 'bg-[var(--color-status-gray)]',
          config.tone === 'neutral' && 'bg-[var(--color-mid-gray)]'
        )}
        aria-hidden="true"
      />
      {label || config.label}
    </Badge>
  );
}

export default Badge;
