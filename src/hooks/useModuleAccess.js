import { useAuth } from '../context/AuthContext';
import { ROLES } from '../data/roles';

/**
 * The IT/Admin account can see the Library MIS and Stock MIS for oversight,
 * but must not be able to perform any mutating action there (add, edit,
 * borrow, return, stock in/out, notify, delete, etc.) — that stays the
 * responsibility of the Librarian and Stock Manager roles respectively.
 *
 * @param {string} moduleRole - ROLES.LIBRARIAN or ROLES.STOCK_MANAGER
 * @returns {{ viewOnly: boolean }}
 */
export function useModuleAccess(moduleRole) {
  const { role } = useAuth();
  const viewOnly = role === ROLES.ADMIN && role !== moduleRole;
  return { viewOnly };
}
