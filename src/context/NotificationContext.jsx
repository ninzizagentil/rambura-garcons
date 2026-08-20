import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const NotificationContext = createContext(null);
const STORAGE_KEY = 'rg_notifications';

const SEED_NOTIFICATIONS = [
  { id: 'n1', type: 'overdue', message: 'Book "Applied Electricity Vol. 2" is overdue by 4 days.', to: '/library/overdue', read: false, date: '2026-08-17T09:00:00Z' },
  { id: 'n2', type: 'low-stock', message: 'Rice is below minimum stock level.', to: '/stock/low-stock', read: false, date: '2026-08-17T11:20:00Z' },
  { id: 'n3', type: 'stock', message: 'Stock In recorded: 20 units of Exercise Books.', to: '/stock/transactions', read: true, date: '2026-08-16T14:05:00Z' },
  { id: 'n4', type: 'borrow', message: 'New borrowing: "Welding Fundamentals" by MUKAMANA Alice.', to: '/library/borrowed', read: true, date: '2026-08-16T10:30:00Z' },
];

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setNotifications(raw ? JSON.parse(raw) : SEED_NOTIFICATIONS);
    } catch {
      setNotifications(SEED_NOTIFICATIONS);
    }
  }, []);

  useEffect(() => {
    if (notifications.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  const markAsRead = useCallback((id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationProvider');
  return ctx;
}
