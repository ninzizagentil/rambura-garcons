import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/tables/DataTable';
import { SearchBar } from '../../components/common/SearchBar';
import { StatusBadge } from '../../components/common/Badge';
import IconButton from '../../components/common/IconButton';
import ConfirmModal from '../../components/modals/ConfirmModal';
import { EmptyState } from '../../components/feedback/States';
import { useToast } from '../../context/ToastContext';
import { getLoans, returnBook, daysOverdue } from '../../services/bookService';

export default function BorrowedBooks() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loans, setLoans] = useState(() => getLoans().filter((l) => l.status !== 'returned'));
  const [search, setSearch] = useState('');
  const [confirmLoan, setConfirmLoan] = useState(null);
  const [processing, setProcessing] = useState(false);

  const refresh = () => setLoans(getLoans().filter((l) => l.status !== 'returned'));

  const filtered = useMemo(() => {
    return loans.filter(
      (l) => !search || l.bookTitle.toLowerCase().includes(search.toLowerCase()) || l.borrower.toLowerCase().includes(search.toLowerCase())
    );
  }, [loans, search]);

  const handleReturn = () => {
    if (!confirmLoan) return;
    setProcessing(true);
    setTimeout(() => {
      returnBook(confirmLoan.id);
      setProcessing(false);
      showToast(`"${confirmLoan.bookTitle}" returned successfully.`, 'success');
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
    {
      key: 'actions',
      header: 'Actions',
      render: (l) => <IconButton icon={RotateCcw} label={`Return ${l.bookTitle}`} onClick={() => setConfirmLoan(l)} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Borrowed Books"
        description="Books currently out on loan."
        breadcrumb={[{ label: 'Library', to: '/library' }, { label: 'Borrowed Books' }]}
      />
      <SearchBar value={search} onChange={setSearch} placeholder="Search by borrower or book…" className="mb-4 max-w-sm" />
      <div className="bg-white rounded-[var(--radius-card)] border border-[var(--color-border-gray)]">
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
