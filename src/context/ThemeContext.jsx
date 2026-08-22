import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'rg_theme';

function getInitialTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    /* localStorage unavailable — fall through to default */
  }
  // Always start in light/white mode by default, regardless of the
  // device's system color-scheme setting. Dark mode is opt-in only,
  // switched on solely by the person clicking the toggle button.
  return 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  // Persist the preference only. The `dark` class itself is applied by
  // DashboardLayout to its own root element, not here — dark mode is a
  // dashboard-only feature and must never touch <html>/<body>, or it would
  // leak onto the public website (whose pages use plain, non-variable text
  // colors and were never designed for a dark background).
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore storage errors (e.g. private browsing) */
    }
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
