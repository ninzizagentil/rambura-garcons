import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../utils/cn';

const ToastContext = createContext(null);

const ICONS = { success: CheckCircle2, error: AlertCircle, warning: AlertTriangle, info: Info };
const COLORS = {
  success: 'border-[var(--color-status-green)] text-[var(--color-status-green)]',
  error: 'border-[var(--color-status-red)] text-[var(--color-status-red)]',
  warning: 'border-[var(--color-status-amber)] text-[var(--color-status-amber)]',
  info: 'border-[var(--color-status-blue)] text-[var(--color-status-blue)]',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = 'success', duration = 4000) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, type }]);
      if (duration) setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast, dismiss }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[min(360px,calc(100vw-2rem))]"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((t) => {
          const Icon = ICONS[t.type];
          return (
            <div
              key={t.id}
              role="status"
              className={cn(
                'flex items-start gap-2.5 bg-white border-l-4 rounded-[var(--radius-control)] shadow-card-hover px-4 py-3',
                COLORS[t.type]
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              <p className="text-sm text-[var(--color-dark-gray)] flex-1">{t.message}</p>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="text-[var(--color-mid-gray)] hover:text-[var(--color-dark-gray)]"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
