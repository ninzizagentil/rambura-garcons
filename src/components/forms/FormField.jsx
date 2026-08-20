import { forwardRef, useId } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

const fieldClasses = (hasError, dark) =>
  dark
    ? cn(
        'w-full rounded-[var(--radius-control)] border bg-[var(--color-navy-field)] px-3.5 py-2.5 text-sm text-white',
        'placeholder:text-white/40 transition-colors duration-150',
        'focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] focus:border-[var(--color-gold)]',
        hasError ? 'border-[var(--color-status-red)]' : 'border-[var(--color-navy-border)]'
      )
    : cn(
        'w-full rounded-[var(--radius-control)] border bg-white px-3.5 py-2.5 text-sm text-[var(--color-dark-gray)]',
        'placeholder:text-[var(--color-mid-gray)] transition-colors duration-150',
        'focus:outline-none focus:ring-2 focus:ring-[var(--color-medium-green)] focus:border-[var(--color-medium-green)]',
        hasError ? 'border-[var(--color-status-red)]' : 'border-[var(--color-border-gray)]'
      );

function FieldWrapper({ id, label, required, error, hint, dark, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className={cn('text-sm font-medium', dark ? 'text-white' : 'text-[var(--color-dark-gray)]')}>
          {label} {required && <span className={dark ? 'text-[var(--color-gold)]' : 'text-[var(--color-status-red)]'} aria-hidden="true">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className={cn('text-xs', dark ? 'text-white/50' : 'text-[var(--color-mid-gray)]')}>{hint}</p>}
      {error && (
        <p className={cn('flex items-center gap-1 text-xs font-medium', dark ? 'text-red-400' : 'text-[var(--color-status-red)]')} role="alert">
          <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * `icon`: optional lucide icon component rendered inside the field, on the left.
 * `dark`: switches to the navy-panel field styling (used on dark-background forms).
 */
export const Input = forwardRef(function Input(
  { label, error, hint, required, id, icon: Icon, dark = false, className = '', ...props },
  ref
) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <FieldWrapper id={inputId} label={label} required={required} error={error} hint={hint} dark={dark}>
      <div className="relative">
        {Icon && (
          <Icon
            className={cn('w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none', dark ? 'text-white/45' : 'text-[var(--color-mid-gray)]')}
            aria-hidden="true"
          />
        )}
        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cn(fieldClasses(!!error, dark), Icon && 'pl-10', className)}
          {...props}
        />
      </div>
    </FieldWrapper>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, error, hint, required, id, rows = 4, dark = false, className = '', ...props },
  ref
) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <FieldWrapper id={inputId} label={label} required={required} error={error} hint={hint} dark={dark}>
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        required={required}
        aria-invalid={!!error}
        className={cn(fieldClasses(!!error, dark), 'resize-y', className)}
        {...props}
      />
    </FieldWrapper>
  );
});

export const Select = forwardRef(function Select(
  { label, error, hint, required, id, options = [], placeholder = 'Select…', icon: Icon, dark = false, className = '', ...props },
  ref
) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <FieldWrapper id={inputId} label={label} required={required} error={error} hint={hint} dark={dark}>
      <div className="relative">
        {Icon && (
          <Icon
            className={cn('w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none', dark ? 'text-white/45' : 'text-[var(--color-mid-gray)]')}
            aria-hidden="true"
          />
        )}
        <select
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={!!error}
          className={cn(fieldClasses(!!error, dark), 'appearance-none', Icon && 'pl-10', dark ? 'bg-[var(--color-navy-field)]' : 'bg-white', className)}
          {...props}
        >
          <option value="" disabled className={dark ? 'text-[var(--color-dark-gray)]' : ''}>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className={dark ? 'text-[var(--color-dark-gray)]' : ''}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </FieldWrapper>
  );
});
