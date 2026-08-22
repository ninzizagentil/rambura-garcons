import { Outlet } from 'react-router-dom';
import Sidebar from '../components/navigation/Sidebar';
import MobileMenu from '../components/navigation/MobileMenu';
import Topbar from '../components/navigation/Topbar';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../utils/cn';

export default function DashboardLayout() {
  const { isDark } = useTheme();

  return (
    <div
      data-dashboard-root
      className={cn('flex min-h-screen bg-[var(--color-off-white)]', isDark && 'dark')}
      style={{ colorScheme: isDark ? 'dark' : 'light' }}
    >
      <Sidebar />
      <MobileMenu />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
