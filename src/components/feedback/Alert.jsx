import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../../utils/cn';

const CONFIG = {
  success: { icon: CheckCircle2, bg: 'bg-[var(--color-status-green-bg)]', text: 'text-[var(--color-status-green)]' },
  error: { icon: AlertCircle, bg: 'bg-[var(--color-status-red-bg)]', text: 'text-[var(--color-status-red)]' },
  warning: { icon: AlertTriangle, bg: 'bg-[var(--color-status-amber-bg)]', text: 'text-[var(--color-status-amber)]' },
  info: { icon: Info, bg: 'bg-[var(--color-status-blue-bg)]', text: 'text-[var(--color-status-blue)]' },
};

export default function Alert({ type = 'info', title, children, onClose, className = '' }) {
  const { icon: Icon, bg, text } = CONFIG[type];
  return (
    <div role="alert" className={cn('flex gap-3 rounded-[var(--radius-control)] p-4', bg, className)}>
      <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', text)} aria-hidden="true" />
      <div className="flex-1">
        {title && <p className={cn('text-sm font-semibold', text)}>{title}</p>}
        {children && <p className="text-sm text-[var(--color-dark-gray)] mt-0.5">{children}</p>}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss message"
          className={cn('flex-shrink-0 rounded p-0.5 hover:bg-black/5', text)}
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
