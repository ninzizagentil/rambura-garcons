import { Outlet } from 'react-router-dom';
import Sidebar from '../components/navigation/Sidebar';
import MobileMenu from '../components/navigation/MobileMenu';
import Topbar from '../components/navigation/Topbar';

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-[var(--color-off-white)]">
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
