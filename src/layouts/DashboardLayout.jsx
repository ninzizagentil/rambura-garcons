import { Outlet } from 'react-router-dom';
import Sidebar from '../components/navigation/Sidebar';
import MobileMenu from '../components/navigation/MobileMenu';
import Topbar from '../components/navigation/Topbar';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../utils/cn';
import PageTransition from '../components/common/PageTransition';

export default function DashboardLayout() {
  const { isDark } = useTheme();

  return (
    <div
      data-dashboard-root
      className={cn(
        'flex min-h-screen bg-[var(--dark-bg)]',
        isDark && 'dark'
      )}
      style={{ colorScheme: isDark ? 'dark' : 'light' }}
    >
      <Sidebar />
      <MobileMenu />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 p-4 md:p-6 xl:p-7">
          <div className="mx-auto max-w-[1600px]">
            <PageTransition><Outlet /></PageTransition>
          </div>
        </main>
      </div>
    </div>
  );
}
