import { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * RowActionMenu — compact "..." popover for a table row's action column.
 * items: [{ label, icon, onClick, tone?: 'default'|'danger', disabled? }]
 * Mirrors the click-outside-to-close pattern used by ProfileMenu, so every
 * popover menu in the app behaves the same way.
 */
export default function RowActionMenu({ items, label = 'Row actions' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const visibleItems = items.filter(Boolean);
  if (visibleItems.length === 0) return null;

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        title={label}
        className="inline-flex items-center justify-center w-8 h-8 rounded-full text-[var(--color-mid-gray)] hover:bg-[var(--color-soft-gray)] hover:text-[var(--color-heading)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <MoreVertical className="w-4 h-4" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-1.5 w-52 bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] shadow-card-hover py-1.5 z-30"
        >
          {visibleItems.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onClick?.();
              }}
              className={cn(
                'w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
                item.tone === 'danger'
                  ? 'text-[var(--color-status-red)] hover:bg-[var(--color-status-red-bg)]'
                  : 'text-[var(--color-dark-gray)] hover:bg-[var(--color-off-white)]'
              )}
            >
              {item.icon && <item.icon className="w-4 h-4 shrink-0" aria-hidden="true" />}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
