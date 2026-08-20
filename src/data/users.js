import { ROLES } from './roles';

export const DEMO_USERS = [
  {
    id: 'u1',
    fullName: 'Jean de Dieu Habimana',
    username: 'admin',
    email: 'admin@ramburagarcons.rw',
    password: 'Admin@123',
    role: ROLES.ADMIN,
    status: 'active',
    lastActivity: '2026-08-18T08:12:00Z',
  },
  {
    id: 'u2',
    fullName: 'Marie Claire Uwase',
    username: 'librarian',
    email: 'librarian@ramburagarcons.rw',
    password: 'Library@123',
    role: ROLES.LIBRARIAN,
    status: 'active',
    lastActivity: '2026-08-18T07:40:00Z',
  },
  {
    id: 'u3',
    fullName: 'Emmanuel Nshuti',
    username: 'stock',
    email: 'stock@ramburagarcons.rw',
    password: 'Stock@123',
    role: ROLES.STOCK_MANAGER,
    status: 'active',
    lastActivity: '2026-08-17T16:05:00Z',
  },
  {
    id: 'u4',
    fullName: 'Bro. Alphonse Ntawuruhunga',
    username: 'director',
    email: 'director@ramburagarcons.rw',
    password: 'Director@123',
    role: ROLES.MANAGEMENT,
    status: 'active',
    lastActivity: '2026-08-18T06:55:00Z',
  },
];
