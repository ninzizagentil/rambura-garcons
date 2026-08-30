import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import PublicNavbar from '../components/navigation/PublicNavbar';
import Footer from '../components/layout/Footer';
import WhatsAppButton from '../components/common/WhatsAppButton';

export default function PublicLayout() {
  const { isDark } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark-public');
    } else {
      root.classList.remove('dark-public');
    }
  }, [isDark]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-white)]">
      <PublicNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
