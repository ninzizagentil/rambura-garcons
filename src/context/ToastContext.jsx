import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../utils/cn';
import { useTheme } from './ThemeContext';

const ToastContext = createContext(null);

const ICONS = { success: CheckCircle2, error: AlertCircle, warning: AlertTriangle, info: Info };
const COLORS = {
  success: 'bg-[var(--color-status-green)] text-white border-l-[4px] border-[var(--color-status-green)]',
  error: 'bg-[var(--color-status-red)] text-white border-l-[4px] border-[var(--color-status-red)]',
  warning: 'bg-[var(--color-status-amber)] text-slate-900 border-l-[4px] border-[var(--color-status-amber)]',
  info: 'bg-[var(--color-status-blue)] text-white border-l-[4px] border-[var(--color-status-blue)]',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const { isDark } = useTheme();

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
        className={cn('fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[min(360px,calc(100vw-2rem))]', isDark && 'dark')}
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
                'flex items-start gap-2.5 rounded-[var(--radius-control)] shadow-[0_16px_30px_rgba(15,23,42,0.18)] px-4 py-3',
                COLORS[t.type]
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              <p className="text-sm font-medium flex-1 leading-relaxed text-current">{t.message}</p>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="text-current/80 hover:text-current"
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
