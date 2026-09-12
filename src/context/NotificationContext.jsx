import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { ROLE_HOME, ROLE_LABELS } from '../data/roles';
import { getNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification as removeNotification } from '../services/notificationService';

const NotificationContext = createContext(null);
const SOUND_KEY = 'rg_notification_sound_enabled';

function normalizeNotification(notification) {
  return { ...notification, id: notification.id || notification._id, to: notification.to || notification.link, date: notification.date || notification.createdAt };
}

/** Plays a short two-tone chime using the Web Audio API — no external audio
 * file needed, so it works instantly offline and isn't blocked by CSP/asset
 * loading. Browsers only allow audio after a user gesture has occurred
 * somewhere on the page, so failures here (e.g. before any click) are
 * swallowed silently rather than thrown. */
function playChime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;

    const tone = (freq, start, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.18, now + start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + duration + 0.02);
    };

    tone(880, 0, 0.12);
    tone(1318.5, 0.1, 0.18);

    setTimeout(() => ctx.close(), 600);
  } catch {
    // Audio not available (e.g. autoplay restrictions) — fail silently.
  }
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const hydrated = useRef(false);

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
    
    // Persist to backend
    api.post('/notifications', { type: type === 'system' ? 'info' : type, title: 'System notification', message, link: to })
      .then((result) => {
        const saved = result.data && normalizeNotification(result.data);
        if (saved?.id) setNotifications((prev) => prev.map((item) => item.id === notification.id ? { ...item, ...saved } : item));
      })
      .catch(() => {});
    
    return notification;
  }, [soundEnabled]);

  const notifyLogin = useCallback(() => {
    try {
      const session = localStorage.getItem('rg_auth_session');
      if (!session) return;
      const user = JSON.parse(session);
      const role = user?.role;
      if (!role) return;

      const panelLabel = ROLE_LABELS[role] || role;
      const to = ROLE_HOME[role] || '/';
      const fullName = user?.fullName || user?.name || 'User';
      addNotification({
        type: 'info',
        message: `${fullName} signed in to ${panelLabel}.`,
        to,
      });
    } catch {
      // Keep quiet if the session payload is missing or malformed.
    }
  }, [addNotification]);

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
      notifyLogin();
    };
    window.addEventListener('rg:authenticated', authenticated);

    if (localStorage.getItem('rg_access_token')) {
      refresh();
    }

    try {
      const rawSound = localStorage.getItem(SOUND_KEY);
      if (rawSound !== null) setSoundEnabled(rawSound === 'true');
    } catch {
      // keep default (enabled)
    }

    const t = setTimeout(() => { hydrated.current = true; }, 0);
    return () => { clearTimeout(t); window.removeEventListener('rg:authenticated', authenticated); };
  }, [notifyLogin]);

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
    } catch {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, addNotification, soundEnabled, toggleSound }}
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
