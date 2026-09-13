import {
  LayoutDashboard, Globe, BookOpen, Package, FileBarChart, Users, ShieldCheck,
  Settings, User, LogOut, Bell, BookMarked, RotateCcw, AlertTriangle,
  History as HistoryIcon, ClipboardList, PackagePlus, PackageMinus, ArrowLeftRight,
  Boxes, LayoutList, ShieldAlert,
  ClipboardEdit, Truck, GraduationCap, MessageSquare, Code2, Activity,
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
    {
      label: 'School Modules',
      to: '/admin',
      icon: LayoutList,
      children: [
        { label: 'Website',    to: '/admin/website', icon: Globe },
        { label: 'Library MIS', to: '/library',      icon: BookOpen },
        { label: 'Stock MIS',  to: '/stock',         icon: Package },
      ],
    },
    {
      label: 'Administration',
      to: '/admin/users',
      icon: ShieldCheck,
      children: [
        { label: 'Reports',             to: '/admin/reports',  icon: FileBarChart },
        { label: 'Users & Roles',       to: '/admin/users',    icon: Users },
        { label: 'Roles & Permissions', to: '/admin/roles',    icon: ShieldCheck },
        { label: 'Activity / Audit',    to: '/admin/activity', icon: Activity },
        { label: 'Settings',            to: '/admin/settings', icon: Settings },
      ],
    },
  ],
  [ROLES.LIBRARIAN]: [
    { label: 'Dashboard', to: '/library', icon: LayoutDashboard, permission: 'library.view' },
    { label: 'Books', to: '/library/books', icon: BookOpen, permission: 'library.view' },
    { label: 'Borrowed Books', to: '/library/borrowed', icon: BookMarked, permission: 'library.view' },
    { label: 'Overdue Books', to: '/library/overdue', icon: AlertTriangle, permission: 'library.view' },
    { label: 'Returns', to: '/library/returns', icon: RotateCcw, permission: 'library.return' },
    { label: 'Borrowing History', to: '/library/history', icon: HistoryIcon, permission: 'library.reports' },
    { label: 'Library Reports', to: '/library/reports', icon: FileBarChart, permission: 'library.reports' },
  ],
  [ROLES.STOCK_MANAGER]: [
    { label: 'Dashboard', to: '/stock', icon: LayoutDashboard, permission: 'stock.view' },
    {
      label: 'Inventory',
      to: '/stock/items',
      icon: Boxes,
      children: [
        { label: 'Items',  to: '/stock/items',  icon: Boxes,         permission: 'stock.view' },
        { label: 'Alerts', to: '/stock/alerts', icon: AlertTriangle, permission: 'stock.view' },
        { label: 'Suppliers', to: '/stock/suppliers', icon: Truck,   permission: 'stock.suppliers' },
      ],
    },
    {
      label: 'Operations',
      to: '/stock/stock-in',
      icon: PackagePlus,
      children: [
        { label: 'Receive Stock',   to: '/stock/stock-in',   icon: PackagePlus,   permission: 'stock.in'       },
        { label: 'Issue Stock',     to: '/stock/stock-out',  icon: PackageMinus,  permission: 'stock.out'      },
        { label: 'Transfer Stock',  to: '/stock/transfer',   icon: ArrowLeftRight,permission: 'stock.transfer' },
        { label: 'Adjust Stock',    to: '/stock/adjustment', icon: ClipboardEdit, permission: 'stock.adjust'   },
      ],
    },
    {
      label: 'Activity',
      to: '/stock/transactions',
      icon: Activity,
      children: [
        { label: 'Transactions',      to: '/stock/transactions', icon: Activity,    permission: 'stock.view'    },
        { label: 'Damage & Disposal', to: '/stock/activity',     icon: ShieldAlert, permission: 'stock.damage'  },
      ],
    },
    { label: 'Reports', to: '/stock/reports', icon: FileBarChart, permission: 'stock.reports' },
  ],
  [ROLES.MANAGEMENT]: [
    { label: 'Dashboard', to: '/management', icon: LayoutDashboard, permission: 'applications.view' },
    { label: 'Applications', to: '/management/applications', icon: GraduationCap, permission: 'applications.view' },
    { label: 'Contact Messages', to: '/management/contact-messages', icon: MessageSquare, permission: 'applications.view' },
    { label: 'Developers Page', to: '/management/developers', icon: Code2, permission: 'applications.view' },
    { label: 'Library Reports', to: '/management/library-reports', icon: BookOpen, permission: 'library.reports' },
    { label: 'Stock Reports', to: '/management/stock-reports', icon: Package, permission: 'stock.reports' },
    { label: 'Management Insights', to: '/management/insights', icon: LayoutList, permission: 'reports.view' },
    { label: 'Notifications', to: '/notifications', icon: Bell },
  ],
};

export function filterNavItems(items, role, hasPermission) {
  if (role === ROLES.ADMIN) return items;
  return items
    .map((item) => {
      const children = item.children?.filter((child) => !child.permission || hasPermission(child.permission));
      const itemAllowed = !item.permission || hasPermission(item.permission);
      if (!itemAllowed) return null;
      return item.children ? { ...item, children } : item;
    })
    .filter((item) => item && (!item.children || item.children.length > 0));
}

export const PROFILE_NAV = [
  { label: 'Profile', to: '/profile', icon: User },
  { label: 'Change Password', to: '/change-password', icon: ClipboardList },
  { label: 'Logout', icon: LogOut, action: 'logout' },
];
