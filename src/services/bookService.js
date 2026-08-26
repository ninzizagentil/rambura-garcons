import { api } from './api';

let books = [];
let loans = [];
let loaded = false;
let loading;

function normalizeBook(book) {
  return { ...book, id: book.id || book._id, availableCopies: book.availableCopies ?? (book.totalCopies - book.borrowedCopies) };
}

function normalizeLoan(loan) {
  const value = { ...loan, id: loan.id || loan._id, bookId: loan.bookId?.id || loan.bookId?._id || loan.bookId };
  value.bookTitle = value.bookTitle || loan.bookId?.title || '';
  return value;
}

export async function refreshLibrary() {
  if (loading) return loading;
  loading = Promise.all([api.get('/library/books', { limit: 100 }), api.get('/library/loans', { limit: 100 })])
    .then(([bookResult, loanResult]) => {
      books = bookResult.data.map(normalizeBook);
      loans = loanResult.data.map(normalizeLoan);
      loaded = true;
      window.dispatchEvent(new Event('rg:library-updated'));
      return { books, loans };
    })
    .finally(() => { loading = null; });
  return loading;
}

if (typeof window !== 'undefined') window.addEventListener('rg:authenticated', () => { refreshLibrary().catch(() => {}); });

export function getBooks() { return books; }
export function getBookById(id) { return books.find((book) => book.id === id) || null; }
export function getLoans() { return loans; }
export function getLoansForBook(bookId) { return loans.filter((loan) => loan.bookId === bookId); }
export function isLibraryLoaded() { return loaded; }

export async function createBook(data) {
  try { const result = await api.post('/library/books', data); await refreshLibrary(); return { success: true, book: normalizeBook(result.data) }; }
  catch (error) { return { success: false, error: error.message }; }
}
export async function updateBook(id, updates) {
  try { await api.put(`/library/books/${id}`, updates); await refreshLibrary(); return { success: true }; }
  catch (error) { return { success: false, error: error.message }; }
}
export async function borrowBook(data) {
  try { const result = await api.post('/library/loans', data); await refreshLibrary(); return { success: true, loan: normalizeLoan(result.data) }; }
  catch (error) { return { success: false, error: error.message }; }
}
export async function returnBook(id) {
  try { await api.post(`/library/loans/${id}/return`, {}); await refreshLibrary(); return { success: true }; }
  catch (error) { return { success: false, error: error.message }; }
}
export function daysOverdue(dueDate, today = new Date()) { return Math.max(0, Math.floor((new Date(today) - new Date(dueDate)) / 86400000)); }
