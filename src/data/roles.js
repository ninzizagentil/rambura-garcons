import {
  LayoutDashboard, Globe, BookOpen, Package, FileBarChart, Users, ShieldCheck,
  Settings, User, LogOut, Bell, BookMarked, RotateCcw, AlertTriangle,
  History as HistoryIcon, ClipboardList, PackagePlus, PackageMinus, ArrowLeftRight,
  TrendingDown, LineChart, Boxes, LayoutList, PackageX, ShieldAlert, CalendarClock, Archive,
  ClipboardEdit, Truck, GraduationCap,
} from 'lucide-react';

export const ROLES = {
  ADMIN: 'admin',
  LIBRARIAN: 'librarian',
  STOCK_MANAGER: 'stock_manager',
  MANAGEMENT: 'management',
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'IT / System Administrator',
  [ROLES.LIBRARIAN]: 'Librarian',
  [ROLES.STOCK_MANAGER]: 'Stock Manager',
  [ROLES.MANAGEMENT]: 'School Management / Director',
};

export const ROLE_HOME = {
  [ROLES.ADMIN]: '/admin',
  [ROLES.LIBRARIAN]: '/library',
  [ROLES.STOCK_MANAGER]: '/stock',
  [ROLES.MANAGEMENT]: '/management',
};

export const NAV_BY_ROLE = {
  [ROLES.ADMIN]: [
    { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
    { label: 'Website', to: '/admin/website', icon: Globe },
    { label: 'Library MIS', to: '/library', icon: BookOpen },
    {
      label: 'Stock MIS',
      to: '/stock',
      icon: Package,
      children: [
        { label: 'All Items', to: '/stock/items', icon: Boxes },
        { label: 'Low Stock', to: '/stock/low-stock', icon: TrendingDown },
        { label: 'Out of Stock', to: '/stock/out-of-stock', icon: PackageX },
        { label: 'Damaged Items', to: '/stock/damaged', icon: ShieldAlert },
        { label: 'Expired Items', to: '/stock/expired', icon: CalendarClock },
        { label: 'Removed / Disposed', to: '/stock/removed', icon: Archive },
        { label: 'Stock In', to: '/stock/stock-in', icon: PackagePlus },
        { label: 'Stock Out', to: '/stock/stock-out', icon: PackageMinus },
        { label: 'Stock Adjustment', to: '/stock/adjustment', icon: ClipboardEdit },
        { label: 'Stock Transfer', to: '/stock/transfer', icon: ArrowLeftRight },
        { label: 'Suppliers', to: '/stock/suppliers', icon: Truck },
        { label: 'Transactions', to: '/stock/transactions', icon: ArrowLeftRight },
        { label: 'Stock Reports', to: '/stock/reports', icon: FileBarChart },
      ],
    },
    { label: 'Reports', to: '/admin/reports', icon: FileBarChart },
    { label: 'Users & Roles', to: '/admin/users', icon: Users },
    { label: 'Roles & Permissions', to: '/admin/roles', icon: ShieldCheck },
    { label: 'Activity / Audit', to: '/admin/activity', icon: ShieldCheck },
    { label: 'Settings', to: '/admin/settings', icon: Settings },
  ],
  [ROLES.LIBRARIAN]: [
    { label: 'Dashboard', to: '/library', icon: LayoutDashboard },
    { label: 'Books', to: '/library/books', icon: BookOpen },
    { label: 'Borrowed Books', to: '/library/borrowed', icon: BookMarked },
    { label: 'Overdue Books', to: '/library/overdue', icon: AlertTriangle },
    { label: 'Returns', to: '/library/returns', icon: RotateCcw },
    { label: 'Borrowing History', to: '/library/history', icon: HistoryIcon },
    { label: 'Library Reports', to: '/library/reports', icon: FileBarChart },
  ],
  [ROLES.STOCK_MANAGER]: [
    { label: 'Dashboard', to: '/stock', icon: LayoutDashboard },
    {
      label: 'Inventory',
      to: '/stock/items',
      icon: Boxes,
      children: [
        { label: 'All Items', to: '/stock/items', icon: Boxes },
        { label: 'Low Stock', to: '/stock/low-stock', icon: TrendingDown },
        { label: 'Out of Stock', to: '/stock/out-of-stock', icon: PackageX },
        { label: 'Damaged Items', to: '/stock/damaged', icon: ShieldAlert },
        { label: 'Expired Items', to: '/stock/expired', icon: CalendarClock },
        { label: 'Removed / Disposed', to: '/stock/removed', icon: Archive },
      ],
    },
    {
      label: 'Stock Operations',
      to: '/stock/stock-in',
      icon: PackagePlus,
      children: [
        { label: 'Stock In', to: '/stock/stock-in', icon: PackagePlus },
        { label: 'Stock Out', to: '/stock/stock-out', icon: PackageMinus },
        { label: 'Stock Adjustment', to: '/stock/adjustment', icon: ClipboardEdit },
        { label: 'Stock Transfer', to: '/stock/transfer', icon: ArrowLeftRight },
      ],
    },
    { label: 'Transactions', to: '/stock/transactions', icon: ArrowLeftRight },
    { label: 'Suppliers', to: '/stock/suppliers', icon: Truck },
    { label: 'Usage Analytics', to: '/stock/analytics', icon: LineChart },
    { label: 'Stock Reports', to: '/stock/reports', icon: FileBarChart },
  ],
  [ROLES.MANAGEMENT]: [
    { label: 'Dashboard', to: '/management', icon: LayoutDashboard },
    { label: 'Applications', to: '/management/applications', icon: GraduationCap },
    { label: 'Library Reports', to: '/management/library-reports', icon: BookOpen },
    { label: 'Stock Reports', to: '/management/stock-reports', icon: Package },
    { label: 'Management Insights', to: '/management/insights', icon: LayoutList },
    { label: 'Notifications', to: '/notifications', icon: Bell },
  ],
};

export const PROFILE_NAV = [
  { label: 'Profile', to: '/profile', icon: User },
  { label: 'Change Password', to: '/change-password', icon: ClipboardList },
  { label: 'Logout', icon: LogOut, action: 'logout' },
];
