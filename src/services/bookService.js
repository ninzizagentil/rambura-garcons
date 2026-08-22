import { SEED_BOOKS, SEED_LOANS } from '../data/library';
import { loadCollection, saveCollection, genId } from '../utils/storage';

const BOOKS_KEY = 'rg_books';
const LOANS_KEY = 'rg_loans';

function withAvailability(book) {
  return { ...book, availableCopies: book.totalCopies - book.borrowedCopies };
}

export function getBooks() {
  return loadCollection(BOOKS_KEY, SEED_BOOKS).map(withAvailability);
}

export function getBookById(id) {
  return getBooks().find((b) => b.id === id) || null;
}

export function createBook({ title, author, category, bookCode, description, totalCopies, coverImage }) {
  const books = loadCollection(BOOKS_KEY, SEED_BOOKS);
  const duplicate = books.some((b) => b.bookCode.toLowerCase() === bookCode.toLowerCase());
  if (duplicate) return { success: false, error: 'A book with this Book Code / ISBN already exists.' };

  const newBook = {
    id: genId('b'),
    title,
    author,
    category,
    bookCode,
    description,
    coverImage: coverImage || '',
    totalCopies: Number(totalCopies),
    borrowedCopies: 0,
  };
  const next = [newBook, ...books];
  saveCollection(BOOKS_KEY, next);
  return { success: true, book: withAvailability(newBook) };
}

export function updateBook(id, updates) {
  const books = loadCollection(BOOKS_KEY, SEED_BOOKS);
  const next = books.map((b) => (b.id === id ? { ...b, ...updates } : b));
  saveCollection(BOOKS_KEY, next);
  return { success: true };
}

export function getLoans() {
  return loadCollection(LOANS_KEY, SEED_LOANS);
}

export function getLoansForBook(bookId) {
  return getLoans().filter((l) => l.bookId === bookId);
}

export function borrowBook({ bookId, borrower, borrowerType, borrowDate, dueDate }) {
  const books = loadCollection(BOOKS_KEY, SEED_BOOKS);
  const book = books.find((b) => b.id === bookId);
  if (!book) return { success: false, error: 'Book not found.' };
  if (book.totalCopies - book.borrowedCopies <= 0) {
    return { success: false, error: 'Insufficient availability — no copies left to borrow.' };
  }

  const updatedBooks = books.map((b) => (b.id === bookId ? { ...b, borrowedCopies: b.borrowedCopies + 1 } : b));
  saveCollection(BOOKS_KEY, updatedBooks);

  const loans = loadCollection(LOANS_KEY, SEED_LOANS);
  const newLoan = {
    id: genId('l'),
    bookId,
    bookTitle: book.title,
    borrower,
    borrowerType,
    borrowDate,
    dueDate,
    returnDate: null,
    status: 'borrowed',
  };
  saveCollection(LOANS_KEY, [newLoan, ...loans]);

  return { success: true, loan: newLoan };
}

export function returnBook(loanId, { today = new Date().toISOString().slice(0, 10) } = {}) {
  const loans = loadCollection(LOANS_KEY, SEED_LOANS);
  const loan = loans.find((l) => l.id === loanId);
  if (!loan) return { success: false, error: 'Loan not found.' };

  const updatedLoans = loans.map((l) => (l.id === loanId ? { ...l, status: 'returned', returnDate: today } : l));
  saveCollection(LOANS_KEY, updatedLoans);

  const books = loadCollection(BOOKS_KEY, SEED_BOOKS);
  const updatedBooks = books.map((b) =>
    b.id === loan.bookId ? { ...b, borrowedCopies: Math.max(0, b.borrowedCopies - 1) } : b
  );
  saveCollection(BOOKS_KEY, updatedBooks);

  return { success: true };
}

export function daysOverdue(dueDate, today = new Date('2026-08-18')) {
  const due = new Date(dueDate);
  const diff = Math.floor((today - due) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}
