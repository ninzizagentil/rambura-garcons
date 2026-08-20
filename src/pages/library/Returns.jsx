import { useState, useMemo } from 'react';
import { CheckCircle2 } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import { SearchBar } from '../../components/common/SearchBar';
import { StatusBadge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import ConfirmModal from '../../components/modals/ConfirmModal';
import { EmptyState } from '../../components/feedback/States';
import { useToast } from '../../context/ToastContext';
import { getLoans, returnBook, daysOverdue } from '../../services/bookService';

export default function Returns() {
  const { showToast } = useToast();
  const [loans, setLoans] = useState(() => getLoans().filter((l) => l.status !== 'returned'));
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [justReturned, setJustReturned] = useState(null);

  const refresh = () => setLoans(getLoans().filter((l) => l.status !== 'returned'));

  const filtered = useMemo(
    () => loans.filter((l) => !search || l.bookTitle.toLowerCase().includes(search.toLowerCase()) || l.borrower.toLowerCase().includes(search.toLowerCase())),
    [loans, search]
  );

  const handleConfirmReturn = () => {
    setProcessing(true);
    setTimeout(() => {
      returnBook(selected.id);
      setProcessing(false);
      setConfirmOpen(false);
      setJustReturned(selected);
      showToast(`"${selected.bookTitle}" returned successfully.`, 'success');
      refresh();
      setSelected(null);
    }, 400);
  };

  if (justReturned) {
    return (
      <div>
        <PageHeader title="Returns" breadcrumb={[{ label: 'Library', to: '/library' }, { label: 'Returns' }]} />
        <div className="bg-white rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-12 flex flex-col items-center text-center">
          <CheckCircle2 className="w-12 h-12 text-[var(--color-status-green)] mb-4" aria-hidden="true" />
          <p className="font-display text-lg font-semibold text-[var(--color-dark-gray)]">Return Successful</p>
          <p className="text-sm text-[var(--color-mid-gray)] mt-1">
            "{justReturned.bookTitle}" has been marked as returned by {justReturned.borrower}.
          </p>
          <Button variant="primary" className="mt-6" onClick={() => setJustReturned(null)}>Return Another Book</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Returns" description="Select a loan to process its return." breadcrumb={[{ label: 'Library', to: '/library' }, { label: 'Returns' }]} />
      <SearchBar value={search} onChange={setSearch} placeholder="Search by borrower or book…" className="mb-4 max-w-sm" />

      {filtered.length === 0 ? (
        <div className="bg-white rounded-[var(--radius-card)] border border-[var(--color-border-gray)]">
          <EmptyState title="No active loans" message="There are no borrowed books awaiting return." />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((l) => (
            <div key={l.id} className="bg-white rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-5">
              <p className="font-display font-semibold text-[var(--color-dark-gray)]">{l.bookTitle}</p>
              <p className="text-sm text-[var(--color-mid-gray)] mt-1">{l.borrower}</p>
              <div className="flex items-center justify-between mt-3">
                <StatusBadge status={daysOverdue(l.dueDate) > 0 ? 'overdue' : 'borrowed'} />
                <Button size="sm" onClick={() => { setSelected(l); setConfirmOpen(true); }}>Return</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmReturn}
        loading={processing}
        title="Confirm return"
        message={selected ? `Confirm that "${selected.bookTitle}" has been returned by ${selected.borrower}.` : ''}
        confirmLabel="Confirm Return"
      />
    </div>
  );
}
