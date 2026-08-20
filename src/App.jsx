import { Routes, Route } from 'react-router-dom';

import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import { ProtectedRoute, RoleProtectedRoute } from './routes/ProtectedRoute';
import { ROLES } from './data/roles';

// Public pages
import Home from './pages/public/Home';
import About from './pages/public/About';
import Academics from './pages/public/Academics';
import Departments from './pages/public/Departments';
import Staff from './pages/public/Staff';
import News from './pages/public/News';
import NewsDetails from './pages/public/NewsDetails';
import Gallery from './pages/public/Gallery';
import Admissions from './pages/public/Admissions';
import Contact from './pages/public/Contact';

// Auth pages
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';

// Dashboards
import AdminDashboard from './pages/admin/AdminDashboard';
import LibraryDashboard from './pages/library/LibraryDashboard';
import StockDashboard from './pages/stock/StockDashboard';
import ManagementDashboard from './pages/management/ManagementDashboard';

// Admin module
import Users from './pages/admin/Users';
import RolesPermissions from './pages/admin/RolesPermissions';
import WebsiteManagement from './pages/admin/WebsiteManagement';
import ActivityAudit from './pages/admin/ActivityAudit';
import AdminReports from './pages/admin/AdminReports';
import Settings from './pages/admin/Settings';

// Library module
import Books from './pages/library/Books';
import BookDetails from './pages/library/BookDetails';
import BorrowedBooks from './pages/library/BorrowedBooks';
import OverdueBooks from './pages/library/OverdueBooks';
import Returns from './pages/library/Returns';
import BorrowingHistory from './pages/library/BorrowingHistory';
import LibraryReports from './pages/library/LibraryReports';

// Stock module
import StockItems from './pages/stock/StockItems';
import StockItemDetails from './pages/stock/StockItemDetails';
import StockIn from './pages/stock/StockIn';
import StockOut from './pages/stock/StockOut';
import Transactions from './pages/stock/Transactions';
import LowStock from './pages/stock/LowStock';
import UsageAnalytics from './pages/stock/UsageAnalytics';
import StockReports from './pages/stock/StockReports';

// Management module
import ManagementLibraryReports from './pages/management/LibraryReports';
import ManagementStockReports from './pages/management/StockReports';
import ManagementInsights from './pages/management/ManagementInsights';

// Shared
import Notifications from './pages/shared/Notifications';
import Profile from './pages/shared/Profile';
import ChangePassword from './pages/shared/ChangePassword';
import AccessRestricted from './pages/shared/AccessRestricted';
import { SuccessPage, ErrorPage, NotFoundPage } from './pages/shared/StatusPages';

export default function App() {
  return (
    <Routes>
      {/* ---------- PUBLIC WEBSITE ---------- */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/academics" element={<Academics />} />
        <Route path="/departments" element={<Departments />} />
        <Route path="/staff" element={<Staff />} />
        <Route path="/news" element={<News />} />
        <Route path="/news/:slug" element={<NewsDetails />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/admissions" element={<Admissions />} />
        <Route path="/contact" element={<Contact />} />
      </Route>

      {/* ---------- AUTH ---------- */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* ---------- SHARED (any authenticated role) ---------- */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/change-password" element={<ChangePassword />} />
        </Route>
      </Route>

      {/* ---------- ADMIN ---------- */}
      <Route element={<RoleProtectedRoute allow={[ROLES.ADMIN]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/website" element={<WebsiteManagement />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/users" element={<Users />} />
          <Route path="/admin/roles" element={<RolesPermissions />} />
          <Route path="/admin/activity" element={<ActivityAudit />} />
          <Route path="/admin/settings" element={<Settings />} />
        </Route>
      </Route>

      {/* ---------- LIBRARIAN (+ Admin can also view Library MIS) ---------- */}
      <Route element={<RoleProtectedRoute allow={[ROLES.LIBRARIAN, ROLES.ADMIN]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/library" element={<LibraryDashboard />} />
          <Route path="/library/books" element={<Books />} />
          <Route path="/library/books/:id" element={<BookDetails />} />
          <Route path="/library/borrowed" element={<BorrowedBooks />} />
          <Route path="/library/overdue" element={<OverdueBooks />} />
          <Route path="/library/returns" element={<Returns />} />
          <Route path="/library/history" element={<BorrowingHistory />} />
          <Route path="/library/reports" element={<LibraryReports />} />
        </Route>
      </Route>

      {/* ---------- STOCK MANAGER (+ Admin) ---------- */}
      <Route element={<RoleProtectedRoute allow={[ROLES.STOCK_MANAGER, ROLES.ADMIN]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/stock" element={<StockDashboard />} />
          <Route path="/stock/items" element={<StockItems />} />
          <Route path="/stock/items/:id" element={<StockItemDetails />} />
          <Route path="/stock/stock-in" element={<StockIn />} />
          <Route path="/stock/stock-out" element={<StockOut />} />
          <Route path="/stock/transactions" element={<Transactions />} />
          <Route path="/stock/low-stock" element={<LowStock />} />
          <Route path="/stock/analytics" element={<UsageAnalytics />} />
          <Route path="/stock/reports" element={<StockReports />} />
        </Route>
      </Route>

      {/* ---------- MANAGEMENT (+ Admin) ---------- */}
      <Route element={<RoleProtectedRoute allow={[ROLES.MANAGEMENT, ROLES.ADMIN]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/management" element={<ManagementDashboard />} />
          <Route path="/management/library-reports" element={<ManagementLibraryReports />} />
          <Route path="/management/stock-reports" element={<ManagementStockReports />} />
          <Route path="/management/insights" element={<ManagementInsights />} />
        </Route>
      </Route>

      {/* ---------- STATUS / FALLBACK ---------- */}
      <Route path="/access-restricted" element={<AccessRestricted />} />
      <Route path="/success" element={<SuccessPage />} />
      <Route path="/error" element={<ErrorPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
