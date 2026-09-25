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
              className="p-2 rounded-md text-[var(--color-mid-gray)] hover:bg-[var(--color-off-white)] hover:text-[var(--color-dark-gray)] transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            {unreadCount > 0 && (
              <Button variant="secondary" size="sm" onClick={handleMarkAll}>
                {t('markAllAsRead')}
              </Button>
            )}
          </div>
        }
      />
      <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] divide-y divide-[var(--color-border-gray)]">
        {notifications.length === 0 ? (
          <EmptyState title={t('noNotifications')} message={t('notificationsCaughtUp')} />
        ) : (
          notifications.map((n) => <NotificationItem key={n.id} notification={n} onClick={handleClick} onDelete={async (item) => { const result = await deleteNotification(item.id); showToast(result.success ? t('notificationDeleted') : t('couldNotUpdateNotifications'), result.success ? 'success' : 'error'); }} />)
        )}
      </div>
    </div>
  );
}
