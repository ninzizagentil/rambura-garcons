import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Volume2, VolumeX } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import { NotificationItem } from '../../components/navigation/NotificationBell';
import { EmptyState } from '../../components/feedback/States';
import Button from '../../components/common/Button';
import { useNotifications } from '../../context/NotificationContext';
import { useToast } from '../../context/ToastContext';
import { useApp } from '../../context/AppContext';

export default function Notifications() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, soundEnabled, toggleSound } = useNotifications();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useApp();
  const [filter, setFilter] = useState('all');

  const visibleNotifications = useMemo(() => {
    if (filter === 'unread') return notifications.filter((n) => !n.read);
    if (filter === 'alerts') return notifications.filter((n) => !n.read || ['overdue', 'low-stock', 'stock', 'borrow'].includes(n.type));
    return notifications;
  }, [filter, notifications]);

  const handleClick = (n) => {
    markAsRead(n.id);
    navigate(n.to || '/notifications');
  };

  const handleMarkAll = async () => {
    try {
      await markAllAsRead();
      showToast(t('allNotificationsRead'), 'success');
    } catch {
      showToast(t('couldNotUpdateNotifications'), 'error');
    }
  };

  return (
    <div>
      <PageHeader
        title={t('notifications')}
        description={t('notificationsDescription')}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSound}
              aria-label={soundEnabled ? t('muteNotificationSound') : t('unmuteNotificationSound')}
              title={soundEnabled ? t('notificationSoundOn') : t('notificationSoundOff')}
              className="rounded-md p-2 text-[var(--color-mid-gray)] transition-colors hover:bg-[var(--color-off-white)] hover:text-[var(--color-dark-gray)]"
            >
              {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>
            {unreadCount > 0 && (
              <Button variant="secondary" size="sm" onClick={handleMarkAll}>
                {t('markAllAsRead')}
              </Button>
            )}
          </div>
        }
      />

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border-gray)] bg-[var(--color-white)] p-4 shadow-card">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {['all', 'unread', 'alerts'].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${filter === option ? 'bg-[var(--color-gold-100)] text-[var(--color-heading)]' : 'bg-[var(--color-soft-gray)] text-[var(--color-mid-gray)] hover:text-[var(--color-dark-gray)]'}`}
            >
              {option === 'all' ? 'All' : option === 'unread' ? 'Unread' : 'Alerts'}
            </button>
          ))}
        </div>

        <div className="divide-y divide-[var(--color-border-gray)] overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border-gray)]">
          {visibleNotifications.length === 0 ? (
            <EmptyState title={t('noNotifications')} message={t('notificationsCaughtUp')} />
          ) : (
            visibleNotifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onClick={handleClick}
                onDelete={async (item) => {
                  const result = await deleteNotification(item.id);
                  showToast(result.success ? t('notificationDeleted') : t('couldNotUpdateNotifications'), result.success ? 'success' : 'error');
                }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
