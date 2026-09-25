// Demo records for EVERY panel, so each screen can be tried right after `npm run seed`.
// It is called at the end of seed.js (which has already emptied the collections).
// All dates are relative to "today", so overdue loans, expiring food and upcoming events stay realistic.
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Book from '../models/Book.js';
import Loan from '../models/Loan.js';
import Supplier from '../models/Supplier.js';
import StockItem from '../models/StockItem.js';
import StockTransaction from '../models/StockTransaction.js';
import DamagedStock from '../models/DamagedStock.js';
import DisposedStock from '../models/DisposedStock.js';
import StockReconciliation from '../models/StockReconciliation.js';
import StockArchiveRequest from '../models/StockArchiveRequest.js';
import Equipment from '../models/Equipment.js';
import EquipmentRetirementRequest from '../models/EquipmentRetirementRequest.js';
import EquipmentArchiveRequest from '../models/EquipmentArchiveRequest.js';
import Event from '../models/Event.js';
import Admission from '../models/Admission.js';
import ContactMessage from '../models/ContactMessage.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import Report from '../models/Report.js';

const DAY = 24 * 60 * 60 * 1000;
const ago = (days) => new Date(Date.now() - days * DAY);
const ahead = (days) => new Date(Date.now() + days * DAY);
const NO_STAMPS = { timestamps: false }; // keep the created/updated dates we set below

