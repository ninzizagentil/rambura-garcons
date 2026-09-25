import {
  LayoutDashboard, Globe, BookOpen, Package, FileBarChart, Users, ShieldCheck,
  Settings, User, LogOut, BookMarked, RotateCcw, AlertTriangle,
  History as HistoryIcon, ClipboardList, PackagePlus, PackageMinus, ArrowLeftRight,
  Boxes, LayoutList, ShieldAlert,
  ClipboardEdit, Truck, GraduationCap, MessageSquare, Code2, Activity,
  Laptop, CheckCircle2, Archive, Wrench,
} from 'lucide-react';

export const ROLES = {
  ADMIN: 'admin',
  LIBRARIAN: 'librarian',
  STOCK_MANAGER: 'stock_manager',
  EQUIPMENT_MANAGER: 'equipment_manager',
  MANAGEMENT: 'management',
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'IT / System Administrator',
  [ROLES.LIBRARIAN]: 'Librarian',
  [ROLES.STOCK_MANAGER]: 'Stock Manager',
  [ROLES.EQUIPMENT_MANAGER]: 'Equipment Manager',
  [ROLES.MANAGEMENT]: 'School Management / Director',
};

export const ROLE_HOME = {
  [ROLES.ADMIN]: '/admin',
  [ROLES.LIBRARIAN]: '/library',
  [ROLES.STOCK_MANAGER]: '/stock',
  [ROLES.EQUIPMENT_MANAGER]: '/equipment',
  [ROLES.MANAGEMENT]: '/management',
};

/**
 * The IT / System Administrator always sees the full menu.
 * Every other user gets a menu built from the permissions they currently hold
 * (see MASTER_NAV + getNavForUser below), NOT from their role name.
 */
