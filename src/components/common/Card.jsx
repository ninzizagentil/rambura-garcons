import { cn } from '../../utils/cn';

export default function Card({ className = '', children, ...props }) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border-gray)] bg-[var(--color-white)] shadow-[0_12px_30px_rgba(23,59,49,0.05)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
