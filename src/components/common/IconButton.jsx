import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

/**
 * IconButton — for icon-only controls. MUST always receive a descriptive
 * `label` used as aria-label + title, since icons alone don't convey action.
 */
const IconButton = forwardRef(function IconButton(
  { icon: Icon, label, variant = 'ghost', size = 'md', className = '', ...props },
  ref
) {
  const sizes = { sm: 'p-1.5', md: 'p-2', lg: 'p-2.5' };
  const iconSizes = { sm: 'w-4 h-4', md: 'w-4.5 h-4.5', lg: 'w-5 h-5' };
  const variants = {
    ghost: 'text-[var(--color-mid-gray)] hover:bg-[var(--color-soft-gray)] hover:text-[var(--color-heading)]',
    solid: 'bg-[var(--color-medium-green)] text-white hover:bg-[var(--color-deep-green-600)]',
    danger: 'text-[var(--color-status-red)] hover:bg-[var(--color-status-red-bg)]',
  };

  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center rounded-full transition-colors duration-150',
        'focus-visible:outline-2 focus-visible:outline-offset-2',
        sizes[size],
        variants[variant],
        className
      )}
      {...props}
    >
      <Icon className={iconSizes[size]} aria-hidden="true" />
    </button>
  );
});

export default IconButton;
