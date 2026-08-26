import { forwardRef, useEffect, useId, useRef, useState } from 'react';
import { AlertCircle, ChevronDown, Check } from 'lucide-react';
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
        'w-full rounded-[var(--radius-control)] border bg-[var(--color-white)] px-3.5 py-2.5 text-sm text-[var(--color-dark-gray)]',
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

/**
 * DarkSelect — a fully custom dropdown used instead of a native <select>
 * when `dark` is true. Native <select> option lists are styled by the
 * browser/OS (usually a plain white or system-blue-highlight popup), which
 * is unreadable dropped onto this app's dark navy panels — text and the
 * "selected" row both lose contrast. This renders the option list
 * ourselves so every color (background, hover, selected) comes from the
 * app's own palette and stays clearly legible.
 */
function DarkSelect({ inputId, error, required, options, placeholder, Icon, value, onChange, className, ...props }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);

  const selectOption = (val) => {
    onChange?.({ target: { value: val } });
    setOpen(false);
  };

  return (
    <div className="relative" ref={rootRef}>
      {Icon && (
        <Icon
          className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/45 z-10"
          aria-hidden="true"
        />
      )}
      <button
        type="button"
        id={inputId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-required={required}
        aria-invalid={!!error}
        onClick={() => setOpen((v) => !v)}
        className={cn(fieldClasses(!!error, true), 'flex items-center justify-between gap-2 text-left', Icon && 'pl-10', className)}
        {...props}
      >
        <span className={cn('truncate', selected ? 'text-white' : 'text-white/40')}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className={cn('w-4 h-4 text-white/50 shrink-0 transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>
      {open && (
        <ul
          role="listbox"
          tabIndex={-1}
          className="absolute z-30 mt-1.5 w-full max-h-56 overflow-y-auto rounded-[var(--radius-control)] border border-[var(--color-navy-border)] bg-[var(--color-navy-800)] shadow-xl py-1"
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <li key={opt.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => selectOption(opt.value)}
                  className={cn(
                    'w-full flex items-center justify-between gap-2 text-left px-3.5 py-2.5 text-sm transition-colors',
                    isSelected
                      ? 'bg-[var(--color-gold)] text-[var(--color-navy-900)] font-semibold'
                      : 'text-white hover:bg-white/10'
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export const Select = forwardRef(function Select(
  { label, error, hint, required, id, options = [], placeholder = 'Select…', icon: Icon, dark = false, className = '', ...props },
  ref
) {
  const autoId = useId();
  const inputId = id || autoId;

  if (dark) {
    return (
      <FieldWrapper id={inputId} label={label} required={required} error={error} hint={hint} dark={dark}>
        <DarkSelect
          inputId={inputId}
          error={error}
          required={required}
          options={options}
          placeholder={placeholder}
          Icon={Icon}
          className={className}
          {...props}
        />
      </FieldWrapper>
    );
  }

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
          className={cn(fieldClasses(!!error, dark), 'appearance-none', Icon && 'pl-10', dark ? 'bg-[var(--color-navy-field)]' : 'bg-[var(--color-white)]', className)}
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
