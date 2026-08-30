import { useNavigate } from 'react-router-dom';
import { Volume2, VolumeX } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import { NotificationItem } from '../../components/navigation/NotificationBell';
import { EmptyState } from '../../components/feedback/States';
import Button from '../../components/common/Button';
import { useNotifications } from '../../context/NotificationContext';

export default function Notifications() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, soundEnabled, toggleSound } = useNotifications();
  const navigate = useNavigate();

  const handleClick = (n) => {
    markAsRead(n.id);
    navigate(n.to || '/notifications');
  };

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Overdue books, low stock alerts, and system activity."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSound}
              aria-label={soundEnabled ? 'Mute notification sound' : 'Unmute notification sound'}
              title={soundEnabled ? 'Notification sound on' : 'Notification sound off'}
              className="p-2 rounded-md text-[var(--color-mid-gray)] hover:bg-[var(--color-off-white)] hover:text-[var(--color-dark-gray)] transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            {unreadCount > 0 && (
              <Button variant="secondary" size="sm" onClick={markAllAsRead}>
                Mark all as read
              </Button>
            )}
          </div>
        }
      />
      <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] divide-y divide-[var(--color-border-gray)]">
        {notifications.length === 0 ? (
          <EmptyState title="No notifications" message="You're all caught up. New alerts will appear here." />
        ) : (
          notifications.map((n) => <NotificationItem key={n.id} notification={n} onClick={handleClick} />)
        )}
      </div>
    </div>
  );
}
