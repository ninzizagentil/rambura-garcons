import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, AlertTriangle, TrendingDown, Package, BookMarked, Info, Volume2, VolumeX, Trash2 } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useApp } from '../../context/AppContext';
import { EmptyState } from '../feedback/States';

const ICONS = { overdue: AlertTriangle, 'low-stock': TrendingDown, stock: Package, borrow: BookMarked, system: Info, website: Info, info: Info };

const TYPE_META = {
  overdue: { label: 'Overdue', tone: 'bg-amber-50 text-amber-700 ring-amber-200' },
  'low-stock': { label: 'Low stock', tone: 'bg-orange-50 text-orange-700 ring-orange-200' },
  stock: { label: 'Stock', tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  borrow: { label: 'Library', tone: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
  system: { label: 'System', tone: 'bg-sky-50 text-sky-700 ring-sky-200' },
  website: { label: 'Website', tone: 'bg-violet-50 text-violet-700 ring-violet-200' },
  info: { label: 'Info', tone: 'bg-slate-100 text-slate-700 ring-slate-200' },
};

function formatNotificationDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';
  return date.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function NotificationItem({ notification, onClick, onDelete }) {
  const { t } = useApp();
  const Icon = ICONS[notification.type] || Info;
  const meta = TYPE_META[notification.type] || TYPE_META.info;

  return (
    <div className={`w-full border-b border-[var(--color-border-gray)] p-3 transition-colors ${notification.read ? 'bg-white' : 'bg-[var(--color-gold-100)]/35 hover:bg-[var(--color-gold-100)]/50'}`}>
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => onClick(notification)}
          className="flex flex-1 items-start gap-3 text-left"
        >
          <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--color-soft-gray)] text-[var(--color-heading)] ring-1 ring-inset ring-[var(--color-border-gray)]">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>

          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${meta.tone}`}>
                {meta.label}
              </span>
              {!notification.read && <span className="h-2 w-2 rounded-full bg-[var(--color-gold)]" aria-label="Unread notification" />}
            </span>

            <span className={`mt-1 block text-sm leading-5 ${notification.read ? 'text-[var(--color-mid-gray)]' : 'text-[var(--color-dark-gray)] font-medium'}`}>
              {notification.message}
            </span>

            <span className="mt-1 block text-[11px] text-[var(--color-mid-gray)]">
              {formatNotificationDate(notification.date)}
            </span>
          </span>
        </button>

        {onDelete && (
          <button
            type="button"
            aria-label={t('deleteNotification')}
            title={t('deleteNotification')}
            onClick={(e) => { e.stopPropagation(); onDelete(notification); }}
            className="mt-1 rounded-md p-1.5 text-[var(--color-mid-gray)] transition-colors hover:bg-[var(--color-soft-gray)] hover:text-[var(--color-status-red)]"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, soundEnabled, toggleSound } = useNotifications();
  const { t } = useApp();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const visibleNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'alerts') return !n.read || ['overdue', 'low-stock', 'stock', 'borrow'].includes(n.type);
    return true;
  });

  const handleClick = (n) => {
    markAsRead(n.id);
    setOpen(false);
    navigate(n.to || '/notifications');
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t('notificationsUnread', { count: unreadCount })}
        className="relative rounded-full p-2 text-[var(--color-mid-gray)] transition-colors hover:bg-[var(--color-soft-gray)]"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-[var(--color-status-red)] ring-2 ring-[var(--color-white)]" aria-hidden="true" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 flex max-h-[75vh] w-[360px] flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border-gray)] bg-[var(--sidebar-bg)] shadow-card-hover z-30">
          <div className="border-b border-[var(--color-border-gray)] px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-sm text-[var(--color-dark-gray)]">{t('notifications')}</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleSound}
                  aria-label={soundEnabled ? t('muteNotificationSound') : t('unmuteNotificationSound')}
                  title={soundEnabled ? t('notificationSoundOn') : t('notificationSoundOff')}
                  className="rounded-md p-1.5 text-[var(--color-mid-gray)] transition-colors hover:bg-[var(--color-off-white)] hover:text-[var(--color-dark-gray)]"
                >
                  {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </button>
                {unreadCount > 0 && (
                  <button type="button" onClick={markAllAsRead} className="text-[11px] font-medium text-[var(--color-gold)] hover:underline">
                    {t('markAllAsRead')}
                  </button>
                )}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              {['all', 'unread', 'alerts'].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${filter === option ? 'bg-[var(--color-gold-100)] text-[var(--color-heading)]' : 'bg-[var(--color-soft-gray)] text-[var(--color-mid-gray)] hover:text-[var(--color-dark-gray)]'}`}
                >
                  {option === 'all' ? 'All' : option === 'unread' ? 'Unread' : 'Alerts'}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-y-auto bg-white">
            {visibleNotifications.length === 0 ? (
              <div className="p-4">
                <EmptyState title={t('noNotifications')} message={t('allCaughtUp')} />
              </div>
            ) : (
              visibleNotifications.map((n) => (
                <NotificationItem key={n.id} notification={n} onClick={handleClick} onDelete={(item) => deleteNotification(item.id)} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
