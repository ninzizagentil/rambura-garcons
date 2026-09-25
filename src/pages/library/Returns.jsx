import { useState, useMemo, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import { SearchBar } from '../../components/common/SearchBar';
import { StatusBadge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import ConfirmModal from '../../components/modals/ConfirmModal';
import { EmptyState } from '../../components/feedback/States';
import ViewOnlyBanner from '../../components/feedback/ViewOnlyBanner';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { ROLES } from '../../data/roles';
import { useToast } from '../../context/ToastContext';
import { useNotifications } from '../../context/NotificationContext';
import { useApp } from '../../context/AppContext';
import { getLoans, refreshLibrary, returnBook, daysOverdue } from '../../services/bookService';

export default function Returns() {
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const { t } = useApp();
  const { viewOnly, can } = useModuleAccess(ROLES.LIBRARIAN, 'library');
  const [loans, setLoans] = useState(() => getLoans().filter((l) => l.status !== 'returned'));
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [justReturned, setJustReturned] = useState(null);

  const refresh = () => setLoans(getLoans().filter((l) => l.status !== 'returned'));
  useEffect(() => {
    window.addEventListener('rg:library-updated', refresh);
    refreshLibrary().catch(() => {});
    return () => window.removeEventListener('rg:library-updated', refresh);
  }, []);

  const filtered = useMemo(
    () => loans.filter((l) => !search || l.bookTitle.toLowerCase().includes(search.toLowerCase()) || l.borrower.toLowerCase().includes(search.toLowerCase())),
    [loans, search]
  );

  const handleConfirmReturn = () => {
    setProcessing(true);
    setTimeout(async () => {
      const result = await returnBook(selected.id);
      setProcessing(false);
      if (!result.success) { showToast(result.error, 'error'); return; }
      setConfirmOpen(false);
      setJustReturned(selected);
      showToast(t('bookReturnedSuccess', { bookTitle: selected.bookTitle }), 'success');
      addNotification({
        type: 'borrow',
        message: t('confirmReturnBook', { bookTitle: selected.bookTitle, borrower: selected.borrower }),
        to: '/library/history',
      });
      refresh();
      setSelected(null);
    }, 400);
  };

  if (justReturned) {
    return (
      <div>
        <PageHeader title={t('returns')} breadcrumb={[{ label: t('library'), to: '/library' }, { label: t('returns') }]} />
        <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-12 flex flex-col items-center text-center">
          <CheckCircle2 className="w-12 h-12 text-[var(--color-status-green)] mb-4" aria-hidden="true" />
          <p className="font-display text-lg font-semibold text-[var(--color-dark-gray)]">{t('returnSuccessful')}</p>
          <p className="text-sm text-[var(--color-mid-gray)] mt-1">
            {t('confirmReturnBook', { bookTitle: justReturned.bookTitle, borrower: justReturned.borrower })}
          </p>
          <Button variant="primary" className="mt-6" onClick={() => setJustReturned(null)}>{t('returnAnotherBook')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={t('returns')} description={viewOnly ? t('activeLoansAwaitingReturn') : t('selectLoanToProcessReturn')} breadcrumb={[{ label: t('library'), to: '/library' }, { label: t('returns') }]} />
      {viewOnly && <ViewOnlyBanner module="Library MIS" />}
      <SearchBar value={search} onChange={setSearch} placeholder={t('searchBorrowerBook')} className="mb-4 max-w-sm" />

      {filtered.length === 0 ? (
        <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)]">
          <EmptyState title={t('noActiveLoans')} message={t('noBorrowedAwaitingReturn')} />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((l) => (
            <div key={l.id} className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-5">
              <p className="font-display font-semibold text-[var(--color-dark-gray)]">{l.bookTitle}</p>
              <p className="text-sm text-[var(--color-mid-gray)] mt-1">{l.borrower}</p>
              <div className="flex items-center justify-between mt-3">
                <StatusBadge status={daysOverdue(l.dueDate) > 0 ? 'overdue' : 'borrowed'} />
                {can('library.return') && (
                  <Button size="sm" onClick={() => { setSelected(l); setConfirmOpen(true); }}>{t('returnButton')}</Button>
                )}
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
        title={t('confirmReturn')}
        message={selected ? t('confirmReturnBook', { bookTitle: selected.bookTitle, borrower: selected.borrower }) : ''}
        confirmLabel={t('confirmReturn')}
      />
    </div>
  );
}
