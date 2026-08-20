import {
  LayoutDashboard, Globe, BookOpen, Package, FileBarChart, Users, ShieldCheck,
  Settings, User, LogOut, Bell, BookMarked, RotateCcw, AlertTriangle,
  History as HistoryIcon, ClipboardList, PackagePlus, PackageMinus, ArrowLeftRight,
  TrendingDown, LineChart, Boxes, LayoutList,
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
    { label: 'Stock MIS', to: '/stock', icon: Package },
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
    { label: 'All Items', to: '/stock/items', icon: Boxes },
    { label: 'Stock In', to: '/stock/stock-in', icon: PackagePlus },
    { label: 'Stock Out', to: '/stock/stock-out', icon: PackageMinus },
    { label: 'Transactions', to: '/stock/transactions', icon: ArrowLeftRight },
    { label: 'Low Stock', to: '/stock/low-stock', icon: TrendingDown },
    { label: 'Usage Analytics', to: '/stock/analytics', icon: LineChart },
    { label: 'Stock Reports', to: '/stock/reports', icon: FileBarChart },
  ],
  [ROLES.MANAGEMENT]: [
    { label: 'Dashboard', to: '/management', icon: LayoutDashboard },
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
