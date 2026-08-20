import { cn } from '../../utils/cn';

/**
 * StatCard — KPI tile used across all dashboards. Clickable when onClick is
 * supplied (per spec: every KPI must navigate to its relevant page).
 */
export default function StatCard({ label, value, icon: Icon, trend, tone = 'default', onClick, className = '' }) {
  const Wrapper = onClick ? 'button' : 'div';
  const toneStyles = {
    default: 'text-[var(--color-deep-green)] bg-[var(--color-light-green-100)]',
    red: 'text-[var(--color-status-red)] bg-[var(--color-status-red-bg)]',
    amber: 'text-[var(--color-status-amber)] bg-[var(--color-status-amber-bg)]',
    gold: 'text-[var(--color-gold)] bg-[var(--color-gold-100)]',
  };

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'text-left w-full bg-white rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-5',
        'shadow-card transition-shadow duration-150',
        onClick && 'hover:shadow-card-hover cursor-pointer focus-visible:outline-2',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-[var(--color-mid-gray)]">{label}</p>
        {Icon && (
          <span className={cn('inline-flex items-center justify-center w-9 h-9 rounded-lg', toneStyles[tone])}>
            <Icon className="w-4.5 h-4.5" aria-hidden="true" />
          </span>
        )}
      </div>
      <p className="font-display text-3xl font-semibold text-[var(--color-dark-gray)] mt-2">{value}</p>
      {trend && (
        <p className={cn('text-xs font-medium mt-1', trend.positive ? 'text-[var(--color-status-green)]' : 'text-[var(--color-status-red)]')}>
          {trend.label}
        </p>
      )}
    </Wrapper>
  );
}
