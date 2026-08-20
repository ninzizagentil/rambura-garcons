import { ArrowRight } from 'lucide-react';
import { cn } from '../../utils/cn';

/** InsightCard — question-framed management insight linking to its detail page. */
export function InsightCard({ icon: Icon, question, answer, onClick, tone = 'default' }) {
  const toneStyles = {
    default: 'bg-[var(--color-light-green-100)] text-[var(--color-deep-green)]',
    amber: 'bg-[var(--color-status-amber-bg)] text-[var(--color-status-amber)]',
    red: 'bg-[var(--color-status-red-bg)] text-[var(--color-status-red)]',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-white rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-5 shadow-card hover:shadow-card-hover transition-shadow"
    >
      <div className="flex items-start gap-3">
        {Icon && (
          <span className={cn('inline-flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0', toneStyles[tone])}>
            <Icon className="w-4.5 h-4.5" aria-hidden="true" />
          </span>
        )}
        <div className="flex-1">
          <p className="text-sm font-medium text-[var(--color-mid-gray)]">{question}</p>
          <p className="font-display text-base font-semibold text-[var(--color-dark-gray)] mt-1">{answer}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-[var(--color-mid-gray)] flex-shrink-0 mt-1" aria-hidden="true" />
      </div>
    </button>
  );
}

/** ChartCard — wraps a Recharts chart with a titled card shell. */
export function ChartCard({ title, description, actions, children, className = '' }) {
  return (
    <div className={cn('bg-white rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-5 shadow-card', className)}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-display text-base font-semibold text-[var(--color-dark-gray)]">{title}</h3>
          {description && <p className="text-xs text-[var(--color-mid-gray)] mt-0.5">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}

/** FormSection — groups related form fields under a heading. */
export function FormSection({ title, description, children }) {
  return (
    <fieldset className="border-t border-[var(--color-border-gray)] pt-5 first:border-t-0 first:pt-0">
      <legend className="sr-only">{title}</legend>
      {title && <h3 className="font-display text-sm font-semibold text-[var(--color-deep-green)] mb-1">{title}</h3>}
      {description && <p className="text-xs text-[var(--color-mid-gray)] mb-4">{description}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </fieldset>
  );
}
