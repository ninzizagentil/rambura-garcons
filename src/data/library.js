export const BOOK_CATEGORIES = [
  'Electrical Technology',
  'Welding & Fabrication',
  'Construction',
  'Automobile Mechanics',
  'General Studies',
  'Reference',
];

export const SEED_BOOKS = [
  { id: 'b1', title: 'Applied Electricity Vol. 2', author: 'J. Nkurunziza', category: 'Electrical Technology', bookCode: 'ELT-002', totalCopies: 12, borrowedCopies: 5, description: 'Core reference for electrical wiring and installation practice.', seedImage: 'books/b1.svg' },
  { id: 'b2', title: 'Welding Fundamentals', author: 'P. Habimana', category: 'Welding & Fabrication', bookCode: 'WLD-014', totalCopies: 8, borrowedCopies: 2, description: 'Introductory arc and gas welding techniques.', seedImage: 'books/b2.svg' },
  { id: 'b3', title: 'Concrete Technology Basics', author: 'S. Mukashyaka', category: 'Construction', bookCode: 'CST-021', totalCopies: 10, borrowedCopies: 4, description: 'Mix design, curing, and quality control fundamentals.', seedImage: 'books/b3.svg' },
  { id: 'b4', title: 'Automotive Engine Systems', author: 'F. Nsengiyumva', category: 'Automobile Mechanics', bookCode: 'AUT-007', totalCopies: 9, borrowedCopies: 9, description: 'Combustion engine theory and diagnostics.', seedImage: 'books/b4.svg' },
  { id: 'b5', title: 'English for Technical Studies', author: 'A. Uwimana', category: 'General Studies', bookCode: 'GEN-031', totalCopies: 15, borrowedCopies: 6, description: 'Technical vocabulary and workplace communication.', seedImage: 'books/b5.svg' },
  { id: 'b6', title: 'Workshop Safety Handbook', author: 'Ministry of Education', category: 'Reference', bookCode: 'REF-004', totalCopies: 6, borrowedCopies: 1, description: 'National safety standards for TVET workshops.', seedImage: 'books/b6.svg' },
  { id: 'b7', title: 'Electrical Circuit Theory', author: 'J. Nkurunziza', category: 'Electrical Technology', bookCode: 'ELT-010', totalCopies: 10, borrowedCopies: 3, description: 'Foundational circuit analysis for beginners.', seedImage: 'books/b7.svg' },
  { id: 'b8', title: 'Structural Steel Fabrication', author: 'P. Habimana', category: 'Welding & Fabrication', bookCode: 'WLD-019', totalCopies: 7, borrowedCopies: 0, description: 'Fabrication and assembly of structural steel components.', seedImage: 'books/b8.svg' },
];

// borrowDate/dueDate are ISO date strings relative to a fixed "today" of 2026-08-18
export const SEED_LOANS = [
  { id: 'l1', bookId: 'b1', bookTitle: 'Applied Electricity Vol. 2', borrower: 'MUGISHA Eric', borrowerType: 'Student', borrowDate: '2026-08-01', dueDate: '2026-08-14', returnDate: null, status: 'overdue' },
  { id: 'l2', bookId: 'b4', bookTitle: 'Automotive Engine Systems', borrower: 'MUKAMANA Alice', borrowerType: 'Student', borrowDate: '2026-08-10', dueDate: '2026-08-24', returnDate: null, status: 'borrowed' },
  { id: 'l3', bookId: 'b2', bookTitle: 'Welding Fundamentals', borrower: 'NSABIMANA Jean', borrowerType: 'Student', borrowDate: '2026-07-20', dueDate: '2026-08-03', returnDate: null, status: 'overdue' },
  { id: 'l4', bookId: 'b3', bookTitle: 'Concrete Technology Basics', borrower: 'IRADUKUNDA Claudine', borrowerType: 'Student', borrowDate: '2026-08-12', dueDate: '2026-08-26', returnDate: null, status: 'borrowed' },
  { id: 'l5', bookId: 'b5', bookTitle: 'English for Technical Studies', borrower: 'HABIMANA Eric', borrowerType: 'Student', borrowDate: '2026-07-15', dueDate: '2026-07-29', returnDate: '2026-07-27', status: 'returned' },
  { id: 'l6', bookId: 'b1', bookTitle: 'Applied Electricity Vol. 2', borrower: 'UWASE Diane', borrowerType: 'Student', borrowDate: '2026-08-05', dueDate: '2026-08-19', returnDate: null, status: 'borrowed' },
];