export async function seedDemoData() {
  const found = await User.find({}, '_id username');
  const id = Object.fromEntries(found.map((user) => [user.username, user._id]));
  const { admin, librarian, stock, equipment: equipmentUser, director } = id;

  // ---------- Users (extra accounts for the Users panel) ----------
  const demoHash = await bcrypt.hash('Demo@12345', 12);
  await User.insertMany([
    { fullName: 'Aline Uwase', username: 'librarian2', email: 'aline.uwase@ramburagarcons.rw', role: 'librarian', passwordHash: demoHash, status: 'active', lastActivity: ago(2) },
    { fullName: 'Eric Niyonzima', username: 'stock2', email: 'eric.niyonzima@ramburagarcons.rw', role: 'stock_manager', passwordHash: demoHash, status: 'inactive', lastActivity: ago(60) },
    { fullName: 'Claudine Mukamana', username: 'registrar', email: 'claudine.mukamana@ramburagarcons.rw', role: 'management', passwordHash: demoHash, status: 'active', lastActivity: ago(1) },
  ]);

  // ---------- Library: books + loans ----------
  const extraBooks = [
    ['Electrical Installation Handbook', 'B. Scaddan', 'Electrical Technology'], ['Basic Welding Skills', 'J. Uwimana', 'Welding & Fabrication'],
    ['Building Construction Technology', 'R. Mugisha', 'Construction'], ['Automotive Engine Repair', 'P. Nkurunziza', 'Automobile Mechanics'],
    ['Mathematics for TVET Level 3', 'A. Habimana', 'Mathematics'], ['English for Technical Students', 'M. Ingabire', 'Languages'],
    ['Introduction to ICT', 'D. Ndayisaba', 'ICT'], ['Entrepreneurship Skills', 'C. Uwera', 'Entrepreneurship'],
    ['Physics Made Simple', 'E. Kamanzi', 'Science'], ['Workshop Safety Manual', 'Ministry of Education', 'Reference'],
    ['Technical Drawing Basics', 'S. Bizimana', 'Construction'], ['Circuit Theory', 'H. Mutabazi', 'Electrical Technology'],
    ['Metal Fabrication Guide', 'L. Rutayisire', 'Welding & Fabrication'], ['Vehicle Electrical Systems', 'F. Hakizimana', 'Automobile Mechanics'],
    ['Kinyarwanda Grammar', 'J. Nsengiyumva', 'Languages'], ['Career Guidance for Youth', 'REB', 'Reference'],
  ];
  await Book.insertMany(extraBooks.map(([title, author, category], index) => ({
    title, author, category, bookCode: `DEMO-B${String(index + 1).padStart(2, '0')}`, totalCopies: 3 + (index % 5) * 2, borrowedCopies: 0,
    description: `${title} - demo library record for ${category}.`,
  })));
  const books = await Book.find({});
  const borrowers = [
    ['Jean Claude Habimana', 'student', 'S4 ELT'], ['Eric Ndayisenga', 'student', 'S5 WOF'], ['Patrick Mugabo', 'student', 'S3 CON'], ['Emmanuel Nsabimana', 'student', 'S4 AUT'],
    ['Samuel Iradukunda', 'student', 'S5 ELT'], ['David Niyigena', 'student', 'S3 WOF'], ['Olivier Twagirayezu', 'student', 'S6 CON'], ['Innocent Manirakiza', 'student', 'S4 CON'],
    ['Mr. Jean Bosco Karekezi', 'teacher', ''], ['Mrs. Vestine Uwimana', 'teacher', ''], ['Mr. Theogene Rukundo', 'staff', ''], ['Fabrice Munyaneza', 'student', 'S5 AUT'],
  ];
  const loans = [];
  const plan = [
    ...Array.from({ length: 10 }, (_, i) => ({ state: 'returned', borrowed: 40 - i * 3, days: 14, returnedAfter: 9 + (i % 5) })),
    ...Array.from({ length: 6 }, (_, i) => ({ state: 'borrowed', borrowed: 3 + i * 2, days: 14 })),
    ...Array.from({ length: 5 }, (_, i) => ({ state: 'overdue', borrowed: 20 + i * 4, days: 14 })),
  ];
  plan.forEach((entry, index) => {
    const [borrower, borrowerType, studentClassYear] = borrowers[index % borrowers.length];
    const borrowDate = ago(entry.borrowed);
    const dueDate = new Date(borrowDate.getTime() + entry.days * DAY);
    loans.push({
      bookId: books[(index * 3) % books.length]._id, borrower, borrowerType, studentClassYear, borrowDate, dueDate,
      status: entry.state,
      ...(entry.state === 'returned' ? { returnDate: new Date(borrowDate.getTime() + entry.returnedAfter * DAY), returnedBy: librarian } : {}),
      issuedBy: librarian, notes: entry.state === 'overdue' ? 'Reminder sent to the borrower.' : undefined,
    });
  });
  await Loan.insertMany(loans);
  // Keep the "borrowed copies" counters equal to the loans that are still out.
  await Book.updateMany({}, { $set: { borrowedCopies: 0 } });
  for (const loan of loans.filter((entry) => entry.status !== 'returned')) await Book.updateOne({ _id: loan.bookId }, { $inc: { borrowedCopies: 1 } });
  for (const book of await Book.find({})) {
    if (book.totalCopies < book.borrowedCopies) await Book.updateOne({ _id: book._id }, { $set: { totalCopies: book.borrowedCopies } });
  }

  // ---------- Stock: suppliers, items, history ----------
  const suppliers = await Supplier.insertMany([
    { name: 'Kigali Fresh Foods Ltd', contactPerson: 'Alice Mukeshimana', phone: '0788100101', email: 'sales@kigalifresh.rw', address: 'Kigali, Nyarugenge', notes: 'Rice, beans, maize flour' },
    { name: 'Rubavu Grain Traders', contactPerson: 'Jean Pierre Habineza', phone: '0788100102', email: 'info@rubavugrain.rw', address: 'Rubavu Town', notes: 'Bulk grains, cooking oil' },
    { name: 'Musanze Stationery Centre', contactPerson: 'Diane Uwamahoro', phone: '0788100103', email: 'orders@musanzestationery.rw', address: 'Musanze, Muhoza', notes: 'Books, chalk, pens' },
    { name: 'TechPro Rwanda', contactPerson: 'Eric Rugamba', phone: '0788100104', email: 'sales@techpro.rw', address: 'Kigali, Kimironko', notes: 'ICT lab consumables' },
    { name: 'Nyabihu Hardware & Tools', contactPerson: 'Claude Bizimana', phone: '0788100105', email: 'hello@nyabihuhardware.rw', address: 'Nyabihu, Mukamira', notes: 'Workshop materials' },
    { name: 'Green Clean Supplies', contactPerson: 'Beatrice Nyirahabimana', phone: '0788100106', email: 'clean@greenclean.rw', address: 'Gisenyi', status: 'inactive', notes: 'Contract ended' },
  ]);
  const sup = (name) => suppliers.find((entry) => entry.name.startsWith(name))._id;
  // [code, name, category, unit, quantity, minLevel, unitPrice, location, supplier, batch, expiry(days from today), abc]
  const rows = [
    ['FD-001', 'Rice (Long Grain)', 'Foods', 'kg', 850, 300, 1100, 'Kitchen Store', 'Kigali', 'RC-2601', 150, 'A'],
    ['FD-002', 'Beans (Red)', 'Foods', 'kg', 420, 250, 900, 'Kitchen Store', 'Kigali', 'BN-2602', 120, 'A'],
    ['FD-003', 'Maize Flour', 'Foods', 'kg', 180, 200, 800, 'Kitchen Store', 'Rubavu', 'MF-2603', 25, 'B'],
    ['FD-004', 'Cooking Oil', 'Foods', 'litres', 95, 60, 2600, 'Kitchen Store', 'Rubavu', 'CO-2604', 200, 'A'],
    ['FD-005', 'Sugar', 'Foods', 'kg', 60, 80, 1500, 'Kitchen Store', 'Rubavu', 'SG-2605', 300, 'B'],
    ['FD-006', 'Salt', 'Foods', 'kg', 45, 20, 500, 'Kitchen Store', 'Rubavu', 'SL-2606', 500, 'C'],
    ['FD-007', 'Milk Powder', 'Foods', 'cartons', 12, 10, 24000, 'Main Store', 'Kigali', 'MP-2607', 12, 'B'],
    ['FD-008', 'Cassava Flour', 'Foods', 'bags', 8, 15, 18000, 'Kitchen Store', 'Kigali', 'CF-2608', -6, 'C'],
    ['FD-009', 'Tea Leaves', 'Foods', 'boxes', 30, 10, 6500, 'Kitchen Store', 'Kigali', 'TL-2609', 240, 'C'],
    ['SM-001', 'Exercise Books (A4, 96 pages)', 'Other School Materials', 'pieces', 1200, 500, 450, 'Main Store', 'Musanze', null, null, 'A'],
    ['SM-002', 'Ball Pens (Blue)', 'Other School Materials', 'boxes', 40, 20, 3500, 'Admin Store', 'Musanze', null, null, 'B'],
    ['SM-003', 'Chalk (White)', 'Other School Materials', 'boxes', 70, 30, 1800, 'Main Store', 'Musanze', null, null, 'C'],
    ['SM-004', 'Whiteboard Markers', 'Other School Materials', 'boxes', 18, 20, 6000, 'Admin Store', 'Musanze', null, null, 'B'],
    ['SM-005', 'Printer Paper (A4 Ream)', 'Other School Materials', 'boxes', 25, 15, 24000, 'Admin Store', 'TechPro', null, null, 'A'],
    ['SM-006', 'HDMI Cables', 'Other School Materials', 'pieces', 22, 10, 4500, 'ICT Lab Store', 'TechPro', null, null, 'C'],
    ['SM-007', 'Network Cable (Cat6, 305 m)', 'Other School Materials', 'boxes', 6, 4, 85000, 'ICT Lab Store', 'TechPro', null, null, 'B'],
    ['SM-008', 'Welding Rods (2.5 mm)', 'Other School Materials', 'boxes', 35, 25, 12000, 'Main Store', 'Nyabihu', null, null, 'A'],
    ['SM-009', 'Safety Gloves', 'Other School Materials', 'pieces', 90, 60, 2500, 'Main Store', 'Nyabihu', null, null, 'B'],
    ['SM-010', 'Safety Helmets', 'Other School Materials', 'pieces', 40, 30, 7000, 'Main Store', 'Nyabihu', null, null, 'B'],
    ['SM-011', 'Electrical Wire (2.5 mm, 100 m)', 'Other School Materials', 'sets', 14, 10, 55000, 'Main Store', 'Nyabihu', null, null, 'A'],
    ['SM-012', 'Cement (50 kg)', 'Other School Materials', 'bags', 60, 40, 13500, 'Main Store', 'Nyabihu', null, null, 'A'],
    ['SM-013', 'Old Exercise Books (A5)', 'Other School Materials', 'pieces', 0, 100, 300, 'Main Store', 'Musanze', null, null, 'C'],
    ['SM-014', 'Marker Pens (Permanent)', 'Other School Materials', 'boxes', 0, 5, 5000, 'Admin Store', 'Musanze', null, null, 'C'],
    ['SM-015', 'Wall Chart (Old Curriculum)', 'Other School Materials', 'pieces', 0, 0, 1500, 'Main Store', 'Musanze', null, null, 'C'],
  ];
  const items = await StockItem.insertMany(rows.map(([code, name, category, unit, quantity, minLevel, unitPrice, location, supplier, batchNumber, expiry, abc]) => ({
    code, name, category, unit, quantity, minLevel, unitPrice, location, supplierId: sup(supplier), abcClassification: abc,
    ...(batchNumber ? { batchNumber, expiryDate: ahead(expiry) } : {}), description: `${name} - demo stock item.`,
  })));
  const item = (code) => items.find((entry) => entry.code === code);

  // History per item: events go oldest -> newest, and the opening stock is worked out backwards so the
  // running quantities end exactly at today's quantity. [item, daysAgo, type, change, party/notes]
  const events = [
    ['FD-001', 50, 'out', -150, 'Kitchen'], ['FD-001', 30, 'out', -160, 'Kitchen'], ['FD-001', 20, 'in', 400, 'Kigali Fresh Foods Ltd'], ['FD-001', 8, 'out', -140, 'Kitchen'], ['FD-001', 2, 'out', -120, 'Kitchen'],
    ['FD-002', 45, 'out', -120, 'Kitchen'], ['FD-002', 25, 'out', -100, 'Kitchen'], ['FD-002', 12, 'in', 200, 'Kigali Fresh Foods Ltd'], ['FD-002', 4, 'out', -90, 'Kitchen'],
    ['FD-003', 40, 'out', -90, 'Kitchen'], ['FD-003', 15, 'out', -70, 'Kitchen'], ['FD-003', 6, 'out', -60, 'Kitchen'],
    ['FD-004', 35, 'out', -40, 'Kitchen'], ['FD-004', 10, 'out', -35, 'Kitchen'], ['FD-004', 9, 'adjustment', -5, 'Spoilage'],
    ['FD-005', 28, 'out', -30, 'Kitchen'], ['FD-005', 7, 'out', -25, 'Kitchen'],
    ['FD-007', 18, 'out', -6, 'Kitchen'], ['FD-007', 5, 'out', -4, 'Kitchen'],
    ['FD-008', 30, 'out', -12, 'Kitchen'], ['FD-008', 14, 'removed', -6, 'Expired'], ['FD-008', 3, 'out', -4, 'Kitchen'],
    ['SM-001', 60, 'out', -300, 'Students (Term 1)'], ['SM-001', 33, 'out', -250, 'Students (Term 2)'], ['SM-001', 5, 'in', 500, 'Musanze Stationery Centre'],
    ['SM-002', 22, 'out', -12, 'Administration'], ['SM-003', 30, 'out', -10, 'Classrooms'], ['SM-004', 12, 'out', -7, 'Classrooms'],
    ['SM-005', 20, 'out', -10, 'Administration'], ['SM-005', 6, 'out', -5, 'Administration'],
    ['SM-006', 26, 'out', -8, 'ICT Lab'], ['SM-006', 11, 'damaged', -2, 'Cable strain'],
    ['SM-007', 14, 'transfer', 0, 'Main Store -> ICT Lab Store'],
    ['SM-008', 40, 'out', -20, 'Welding workshop'], ['SM-008', 9, 'out', -15, 'Welding workshop'],
    ['SM-009', 32, 'out', -30, 'Workshops'], ['SM-009', 8, 'damaged', -6, 'Water damage'],
    ['SM-010', 21, 'out', -10, 'Workshops'], ['SM-011', 17, 'out', -6, 'Electrical workshop'], ['SM-012', 10, 'out', -20, 'Construction workshop'],
    ['SM-013', 70, 'out', -100, 'Students'], ['SM-014', 55, 'out', -8, 'Classrooms'], ['SM-015', 90, 'out', -30, 'Classrooms'],
    ['FD-006', 65, 'out', -10, 'Kitchen'], ['FD-009', 44, 'out', -5, 'Kitchen'], ['SM-010', 3, 'adjustment', 3, 'Found extra stock'],
  ];
  const transactions = [];
  const damagedRows = [];
  const removedRows = [];
  let refNo = 1000;
  for (const stockItem of items) {
    const own = events.filter((entry) => entry[0] === stockItem.code).sort((a, b) => b[1] - a[1]);
    const change = own.reduce((sum, entry) => sum + entry[3], 0);
    let running = Math.max(0, stockItem.quantity - change); // opening stock
    const receiptDay = (own[0] ? own[0][1] : 30) + 5;
    transactions.push({ itemId: stockItem._id, type: 'in', quantity: running, previousQuantity: 0, newQuantity: running, difference: running, date: ago(receiptDay), party: 'Opening delivery', supplierId: stockItem.supplierId, responsibleUser: stock, notes: 'Opening stock (demo)', referenceNumber: `GRN-${++refNo}` });
    for (const [, days, type, delta, party] of own) {
      const previous = running;
      running = Math.max(0, running + delta);
      const base = { itemId: stockItem._id, type, date: ago(days), responsibleUser: stock, referenceNumber: `${type === 'in' ? 'GRN' : 'REQ'}-${++refNo}` };
      if (type === 'in') transactions.push({ ...base, quantity: delta, previousQuantity: previous, newQuantity: running, difference: delta, party, supplierId: stockItem.supplierId, notes: 'Restock (demo)' });
      else if (type === 'adjustment') transactions.push({ ...base, quantity: running, previousQuantity: previous, newQuantity: running, difference: delta, notes: party });
      else if (type === 'transfer') transactions.push({ ...base, quantity: 3, previousQuantity: previous, newQuantity: running, difference: 0, fromLocation: 'Main Store', toLocation: 'ICT Lab Store', notes: 'Transfer for ICT Lab setup (demo)' });
      else {
        transactions.push({ ...base, quantity: Math.abs(delta), previousQuantity: previous, newQuantity: running, difference: delta, party, notes: type === 'out' ? `Issued to ${party} (demo)` : `${type} - ${party} (demo)` });
        if (type === 'damaged') damagedRows.push({ itemId: stockItem._id, quantity: Math.abs(delta), reason: party.includes('Water') ? 'Water Damage' : 'Physical Damage', date: ago(days), reportedBy: stock, notes: party, status: 'reported' });
        if (type === 'removed') removedRows.push({ item: stockItem, days, quantity: Math.abs(delta), reason: party, remaining: running });
      }
    }
  }
  await StockTransaction.insertMany(transactions);
  await DamagedStock.insertMany(damagedRows);
  await DisposedStock.insertMany([
    ...removedRows.map((row) => ({ itemId: row.item._id, itemName: row.item.name, quantityRemoved: row.quantity, remainingQuantity: row.remaining, reason: row.reason, status: 'approved', date: ago(row.days), requestedBy: stock, approvedBy: director, approvedByName: 'Bro. Alphonse Ntawuruhunga', approvalNotes: 'Approved. Record kept.', responsibleUser: stock, notes: 'Expired stock removed (demo)' })),
    { itemId: item('FD-007')._id, itemName: item('FD-007').name, quantityRemoved: 4, remainingQuantity: item('FD-007').quantity - 4, reason: 'Expired', status: 'pending', date: ago(1), requestedBy: stock, responsibleUser: stock, notes: 'Close to expiry date - waiting for approval (demo)' },
    { itemId: item('FD-003')._id, itemName: item('FD-003').name, quantityRemoved: 20, remainingQuantity: item('FD-003').quantity - 20, reason: 'Damaged', status: 'pending', date: ago(2), requestedBy: stock, responsibleUser: stock, notes: 'Rain got into the store (demo)' },
    { itemId: item('SM-004')._id, itemName: item('SM-004').name, quantityRemoved: 3, remainingQuantity: item('SM-004').quantity - 3, reason: 'Lost', status: 'rejected', date: ago(12), requestedBy: stock, approvedBy: director, approvedByName: 'Bro. Alphonse Ntawuruhunga', rejectionReason: 'Please search the Admin Store again before writing off.', responsibleUser: stock, notes: 'Markers not found (demo)' },
  ]);

  const recon = (title, location, status, scheduled, codes, extra = {}) => {
    const lines = codes.map((code, index) => {
      const system = item(code).quantity;
      const physical = Math.max(0, system + [0, -3, 2, 0, -1][index % 5]);
      const variance = physical - system;
      return { itemId: item(code)._id, systemQuantity: system, physicalQuantity: physical, variance, variancePercentage: system ? Math.round((variance / system) * 1000) / 10 : 0, adjustmentNeeded: variance !== 0, notes: variance ? 'Count differs from system' : '' };
    });
    return { title, location, status, scheduledDate: scheduled, createdBy: stock, items: lines, totalItems: lines.length, totalVariances: lines.filter((line) => line.variance !== 0).length, ...extra };
  };
  await StockReconciliation.insertMany([
    recon('Monthly count - Kitchen Store (last month)', 'Kitchen Store', 'completed', ago(30), ['FD-001', 'FD-002', 'FD-004', 'FD-005'], { startedAt: ago(30), completedAt: ago(29), approvedBy: director, approvalNotes: 'Variances explained and approved.' }),
    recon('Monthly count - Kitchen Store', 'Kitchen Store', 'pending-approval', ago(2), ['FD-001', 'FD-003', 'FD-006', 'FD-009'], { startedAt: ago(2), completedAt: ago(1) }),
    recon('Termly count - ICT Lab Store', 'ICT Lab Store', 'in-progress', ago(0), ['SM-006', 'SM-007'], { startedAt: new Date() }),
    recon('Planned count - Admin Store', 'Admin Store', 'planned', ahead(6), ['SM-002', 'SM-004', 'SM-005']),
  ]);

  await item('SM-015').updateOne({ $set: { active: false } });
  await StockArchiveRequest.insertMany([
    { itemId: item('SM-013')._id, itemName: item('SM-013').name, itemCode: 'SM-013', reason: 'Old curriculum - no longer used', notes: 'Zero quantity, safe to archive.', status: 'pending', requestedBy: stock },
    { itemId: item('SM-015')._id, itemName: item('SM-015').name, itemCode: 'SM-015', reason: 'Discontinued item', status: 'approved', requestedBy: stock, reviewedBy: director, reviewedAt: ago(4), approvalNotes: 'Approved.' },
    { itemId: item('SM-014')._id, itemName: item('SM-014').name, itemCode: 'SM-014', reason: 'Not needed', status: 'rejected', requestedBy: stock, reviewedBy: director, reviewedAt: ago(9), rejectionReason: 'Still needed for exams. Please restock instead.' },
  ]);

  // ---------- Equipment ----------
  const gear = await Equipment.insertMany([
    { assetNumber: 'LAP-002', name: 'ICT Lab Laptop 02', type: 'laptop', brand: 'Dell', model: 'Latitude 5420', serialNumber: 'RG-LAP-002', location: 'ICT Lab', condition: 'good', status: 'assigned', purchaseDate: ago(400), purchaseCost: 650000, warrantyExpiry: ahead(320), currentAssignee: { userName: 'Mr. Theogene Rukundo', assignedAt: ago(20) }, assignmentHistory: [{ userName: 'Mr. Theogene Rukundo', assignedAt: ago(20), notes: 'For ICT lessons' }] },
    { assetNumber: 'LAP-003', name: 'ICT Lab Laptop 03', type: 'laptop', brand: 'HP', model: 'ProBook 450', serialNumber: 'RG-LAP-003', location: 'ICT Lab', condition: 'fair', status: 'under_maintenance', purchaseDate: ago(700), purchaseCost: 580000, warrantyExpiry: ago(30), maintenanceRecords: [{ date: ago(3), type: 'repair', description: 'Battery replacement', cost: 45000, performedBy: 'TechPro Rwanda', nextDueDate: ahead(180), recordedBy: equipmentUser }] },
    { assetNumber: 'DES-002', name: 'Library Desktop', type: 'desktop', brand: 'Lenovo', model: 'ThinkCentre M70', serialNumber: 'RG-DES-002', location: 'Library', condition: 'good', status: 'assigned', purchaseDate: ago(500), purchaseCost: 520000, warrantyExpiry: ahead(60), currentAssignee: { userName: 'Library', assignedAt: ago(200) }, assignmentHistory: [{ userName: 'Library', assignedAt: ago(200) }], maintenanceRecords: [{ date: ago(60), type: 'inspection', description: 'Routine check and cleaning', cost: 0, performedBy: 'School IT', recordedBy: equipmentUser }] },
    { assetNumber: 'PRN-001', name: 'Office Laser Printer', type: 'printer', brand: 'Canon', model: 'LBP6030', serialNumber: 'RG-PRN-001', location: 'Administration Office', condition: 'good', status: 'available', purchaseDate: ago(300), purchaseCost: 210000, warrantyExpiry: ahead(65) },
    { assetNumber: 'PRN-002', name: 'Workshop Printer', type: 'printer', brand: 'Epson', model: 'L3150', serialNumber: 'RG-PRN-002', location: 'Workshop Office', condition: 'damaged', status: 'available', purchaseDate: ago(900), purchaseCost: 260000, notes: 'Paper feed broken.' },
    { assetNumber: 'PRJ-001', name: 'Classroom Projector A', type: 'projector', brand: 'Epson', model: 'EB-X06', serialNumber: 'RG-PRJ-001', location: 'Classroom A', condition: 'good', status: 'assigned', purchaseDate: ago(250), purchaseCost: 480000, warrantyExpiry: ahead(115), currentAssignee: { userName: 'Classroom A', assignedAt: ago(250) }, assignmentHistory: [{ userName: 'Classroom A', assignedAt: ago(250) }] },
    { assetNumber: 'PRJ-002', name: 'Hall Projector', type: 'projector', brand: 'BenQ', model: 'MS550', serialNumber: 'RG-PRJ-002', location: 'Assembly Hall', condition: 'under_repair', status: 'under_maintenance', purchaseDate: ago(800), purchaseCost: 450000, maintenanceRecords: [{ date: ago(6), type: 'repair', description: 'Lamp replacement', cost: 90000, performedBy: 'TechPro Rwanda', nextDueDate: ahead(30), recordedBy: equipmentUser }] },
    { assetNumber: 'NET-001', name: 'Core Network Switch (24 port)', type: 'network', brand: 'TP-Link', model: 'TL-SG1024', serialNumber: 'RG-NET-001', location: 'Server Room', condition: 'good', status: 'assigned', purchaseDate: ago(600), purchaseCost: 190000, currentAssignee: { userName: 'IT Department', assignedAt: ago(590) }, assignmentHistory: [{ userName: 'IT Department', assignedAt: ago(590) }] },
    { assetNumber: 'NET-002', name: 'Wi-Fi Access Point', type: 'network', brand: 'Ubiquiti', model: 'UniFi AC Lite', serialNumber: 'RG-NET-002', location: 'Library', condition: 'new', status: 'available', purchaseDate: ago(30), purchaseCost: 160000, warrantyExpiry: ahead(700) },
    { assetNumber: 'ELM-001', name: 'Electrical Training Board', type: 'electrical_material', brand: 'Local make', model: 'ETB-3', serialNumber: 'RG-ELM-001', location: 'Electrical Workshop', condition: 'good', status: 'assigned', purchaseDate: ago(900), purchaseCost: 350000, currentAssignee: { userName: 'Electrical Department', assignedAt: ago(880) }, assignmentHistory: [{ userName: 'Electrical Department', assignedAt: ago(880) }] },
    { assetNumber: 'OTH-001', name: 'Public Address System', type: 'other', brand: 'Behringer', model: 'PMP500', serialNumber: 'RG-OTH-001', location: 'Assembly Hall', condition: 'good', status: 'available', purchaseDate: ago(450), purchaseCost: 420000 },
    { assetNumber: 'DES-003', name: 'Old Reception Desktop', type: 'desktop', brand: 'Dell', model: 'OptiPlex 380', serialNumber: 'RG-DES-003', location: 'Store', condition: 'retired', status: 'retired', purchaseDate: ago(2500), purchaseCost: 300000, notes: 'Retired after approval.' },
    { assetNumber: 'LAP-004', name: 'Old Teacher Laptop', type: 'laptop', brand: 'Toshiba', model: 'Satellite C50', serialNumber: 'RG-LAP-004', location: 'Store', condition: 'retired', status: 'retired', active: false, purchaseDate: ago(2800), purchaseCost: 350000, notes: 'Archived after approval.' },
    { assetNumber: 'LAP-005', name: 'Damaged Lab Laptop', type: 'laptop', brand: 'Acer', model: 'Aspire 3', serialNumber: 'RG-LAP-005', location: 'ICT Lab', condition: 'damaged', status: 'available', purchaseDate: ago(1100), purchaseCost: 400000, notes: 'Screen cracked, board failing.' },
  ]);
  const unit = (assetNumber) => gear.find((entry) => entry.assetNumber === assetNumber);
  const asset = (assetNumber) => ({ equipmentId: unit(assetNumber)._id, assetNumber, equipmentName: unit(assetNumber).name });
  await EquipmentRetirementRequest.insertMany([
    { ...asset('LAP-005'), reason: 'Screen cracked and motherboard failing; repair costs more than a new unit.', notes: 'Photos kept by IT.', status: 'pending', requestedBy: equipmentUser },
    { ...asset('DES-003'), reason: 'Too old to run the current software.', status: 'approved', requestedBy: equipmentUser, reviewedBy: director, reviewedAt: ago(15) },
    { ...asset('PRN-002'), reason: 'Printer feed is broken.', status: 'rejected', requestedBy: equipmentUser, reviewedBy: director, reviewedAt: ago(5), rejectionReason: 'Try a repair quote first.' },
  ]);
  await EquipmentArchiveRequest.insertMany([
    { ...asset('DES-003'), reason: 'Retired item, remove from active lists.', status: 'pending', requestedBy: equipmentUser },
    { ...asset('LAP-004'), reason: 'Retired long ago; keep only as a record.', status: 'approved', requestedBy: equipmentUser, reviewedBy: director, reviewedAt: ago(10) },
    { ...asset('PRJ-002'), reason: 'Wrong entry', status: 'rejected', requestedBy: equipmentUser, reviewedBy: director, reviewedAt: ago(7), rejectionReason: 'Projector is still in use.' },
  ]);

  // ---------- Events ----------
  await Event.insertMany([
    { title: 'Parents Meeting - Term 3', slug: 'parents-meeting-term-3', description: 'Meeting with parents to share academic progress and school plans.', startDate: ahead(9), endDate: ahead(9), location: 'Assembly Hall', published: true, featured: true, createdBy: admin },
    { title: 'TVET Skills Exhibition', slug: 'tvet-skills-exhibition', description: 'Students show projects from Electrical, Welding, Construction and Automobile departments.', startDate: ahead(30), location: 'School Workshops', published: true, createdBy: director },
    { title: 'Inter-School Football Tournament', slug: 'inter-school-football-tournament', description: 'Friendly tournament with neighbouring schools.', startDate: ahead(16), location: 'School Playground', published: true, createdBy: librarian },
    { title: 'Library Reading Week', slug: 'library-reading-week', description: 'A week of reading challenges and book displays.', startDate: ahead(3), endDate: ahead(7), location: 'School Library', published: true, createdBy: librarian },
    { title: 'Staff Training on Safety', slug: 'staff-training-on-safety', description: 'Workshop safety refresher for all instructors. (Draft - not yet published)', startDate: ahead(21), location: 'Conference Room', published: false, createdBy: admin },
    { title: 'Graduation Ceremony 2026', slug: 'graduation-ceremony-2026', description: 'Celebrating our graduates.', startDate: ago(45), location: 'Assembly Hall', published: true, createdBy: admin },
    { title: 'Career Day', slug: 'career-day', description: 'Employers and alumni share job opportunities.', startDate: ago(20), location: 'Assembly Hall', published: true, createdBy: director },
  ]);

  // ---------- Admissions (public applications) ----------
  const year = String(new Date().getFullYear());
  const pdf = 'data:application/pdf;base64,JVBERi0xLjQKJSBEZW1vIGxldHRlcgolJUVPRgo=';
  const programs = [['electrical-technology', 'Electrical Technology'], ['welding-fabrication', 'Welding & Fabrication'], ['construction', 'Construction'], ['automobile-mechanics', 'Automobile Mechanics']];
  const applicants = [
    ['Jean Paul Nshimiyimana', 'male', 'Nyabihu', 'new'], ['Eric Hakizimana', 'male', 'Rubavu', 'new'], ['Patrick Uwizeye', 'male', 'Musanze', 'new'], ['Emmanuel Ntakirutimana', 'male', 'Rutsiro', 'new'],
    ['Samuel Nkurunziza', 'male', 'Nyabihu', 'reviewed'], ['Olivier Habiyaremye', 'male', 'Gicumbi', 'reviewed'], ['David Munyakazi', 'male', 'Rubavu', 'reviewed'],
    ['Innocent Nzeyimana', 'male', 'Nyabihu', 'accepted'], ['Fabrice Ishimwe', 'male', 'Musanze', 'accepted'], ['Theogene Niyitegeka', 'male', 'Rubavu', 'accepted'], ['Alice Mukamazimpaka', 'female', 'Nyabihu', 'accepted'],
    ['Claude Twizeyimana', 'male', 'Rutsiro', 'declined'], ['Vincent Bizimungu', 'male', 'Gicumbi', 'declined'], ['Marie Claire Uwase', 'female', 'Musanze', 'new'],
  ];
  for (const [index, [fullName, gender, district, status]] of applicants.entries()) {
    const [program, programLabel] = programs[index % programs.length];
    const reviewed = status !== 'new';
    await Admission.create({
      fullName, email: `${fullName.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`, phone: `07881${String(20000 + index * 137).slice(0, 5)}`,
      program, programLabel, dateOfBirth: `${2007 + (index % 3)}-0${1 + (index % 9)}-1${index % 9}`, gender, educationLevel: 'ordinary-level', district,
      previousSchool: `${district} Secondary School`, guardianName: `Parent of ${fullName.split(' ')[0]}`, guardianPhone: `07882${String(30000 + index * 211).slice(0, 5)}`, guardianRelationship: 'Parent',
      intakeYear: year, privacyConsent: true, message: 'I would like to join the school and learn a technical skill.', status, submittedAt: ago(25 - index),
      ...(reviewed ? { reviewedAt: ago(20 - index), reviewedBy: director, reviewFeedback: status === 'declined' ? 'Sorry, the class is full this year. Please apply again next intake.' : status === 'accepted' ? 'Congratulations! Please bring your documents on the reporting day.' : 'Application received and under review.' } : {}),
      ...(status === 'accepted' && index % 2 === 0 ? { adminAttachment: pdf, adminAttachmentName: 'admission-letter.pdf' } : {}),
    });
  }

  // ---------- Contact messages ----------
  await ContactMessage.insertMany([
    { name: 'Marie Uwimana', email: 'marie.uwimana@example.com', subject: 'Admission requirements', message: 'Hello, what documents are needed for admission to Electrical Technology?', status: 'new' },
    { name: 'Jean Damascene', email: 'j.damascene@example.com', subject: 'School fees', message: 'Please share the school fees and boarding costs for the next term.', status: 'new' },
    { name: 'Rwanda Builders Ltd', email: 'hr@rwandabuilders.rw', subject: 'Internship placement', message: 'We would like to host two Construction students for internships.', status: 'new' },
    { name: 'Immaculee Mukarugwiza', email: 'immaculee@example.com', subject: 'Visit the school', message: 'Can parents visit the workshops on a Saturday?', status: 'read' },
    { name: 'Patrick Habimana', email: 'p.habimana@example.com', subject: 'Donation of books', message: 'I would like to donate technical books to the library.', status: 'read' },
    { name: 'Anonymous Visitor', email: 'visitor@example.com', subject: 'Website feedback', message: 'The website is clear and easy to use. Thank you!', status: 'read' },
  ]);

  // ---------- Notifications, audit log, reports ----------
  const notes = (userId, list) => list.map(([title, message, type, module, link, read, days]) => ({ userId, title, message, type, module, link, read, createdAt: ago(days), updatedAt: ago(days) }));
  await Notification.insertMany([
    ...notes(admin, [['New application received', 'Marie Claire Uwase applied for Construction.', 'info', 'Admissions', '/management/applications', false, 0], ['Backup completed', 'The nightly database backup finished successfully.', 'success', 'System', null, true, 1], ['New contact message', 'Marie Uwimana sent a message about admission.', 'info', 'Website', null, false, 1], ['User account inactive', 'Eric Niyonzima was set to inactive.', 'warning', 'Users', null, true, 6]]),
    ...notes(librarian, [['Overdue books', '5 books are overdue. Please remind the borrowers.', 'warning', 'Library', '/library/borrowing-history', false, 0], ['Book returned', 'Circuit Theory was returned on time.', 'success', 'Library', null, true, 2], ['Low copies', 'Some popular books have only one copy left.', 'info', 'Library', null, false, 3]]),
    ...notes(stock, [['Low stock', 'Maize Flour, Sugar and Cassava Flour are below the minimum level.', 'warning', 'Stock', '/stock/items', false, 0], ['Food expiring soon', 'Milk Powder and Maize Flour expire within 30 days.', 'danger', 'Stock', '/stock/items', false, 0], ['Archive request pending', 'Your request for Old Exercise Books (A5) is waiting for management.', 'info', 'Stock', '/stock/archive-requests', true, 1], ['Disposal request rejected', 'Whiteboard Markers write-off was rejected.', 'warning', 'Stock', null, true, 12]]),
    ...notes(equipmentUser, [['Maintenance due', 'Classroom projector warranty ends soon.', 'warning', 'Equipment', null, false, 1], ['Retirement request pending', 'Damaged Lab Laptop is waiting for approval.', 'info', 'Equipment', null, true, 2]]),
    ...notes(director, [['Approvals waiting', '2 stock disposals, 1 reconciliation, 1 stock archive and 2 equipment requests need your decision.', 'warning', 'Approvals', '/management/approvals', false, 0], ['New applications', '5 new admission applications this week.', 'info', 'Admissions', '/management/applications', false, 1], ['Report ready', 'Monthly stock report was generated.', 'success', 'Reports', null, true, 4]]),
  ], NO_STAMPS);
  const by = [[admin, 'System Administrator'], [librarian, 'Librarian'], [stock, 'Stock Manager'], [equipmentUser, 'Equipment Manager'], [director, 'Bro. Alphonse Ntawuruhunga']];
  const logRows = [
    ['User signed in', 'Auth', 'Signed in successfully', 0], ['Book issued', 'Library', 'Issued "Circuit Theory" to Jean Claude Habimana', 0], ['Stock item created', 'Stock', 'Created stock item SM-012 Cement', 1],
    ['Stock in recorded', 'Stock', 'Received 400 kg of Rice', 20], ['Application status updated', 'Admissions', 'Application accepted for Innocent Nzeyimana', 3], ['Equipment assigned', 'Equipment', 'Assigned ICT Lab Laptop 02 to Mr. Theogene Rukundo', 20],
    ['Website content updated', 'Website', 'Updated the home page hero text', 2], ['User created', 'Users', 'Created account for Claudine Mukamana', 8], ['Stock archive approved', 'Stock', 'Approved archive for SM-015 Wall Chart', 4],
    ['Book returned', 'Library', 'Returned "Basic Welding Skills"', 2], ['Reconciliation completed', 'Stock', 'Kitchen Store count completed', 1], ['Equipment retired', 'Equipment', 'Retired DES-003 Old Reception Desktop', 15],
    ['Event published', 'Events', 'Published "Parents Meeting - Term 3"', 5], ['Disposal rejected', 'Stock', 'Rejected write-off of Whiteboard Markers', 12], ['Password changed', 'Auth', 'Changed own password', 18],
    ['Loan overdue reminder', 'Library', 'Sent reminders for overdue loans', 1], ['Damaged stock reported', 'Stock', 'Reported 6 Safety Gloves damaged by water', 8], ['Equipment maintenance', 'Equipment', 'Recorded battery replacement for LAP-003', 3],
  ];
  await AuditLog.insertMany(logRows.map(([action, module, description, days], index) => {
    const [userId, userName] = by[index % by.length];
    return { userId, userName, action, module, description, method: 'POST', endpoint: `/api/${module.toLowerCase()}`, ipAddress: '127.0.0.1', userAgent: 'Demo data', status: action.includes('rejected') ? 'warning' : 'success', createdAt: ago(days), updatedAt: ago(days) };
  }), NO_STAMPS);
  await Report.insertMany([
    { name: 'Monthly stock report', type: 'stock', generatedBy: stock, filters: { period: 'last-30-days' } },
    { name: 'Library circulation summary', type: 'library', generatedBy: librarian, filters: { period: 'this-term' } },
    { name: 'Equipment inventory', type: 'equipment', generatedBy: equipmentUser, filters: { status: 'all' } },
    { name: 'Admissions overview', type: 'admissions', generatedBy: director, filters: { intakeYear: year } },
  ]);

  const counts = await Promise.all([Book.countDocuments(), Loan.countDocuments(), StockItem.countDocuments(), StockTransaction.countDocuments(), Equipment.countDocuments(), Admission.countDocuments()]);
  return `Demo data added: ${counts[0]} books, ${counts[1]} loans, ${counts[2]} stock items, ${counts[3]} stock movements, ${counts[4]} equipment, ${counts[5]} applications, plus suppliers, approvals, events, messages, notifications, logs and reports.`;
}
