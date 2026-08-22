import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Pencil, BookMarked } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/tables/DataTable';
import { SearchBar, FilterDropdown } from '../../components/common/SearchBar';
import { StatusBadge } from '../../components/common/Badge';
import IconButton from '../../components/common/IconButton';
import Button from '../../components/common/Button';
import { EmptyState } from '../../components/feedback/States';
import ViewOnlyBanner from '../../components/feedback/ViewOnlyBanner';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { ROLES } from '../../data/roles';
import { getBooks } from '../../services/bookService';
import { BOOK_CATEGORIES } from '../../data/library';
import BookFormModal from './BookFormModal';

export default function Books() {
  const navigate = useNavigate();
  const { viewOnly } = useModuleAccess(ROLES.LIBRARIAN);
  const [books, setBooks] = useState(getBooks());
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  const refresh = () => setBooks(getBooks());

  const filtered = useMemo(() => {
    return books.filter((b) => {
      const matchesSearch =
        !search ||
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.author.toLowerCase().includes(search.toLowerCase()) ||
        b.bookCode.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !categoryFilter || b.category === categoryFilter;
      const matchesAvailability =
        !availabilityFilter ||
        (availabilityFilter === 'available' && b.availableCopies > 0) ||
        (availabilityFilter === 'unavailable' && b.availableCopies === 0);
      return matchesSearch && matchesCategory && matchesAvailability;
    });
  }, [books, search, categoryFilter, availabilityFilter]);

  const columns = [
    {
      key: 'title',
      header: 'Title',
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
    { key: 'author', header: 'Author' },
    { key: 'category', header: 'Category' },
    { key: 'bookCode', header: 'Book Code' },
    { key: 'totalCopies', header: 'Copies' },
    { key: 'availableCopies', header: 'Available' },
    { key: 'borrowedCopies', header: 'Borrowed' },
    { key: 'status', header: 'Status', render: (b) => <StatusBadge status={b.availableCopies > 0 ? 'available' : 'borrowed'} label={b.availableCopies > 0 ? 'Available' : 'Fully Borrowed'} /> },
    {
      key: 'actions',
      header: 'Actions',
      render: (b) => (
        <div className="flex items-center gap-1">
          <IconButton icon={Eye} label={`View ${b.title}`} onClick={() => navigate(`/library/books/${b.id}`)} />
          {!viewOnly && (
            <>
              <IconButton icon={Pencil} label={`Edit ${b.title}`} onClick={() => navigate(`/library/books/${b.id}`)} />
              <IconButton icon={BookMarked} label={`Borrow ${b.title}`} onClick={() => navigate(`/library/books/${b.id}?borrow=1`)} />
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Books"
        description="Manage the school library catalogue."
        breadcrumb={[{ label: 'Library', to: '/library' }, { label: 'Books' }]}
        actions={!viewOnly && <Button icon={Plus} onClick={() => setFormOpen(true)}>Add Book</Button>}
      />

      {viewOnly && <ViewOnlyBanner module="Library MIS" />}

      <div className="flex flex-wrap gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by title, author, or code…" className="flex-1 min-w-[220px]" />
        <FilterDropdown label="All Categories" value={categoryFilter} onChange={setCategoryFilter} options={BOOK_CATEGORIES.map((c) => ({ value: c, label: c }))} />
        <FilterDropdown
          label="All Availability"
          value={availabilityFilter}
          onChange={setAvailabilityFilter}
          options={[{ value: 'available', label: 'Available' }, { value: 'unavailable', label: 'Fully Borrowed' }]}
        />
      </div>

      <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)]">
        <DataTable
          columns={columns}
          data={filtered}
          onRowClick={(b) => navigate(`/library/books/${b.id}`)}
          emptyState={
            <EmptyState
              title="No books found"
              message="Try a different search, or add a new book to the catalogue."
              actionLabel={viewOnly ? undefined : 'Add Book'}
              onAction={viewOnly ? undefined : () => setFormOpen(true)}
            />
          }
        />
      </div>

      {!viewOnly && (
        <BookFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={() => { refresh(); setFormOpen(false); }} />
      )}
    </div>
  );
}
