import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import { ProtectedRoute, RoleProtectedRoute } from './routes/ProtectedRoute';
import { ROLES } from './data/roles';

const lazyPage = (loader) => lazy(loader);

const Home = lazyPage(() => import('./pages/public/Home'));
const About = lazyPage(() => import('./pages/public/About'));
const Academics = lazyPage(() => import('./pages/public/Academics'));
const Departments = lazyPage(() => import('./pages/public/Departments'));
const Staff = lazyPage(() => import('./pages/public/Staff'));
const News = lazyPage(() => import('./pages/public/News'));
const NewsDetails = lazyPage(() => import('./pages/public/NewsDetails'));
const Gallery = lazyPage(() => import('./pages/public/Gallery'));
const Admissions = lazyPage(() => import('./pages/public/Admissions'));
const Contact = lazyPage(() => import('./pages/public/Contact'));
const Login = lazyPage(() => import('./pages/auth/Login'));
const ForgotPassword = lazyPage(() => import('./pages/auth/ForgotPassword'));
const AdminDashboard = lazyPage(() => import('./pages/admin/AdminDashboard'));
const LibraryDashboard = lazyPage(() => import('./pages/library/LibraryDashboard'));
const StockDashboard = lazyPage(() => import('./pages/stock/StockDashboard'));
const ManagementDashboard = lazyPage(() => import('./pages/management/ManagementDashboard'));
const Users = lazyPage(() => import('./pages/admin/Users'));
const RolesPermissions = lazyPage(() => import('./pages/admin/RolesPermissions'));
const WebsiteManagement = lazyPage(() => import('./pages/admin/WebsiteManagement'));
const ActivityAudit = lazyPage(() => import('./pages/admin/ActivityAudit'));
const AdminReports = lazyPage(() => import('./pages/admin/AdminReports'));
const Settings = lazyPage(() => import('./pages/admin/Settings'));
const Books = lazyPage(() => import('./pages/library/Books'));
const BookDetails = lazyPage(() => import('./pages/library/BookDetails'));
const BorrowedBooks = lazyPage(() => import('./pages/library/BorrowedBooks'));
const OverdueBooks = lazyPage(() => import('./pages/library/OverdueBooks'));
const Returns = lazyPage(() => import('./pages/library/Returns'));
const BorrowingHistory = lazyPage(() => import('./pages/library/BorrowingHistory'));
const LibraryReports = lazyPage(() => import('./pages/library/LibraryReports'));
const StockItems = lazyPage(() => import('./pages/stock/StockItems'));
const StockItemDetails = lazyPage(() => import('./pages/stock/StockItemDetails'));
const StockIn = lazyPage(() => import('./pages/stock/StockIn'));
const StockOut = lazyPage(() => import('./pages/stock/StockOut'));
const StockAdjustment = lazyPage(() => import('./pages/stock/StockAdjustment'));
const StockTransfer = lazyPage(() => import('./pages/stock/StockTransfer'));
const Suppliers = lazyPage(() => import('./pages/stock/Suppliers'));
const Transactions = lazyPage(() => import('./pages/stock/Transactions'));
const LowStock = lazyPage(() => import('./pages/stock/LowStock'));
const OutOfStock = lazyPage(() => import('./pages/stock/OutOfStock'));
const DamagedItems = lazyPage(() => import('./pages/stock/DamagedItems'));
const ExpiredItems = lazyPage(() => import('./pages/stock/ExpiredItems'));
const RemovedDisposed = lazyPage(() => import('./pages/stock/RemovedDisposed'));
const UsageAnalytics = lazyPage(() => import('./pages/stock/UsageAnalytics'));
const StockReports = lazyPage(() => import('./pages/stock/StockReports'));
const ManagementLibraryReports = lazyPage(() => import('./pages/management/LibraryReports'));
const ManagementStockReports = lazyPage(() => import('./pages/management/StockReports'));
const ManagementInsights = lazyPage(() => import('./pages/management/ManagementInsights'));
const ManagementApplications = lazyPage(() => import('./pages/management/Applications'));
const Notifications = lazyPage(() => import('./pages/shared/Notifications'));
const Profile = lazyPage(() => import('./pages/shared/Profile'));
const ChangePassword = lazyPage(() => import('./pages/shared/ChangePassword'));
const AccessRestricted = lazyPage(() => import('./pages/shared/AccessRestricted'));
const SuccessPage = lazyPage(() => import('./pages/shared/StatusPages').then((module) => ({ default: module.SuccessPage })));
const ErrorPage = lazyPage(() => import('./pages/shared/StatusPages').then((module) => ({ default: module.ErrorPage })));
const NotFoundPage = lazyPage(() => import('./pages/shared/StatusPages').then((module) => ({ default: module.NotFoundPage })));

function LoadingPage() {
  return <div className="flex min-h-[40vh] items-center justify-center text-sm text-[var(--color-gray-500)]">Loading...</div>;
}

export default function App() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <Routes>
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

      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/change-password" element={<ChangePassword />} />
        </Route>
      </Route>

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

      <Route element={<RoleProtectedRoute allow={[ROLES.STOCK_MANAGER, ROLES.ADMIN]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/stock" element={<StockDashboard />} />
          <Route path="/stock/items" element={<StockItems />} />
          <Route path="/stock/items/:id" element={<StockItemDetails />} />
          <Route path="/stock/low-stock" element={<LowStock />} />
          <Route path="/stock/out-of-stock" element={<OutOfStock />} />
          <Route path="/stock/damaged" element={<DamagedItems />} />
          <Route path="/stock/expired" element={<ExpiredItems />} />
          <Route path="/stock/removed" element={<RemovedDisposed />} />
          <Route path="/stock/stock-in" element={<StockIn />} />
          <Route path="/stock/stock-out" element={<StockOut />} />
          <Route path="/stock/adjustment" element={<StockAdjustment />} />
          <Route path="/stock/transfer" element={<StockTransfer />} />
          <Route path="/stock/suppliers" element={<Suppliers />} />
          <Route path="/stock/transactions" element={<Transactions />} />
          <Route path="/stock/analytics" element={<UsageAnalytics />} />
          <Route path="/stock/reports" element={<StockReports />} />
        </Route>
      </Route>

      <Route element={<RoleProtectedRoute allow={[ROLES.MANAGEMENT, ROLES.ADMIN]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/management" element={<ManagementDashboard />} />
          <Route path="/management/applications" element={<ManagementApplications />} />
          <Route path="/management/library-reports" element={<ManagementLibraryReports />} />
          <Route path="/management/stock-reports" element={<ManagementStockReports />} />
          <Route path="/management/insights" element={<ManagementInsights />} />
        </Route>
      </Route>

      <Route path="/access-restricted" element={<AccessRestricted />} />
      <Route path="/success" element={<SuccessPage />} />
      <Route path="/error" element={<ErrorPage />} />
      <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
