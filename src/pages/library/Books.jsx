import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Pencil, BookMarked, Trash2, Download, FileSpreadsheet, Printer } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/tables/DataTable';
import { SearchBar, FilterDropdown } from '../../components/common/SearchBar';
import { StatusBadge } from '../../components/common/Badge';
import IconButton from '../../components/common/IconButton';
import Button from '../../components/common/Button';
import CsvImportButton from '../../components/common/CsvImportButton';
import ConfirmModal from '../../components/modals/ConfirmModal';
import { EmptyState } from '../../components/feedback/States';
import ViewOnlyBanner from '../../components/feedback/ViewOnlyBanner';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { ROLES } from '../../data/roles';
import { getBooks, fetchBooks, refreshLibrary, createBook, deleteBook } from '../../services/bookService';
import { BOOK_CATEGORIES } from '../../data/library';
import BookFormModal from './BookFormModal';
import BorrowModal from './BorrowModal';
import { exportToCSV, exportToExcel, parseCSV } from '../../utils/export';
import { printReport } from '../../utils/print';
import { useToast } from '../../context/ToastContext';
import { useApp } from '../../context/AppContext';

export default function Books() {
  const navigate = useNavigate();
  const { viewOnly, can } = useModuleAccess(ROLES.LIBRARIAN, 'library');
  const { showToast } = useToast();
  const { t } = useApp();
  const [books, setBooks] = useState(() => getBooks());
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [borrowBook, setBorrowBook] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showArchived, setShowArchived] = useState(false);

  const refresh = async () => {
    if (showArchived) setBooks(await fetchBooks({ archived: true }));
    else setBooks([...getBooks()]);
  };
  useEffect(() => {
    const handleUpdate = () => refresh();
    window.addEventListener('rg:library-updated', handleUpdate);
    if (showArchived) fetchBooks({ archived: true }).then(setBooks).catch(() => {});
    else refreshLibrary().catch(() => {});
    return () => window.removeEventListener('rg:library-updated', handleUpdate);
  }, [showArchived]); // eslint-disable-line react-hooks/exhaustive-deps -- refresh is recreated from the current archive filter

  const filtered = useMemo(() => {
    return books.filter((b) => {
      const matchesSearch =
        !search ||
        String(b.title || '').toLowerCase().includes(search.toLowerCase()) ||
        String(b.author || '').toLowerCase().includes(search.toLowerCase()) ||
        String(b.bookCode || '').toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !categoryFilter || b.category === categoryFilter;
      const matchesAvailability =
        !availabilityFilter ||
        (availabilityFilter === 'available' && b.availableCopies > 0) ||
        (availabilityFilter === 'unavailable' && b.availableCopies === 0);
      return matchesSearch && matchesCategory && matchesAvailability;
    });
  }, [books, search, categoryFilter, availabilityFilter]);

  const dataColumns = [
    { key: 'bookCode', header: t('bookCode') }, { key: 'title', header: t('title') }, { key: 'author', header: t('author') },
    { key: 'category', header: t('category') }, { key: 'totalCopies', header: t('totalCopies') }, { key: 'availableCopies', header: t('available') },
  ];
  const handleExport = () => { exportToCSV('library-books', dataColumns, filtered); showToast(t('libraryCsvExported'), 'success'); };
  const handleExcel = () => { exportToExcel('library-books', dataColumns, filtered); showToast(t('libraryExcelExported'), 'success'); };
  const handlePrint = () => { printReport(t('libraryBooks'), dataColumns, filtered); showToast(t('libraryPrintReportOpened'), 'success'); };
  const handleImport = async (text) => {
    const rows = parseCSV(text); let imported = 0;
    for (const row of rows) {
      if (!row.title || !row.author) continue;
      const result = await createBook({ ...row, totalCopies: Number(row.totalCopies || 1), borrowedCopies: 0 });
      if (result.success) imported += 1;
    }
    refresh(); showToast(t('booksImported', { count: imported }), imported ? 'success' : 'warning');
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    const result = await deleteBook(target.id);
    if (!result.success) { showToast(result.error, 'error'); return; }
    showToast(t('bookArchived'), 'success');
    refresh();
  };

  const categoryLabel = (category) => t(`bookCategory.${category}`);

  const columns = [
    {
      key: 'title',
      header: t('title'),
      render: (b) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-12 rounded-md overflow-hidden shrink-0 bg-[var(--color-soft-gray)] border border-[var(--color-border-gray)]">
            {b.coverImage ? (
              <img src={b.coverImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[var(--color-mid-gray)]">
                <BookMarked className="w-3.5 h-3.5" aria-hidden="true" />
              </div>
            )}
          </div>
          <span className="font-medium text-[var(--color-dark-gray)]">{b.title}</span>
        </div>
      ),
    },
    { key: 'author', header: t('author') },
    { key: 'category', header: t('category') },
    { key: 'bookCode', header: t('bookCode') },
    { key: 'totalCopies', header: t('copies') },
    { key: 'availableCopies', header: t('available') },
    { key: 'borrowedCopies', header: t('borrowed') },
    { key: 'status', header: t('status'), render: (b) => <StatusBadge status={b.availableCopies > 0 ? 'available' : 'borrowed'} label={b.availableCopies > 0 ? t('available') : t('fullyBorrowed')} /> },
    {
      key: 'actions',
      header: t('actions'),
      render: (b) => (
        <div className="flex items-center gap-1">
          <IconButton icon={Eye} label={`${t('view')} ${b.title}`} onClick={() => navigate(`/library/books/${b.id}`)} />
          {can('library.books.update') && (
            <>
              <IconButton icon={Pencil} label={`${t('edit')} ${b.title}`} onClick={() => navigate(`/library/books/${b.id}`)} />
            </>
          )}
          {can('library.borrow') && <IconButton icon={BookMarked} label={`${t('borrowBook')} ${b.title}`} onClick={() => setBorrowBook(b)} />}
          {can('library.books.delete') && <IconButton icon={Trash2} label={`${t('archiveBook')} ${b.title}`} variant="danger" onClick={(event) => { event.stopPropagation(); setDeleteTarget(b); }} />}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('books')}
        description={t('manageLibraryCatalogue')}
        breadcrumb={[{ label: t('library'), to: '/library' }, { label: t('books') }]}
        actions={<div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" icon={Download} onClick={handleExport}>{t('csv')}</Button>
          <Button variant="secondary" icon={FileSpreadsheet} onClick={handleExcel}>{t('excel')}</Button>
          <Button variant="secondary" icon={Printer} onClick={handlePrint}>{t('printPdf')}</Button>
          {can('library.books.create') && <CsvImportButton onImport={handleImport} />}
          {can('library.books.create') && <Button icon={Plus} onClick={() => setFormOpen(true)}>{t('addBook')}</Button>}
        </div>}
      />

      {viewOnly && <ViewOnlyBanner module="Library MIS" />}

      <div className="flex flex-wrap gap-3 mb-4">
        <FilterDropdown
          label={t('activeBooks')}
          value={showArchived ? 'archived' : 'active'}
          onChange={(value) => setShowArchived(value === 'archived')}
          options={[{ value: 'active', label: t('activeBooks') }, { value: 'archived', label: t('archivedBooks') }]}
        />
        <SearchBar value={search} onChange={setSearch} placeholder={t('searchByTitleAuthorCode')} className="flex-1 min-w-[220px]" />
        <FilterDropdown label={t('allCategories')} value={categoryFilter} onChange={setCategoryFilter} options={BOOK_CATEGORIES.map((c) => ({ value: c, label: categoryLabel(c) }))} />
        <FilterDropdown
          label={t('allAvailability')}
          value={availabilityFilter}
          onChange={setAvailabilityFilter}
          options={[{ value: 'available', label: t('available') }, { value: 'unavailable', label: t('fullyBorrowed') }]}
        />
      </div>

      <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)]">
        <DataTable
          columns={columns}
          data={filtered}
          onRowClick={(b) => navigate(`/library/books/${b.id}`)}
          emptyState={
            <EmptyState
              title={t('noBooksFound')}
              message={t('tryDifferentSearch')}
              actionLabel={can('library.books.create') ? t('addBook') : undefined}
              onAction={can('library.books.create') ? () => setFormOpen(true) : undefined}
            />
          }
        />
      </div>

      {(can('library.books.create') || can('library.books.update') || can('library.borrow')) && (
        <>
          {can('library.books.create') && <BookFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={() => { refresh(); setFormOpen(false); }} />}
          {can('library.borrow') && <BorrowModal open={!!borrowBook} onClose={() => setBorrowBook(null)} book={borrowBook} onBorrowed={() => { refresh(); setBorrowBook(null); }} />}
        </>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('archiveBook')}
        message={deleteTarget ? t('confirmArchiveBook', { title: deleteTarget.title }) : ''}
        confirmLabel={t('archiveBook')}
        variant="danger"
      />
    </div>
  );
}
