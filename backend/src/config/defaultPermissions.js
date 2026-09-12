export const DEFAULT_ROLE_PERMISSIONS = {
  admin: [],
  librarian: ['library.view', 'library.books.create', 'library.books.update', 'library.books.delete', 'library.borrow', 'library.return', 'library.reports'],
  stock_manager: ['stock.view', 'stock.create', 'stock.update', 'stock.delete', 'stock.in', 'stock.out', 'stock.adjust', 'stock.transfer', 'stock.damage', 'stock.dispose', 'stock.suppliers', 'stock.reports'],
  management: ['applications.view', 'applications.update', 'reports.view', 'library.reports', 'stock.reports'],
};
