import { useAuth } from '../context/AuthContext';
import { ROLES } from '../data/roles';

// Permissions that let a user CHANGE data in a module (anything else is read-only).
const MODULE_MUTATIONS = {
  library: ['library.books.create', 'library.books.update', 'library.books.archive.request', 'library.borrow', 'library.return'],
  stock: ['stock.create', 'stock.update', 'stock.delete', 'stock.in', 'stock.out', 'stock.adjust', 'stock.transfer', 'stock.damage', 'stock.dispose.request', 'stock.dispose.approve', 'stock.suppliers'],
};

/**
 * Whether the signed-in user may change data in a module, decided by the
 * permissions they hold right now (never by their role name), so it follows
 * Roles & Permissions edits immediately.
 *
 * @param {string} moduleRole - ROLES.LIBRARIAN or ROLES.STOCK_MANAGER (only used to pick the module)
 * @param {string} [permissionPrefix] - 'library' | 'stock'; inferred from moduleRole when omitted
 * @param {string[]} [actionPermissions] - permissions that unlock editing on THIS page
 *   (defaults to every mutation permission of the module)
 * @returns {{ viewOnly: boolean, can: (permission: string) => boolean }}
 */
export function useModuleAccess(moduleRole, permissionPrefix, actionPermissions) {
  const { role, hasPermission } = useAuth();
  const can = (permission) => hasPermission(permission);
  const prefix = permissionPrefix
    || (moduleRole === ROLES.STOCK_MANAGER ? 'stock' : moduleRole === ROLES.LIBRARIAN ? 'library' : null);
  const relevant = actionPermissions || MODULE_MUTATIONS[prefix] || [];
  const viewOnly = !relevant.some((permission) => can(permission));
  return { viewOnly, can };
}
