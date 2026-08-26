import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    const refresh = () => setDataVersion((version) => version + 1);
    window.addEventListener('rg:library-updated', refresh);
    window.addEventListener('rg:stock-updated', refresh);
    window.addEventListener('rg:content-updated', refresh);
    window.addEventListener('rg:images-updated', refresh);
    return () => {
      window.removeEventListener('rg:library-updated', refresh);
      window.removeEventListener('rg:stock-updated', refresh);
      window.removeEventListener('rg:content-updated', refresh);
      window.removeEventListener('rg:images-updated', refresh);
    };
  }, []);

  const toggleSidebar = useCallback(() => setSidebarCollapsed((v) => !v), []);
  const toggleMobileMenu = useCallback(() => setMobileMenuOpen((v) => !v), []);
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  return (
    <AppContext.Provider
      value={{ sidebarCollapsed, toggleSidebar, mobileMenuOpen, toggleMobileMenu, closeMobileMenu }}
    >
      <div key={dataVersion}>{children}</div>
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
}
