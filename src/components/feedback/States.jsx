import { Inbox, Loader2, AlertCircle } from 'lucide-react';
import Button from '../common/Button';
import { useApp } from '../../context/AppContext';
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

export function ErrorState({ title = 'Something went wrong', message, retryLabel = 'Try again', onRetry, className = '' }) {
  const { t } = useApp();
  const resolvedTitle = title === 'Something went wrong' ? t('somethingWentWrong') : title;
  const resolvedRetryLabel = retryLabel === 'Try again' ? t('tryAgain') : retryLabel;
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-14 px-6', className)} role="alert">
      <div className="w-14 h-14 rounded-full bg-[var(--color-status-red-bg)] flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6 text-[var(--color-status-red)]" aria-hidden="true" />
      </div>
      <p className="font-display text-base font-semibold text-[var(--color-dark-gray)]">{resolvedTitle}</p>
      {message && <p className="text-sm text-[var(--color-mid-gray)] mt-1 max-w-sm">{message}</p>}
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="mt-5">
          {resolvedRetryLabel}
        </Button>
      )}
    </div>
  );
}

export function LoadingState({ label = 'Loading…', className = '' }) {
  const { t } = useApp();
  const resolvedLabel = label === 'Loading…' ? t('loading') : label;
  return (
    <div className={cn('flex flex-col items-center justify-center py-14 gap-3', className)} role="status" aria-live="polite">
      <Loader2 className="w-6 h-6 text-[var(--color-medium-green)] animate-spin" aria-hidden="true" />
      <p className="text-sm text-[var(--color-mid-gray)]">{resolvedLabel}</p>
    </div>
  );
}

export function SkeletonPage({ className = '' }) {
  return (
    <div className={cn('space-y-5 p-1', className)} aria-hidden="true">
      <div className="h-8 w-56 skeleton-shimmer rounded-lg" />
      <div className="h-4 w-80 max-w-full skeleton-shimmer rounded" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => <SkeletonCard key={index} />)}
      </div>
      <div className="h-72 skeleton-shimmer rounded-[var(--radius-card)]" />
    </div>
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={cn('rounded-[var(--radius-card)] bg-[var(--color-white)] border border-[var(--color-border-gray)] p-5', className)}>
      <div className="h-3 w-20 skeleton-shimmer rounded mb-3" />
      <div className="h-6 w-28 skeleton-shimmer rounded" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="divide-y divide-[var(--color-border-gray)]" aria-hidden="true">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 py-3.5 px-4">
          {Array.from({ length: cols }).map((__, c) => (
            <div key={c} className="h-3 skeleton-shimmer rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
