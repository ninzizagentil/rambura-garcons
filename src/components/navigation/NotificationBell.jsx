import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, AlertTriangle, TrendingDown, Package, BookMarked, Info, Volume2, VolumeX, Trash2 } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useApp } from '../../context/AppContext';
import { EmptyState } from '../feedback/States';

const ICONS = { overdue: AlertTriangle, 'low-stock': TrendingDown, stock: Package, borrow: BookMarked, system: Info };

export function NotificationItem({ notification, onClick, onDelete }) {
  const { t } = useApp();
  const Icon = ICONS[notification.type] || Info;
  return (
    <div className="w-full flex items-start gap-3 px-4 py-3 hover:bg-[var(--color-off-white)]">
      <button
        type="button"
        onClick={() => onClick(notification)}
        className="flex-1 flex items-start gap-3 text-left"
      >
        <span className="mt-0.5 w-7 h-7 rounded-full bg-[var(--color-gold-100)] text-[var(--color-gold)] flex items-center justify-center flex-shrink-0">
          <Icon className="w-3.5 h-3.5" aria-hidden="true" />
        </span>
        <span className="flex-1">
          <span className={`block text-sm ${notification.read ? 'text-[var(--color-mid-gray)]' : 'text-[var(--color-dark-gray)] font-medium'}`}>
            {notification.message}
          </span>
          <span className="block text-xs text-[var(--color-mid-gray)] mt-0.5">
            {new Date(notification.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </span>
        </span>
        {!notification.read && <span className="w-2 h-2 rounded-full bg-[var(--color-gold)] mt-1.5 flex-shrink-0" aria-hidden="true" />}
      </button>
      {onDelete && (
        <button
          type="button"
          aria-label={t('deleteNotification')}
          title={t('deleteNotification')}
          onClick={(e) => { e.stopPropagation(); onDelete(notification); }}
          className="p-1 rounded-md text-[var(--color-mid-gray)] hover:bg-[var(--color-soft-gray)] hover:text-[var(--color-status-red)]"
        >
          <Trash2 className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, soundEnabled, toggleSound } = useNotifications();
  const { t } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
        className="relative p-2 rounded-full hover:bg-[var(--color-soft-gray)] text-[var(--color-mid-gray)]"
      >
        <Bell className="w-5 h-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--color-status-red)]" aria-hidden="true" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-[var(--sidebar-bg)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] shadow-card-hover z-30 max-h-[70vh] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-gray)]">
            <p className="font-semibold text-sm text-[var(--color-dark-gray)]">{t('notifications')}</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleSound}
                aria-label={soundEnabled ? t('muteNotificationSound') : t('unmuteNotificationSound')}
                title={soundEnabled ? t('notificationSoundOn') : t('notificationSoundOff')}
                className="p-1 rounded-md text-[var(--color-mid-gray)] hover:bg-[var(--color-off-white)] hover:text-[var(--color-dark-gray)]"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              {unreadCount > 0 && (
                <button type="button" onClick={markAllAsRead} className="text-xs font-medium text-[var(--color-gold)] hover:underline">
                  {t('markAllAsRead')}
                </button>
              )}
            </div>
          </div>
          <div className="overflow-y-auto divide-y divide-[var(--color-border-gray)]">
            {notifications.length === 0 ? (
              <EmptyState title={t('noNotifications')} message={t('allCaughtUp')} />
            ) : (
              notifications.map((n) => <NotificationItem key={n.id} notification={n} onClick={handleClick} onDelete={(item) => deleteNotification(item.id)} />)
            )}
          </div>
        </div>
      )}
    </div>
  );
}
