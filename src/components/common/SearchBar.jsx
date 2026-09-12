import { Search, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export function SearchBar({ value, onChange, placeholder, className = '' }) {
  const { t } = useApp();
  const resolvedPlaceholder = placeholder || t('searchPlaceholder');
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-mid-gray)]" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={resolvedPlaceholder}
        aria-label={resolvedPlaceholder}
        className="w-full rounded-[var(--radius-control)] border border-[var(--color-border-gray)] bg-[var(--color-soft-gray)] pl-9 pr-9 py-2.5 text-sm text-[var(--color-dark-gray)] placeholder:text-[var(--color-mid-gray)] focus:outline-none focus:ring-2 focus:ring-[var(--color-medium-green)] focus:border-[var(--color-medium-green)]"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label={t('clearSearch')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-mid-gray)] hover:text-[var(--color-dark-gray)]"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export function FilterDropdown({ label, value, onChange, options }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="rounded-[var(--radius-control)] border border-[var(--color-border-gray)] bg-[var(--color-soft-gray)] px-3 py-2.5 text-sm text-[var(--color-dark-gray)] focus:outline-none focus:ring-2 focus:ring-[var(--color-medium-green)]"
      >
        <option value="" className="text-[var(--color-dark-gray)] bg-[var(--color-white)]">{label}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="text-[var(--color-dark-gray)] bg-[var(--color-white)]">
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
