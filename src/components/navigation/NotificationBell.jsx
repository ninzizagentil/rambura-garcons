import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, AlertTriangle, TrendingDown, Package, BookMarked, Info, Volume2, VolumeX } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { EmptyState } from '../feedback/States';

const ICONS = { overdue: AlertTriangle, 'low-stock': TrendingDown, stock: Package, borrow: BookMarked, system: Info };

export function NotificationItem({ notification, onClick }) {
  const Icon = ICONS[notification.type] || Info;
  return (
    <button
      type="button"
      onClick={() => onClick(notification)}
      className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-[var(--color-off-white)]"
    >
      <span className="mt-0.5 w-7 h-7 rounded-full bg-[rgba(15,108,255,0.08)] text-[#0F6CFF] flex items-center justify-center flex-shrink-0">
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
      {!notification.read && <span className="w-2 h-2 rounded-full bg-[#0F6CFF] mt-1.5 flex-shrink-0" aria-hidden="true" />}
    </button>
  );
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, soundEnabled, toggleSound } = useNotifications();
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
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
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
            <p className="font-semibold text-sm text-[var(--color-dark-gray)]">Notifications</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleSound}
                aria-label={soundEnabled ? 'Mute notification sound' : 'Unmute notification sound'}
                title={soundEnabled ? 'Notification sound on' : 'Notification sound off'}
                className="p-1 rounded-md text-[var(--color-mid-gray)] hover:bg-[var(--color-off-white)] hover:text-[var(--color-dark-gray)]"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              {unreadCount > 0 && (
                <button type="button" onClick={markAllAsRead} className="text-xs font-medium text-[#0F6CFF] hover:underline">
                  Mark all as read
                </button>
              )}
            </div>
          </div>
          <div className="overflow-y-auto divide-y divide-[var(--color-border-gray)]">
            {notifications.length === 0 ? (
              <EmptyState title="No notifications" message="You're all caught up." />
            ) : (
              notifications.map((n) => <NotificationItem key={n.id} notification={n} onClick={handleClick} />)
            )}
          </div>
        </div>
      )}
    </div>
  );
}
