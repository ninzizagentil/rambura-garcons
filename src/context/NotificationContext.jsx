import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { api } from '../services/api';
import { getNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification as removeNotification } from '../services/notificationService';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);
const SOUND_KEY = 'rg_notification_sound_enabled';
const MODULE_PERMISSION_MAP = {
  Library: ['library.view', 'library.books.create', 'library.books.update', 'library.books.delete', 'library.borrow', 'library.return', 'library.reports'],
  Stock: ['stock.view', 'stock.create', 'stock.update', 'stock.in', 'stock.out', 'stock.adjust', 'stock.transfer', 'stock.damage', 'stock.dispose.request', 'stock.dispose.approve', 'stock.archive.request', 'stock.archive.approve', 'stock.suppliers', 'stock.reports'],
  Admissions: ['applications.view', 'applications.update'],
};

function isRelevantToUser(notification, user) {
  if (!notification?.module || !user) return true;
  const permissionHints = MODULE_PERMISSION_MAP[notification.module] || [];
  if (!permissionHints.length) return true;

  const userPermissions = Array.isArray(user.permissions) ? user.permissions : [];
  const hasMatchingPermission = permissionHints.some((permission) => userPermissions.includes(permission));
  return hasMatchingPermission || (notification.module === 'Library' && user.role === 'librarian') || (notification.module === 'Stock' && user.role === 'stock_manager') || (notification.module === 'Admissions' && user.role === 'management');
}

function normalizeNotification(notification) {
  return { ...notification, id: notification.id || notification._id, to: notification.to || notification.link, date: notification.date || notification.createdAt };
}

function playChime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;

    const tone = (freq, start, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.18, now + start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + duration + 0.02);
    };

    tone(1046.5, 0, 0.11);
    tone(1318.5, 0.08, 0.11);
    tone(1568, 0.16, 0.22);

    setTimeout(() => ctx.close(), 700);
  } catch {
  }
}

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      const rawSound = localStorage.getItem(SOUND_KEY);
      return rawSound !== null ? rawSound === 'true' : true;
    } catch {
      return true;
    }
  });
  const hydrated = useRef(false);
  const relevantNotifications = useMemo(() => notifications.filter((notification) => isRelevantToUser(notification, user)), [notifications, user]);

  const addNotification = useCallback(({ type = 'system', message, to }) => {
    const notification = {
      id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type,
      message,
      to,
      read: false,
      date: new Date().toISOString(),
    };
    setNotifications((prev) => [notification, ...prev]);
    if (hydrated.current && soundEnabled) playChime();
    
    api.post('/notifications', { type: type === 'system' ? 'info' : type, title: 'System notification', message, link: to })
      .then((result) => {
        const saved = result.data && normalizeNotification(result.data);
        if (saved?.id) setNotifications((prev) => prev.map((item) => item.id === notification.id ? { ...item, ...saved } : item));
      })
      .catch(() => {});
    
    return notification;
  }, [soundEnabled]);

  useEffect(() => {
    const refresh = () => {
      const accessToken = localStorage.getItem('rg_access_token');
      if (!accessToken) {
        setNotifications([]);
        return Promise.resolve([]);
      }
      return api.post('/notifications/scan', {}).catch(() => null)
        .then(() => getNotifications())
        .then((result) => setNotifications((Array.isArray(result) ? result : result?.items || []).map(normalizeNotification)))
        .catch(() => setNotifications([]));
    };

    const authenticated = () => {
      refresh();
    };
    const loggedOut = () => setNotifications([]);
    window.addEventListener('rg:authenticated', authenticated);
    window.addEventListener('rg:logged-out', loggedOut);

    if (localStorage.getItem('rg_access_token')) refresh();
    const interval = setInterval(() => {
      if (localStorage.getItem('rg_access_token')) refresh();
    }, 10000);

    const t = setTimeout(() => { hydrated.current = true; }, 0);
    return () => { clearTimeout(t); clearInterval(interval); window.removeEventListener('rg:authenticated', authenticated); window.removeEventListener('rg:logged-out', loggedOut); };
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(SOUND_KEY, String(next));
      return next;
    });
  }, []);

  const markAsRead = useCallback(async (id) => {
    if (typeof id === 'string' && /^[a-f\d]{24}$/i.test(id)) await markNotificationRead(id).catch(() => {});
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllAsRead = useCallback(async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const deleteNotification = useCallback(async (id) => {
    try {
      await removeNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      return { success: true };
    } catch {
      return { success: false };
    }
  }, []);

  const unreadCount = relevantNotifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{ notifications: relevantNotifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, addNotification, soundEnabled, toggleSound }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationProvider');
  return ctx;
}