export const ADMIN_NAV = [
    { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
    {
      label: 'School Modules',
      to: '/admin',
      icon: LayoutList,
      children: [
        { label: 'Website Management', to: '/admin/website', icon: Globe },
        { label: 'Equipment MIS', to: '/equipment', icon: Laptop, permission: 'equipment.view' },
        { label: 'Equipment Reports', to: '/equipment/reports', icon: FileBarChart, permission: 'equipment.view' },
      ],
    },
    {
      label: 'Stock MIS',
      to: '/stock',
      icon: Package,
      children: [
        { label: 'Items', to: '/stock/items', icon: Boxes, permission: 'stock.view' },
        { label: 'Alerts', to: '/stock/alerts', icon: AlertTriangle, permission: 'stock.view' },
        { label: 'Receive Stock', to: '/stock/stock-in', icon: PackagePlus, permission: 'stock.in' },
        { label: 'Issue Stock', to: '/stock/stock-out', icon: PackageMinus, permission: 'stock.out' },
        { label: 'Transfer Stock', to: '/stock/transfer', icon: ArrowLeftRight, permission: 'stock.transfer' },
        { label: 'Adjust Stock', to: '/stock/adjustment', icon: ClipboardEdit, permission: 'stock.adjust' },
        { label: 'Stock Reports', to: '/stock/reports', icon: FileBarChart, permission: 'stock.reports' },
      ],
    },
    {
      label: 'Library MIS',
      to: '/library',
      icon: BookOpen,
      permission: 'library.view',
      children: [
        { label: 'Books', to: '/library/books', icon: BookOpen, permission: 'library.view' },
        { label: 'Borrowed Books', to: '/library/borrowed', icon: BookMarked, permission: 'library.view' },
        { label: 'Overdue Books', to: '/library/overdue', icon: AlertTriangle, permission: 'library.view' },
        { label: 'Returns', to: '/library/returns', icon: RotateCcw, permission: 'library.return' },
        { label: 'Borrowing History', to: '/library/history', icon: HistoryIcon, permission: 'library.reports' },
        { label: 'Library Reports', to: '/library/reports', icon: FileBarChart, permission: 'library.reports' },
      ],
    },
    {
      label: 'Administration',
      to: '/admin/users',
      icon: ShieldCheck,
      children: [
        { label: 'Users & Roles',       to: '/admin/users',    icon: Users },
        { label: 'Roles & Permissions', to: '/admin/roles',    icon: ShieldCheck },
        { label: 'Activity / Audit',    to: '/admin/activity', icon: Activity },
        { label: 'Settings',            to: '/admin/settings', icon: Settings },
      ],
    },
  ];

/**
 * Menu shown to non-admin users. Each entry is shown only when the user holds
 * the permission(s) it needs — the same permissions the matching route guard in
 * App.jsx and the API enforce — so granting a permission in Roles & Permissions
 * adds the entry and removing it takes the entry away.
 *
 *   permission     – string | string[]  → ALL of these are required
 *   anyPermission  – string[]           → at least ONE of these is required
 *   hideWhen       – string[]           → hidden if the user holds ANY of these
 *                                         (avoids duplicate links to one report)
 *   dashboard      – marks a module dashboard (renamed to "Dashboard" when it
 *                    is the only one the user can open)
 */
export const MASTER_NAV = [
  { label: 'Library Dashboard', to: '/library', icon: LayoutDashboard, permission: 'library.view', dashboard: true },
  { label: 'Stock Dashboard', to: '/stock', icon: LayoutDashboard, permission: 'stock.view', dashboard: true },
  { label: 'Equipment Dashboard', to: '/equipment', icon: LayoutDashboard, permission: 'equipment.view', dashboard: true },
  { label: 'Equipment Records', to: '/equipment/items', icon: Laptop, permission: 'equipment.view' },
  { label: 'Assignment & Return', to: '/equipment/assignments', icon: ArrowLeftRight, permission: 'equipment.view' },
  { label: 'Maintenance', to: '/equipment/maintenance', icon: Wrench, permission: 'equipment.view' },
  { label: 'Equipment Reports', to: '/equipment/reports', icon: FileBarChart, permission: 'equipment.view' },
  {
    label: 'Retirement & Archive',
    to: '/equipment/retirement-requests',
    icon: CheckCircle2,
    children: [
      { label: 'Retirement Requests', to: '/equipment/retirement-requests', icon: CheckCircle2, permission: 'equipment.retire.request', hideForRoles: [ROLES.MANAGEMENT] },
      { label: 'Archive Requests', to: '/equipment/archive-requests', icon: Archive, permission: 'equipment.archive.request', hideForRoles: [ROLES.MANAGEMENT] },
    ],
  },
  { label: 'Management Dashboard', to: '/management', icon: LayoutDashboard, anyPermission: ['applications.view', 'reports.view'], dashboard: true },

  {
    label: 'Library Catalogue',
    to: '/library/books',
    icon: Boxes,
    children: [
      { label: 'Books', to: '/library/books', icon: BookOpen, permission: 'library.view' },
      { label: 'Borrowed Books', to: '/library/borrowed', icon: BookMarked, permission: 'library.view' },
      { label: 'Overdue Books', to: '/library/overdue', icon: AlertTriangle, permission: 'library.view' },
      { label: 'Returns', to: '/library/returns', icon: RotateCcw, permission: ['library.view', 'library.return'] },
    ],
  },
  {
    label: 'Library Activity',
    to: '/library/history',
    icon: Activity,
    children: [
      { label: 'Borrowing History', to: '/library/history', icon: HistoryIcon, permission: ['library.view', 'library.reports'] },
      { label: 'Library Reports', to: '/library/reports', icon: FileBarChart, permission: ['library.view', 'library.reports'] },
    ],
  },

  {
    label: 'Inventory',
    to: '/stock/items',
    icon: Boxes,
    children: [
      { label: 'Items', to: '/stock/items', icon: Boxes, permission: 'stock.view' },
      { label: 'Alerts', to: '/stock/alerts', icon: AlertTriangle, permission: 'stock.view' },
      { label: 'Suppliers', to: '/stock/suppliers', icon: Truck, permission: ['stock.view', 'stock.suppliers'] },
    ],
  },
  {
    label: 'Operations',
    to: '/stock/stock-in',
    icon: PackagePlus,
    children: [
      { label: 'Receive Stock', to: '/stock/stock-in', icon: PackagePlus, permission: ['stock.view', 'stock.in'] },
      { label: 'Issue Stock', to: '/stock/stock-out', icon: PackageMinus, permission: ['stock.view', 'stock.out'] },
      { label: 'Transfer Stock', to: '/stock/transfer', icon: ArrowLeftRight, permission: ['stock.view', 'stock.transfer'] },
      { label: 'Adjust Stock', to: '/stock/adjustment', icon: ClipboardEdit, permission: ['stock.view', 'stock.adjust'] },
    ],
  },
  {
    label: 'Activity',
    to: '/stock/transactions',
    icon: Activity,
    children: [
      { label: 'Transactions', to: '/stock/transactions', icon: Activity, permission: 'stock.view' },
      { label: 'Damage & Disposal', to: '/stock/activity', icon: ShieldAlert, permission: ['stock.view', 'stock.damage'] },
      { label: 'Archive Requests', to: '/stock/archive-requests', icon: Archive, permission: 'stock.archive.request' },
    ],
  },
  { label: 'Stock Reports', to: '/stock/reports', icon: FileBarChart, permission: ['stock.view', 'stock.reports'] },
  { label: 'Activity / Audit', to: '/admin/activity', icon: Activity, permission: 'audit.view' },

  {
    label: 'Management',
    to: '/management/applications',
    icon: LayoutList,
    children: [
      { label: 'Applications', to: '/management/applications', icon: GraduationCap, permission: 'applications.view' },
      { label: 'Contact Messages', to: '/management/contact-messages', icon: MessageSquare, permission: 'applications.view' },
      { label: 'Developers Page', to: '/management/developers', icon: Code2, permission: 'applications.view' },
    ],
  },
  {
    label: 'Reports & Insights',
    to: '/management/insights',
    icon: FileBarChart,
    children: [
      { label: 'Library Reports', to: '/management/library-reports', icon: BookOpen, permission: 'library.reports' },
      { label: 'Stock Reports', to: '/management/stock-reports', icon: Package, permission: 'stock.reports' },
      { label: 'Management Insights', to: '/management/insights', icon: LayoutList, permission: 'reports.view' },
    ],
  },
  { label: 'Approvals', to: '/management/approvals', icon: CheckCircle2, anyPermission: ['stock.dispose.approve', 'equipment.retire.approve', 'stock.archive.approve', 'equipment.archive.approve'] },
];

// Kept for backwards compatibility with older imports; only the admin menu is static.
export const NAV_BY_ROLE = { [ROLES.ADMIN]: ADMIN_NAV };

const toArray = (value) => (value === undefined || value === null ? [] : Array.isArray(value) ? value : [value]);

/** True when the user currently holds what this menu entry requires. */
export function canSeeNavItem(item, hasPermission, role) {
  if (!toArray(item.permission).every((permission) => hasPermission(permission))) return false;
  if (item.anyPermission && !item.anyPermission.some((permission) => hasPermission(permission))) return false;
  if (item.hideWhen && item.hideWhen.some((permission) => hasPermission(permission))) return false;
  if (item.hideForRoles && item.hideForRoles.includes(role)) return false;
  return true;
}

export function filterNavItems(items, role, hasPermission) {
  if (role === ROLES.ADMIN) return items;
  return items
    .map((item) => {
      if (!canSeeNavItem(item, hasPermission, role)) return null;
      if (!item.children) return item;
      const children = item.children.filter((child) => canSeeNavItem(child, hasPermission, role));
      if (children.length === 0) return null;
      // Point the group at the first page the user can really open.
      return { ...item, to: children[0].to, children };
    })
    .filter(Boolean);
}

/**
 * The menu for the signed-in user, built from the permissions they hold right
 * now. Because it is derived from `user.permissions`, it changes the moment
 * those permissions change (see AuthContext, which keeps them in sync).
 */
export function getNavForUser(user, hasPermission) {
  if (!user) return [];
  if (user.role === ROLES.ADMIN) return ADMIN_NAV;
  const items = filterNavItems(MASTER_NAV, user.role, hasPermission);
  if (user.role === ROLES.MANAGEMENT) {
    const dashboardOrder = {
      [ROLE_HOME[ROLES.MANAGEMENT]]: 0,
      ['/management/applications']: 1,
      [ROLE_HOME[ROLES.LIBRARIAN]]: 2,
      [ROLE_HOME[ROLES.STOCK_MANAGER]]: 3,
      [ROLE_HOME[ROLES.EQUIPMENT_MANAGER]]: 4,
    };
    items.sort((first, second) => {
      const firstOrder = dashboardOrder[first.to] ?? 99;
      const secondOrder = dashboardOrder[second.to] ?? 99;
      return firstOrder - secondOrder;
    });
  }
  const dashboards = items.filter((item) => item.dashboard);
  if (dashboards.length !== 1) return items;
  return items.map((item) => (item.dashboard ? { ...item, label: 'Dashboard' } : item));
}

const HOME_CANDIDATES = [
  { to: '/management', anyPermission: ['applications.view', 'reports.view'] },
  { to: '/management/applications', permission: 'applications.view' },
  { to: '/library', permission: 'library.view' },
  { to: '/stock', permission: 'stock.view' },
  { to: '/equipment', permission: 'equipment.view' },
];

/**
 * Where "home" is for this user: their role's own dashboard when they can still
 * open it, otherwise the first dashboard their permissions allow, otherwise the
 * profile page (which every signed-in user can open).
 */
export function getHomePath(user) {
  if (!user) return '/login';
  if (user.role === ROLES.ADMIN) return ROLE_HOME[ROLES.ADMIN];
  const has = (permission) => !!user.permissions?.includes(permission);
  const open = HOME_CANDIDATES.filter((candidate) => canSeeNavItem(candidate, has));
  const own = open.find((candidate) => candidate.to === ROLE_HOME[user.role]);
  return (own || open[0])?.to || '/profile';
}

export const PROFILE_NAV = [
  { label: 'Profile', to: '/profile', icon: User },
  { label: 'Change Password', to: '/change-password', icon: ClipboardList },
  { label: 'Logout', icon: LogOut, action: 'logout' },
];
