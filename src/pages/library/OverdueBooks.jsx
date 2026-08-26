import { useState, useMemo, useEffect } from 'react';
import { RotateCcw, Bell } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/tables/DataTable';
import { Badge } from '../../components/common/Badge';
import IconButton from '../../components/common/IconButton';
import ConfirmModal from '../../components/modals/ConfirmModal';
import { EmptyState } from '../../components/feedback/States';
import ViewOnlyBanner from '../../components/feedback/ViewOnlyBanner';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { ROLES } from '../../data/roles';
import { useToast } from '../../context/ToastContext';
import { getLoans, refreshLibrary, returnBook, daysOverdue } from '../../services/bookService';

export default function OverdueBooks() {
  const { showToast } = useToast();
  const { viewOnly } = useModuleAccess(ROLES.LIBRARIAN);
  const [loans, setLoans] = useState(() => getLoans().filter((l) => l.status !== 'returned' && daysOverdue(l.dueDate) > 0));
  const [confirmLoan, setConfirmLoan] = useState(null);
  const [processing, setProcessing] = useState(false);

  const refresh = () => setLoans(getLoans().filter((l) => l.status !== 'returned' && daysOverdue(l.dueDate) > 0));
  useEffect(() => {
    window.addEventListener('rg:library-updated', refresh);
    refreshLibrary().catch(() => {});
    return () => window.removeEventListener('rg:library-updated', refresh);
  }, []);

  const handleReturn = () => {
    if (!confirmLoan) return;
    setProcessing(true);
    setTimeout(async () => {
      const result = await returnBook(confirmLoan.id);
      setProcessing(false);
      if (!result.success) { showToast(result.error, 'error'); return; }
      showToast(`"${confirmLoan.bookTitle}" returned successfully.`, 'success');
      refresh();
      setConfirmLoan(null);
    }, 400);
  };

  const handleNotify = (loan) => showToast(`Overdue reminder sent to ${loan.borrower}.`, 'info');

  const rows = useMemo(() => loans.map((l) => ({ ...l, overdueDays: daysOverdue(l.dueDate) })), [loans]);

  const columns = [
    { key: 'borrower', header: 'Borrower' },
    { key: 'bookTitle', header: 'Book' },
    { key: 'dueDate', header: 'Due Date' },
    { key: 'overdueDays', header: 'Days Overdue', render: (l) => <Badge tone="red">{l.overdueDays} days</Badge> },
    { key: 'status', header: 'Status', render: () => <Badge tone="red">Overdue</Badge> },
  ];
  if (!viewOnly) {
    columns.push({
      key: 'actions',
      header: 'Actions',
      render: (l) => (
        <div className="flex items-center gap-1">
          <IconButton icon={RotateCcw} label={`Return ${l.bookTitle}`} onClick={() => setConfirmLoan(l)} />
          <IconButton icon={Bell} label={`Notify ${l.borrower}`} onClick={() => handleNotify(l)} />
        </div>
      ),
    });
  }

  return (
    <div>
      <PageHeader
        title="Overdue Books"
        description="Loans past their due date."
        breadcrumb={[{ label: 'Library', to: '/library' }, { label: 'Overdue Books' }]}
      />
      {viewOnly && <ViewOnlyBanner module="Library MIS" />}      <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)]">
        <DataTable columns={columns} data={rows} emptyState={<EmptyState title="No overdue books" message="Nice — every loan is within its due date." />} />
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
