import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { cn } from '../../utils/cn';

/**
 * StatCard — KPI tile used across all dashboards. Clickable when onClick is
 * supplied (per spec: every KPI must navigate to its relevant page).
 *
 * Visual language: a soft tone-tinted glow anchors the icon in one corner,
 * a thin accent bar along the top edge signals status at a glance even
 * before reading the number, and the whole tile lifts gently on hover so
 * clickable KPIs read as clearly interactive.
 */
export default function StatCard({ label, value, icon: Icon, trend, spark, tone = 'default', onClick, className = '' }) {
  const Wrapper = onClick ? 'button' : 'div';

  const toneStyles = {
    default: {
      icon: 'text-[var(--color-heading)] bg-gradient-to-br from-[var(--color-light-green-100)] to-[var(--color-light-green-100)]',
      bar: 'bg-[var(--color-medium-green)]',
      glow: 'bg-[var(--color-light-green)]',
      spark: 'var(--color-medium-green)',
    },
    red: {
      icon: 'text-[var(--color-status-red)] bg-[var(--color-status-red-bg)]',
      bar: 'bg-[var(--color-status-red)]',
      glow: 'bg-[var(--color-status-red)]',
      spark: 'var(--color-status-red)',
    },
    amber: {
      icon: 'text-[var(--color-status-amber)] bg-[var(--color-status-amber-bg)]',
      bar: 'bg-[var(--color-status-amber)]',
      glow: 'bg-[var(--color-status-amber)]',
      spark: 'var(--color-status-amber)',
    },
    gold: {
      icon: 'text-[var(--color-gold)] bg-[var(--color-gold-100)]',
      bar: 'bg-[var(--color-gold)]',
      glow: 'bg-[var(--color-gold)]',
      spark: 'var(--color-gold)',
    },
    blue: {
      icon: 'text-[var(--color-status-blue)] bg-[var(--color-status-blue-bg)]',
      bar: 'bg-[var(--color-status-blue)]',
      glow: 'bg-[var(--color-status-blue)]',
      spark: 'var(--color-status-blue)',
    },
    orange: {
      icon: 'text-[var(--color-status-orange)] bg-[var(--color-status-orange-bg)]',
      bar: 'bg-[var(--color-status-orange)]',
      glow: 'bg-[var(--color-status-orange)]',
      spark: 'var(--color-status-orange)',
    },
    purple: {
      icon: 'text-[var(--color-status-purple)] bg-[var(--color-status-purple-bg)]',
      bar: 'bg-[var(--color-status-purple)]',
      glow: 'bg-[var(--color-status-purple)]',
      spark: 'var(--color-status-purple)',
    },
    gray: {
      icon: 'text-[var(--color-status-gray)] bg-[var(--color-status-gray-bg)]',
      bar: 'bg-[var(--color-status-gray)]',
      glow: 'bg-[var(--color-status-gray)]',
      spark: 'var(--color-status-gray)',
    },
  };
  const t = toneStyles[tone] || toneStyles.default;

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'group relative text-left w-full overflow-hidden bg-[var(--color-white)] rounded-[var(--radius-card)]',
        'border border-[var(--color-border-gray)] p-5',
        'shadow-card transition-all duration-200 ease-out',
        onClick && 'hover:shadow-card-hover hover:-translate-y-0.5 hover:border-[var(--color-light-green)]/60 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-medium-green)]',
        className
      )}
    >
      {/* top accent bar — signals status/tone at a glance */}
      <span className={cn('absolute top-0 left-0 right-0 h-0.5', t.bar)} aria-hidden="true" />

      {/* soft ambient glow anchoring the icon corner */}
      <span
        className={cn('pointer-events-none absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-[0.12] blur-2xl transition-opacity duration-200 group-hover:opacity-[0.2]', t.glow)}
        aria-hidden="true"
      />

      <div className="relative flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-[var(--color-mid-gray)] leading-snug">{label}</p>
        <div className="flex items-center gap-2 shrink-0">
          {spark && spark.length > 1 && (
            <div className="w-14 h-8 hidden sm:block" aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spark.map((v, i) => ({ i, v }))} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id={`spark-${label?.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={t.spark} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={t.spark} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="v" stroke={t.spark} strokeWidth={1.75} fill={`url(#spark-${label?.replace(/\s+/g, '')})`} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
          {Icon && (
            <span className={cn('inline-flex items-center justify-center w-10 h-10 rounded-xl shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105', t.icon)}>
              <Icon className="w-4.5 h-4.5" aria-hidden="true" />
            </span>
          )}
        </div>
      </div>
      <p
        className={cn(
          'relative font-display font-semibold text-[var(--color-dark-gray)] mt-2 tracking-tight',
          typeof value === 'string' && value.length > 14 ? 'text-lg leading-snug line-clamp-2' : 'text-3xl'
        )}
      >
        {value}
      </p>
      {trend && (
        <p className={cn('relative text-xs font-semibold mt-1.5 inline-flex items-center gap-1', trend.positive ? 'text-[var(--color-status-green)]' : 'text-[var(--color-status-red)]')}>
          {trend.label}
        </p>
      )}
    </Wrapper>
  );
}
