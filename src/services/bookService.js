import { api } from './api';
import { uploadImage } from './imageService';
import { useEffect, useState } from 'react';

let books = [];
let loans = [];
let loaded = false;
let loading;
let lastError = null;
let libraryVersion = 0;
let lastLoadedAt = 0;
const CACHE_TTL_MS = 30_000;

function normalizeBook(book) {
  const value = { ...book, id: book.id || book._id, availableCopies: book.availableCopies ?? (book.totalCopies - book.borrowedCopies) };
  // The API stores the cover as { imageUrl, publicId }; the form and cover
  // <img> tags just want the URL string.
  if (value.coverImage && typeof value.coverImage === 'object') value.coverImage = value.coverImage.imageUrl || '';
  return value;
}

function dateOnly(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function normalizeLoan(loan) {
  const value = { ...loan, id: loan.id || loan._id, bookId: loan.bookId?.id || loan.bookId?._id || loan.bookId };
  value.bookTitle = value.bookTitle || loan.bookId?.title || '';
  value.studentClassYear = value.studentClassYear || loan.studentClassYear || '';
  value.borrowDate = dateOnly(value.borrowDate);
  value.dueDate = dateOnly(value.dueDate);
  value.returnDate = dateOnly(value.returnDate);
  return value;
}

function listItems(result) {
  return Array.isArray(result?.data) ? result.data : result?.data?.items || [];
}

export async function refreshLibrary({ force = false } = {}) {
  if (!force && loaded && Date.now() - lastLoadedAt < CACHE_TTL_MS) return { books, loans };
  if (loading) return loading;
  loading = Promise.all([api.get('/library/books', { limit: 100 }), api.get('/library/loans', { limit: 100 })])
    .then(([bookResult, loanResult]) => {
      books = listItems(bookResult).map(normalizeBook);
      loans = listItems(loanResult).map(normalizeLoan);
      loaded = true;
      lastLoadedAt = Date.now();
      lastError = null;
      libraryVersion += 1;
      window.dispatchEvent(new Event('rg:library-updated'));
      return { books, loans };
    })
    .catch((error) => {
      lastError = error.message || 'Failed to load library data';
      console.error('[library] refreshLibrary failed:', error);
      window.dispatchEvent(new CustomEvent('rg:library-error', { detail: lastError }));
      throw error;
    })
    .finally(() => { loading = null; });
  return loading;
}

if (typeof window !== 'undefined') window.addEventListener('rg:authenticated', () => { refreshLibrary().catch(() => {}); });

export function getBooks() { return books; }
export async function fetchBooks({ archived = false } = {}) {
  const result = await api.get('/library/books', { limit: 100, archived: archived ? 'true' : undefined });
  return listItems(result).map(normalizeBook);
}
export function useLibraryVersion() {
  const [version, setVersion] = useState(libraryVersion);
  useEffect(() => {
    const bump = () => setVersion(libraryVersion);
    window.addEventListener('rg:library-updated', bump);
    return () => window.removeEventListener('rg:library-updated', bump);
  }, []);
  return version;
}
export function getBookById(id) { return books.find((book) => book.id === id) || null; }
export function getLoans() { return loans; }
export function getLoansForBook(bookId) { return loans.filter((loan) => loan.bookId === bookId); }
export function isLibraryLoaded() { return loaded; }
export function getLibraryError() { return lastError; }

// A freshly-picked cover comes in as a data: URL from ImageField — it has to
// be uploaded to Cloudinary first so the backend gets a real { imageUrl,
// publicId } object instead of a giant base64 string it would silently drop.
async function withUploadedCover(data) {
  const payload = { ...data };
  if (payload.coverImage?.startsWith?.('data:')) {
    payload.coverImage = await uploadImage(payload.coverImage, 'rambura-garcons/library');
  } else if (!payload.coverImage) {
    delete payload.coverImage; // don't wipe an existing cover with a blank value
  }
  return payload;
}

export async function createBook(data) {
  try { const payload = await withUploadedCover(data); const result = await api.post('/library/books', payload); await refreshLibrary({ force: true }); return { success: true, book: normalizeBook(result.data) }; }
  catch (error) { return { success: false, error: error.message }; }
}
export async function updateBook(id, updates) {
  try { const payload = await withUploadedCover(updates); await api.put(`/library/books/${id}`, payload); await refreshLibrary({ force: true }); return { success: true }; }
  catch (error) { return { success: false, error: error.message }; }
}
export async function deleteBook(id) {
  try { await api.delete(`/library/books/${id}`); await refreshLibrary({ force: true }); return { success: true }; }
  catch (error) { return { success: false, error: error.message }; }
}
export async function borrowBook(data) {
  try { const result = await api.post('/library/loans', data); await refreshLibrary({ force: true }); return { success: true, loan: normalizeLoan(result.data) }; }
  catch (error) { return { success: false, error: error.message }; }
}
export async function returnBook(id) {
  try { await api.post(`/library/loans/${id}/return`, {}); await refreshLibrary({ force: true }); return { success: true }; }
  catch (error) { return { success: false, error: error.message }; }
}
export function daysOverdue(dueDate, today = new Date()) { return Math.max(0, Math.floor((new Date(today) - new Date(dueDate)) / 86400000)); }
