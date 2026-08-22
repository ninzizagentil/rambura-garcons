/**
 * CRITICAL STOCK RULE — never broken anywhere in the app:
 * the Stock category must contain ONLY "Foods" and "Electronic Devices".
 */
export const STOCK_CATEGORIES = ['Foods', 'Electronic Devices'];

export const STOCK_UNITS = ['kg', 'litres', 'bags', 'cartons', 'boxes', 'pieces', 'units', 'sets'];

// quantity/minLevel are tuned so several items sit at/under minimum (Low Stock),
// one sits at zero (Out of Stock), and several sit comfortably above it (Normal).
// "today" for demo purposes is 2026-08-18.
//
// `code` — short catalogue code shown in the inventory table (category prefix + index).
// `unitPrice` — RWF price per unit, used to derive each item's stock value (quantity × unitPrice).
export const SEED_ITEMS = [
  { id: 'i1', name: 'Rice', code: 'RCE-001', category: 'Foods', unit: 'kg', quantity: 40, minLevel: 50, unitPrice: 2000, description: 'Kitchen staple for student meals.' },
  { id: 'i2', name: 'Dry Beans', code: 'DBN-002', category: 'Foods', unit: 'kg', quantity: 120, minLevel: 60, unitPrice: 1500, description: 'Kitchen staple for student meals.' },
  { id: 'i3', name: 'Maize Flour', code: 'MZF-003', category: 'Foods', unit: 'kg', quantity: 25, minLevel: 40, unitPrice: 2500, description: 'Used for porridge and ugali.' },
  { id: 'i4', name: 'Cooking Oil', code: 'COL-004', category: 'Foods', unit: 'litres', quantity: 18, minLevel: 20, unitPrice: 2500, description: 'Vegetable cooking oil for the kitchen.' },
  { id: 'i5', name: 'Sugar', code: 'SGR-005', category: 'Foods', unit: 'kg', quantity: 60, minLevel: 25, unitPrice: 600, description: 'For tea and porridge.' },
  { id: 'i6', name: 'Salt', code: 'SLT-006', category: 'Foods', unit: 'kg', quantity: 30, minLevel: 10, unitPrice: 350, description: 'Cooking salt.' },
  { id: 'i7', name: 'Desktop Computers', code: 'DCP-007', category: 'Electronic Devices', unit: 'units', quantity: 22, minLevel: 5, unitPrice: 450000, description: 'ICT lab workstations.' },
  { id: 'i8', name: 'Classroom Projectors', code: 'CPJ-008', category: 'Electronic Devices', unit: 'units', quantity: 4, minLevel: 5, unitPrice: 380000, description: 'Portable projectors for teaching.' },
  { id: 'i9', name: 'Laser Printers', code: 'LPR-009', category: 'Electronic Devices', unit: 'units', quantity: 0, minLevel: 2, unitPrice: 220000, description: 'Administration office printers.' },
  { id: 'i10', name: 'UPS Backup Units', code: 'UPS-010', category: 'Electronic Devices', unit: 'units', quantity: 6, minLevel: 6, unitPrice: 95000, description: 'Power backup for server and ICT lab.' },
  { id: 'i11', name: 'Laptops', code: 'LTP-011', category: 'Electronic Devices', unit: 'units', quantity: 15, minLevel: 8, unitPrice: 520000, description: 'Staff and lab laptops.' },
  { id: 'i12', name: 'Extension Cables', code: 'EXC-012', category: 'Electronic Devices', unit: 'pieces', quantity: 9, minLevel: 10, unitPrice: 8000, description: 'Power extension cables for labs and offices.' },
];

// type: 'in' | 'out'
export const SEED_TRANSACTIONS = [
  { id: 't1', itemId: 'i1', itemName: 'Rice', category: 'Foods', type: 'in', quantity: 50, date: '2026-08-01', party: 'Kigali Grain Suppliers Ltd', responsibleUser: 'Emmanuel Nshuti', notes: 'Monthly kitchen restock.' },
  { id: 't2', itemId: 'i1', itemName: 'Rice', category: 'Foods', type: 'out', quantity: 60, date: '2026-08-10', party: 'Main Kitchen', responsibleUser: 'Emmanuel Nshuti', notes: 'Weekly meal preparation.' },
  { id: 't3', itemId: 'i3', itemName: 'Maize Flour', category: 'Foods', type: 'in', quantity: 40, date: '2026-08-02', party: 'Rambura Millers Co-op', responsibleUser: 'Emmanuel Nshuti', notes: '' },
  { id: 't4', itemId: 'i3', itemName: 'Maize Flour', category: 'Foods', type: 'out', quantity: 55, date: '2026-08-14', party: 'Main Kitchen', responsibleUser: 'Emmanuel Nshuti', notes: 'Porridge for the week.' },
  { id: 't5', itemId: 'i4', itemName: 'Cooking Oil', category: 'Foods', type: 'in', quantity: 30, date: '2026-08-03', party: 'Kigali Grain Suppliers Ltd', responsibleUser: 'Emmanuel Nshuti', notes: '' },
  { id: 't6', itemId: 'i4', itemName: 'Cooking Oil', category: 'Foods', type: 'out', quantity: 32, date: '2026-08-15', party: 'Main Kitchen', responsibleUser: 'Emmanuel Nshuti', notes: '' },
  { id: 't7', itemId: 'i8', itemName: 'Classroom Projectors', category: 'Electronic Devices', type: 'in', quantity: 6, date: '2026-07-20', party: 'TechSupply Rwanda', responsibleUser: 'Emmanuel Nshuti', notes: 'New procurement for ICT block.' },
  { id: 't8', itemId: 'i8', itemName: 'Classroom Projectors', category: 'Electronic Devices', type: 'out', quantity: 2, date: '2026-08-05', party: 'Science Block', responsibleUser: 'Emmanuel Nshuti', notes: 'Issued for exam term.' },
  { id: 't9', itemId: 'i10', itemName: 'UPS Backup Units', category: 'Electronic Devices', type: 'out', quantity: 1, date: '2026-08-11', party: 'Server Room', responsibleUser: 'Emmanuel Nshuti', notes: 'Replacement for faulty unit.' },
  { id: 't10', itemId: 'i7', itemName: 'Desktop Computers', category: 'Electronic Devices', type: 'in', quantity: 10, date: '2026-07-28', party: 'TechSupply Rwanda', responsibleUser: 'Emmanuel Nshuti', notes: 'ICT lab expansion.' },
  { id: 't11', itemId: 'i11', itemName: 'Laptops', category: 'Electronic Devices', type: 'out', quantity: 3, date: '2026-08-16', party: 'Administration Office', responsibleUser: 'Emmanuel Nshuti', notes: 'Issued to new staff.' },
  { id: 't12', itemId: 'i12', itemName: 'Extension Cables', category: 'Electronic Devices', type: 'out', quantity: 4, date: '2026-08-12', party: 'ICT Lab', responsibleUser: 'Emmanuel Nshuti', notes: '' },
];
