import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import IconButton from '../common/IconButton';
import { cn } from '../../utils/cn';

export default function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', handleKey);
    dialogRef.current?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  // Keep dashboard modals inside the themed dashboard root.
  const portalTarget = document.querySelector('[data-dashboard-root]') || document.body;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[var(--color-deep-green)]/40 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        className={cn(
          'relative w-full bg-[var(--color-white)] rounded-[var(--radius-card)] shadow-card-hover',
          'max-h-[90vh] flex flex-col animate-[fadeIn_.15s_ease-out]',
          sizes[size]
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-gray)]">
          <h2 id="modal-title" className="font-display text-lg font-semibold text-[var(--color-heading)]">
            {title}
          </h2>
          <IconButton icon={X} label="Close dialog" onClick={onClose} />
        </div>
        <div className="px-6 py-5 overflow-y-auto">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--color-border-gray)]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    portalTarget
  );
}
