import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/tables/DataTable';
import { SearchBar } from '../../components/common/SearchBar';
import { StatusBadge } from '../../components/common/Badge';
import IconButton from '../../components/common/IconButton';
import ConfirmModal from '../../components/modals/ConfirmModal';
import { EmptyState } from '../../components/feedback/States';
import ViewOnlyBanner from '../../components/feedback/ViewOnlyBanner';
import Alert from '../../components/feedback/Alert';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { ROLES } from '../../data/roles';
import { useToast } from '../../context/ToastContext';
import { useNotifications } from '../../context/NotificationContext';
import { getLoans, refreshLibrary, returnBook, daysOverdue, getLibraryError } from '../../services/bookService';

export default function BorrowedBooks() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const { viewOnly } = useModuleAccess(ROLES.LIBRARIAN);
  const [loans, setLoans] = useState(() => getLoans().filter((l) => l.status !== 'returned'));
  const [search, setSearch] = useState('');
  const [confirmLoan, setConfirmLoan] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [loadError, setLoadError] = useState(getLibraryError());

  const refresh = () => { setLoans(getLoans().filter((l) => l.status !== 'returned')); setLoadError(getLibraryError()); };
  const onError = (e) => setLoadError(e.detail);
  useEffect(() => {
    window.addEventListener('rg:library-updated', refresh);
    window.addEventListener('rg:library-error', onError);
    refreshLibrary().catch(() => {});
    return () => {
      window.removeEventListener('rg:library-updated', refresh);
      window.removeEventListener('rg:library-error', onError);
    };
  }, []);

  const filtered = useMemo(() => {
    return loans.filter(
      (l) => !search || l.bookTitle.toLowerCase().includes(search.toLowerCase()) || l.borrower.toLowerCase().includes(search.toLowerCase())
    );
  }, [loans, search]);

  const handleReturn = () => {
    if (!confirmLoan) return;
    setProcessing(true);
    setTimeout(async () => {
      const result = await returnBook(confirmLoan.id);
      setProcessing(false);
      if (!result.success) { showToast(result.error, 'error'); return; }
      showToast(`"${confirmLoan.bookTitle}" returned successfully.`, 'success');
      addNotification({
        type: 'borrow',
        message: `"${confirmLoan.bookTitle}" was returned by ${confirmLoan.borrower}.`,
        to: '/library/history',
      });
      refresh();
      setConfirmLoan(null);
    }, 400);
  };

  const columns = [
    { key: 'borrower', header: 'Borrower' },
    { key: 'bookTitle', header: 'Book' },
    { key: 'borrowDate', header: 'Borrowed' },
    { key: 'dueDate', header: 'Due Date' },
    { key: 'status', header: 'Status', render: (l) => <StatusBadge status={daysOverdue(l.dueDate) > 0 ? 'overdue' : 'borrowed'} /> },
  ];
  if (!viewOnly) {
    columns.push({
      key: 'actions',
      header: 'Actions',
      render: (l) => <IconButton icon={RotateCcw} label={`Return ${l.bookTitle}`} onClick={() => setConfirmLoan(l)} />,
    });
  }

  return (
    <div>
      <PageHeader
        title="Borrowed Books"
        description="Books currently out on loan."
        breadcrumb={[{ label: 'Library', to: '/library' }, { label: 'Borrowed Books' }]}
      />
      {viewOnly && <ViewOnlyBanner module="Library MIS" />}
      {loadError && <Alert type="error" title="Couldn't load borrowed books" className="mb-4">{loadError}</Alert>}
      <SearchBar value={search} onChange={setSearch} placeholder="Search by borrower or book…" className="mb-4 max-w-sm" />
      <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)]">
        <DataTable
          columns={columns}
          data={filtered}
          emptyState={<EmptyState title="No borrowed books" message="All copies are currently available." actionLabel="View Books" onAction={() => navigate('/library/books')} />}
        />
      </div>

      <ConfirmModal
        open={!!confirmLoan}
        onClose={() => setConfirmLoan(null)}
        onConfirm={handleReturn}
        loading={processing}
        title="Return book"
        message={confirmLoan ? `Confirm that "${confirmLoan.bookTitle}" has been returned by ${confirmLoan.borrower}.` : ''}
        confirmLabel="Confirm Return"
      />
    </div>
  );
}
