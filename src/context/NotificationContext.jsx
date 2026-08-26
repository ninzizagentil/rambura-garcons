import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../services/notificationService';

const NotificationContext = createContext(null);
const SOUND_KEY = 'rg_notification_sound_enabled';

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

  useEffect(() => {
    const refresh = () => getNotifications().then(setNotifications).catch(() => setNotifications([]));
    const authenticated = () => refresh();
    window.addEventListener('rg:authenticated', authenticated);
    refresh();
    try {
      const rawSound = localStorage.getItem(SOUND_KEY);
      if (rawSound !== null) setSoundEnabled(rawSound === 'true');
    } catch {
      // keep default (enabled)
    }
    // Mark hydration complete on the next tick so the initial seed/load
    // above never itself triggers the "new notification" chime.
    const t = setTimeout(() => { hydrated.current = true; }, 0);
    return () => { clearTimeout(t); window.removeEventListener('rg:authenticated', authenticated); };
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(SOUND_KEY, String(next));
      return next;
    });
  }, []);

  const markAsRead = useCallback(async (id) => {
    await markNotificationRead(id).catch(() => {});
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllAsRead = useCallback(async () => {
    await markAllNotificationsRead().catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  /** Adds a brand-new notification (unread, timestamped now by default) and
   * plays the chime — this is the single path real app events (a book going
   * overdue, stock dropping low, etc.) should call so the bell badge and
   * sound both stay in sync with what actually happened. */
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
    return notification;
  }, [soundEnabled]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markAsRead, markAllAsRead, addNotification, soundEnabled, toggleSound }}
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
