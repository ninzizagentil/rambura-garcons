import { useState, useMemo, useEffect } from 'react';
import { RotateCcw, Bell } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/tables/DataTable';
import { Badge } from '../../components/common/Badge';
import IconButton from '../../components/common/IconButton';
import ConfirmModal from '../../components/modals/ConfirmModal';
import { EmptyState } from '../../components/feedback/States';
import ViewOnlyBanner from '../../components/feedback/ViewOnlyBanner';
import Alert from '../../components/feedback/Alert';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { ROLES } from '../../data/roles';
import { useToast } from '../../context/ToastContext';
import { useApp } from '../../context/AppContext';
import { getLoans, refreshLibrary, returnBook, daysOverdue, getLibraryError } from '../../services/bookService';

export default function OverdueBooks() {
  const { showToast } = useToast();
  const { t } = useApp();
  const { viewOnly, can } = useModuleAccess(ROLES.LIBRARIAN, 'library');
  const [loans, setLoans] = useState(() => getLoans().filter((l) => l.status !== 'returned' && daysOverdue(l.dueDate) > 0));
  const [confirmLoan, setConfirmLoan] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [loadError, setLoadError] = useState(getLibraryError());

  const refresh = () => { setLoans(getLoans().filter((l) => l.status !== 'returned' && daysOverdue(l.dueDate) > 0)); setLoadError(getLibraryError()); };
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

  const handleReturn = () => {
    if (!confirmLoan) return;
    setProcessing(true);
    setTimeout(async () => {
      const result = await returnBook(confirmLoan.id);
      setProcessing(false);
      if (!result.success) { showToast(result.error, 'error'); return; }
      showToast(t('bookReturnedSuccess', { bookTitle: confirmLoan.bookTitle }), 'success');
      refresh();
      setConfirmLoan(null);
    }, 400);
  };

  const handleNotify = (loan) => showToast(t('overdueReminderSent', { borrower: loan.borrower }), 'info');

  const rows = useMemo(() => loans.map((l) => ({ ...l, overdueDays: daysOverdue(l.dueDate) })), [loans]);

  const columns = [
    { key: 'borrower', header: t('borrowedBy') },
    { key: 'bookTitle', header: t('bookTitle') },
    { key: 'dueDate', header: t('dueDate') },
    { key: 'overdueDays', header: t('daysOverdue'), render: (l) => <Badge tone="red">{l.overdueDays} {t('days')}</Badge> },
    { key: 'status', header: t('status'), render: () => <Badge tone="red">{t('overdue')}</Badge> },
  ];
  if (can('library.return') || can('library.borrow')) {
    columns.push({
      key: 'actions',
      header: t('actions'),
      render: (l) => (
        <div className="flex items-center gap-1">
          {can('library.return') && <IconButton icon={RotateCcw} label={`${t('returnButton')} ${l.bookTitle}`} onClick={() => setConfirmLoan(l)} />}
          {can('library.borrow') && <IconButton icon={Bell} label={`${t('sendReminder')} ${l.borrower}`} onClick={() => handleNotify(l)} />}
        </div>
      ),
    });
  }

  return (
    <div>
      <PageHeader
        title={t('overdueBooks')}
        description={t('loansPastDueDate')}
        breadcrumb={[{ label: t('library'), to: '/library' }, { label: t('overdueBooks') }]}
      />
      {viewOnly && <ViewOnlyBanner module="Library MIS" />}
      {loadError && <Alert type="error" title={t('couldNotLoadOverdueBooks')} className="mb-4">{loadError}</Alert>}
      <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)]">
        <DataTable columns={columns} data={rows} emptyState={<EmptyState title={t('noOverdueBooks')} message={t('allCopiesAvailableOverdue')} />} />
      </div>

      <ConfirmModal
        open={!!confirmLoan}
        onClose={() => setConfirmLoan(null)}
        onConfirm={handleReturn}
        loading={processing}
        title={t('returnBook')}
        message={confirmLoan ? t('confirmReturnBook', { bookTitle: confirmLoan.bookTitle, borrower: confirmLoan.borrower }) : ''}
        confirmLabel={t('confirmReturn')}
      />
    </div>
  );
}
