export const DEFAULT_ROLE_PERMISSIONS = {
  admin: [],
  librarian: [
    'library.view', 'library.books.create', 'library.books.update',
    'library.books.delete', 'library.borrow', 'library.return',
    'library.reports', 'events.view',
  ],
  stock_manager: [
    'stock.view', 'stock.create', 'stock.update',
    // stock.delete removed — archive now goes through approval workflow
    'stock.in', 'stock.out', 'stock.adjust', 'stock.transfer',
    'stock.damage',
    'stock.dispose.request',    // request disposal (not approve)
    'stock.archive.request',    // request archive  (not approve)
    'stock.suppliers', 'stock.reports',
  ],
  equipment_manager: [
    'equipment.view', 'equipment.create', 'equipment.update',
    // equipment.delete removed — archive now goes through approval workflow
    'equipment.assign', 'equipment.maintenance',
    'equipment.retire.request',   // request retirement (not approve)
    'equipment.archive.request',  // request archive   (not approve)
  ],
  management: [
    'applications.view', 'applications.update',
    'reports.view',
    'library.view', 'library.reports',
    'stock.view', 'stock.reports',
    'stock.dispose.approve',    // approve/reject disposal requests
    'stock.archive.approve',    // approve/reject stock archive requests
    'stock.reconcile.approve',  // approve/reject stock reconciliations (separate from stock.adjust)
    'equipment.view',
    'equipment.retire.approve',   // approve/reject retirement requests
    'equipment.archive.approve',  // approve/reject equipment archive requests
    'audit.view',
    'events.view', 'events.manage',
  ],
};
