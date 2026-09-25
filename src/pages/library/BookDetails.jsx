import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { BookMarked, Pencil, ArrowLeft } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import { StatusBadge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { EmptyState } from '../../components/feedback/States';
import ViewOnlyBanner from '../../components/feedback/ViewOnlyBanner';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { useApp } from '../../context/AppContext';
import { ROLES } from '../../data/roles';
import { getBookById, getLoansForBook, refreshLibrary } from '../../services/bookService';
import BorrowModal from './BorrowModal';
import BookFormModal from './BookFormModal';

export default function BookDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { viewOnly, can } = useModuleAccess(ROLES.LIBRARIAN, 'library');
  const { t } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  // Book + loans are synchronous reads from the library cache, so they are
  // computed during render; `refresh` just forces a re-render when the cache
  // changes (no duplicated state to keep in sync with an effect).
  const [, setTick] = useState(0);
  const refresh = () => setTick((n) => n + 1);
  const book = getBookById(id);
  const loans = getLoansForBook(id);
  const [borrowOpen, setBorrowOpen] = useState(searchParams.get('borrow') === '1');
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    const handleUpdate = () => setTick((n) => n + 1);
    window.addEventListener('rg:library-updated', handleUpdate);
    refreshLibrary().catch(() => {});
    return () => window.removeEventListener('rg:library-updated', handleUpdate);
  }, [id]);

  if (!book) return <Navigate to="/library/books" replace />;

  const currentBorrowers = loans.filter((l) => l.status !== 'returned');

  return (
    <div>
      <PageHeader
        title={book.title}
        description={t('bookByAuthor', { author: book.author })}
        breadcrumb={[{ label: t('library'), to: '/library' }, { label: t('books'), to: '/library/books' }, { label: book.title }]}
        actions={
          (can('library.books.update') || can('library.borrow')) && (
            <>
              {can('library.books.update') && <Button variant="secondary" icon={Pencil} onClick={() => setEditOpen(true)}>{t('editBook')}</Button>}
              {can('library.borrow') && <Button icon={BookMarked} onClick={() => { setSearchParams({}); setBorrowOpen(true); }}>{t('borrowBook')}</Button>}
            </>
          )
        }
      />

      {viewOnly && <ViewOnlyBanner module="Library MIS" />}

      <div className="grid lg:grid-cols-3 gap-5 mb-6">
        <div className="lg:col-span-2 bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-6">
          <div className="flex gap-5">
            <div className="w-24 h-32 rounded-lg overflow-hidden shrink-0 bg-[var(--color-soft-gray)] border border-[var(--color-border-gray)]">
              {book.coverImage ? (
                <img src={book.coverImage} alt={t('coverOfBook', { title: book.title })} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--color-mid-gray)]">
                  <BookMarked className="w-6 h-6" aria-hidden="true" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-4">
                <StatusBadge status={book.availableCopies > 0 ? 'available' : 'borrowed'} label={book.availableCopies > 0 ? t('available') : t('fullyBorrowed')} />
                <span className="text-xs text-[var(--color-mid-gray)]">{t('bookCode')}: {book.bookCode}</span>
              </div>
              <p className="text-sm text-[var(--color-dark-gray)] leading-relaxed">{book.description || t('noDescriptionProvided')}</p>
            </div>
          </div>
          <dl className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-[var(--color-border-gray)]">
            <div><dt className="text-xs text-[var(--color-mid-gray)]">{t('category')}</dt><dd className="font-medium text-[var(--color-dark-gray)] mt-0.5">{t(`bookCategory.${book.category}`)}</dd></div>
            <div><dt className="text-xs text-[var(--color-mid-gray)]">{t('totalCopies')}</dt><dd className="font-medium text-[var(--color-dark-gray)] mt-0.5">{book.totalCopies}</dd></div>
            <div><dt className="text-xs text-[var(--color-mid-gray)]">{t('available')}</dt><dd className="font-medium text-[var(--color-dark-gray)] mt-0.5">{book.availableCopies}</dd></div>
          </dl>
        </div>

        <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-6">
          <p className="font-display font-semibold text-[var(--color-dark-gray)] mb-3">{t('currentBorrowers')}</p>
          {currentBorrowers.length === 0 ? (
            <p className="text-sm text-[var(--color-mid-gray)]">{t('noCopiesBorrowed')}</p>
          ) : (
            <ul className="space-y-2.5">
              {currentBorrowers.map((l) => (
                <li key={l.id} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--color-dark-gray)]">{l.borrower}</span>
                  <StatusBadge status={l.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-6">
        <p className="font-display font-semibold text-[var(--color-dark-gray)] mb-3">{t('borrowingHistory')}</p>
        {loans.length === 0 ? (
          <EmptyState title={t('noBorrowingHistory')} message={t('bookNotBorrowed')} />
        ) : (
          <div className="table-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border-gray)] text-xs uppercase text-[var(--color-mid-gray)]">
                  <th className="text-left py-2 pr-4">{t('borrowedBy')}</th>
                  <th className="text-left py-2 pr-4">{t('borrowDate')}</th>
                  <th className="text-left py-2 pr-4">{t('due')}</th>
                  <th className="text-left py-2 pr-4">{t('returnedOn')}</th>
                  <th className="text-left py-2">{t('status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-gray)]">
                {loans.map((l) => (
                  <tr key={l.id}>
                    <td className="py-2.5 pr-4">{l.borrower}</td>
                    <td className="py-2.5 pr-4">{l.borrowDate}</td>
                    <td className="py-2.5 pr-4">{l.dueDate}</td>
                    <td className="py-2.5 pr-4">{l.returnDate || '—'}</td>
                    <td className="py-2.5"><StatusBadge status={l.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/library/books')} className="mt-5">
        {t('backToBooks')}
      </Button>

      {can('library.borrow') && <BorrowModal open={borrowOpen} onClose={() => setBorrowOpen(false)} book={book} onBorrowed={() => { refresh(); setBorrowOpen(false); }} />}
      {can('library.books.update') && <BookFormModal open={editOpen} onClose={() => setEditOpen(false)} book={book} onSaved={() => { refresh(); setEditOpen(false); }} />}
    </div>
  );
}
