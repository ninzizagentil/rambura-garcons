import { DEMO_USERS } from '../data/users';
import { loadCollection, saveCollection, genId } from '../utils/storage';
import { logActivity } from './activityService';

const USERS_KEY = 'rg_users';

export function getUsers() {
  return loadCollection(USERS_KEY, DEMO_USERS);
}

export function getUserById(id) {
  return getUsers().find((u) => u.id === id) || null;
}

export function createUser({ fullName, username, email, role, status, password }) {
  const users = loadCollection(USERS_KEY, DEMO_USERS);

  if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
    return { success: false, error: 'This username is already taken.' };
  }
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return { success: false, error: 'This email is already registered.' };
  }

  const newUser = {
    id: genId('u'),
    fullName,
    username,
    email,
    role,
    status: status || 'active',
    password,
    lastActivity: new Date().toISOString(),
  };
  saveCollection(USERS_KEY, [newUser, ...users]);
  logActivity({ user: 'System Administrator', action: `Created user "${fullName}"`, module: 'Users', status: 'success' });
  return { success: true, user: newUser };
}

export function updateUser(id, updates) {
  const users = loadCollection(USERS_KEY, DEMO_USERS);
  const next = users.map((u) => (u.id === id ? { ...u, ...updates } : u));
  saveCollection(USERS_KEY, next);
  return { success: true };
}

export function setUserStatus(id, status) {
  const result = updateUser(id, { status });
  const user = getUserById(id);
  if (result.success && user) {
    logActivity({
      user: 'System Administrator',
      action: `${status === 'active' ? 'Activated' : 'Deactivated'} user "${user.fullName}"`,
      module: 'Users',
      status: 'success',
    });
  }
  return result;
}
