import bcrypt from 'bcryptjs';
import { connectDatabase } from '../config/database.js';
import User from '../models/User.js';
import Book from '../models/Book.js';
import StockItem from '../models/StockItem.js';
import Supplier from '../models/Supplier.js';
import Program from '../models/Program.js';
import Department from '../models/Department.js';
import Staff from '../models/Staff.js';
import News from '../models/News.js';
import Gallery from '../models/Gallery.js';
import WebsiteSetting from '../models/WebsiteSetting.js';
import Role from '../models/Role.js';
import Permission from '../models/Permission.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';
import Loan from '../models/Loan.js';
import StockTransaction from '../models/StockTransaction.js';
import DamagedStock from '../models/DamagedStock.js';
import DisposedStock from '../models/DisposedStock.js';
import Report from '../models/Report.js';
import SystemSetting from '../models/SystemSetting.js';
import { SEED_BOOKS } from '../../../src/data/library.js';
import { SEED_ITEMS, SEED_SUPPLIERS } from '../../../src/data/stock.js';
import { PROGRAMS, DEPARTMENTS, STAFF, NEWS, GALLERY } from '../../../src/data/content.js';

const users = [
  ['Jean de Dieu Habimana', 'admin', 'admin@ramburagarcons.rw', 'Admin@123', 'admin'],
  ['Marie Claire Uwase', 'librarian', 'librarian@ramburagarcons.rw', 'Library@123', 'librarian'],
  ['Emmanuel Nshuti', 'stock', 'stock@ramburagarcons.rw', 'Stock@123', 'stock_manager'],
  ['Bro. Alphonse Ntawuruhunga', 'director', 'director@ramburagarcons.rw', 'Director@123', 'management'],
];

await connectDatabase();
await User.deleteMany({});
await User.insertMany(await Promise.all(users.map(async ([fullName, username, email, password, role]) => ({
  fullName, username, email, role, passwordHash: await bcrypt.hash(password, 12), status: 'active', lastActivity: new Date(),
}))));
await Promise.all([Book.deleteMany({}), StockItem.deleteMany({}), Supplier.deleteMany({}), Program.deleteMany({}), Department.deleteMany({}), Staff.deleteMany({}), News.deleteMany({}), Gallery.deleteMany({}), WebsiteSetting.deleteMany({})]);
await Book.insertMany(SEED_BOOKS.map(({ id, ...book }) => book));
const suppliers = await Supplier.insertMany(SEED_SUPPLIERS.map(({ id, ...supplier }) => supplier));
const supplierByName = Object.fromEntries(suppliers.map((supplier) => [supplier.name, supplier._id]));
await StockItem.insertMany(SEED_ITEMS.map(({ id, supplier, ...item }) => ({ ...item, supplierId: supplierByName[supplier] })));
await Department.insertMany(DEPARTMENTS.map(({ id, ...department }) => department));
await Program.insertMany(PROGRAMS.map(({ id, ...program }) => ({ ...program, description: program.description || program.summary })));
await Staff.insertMany(STAFF.map(({ id, ...staff }) => ({ ...staff, biography: staff.biography || staff.bio })));
await News.insertMany(NEWS.map(({ id, date, ...news }) => ({ ...news, published: true, publishedAt: date })));
await Gallery.insertMany(GALLERY.map(({ id, ...gallery }) => ({ ...gallery, title: gallery.title || gallery.caption, caption: gallery.caption })));
await WebsiteSetting.create({ key: 'default', schoolName: 'Rambura Garçons TVET School' });
await Promise.all([Role, Permission, AuditLog, Notification, Loan, StockTransaction, DamagedStock, DisposedStock, Report, SystemSetting].map((model) => model.createCollection().catch(() => {})));
const permissionKeys = ['users.view', 'users.create', 'users.update', 'users.delete', 'website.view', 'website.create', 'website.update', 'website.delete', 'library.view', 'library.books.create', 'library.books.update', 'library.books.delete', 'library.borrow', 'library.return', 'library.reports', 'stock.view', 'stock.create', 'stock.update', 'stock.delete', 'stock.in', 'stock.out', 'stock.adjust', 'stock.transfer', 'stock.damage', 'stock.dispose', 'stock.suppliers', 'stock.reports', 'applications.view', 'applications.update', 'reports.view', 'audit.view', 'settings.view', 'settings.update'];
const permissions = await Permission.insertMany(permissionKeys.map((key) => ({ key, label: key, module: key.split('.')[0] })));
await Role.insertMany([
  { name: 'admin', label: 'IT / System Administrator', permissions: permissions.map((permission) => permission._id) },
  { name: 'librarian', label: 'Librarian', permissions: permissions.filter((permission) => permission.module === 'library').map((permission) => permission._id) },
  { name: 'stock_manager', label: 'Stock Manager', permissions: permissions.filter((permission) => permission.module === 'stock').map((permission) => permission._id) },
  { name: 'management', label: 'School Management / Director', permissions: permissions.filter((permission) => ['applications', 'reports'].includes(permission.module)).map((permission) => permission._id) },
]);
console.log(`Seeded ${users.length} users. Demo credentials are documented in the frontend login screen and should be changed outside development.`);
process.exit(0);
