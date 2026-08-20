import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader';
import { NotificationItem } from '../../components/navigation/NotificationBell';
import { EmptyState } from '../../components/feedback/States';
import Button from '../../components/common/Button';
import { useNotifications } from '../../context/NotificationContext';

export default function Notifications() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
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
          unreadCount > 0 && (
            <Button variant="secondary" size="sm" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )
        }
      />
      <div className="bg-white rounded-[var(--radius-card)] border border-[var(--color-border-gray)] divide-y divide-[var(--color-border-gray)]">
        {notifications.length === 0 ? (
          <EmptyState title="No notifications" message="You're all caught up. New alerts will appear here." />
        ) : (
          notifications.map((n) => <NotificationItem key={n.id} notification={n} onClick={handleClick} />)
        )}
      </div>
    </div>
  );
}
