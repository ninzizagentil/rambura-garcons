import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import { ProtectedRoute, RoleProtectedRoute, PermissionProtectedRoute } from './routes/ProtectedRoute';
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
const Developers = lazyPage(() => import('./pages/public/Developers'));
const PrivacyPolicy = lazyPage(() => import('./pages/public/PrivacyPolicy'));
const TermsOfUse = lazyPage(() => import('./pages/public/TermsOfUse'));
const Login = lazyPage(() => import('./pages/auth/Login'));
const ForgotPassword = lazyPage(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazyPage(() => import('./pages/auth/ResetPassword'));
const AdminDashboard = lazyPage(() => import('./pages/admin/AdminDashboard'));
const LibraryDashboard = lazyPage(() => import('./pages/library/LibraryDashboard'));
const StockDashboard = lazyPage(() => import('./pages/stock/StockDashboard'));
const ManagementDashboard = lazyPage(() => import('./pages/management/ManagementDashboard'));
const Users = lazyPage(() => import('./pages/admin/Users'));
const RolesPermissions = lazyPage(() => import('./pages/admin/RolesPermissions'));
const WebsiteManagement = lazyPage(() => import('./pages/admin/WebsiteManagement'));
const ActivityAudit = lazyPage(() => import('./pages/admin/ActivityAudit'));
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
const StockAlerts = lazyPage(() => import('./pages/stock/StockAlerts'));
const DamageDisposal = lazyPage(() => import('./pages/stock/DamageDisposal'));
const StockReports = lazyPage(() => import('./pages/stock/StockReports'));
const Equipment = lazyPage(() => import('./pages/equipment/Equipment'));
const EquipmentDashboard = lazyPage(() => import('./pages/equipment/EquipmentDashboard'));
const EquipmentOperations = lazyPage(() => import('./pages/equipment/EquipmentOperations'));
const EquipmentReports = lazyPage(() => import('./pages/equipment/EquipmentReports'));
const RetirementRequests = lazyPage(() => import('./pages/equipment/RetirementRequests'));
const EquipmentArchiveRequests = lazyPage(() => import('./pages/equipment/ArchiveRequests'));
const StockArchiveRequests = lazyPage(() => import('./pages/stock/ArchiveRequests'));
const PublicEvents = lazyPage(() => import('./pages/public/Events'));
const ManagementLibraryReports = lazyPage(() => import('./pages/management/LibraryReports'));
const ManagementStockReports = lazyPage(() => import('./pages/management/StockReports'));
const ManagementInsights = lazyPage(() => import('./pages/management/ManagementInsights'));
const ManagementApplications = lazyPage(() => import('./pages/management/Applications'));
const ContactMessages = lazyPage(() => import('./pages/management/ContactMessages'));
const DevelopersManagement = lazyPage(() => import('./pages/management/DevelopersManagement'));
const Approvals = lazyPage(() => import('./pages/management/Approvals'));
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
        <Route path="/events" element={<PublicEvents />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/admissions" element={<Admissions />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/developers" element={<Developers />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfUse />} />
      </Route>

      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

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
          <Route path="/admin/reports" element={<Navigate to="/management/insights" replace />} />
          <Route path="/admin/users" element={<Users />} />
          <Route path="/admin/roles" element={<RolesPermissions />} />
          <Route path="/admin/settings" element={<Settings />} />
        </Route>
      </Route>

      <Route element={<PermissionProtectedRoute permissions={['audit.view']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin/activity" element={<ActivityAudit />} />
        </Route>
      </Route>

      <Route element={<PermissionProtectedRoute permissions={['equipment.view']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/equipment" element={<EquipmentDashboard />} />
          <Route path="/equipment/items" element={<Equipment />} />
          <Route path="/equipment/assignments" element={<EquipmentOperations mode="assignments" />} />
          <Route path="/equipment/maintenance" element={<EquipmentOperations mode="maintenance" />} />
          <Route path="/equipment/reports" element={<EquipmentReports />} />
          <Route element={<PermissionProtectedRoute permissions={['equipment.retire.request']} />}>
            <Route path="/equipment/retirement-requests" element={<RetirementRequests />} />
          </Route>
          <Route element={<PermissionProtectedRoute permissions={['equipment.archive.request']} />}>
            <Route path="/equipment/archive-requests" element={<EquipmentArchiveRequests />} />
          </Route>
          <Route path="/admin/equipment" element={<Navigate to="/equipment" replace />} />
        </Route>
      </Route>

      <Route element={<PermissionProtectedRoute permissions={['library.view']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/library" element={<LibraryDashboard />} />
          <Route path="/library/books" element={<Books />} />
          <Route path="/library/books/:id" element={<BookDetails />} />
          <Route path="/library/borrowed" element={<BorrowedBooks />} />
          <Route path="/library/overdue" element={<OverdueBooks />} />
          <Route element={<PermissionProtectedRoute permissions={['library.return']} />}>
            <Route path="/library/returns" element={<Returns />} />
          </Route>
          <Route element={<PermissionProtectedRoute permissions={['library.reports']} />}>
            <Route path="/library/history" element={<BorrowingHistory />} />
            <Route path="/library/reports" element={<LibraryReports />} />
          </Route>
        </Route>
      </Route>

      <Route element={<PermissionProtectedRoute permissions={['stock.view']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/stock"              element={<StockDashboard />} />
          <Route path="/stock/items"        element={<StockItems />} />
          <Route path="/stock/items/:id"    element={<StockItemDetails />} />
          <Route path="/stock/alerts"       element={<StockAlerts />} />
          <Route path="/stock/transactions" element={<Transactions />} />

          <Route element={<PermissionProtectedRoute permissions={['stock.in']} />}>
            <Route path="/stock/stock-in" element={<StockIn />} />
          </Route>
          <Route element={<PermissionProtectedRoute permissions={['stock.out']} />}>
            <Route path="/stock/stock-out" element={<StockOut />} />
          </Route>
          <Route element={<PermissionProtectedRoute permissions={['stock.adjust']} />}>
            <Route path="/stock/adjustment" element={<StockAdjustment />} />
          </Route>
          <Route element={<PermissionProtectedRoute permissions={['stock.transfer']} />}>
            <Route path="/stock/transfer" element={<StockTransfer />} />
          </Route>
          <Route element={<PermissionProtectedRoute permissions={['stock.suppliers']} />}>
            <Route path="/stock/suppliers" element={<Suppliers />} />
          </Route>
          <Route element={<PermissionProtectedRoute permissions={['stock.damage']} />}>
            <Route path="/stock/activity" element={<DamageDisposal />} />
          </Route>
          <Route element={<PermissionProtectedRoute permissions={['stock.archive.request']} />}>
            <Route path="/stock/archive-requests" element={<StockArchiveRequests />} />
          </Route>
          <Route element={<PermissionProtectedRoute permissions={['stock.reports']} />}>
            <Route path="/stock/reports" element={<StockReports />} />
          </Route>

          {/* ── Backward-compat redirects (old URLs → new locations) ─── */}
          <Route path="/stock/low-stock"    element={<Navigate to="/stock/alerts?tab=low-stock"    replace />} />
          <Route path="/stock/out-of-stock" element={<Navigate to="/stock/alerts?tab=out-of-stock" replace />} />
          <Route path="/stock/expired"      element={<Navigate to="/stock/alerts?tab=expiring"     replace />} />
          <Route path="/stock/damaged"      element={<Navigate to="/stock/activity?tab=damaged"    replace />} />
          <Route path="/stock/removed"      element={<Navigate to="/stock/activity?tab=disposed"   replace />} />
          <Route path="/stock/analytics"    element={<Navigate to="/stock/reports?tab=analytics"   replace />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
       <Route element={<DashboardLayout />}>
        <Route element={<PermissionProtectedRoute permissions={['applications.view', 'reports.view']} />}>
          <Route path="/management" element={<ManagementDashboard />} />
        </Route>
        <Route element={<PermissionProtectedRoute permissions={['applications.view']} />}>
          <Route path="/management/applications" element={<ManagementApplications />} />
          <Route path="/management/contact-messages" element={<ContactMessages />} />
          <Route path="/management/developers" element={<DevelopersManagement />} />
        </Route>
        <Route
          element={<PermissionProtectedRoute permissions={[
            'stock.dispose.approve',
            'stock.archive.approve',
            'equipment.retire.approve',
            'equipment.archive.approve',
          ]} />}
        >
          <Route path="/management/approvals" element={<Approvals />} />
        </Route>
        <Route element={<PermissionProtectedRoute permissions={['library.reports']} />}>
          <Route path="/management/library-reports" element={<ManagementLibraryReports />} />
        </Route>
        <Route element={<PermissionProtectedRoute permissions={['stock.reports']} />}>
          <Route path="/management/stock-reports" element={<ManagementStockReports />} />
        </Route>
        <Route element={<PermissionProtectedRoute permissions={['reports.view']} />}>
          <Route path="/management/insights" element={<ManagementInsights />} />
        </Route>
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
