import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

const VARIANTS = {
  primary:
    'bg-[var(--gold)] text-[var(--dark-bg)] hover:bg-[var(--gold-hover)] disabled:opacity-50 shadow-[0_12px_24px_rgba(217,164,65,0.2)]',
  secondary:
    'bg-transparent text-[var(--text-primary)] border border-[var(--gold)] hover:bg-[var(--gold)] hover:text-[var(--dark-bg)] disabled:opacity-50',
  outline:
    'bg-transparent text-[var(--gold)] border border-[var(--gold)] hover:bg-[var(--gold)] hover:text-[var(--dark-bg)] disabled:opacity-50',
  danger:
    'bg-[var(--color-status-red)] text-white hover:opacity-90 disabled:opacity-50',
  ghost:
    'bg-transparent text-[var(--text-primary)] hover:bg-[var(--surface)] disabled:opacity-50',
  gold:
    'bg-[var(--gold)] text-[var(--dark-bg)] hover:bg-[var(--gold-hover)] disabled:opacity-50',
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
  { variant = 'primary', size = 'md', loading = false, disabled, icon: Icon, iconPosition = 'left', className = '', children, type = 'button', ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-[var(--radius-control)] font-semibold transition-colors duration-150',
        'focus-visible:outline-2 focus-visible:outline-offset-2',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
      ) : (
        Icon && iconPosition === 'left' && <Icon className="w-4 h-4" aria-hidden="true" />
      )}
      <span>{children}</span>
      {!loading && Icon && iconPosition === 'right' && <Icon className="w-4 h-4" aria-hidden="true" />}
    </button>
  );
});

export default Button;
