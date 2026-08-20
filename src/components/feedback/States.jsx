import { Inbox, Loader2 } from 'lucide-react';
import Button from '../common/Button';
import { cn } from '../../utils/cn';

export function EmptyState({ icon: Icon = Inbox, title, message, actionLabel, onAction, className = '' }) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-14 px-6', className)}>
      <div className="w-14 h-14 rounded-full bg-[var(--color-light-green-100)] flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-[var(--color-medium-green)]" aria-hidden="true" />
      </div>
      <p className="font-display text-base font-semibold text-[var(--color-dark-gray)]">{title}</p>
      {message && <p className="text-sm text-[var(--color-mid-gray)] mt-1 max-w-sm">{message}</p>}
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction} className="mt-5">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export function LoadingState({ label = 'Loading…', className = '' }) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-14 gap-3', className)} role="status" aria-live="polite">
      <Loader2 className="w-6 h-6 text-[var(--color-medium-green)] animate-spin" aria-hidden="true" />
      <p className="text-sm text-[var(--color-mid-gray)]">{label}</p>
    </div>
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={cn('rounded-[var(--radius-card)] bg-white border border-[var(--color-border-gray)] p-5 animate-pulse', className)}>
      <div className="h-3 w-20 bg-[var(--color-soft-gray)] rounded mb-3" />
      <div className="h-6 w-28 bg-[var(--color-soft-gray)] rounded" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="animate-pulse divide-y divide-[var(--color-border-gray)]">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 py-3.5 px-4">
          {Array.from({ length: cols }).map((__, c) => (
            <div key={c} className="h-3 bg-[var(--color-soft-gray)] rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
