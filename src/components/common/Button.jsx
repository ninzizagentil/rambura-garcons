import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

const VARIANTS = {
  primary:
    'bg-[linear-gradient(135deg,var(--button-primary),var(--button-primary-hover))] text-white border border-[rgba(255,255,255,0.18)] shadow-[0_12px_24px_rgba(23,59,49,0.22)] hover:-translate-y-0.5 hover:shadow-[0_18px_30px_rgba(23,59,49,0.28)] active:translate-y-0 disabled:opacity-50',
  secondary:
    'bg-white text-[var(--text-primary)] border border-[var(--border)] shadow-[0_8px_18px_rgba(23,59,49,0.08)] hover:-translate-y-0.5 hover:border-[var(--button-primary)] hover:text-[var(--button-primary)] hover:bg-[var(--surface-hover)] active:translate-y-0 disabled:opacity-50',
  outline:
    'bg-transparent text-[var(--button-primary)] border border-[var(--button-primary)] shadow-[0_8px_18px_rgba(23,59,49,0.08)] hover:-translate-y-0.5 hover:bg-[var(--button-primary-soft)] hover:text-[var(--button-primary-hover)] active:translate-y-0 disabled:opacity-50',
  danger:
    'bg-[var(--color-status-red)] text-white border border-transparent hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 shadow-[0_10px_22px_rgba(220,38,38,0.18)]',
  ghost:
    'bg-transparent text-[var(--text-primary)] hover:bg-[var(--surface)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50',
  gold:
    'bg-[linear-gradient(135deg,var(--gold),var(--gold-hover))] text-white border border-[rgba(255,255,255,0.18)] shadow-[0_12px_24px_rgba(23,59,49,0.22)] hover:-translate-y-0.5 hover:shadow-[0_18px_30px_rgba(23,59,49,0.28)] active:translate-y-0 disabled:opacity-50',
};

const SIZES = {
  sm: 'text-sm px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2.5 gap-2',
  lg: 'text-base px-5 py-3 gap-2',
};

/**
 * Primary reusable Button. Always renders visible text (never icon-only for
 * consequential actions), supports loading + disabled states.
 */
const Button = forwardRef(function Button(
  { as: Component = 'button', variant = 'primary', size = 'md', loading = false, disabled, icon: Icon, iconPosition = 'left', className = '', contentClassName = '', contentStyle, children, type = 'button', ...props },
  ref
) {
  return (
    <Component
      ref={ref}
      {...(Component === 'button' ? { type } : {})}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'group relative inline-flex items-center justify-center overflow-hidden rounded-[var(--radius-control)] font-semibold transition-all duration-200 ease-out',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--button-primary)]',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute inset-0 translate-x-[-120%] bg-[linear-gradient(120deg,transparent_20%,rgba(255,255,255,0.45)_50%,transparent_80%)] opacity-0 transition-all duration-700 ease-out group-hover:translate-x-[120%] group-hover:opacity-100" aria-hidden="true" />
      <span style={contentStyle} className={cn('relative z-10 inline-flex items-center justify-center gap-2', contentClassName)}>
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        ) : (
          Icon && iconPosition === 'left' && <Icon className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
        )}
        <span style={contentStyle}>{children}</span>
        {!loading && Icon && iconPosition === 'right' && <Icon style={contentStyle} className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />}
      </span>
    </Component>
  );
});

export default Button;
