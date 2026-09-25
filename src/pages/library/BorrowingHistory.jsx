import { useState, useMemo, useEffect } from 'react';
import {
  Download, BookOpen, BookMarked, CheckCircle2, AlertTriangle,
  Eye, RotateCcw, Bell, Printer, CalendarRange,
} from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import StatCard from '../../components/cards/StatCard';
import DataTable, { Pagination } from '../../components/tables/DataTable';
import RowActionMenu from '../../components/tables/RowActionMenu';
import { SearchBar, FilterDropdown } from '../../components/common/SearchBar';
import { StatusBadge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Avatar from '../../components/common/Avatar';
import Modal from '../../components/modals/Modal';
import ConfirmModal from '../../components/modals/ConfirmModal';
import { EmptyState } from '../../components/feedback/States';
import ViewOnlyBanner from '../../components/feedback/ViewOnlyBanner';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { ROLES } from '../../data/roles';
import { useToast } from '../../context/ToastContext';
import { useApp } from '../../context/AppContext';
import { getLoans, getBooks, refreshLibrary, returnBook, daysOverdue } from '../../services/bookService';
import { exportToCSV } from '../../utils/export';
import { printReport } from '../../utils/print';

const PAGE_SIZE = 5;

function formatDate(iso, language = 'en') {
  if (!iso) return '—';
  const locale = language === 'fr' ? 'fr-FR' : language === 'rw' ? 'rw-RW' : 'en-GB';
  return new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function BorrowingHistory() {
  const { showToast } = useToast();
  const { t, language } = useApp();
  const { viewOnly, can } = useModuleAccess(ROLES.LIBRARIAN, 'library');

  const [loans, setLoans] = useState(() => getLoans());
  const [books, setBooks] = useState(() => getBooks());
  const bookById = useMemo(() => Object.fromEntries(books.map((b) => [b.id, b])), [books]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [bookFilter, setBookFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const [viewLoan, setViewLoan] = useState(null);
  const [confirmReturn, setConfirmReturn] = useState(null);
  const [processing, setProcessing] = useState(false);

  const refresh = () => {
    setLoans(getLoans());
    setBooks(getBooks());
  };
  useEffect(() => {
    window.addEventListener('rg:library-updated', refresh);
    refreshLibrary().catch(() => {});
    return () => window.removeEventListener('rg:library-updated', refresh);
  }, []);

  // A loan's real-world status: returned stays returned; otherwise it's
  // overdue the moment today passes its due date, else still borrowed.
  const rows = useMemo(
    () =>
      loans.map((l) => ({
        ...l,
        effectiveStatus: l.status === 'returned' ? 'returned' : daysOverdue(l.dueDate) > 0 ? 'overdue' : 'borrowed',
      })),
    [loans]
  );

  const totalLoans = rows.length;
  const activeLoans = rows.filter((r) => r.effectiveStatus === 'borrowed').length;
  const returnedLoans = rows.filter((r) => r.effectiveStatus === 'returned').length;
  const overdueLoans = rows.filter((r) => r.effectiveStatus === 'overdue').length;

  const filtered = useMemo(() => {
    return rows.filter((l) => {
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || l.bookTitle.toLowerCase().includes(q) || l.borrower.toLowerCase().includes(q);
      const matchesStatus = !statusFilter || l.effectiveStatus === statusFilter;
      const matchesBook = !bookFilter || l.bookId === bookFilter;
      const matchesFrom = !dateFrom || l.borrowDate >= dateFrom;
      const matchesTo = !dateTo || l.borrowDate <= dateTo;
      return matchesSearch && matchesStatus && matchesBook && matchesFrom && matchesTo;
    });
  }, [rows, search, statusFilter, bookFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const resetToFirstPage = (setter) => (val) => {
    setter(val);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setBookFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const hasActiveFilters = search || statusFilter || bookFilter || dateFrom || dateTo;

  const handleReturn = async () => {
    if (!confirmReturn) return;
    setProcessing(true);
    const result = await returnBook(confirmReturn.id);
    setProcessing(false);
    if (!result.success) {
      showToast(result.error, 'error');
      return;
    }
    showToast(t('bookMarkedReturned', { bookTitle: confirmReturn.bookTitle }), 'success');
    refresh();
    setConfirmReturn(null);
  };

  const handleNotify = (loan) => showToast(t('overdueReminderSent', { borrower: loan.borrower }), 'info');
  const handlePrintReceipt = (loan) => showToast(t('printReceiptForBook', { bookTitle: loan.bookTitle }), 'info');

  const handleExport = () => {
    exportToCSV(
      'borrowing-history',
      [
        { key: 'borrower', header: t('borrowedBy') },
        { key: 'borrowerType', header: t('borrowerType') },
        { key: 'bookTitle', header: t('bookTitle') },
        { key: 'borrowDate', header: t('borrowDate') },
        { key: 'dueDate', header: t('due') },
        { key: 'returnDate', header: t('returnedOn'), value: (l) => l.returnDate || '' },
        { key: 'effectiveStatus', header: t('status') },
      ],
      filtered
    );
    showToast(t('borrowingHistoryExported', { count: filtered.length }), 'success');
  };

  const handlePrint = () => {
    const columns = [
      { key: 'borrower', header: t('borrowedBy') },
      { key: 'borrowerType', header: t('borrowerType') },
      { key: 'bookTitle', header: t('bookTitle') },
      { key: 'borrowDate', header: t('borrowDate'), value: (loan) => formatDate(loan.borrowDate, language) },
      { key: 'dueDate', header: t('due'), value: (loan) => formatDate(loan.dueDate, language) },
      { key: 'returnDate', header: t('returnedOn'), value: (loan) => formatDate(loan.returnDate, language) },
      { key: 'effectiveStatus', header: t('status') },
    ];
    const ok = printReport(t('borrowingHistory'), columns, filtered);
    if (!ok) showToast(t('enablePopupsToPrint'), 'error');
  };

  const columns = [
    {
      key: 'borrower',
      header: t('borrowedBy'),
      render: (l) => (
        <div className="flex items-center gap-3">
          <Avatar name={l.borrower} size="sm" />
          <div className="min-w-0">
            <p className="font-medium text-[var(--color-dark-gray)] truncate">{l.borrower}</p>
            <p className="text-xs text-[var(--color-mid-gray)]">{l.borrowerType}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'bookTitle',
      header: t('bookTitle'),
      render: (l) => (
        <div className="min-w-0">
          <p className="font-medium text-[var(--color-dark-gray)] truncate max-w-[220px]">{l.bookTitle}</p>
          {bookById[l.bookId] && <p className="text-xs text-[var(--color-mid-gray)]">{bookById[l.bookId].bookCode}</p>}
        </div>
      ),
    },
    { key: 'borrowDate', header: t('borrowDate'), render: (l) => formatDate(l.borrowDate, language) },
    {
      key: 'dueDate',
      header: t('due'),
      render: (l) => (
        <div>
          <p className={l.effectiveStatus === 'overdue' ? 'text-[var(--color-status-red)] font-medium' : undefined}>
            {formatDate(l.dueDate, language)}
          </p>
          {l.effectiveStatus === 'overdue' && (
            <p className="text-xs text-[var(--color-status-red)]">{t('daysLate', { days: daysOverdue(l.dueDate) })}</p>
          )}
        </div>
      ),
    },
    { key: 'returnDate', header: t('returnedOn'), render: (l) => formatDate(l.returnDate, language) },
    { key: 'status', header: t('status'), render: (l) => <StatusBadge status={l.effectiveStatus} /> },
    {
      key: 'actions',
      header: t('actions'),
      render: (l) => (
        <RowActionMenu
          label={t('actionsForLoan', { borrower: l.borrower })}
          items={[
            { label: t('viewDetails'), icon: Eye, onClick: () => setViewLoan(l) },
            l.effectiveStatus !== 'returned' && can('library.return')
              ? { label: t('markReturned'), icon: RotateCcw, onClick: () => setConfirmReturn(l) }
              : null,
            l.effectiveStatus === 'overdue' && can('library.borrow')
              ? { label: t('sendReminder'), icon: Bell, onClick: () => handleNotify(l) }
              : null,
            l.effectiveStatus === 'returned'
              ? { label: t('printReceipt'), icon: Printer, onClick: () => handlePrintReceipt(l) }
              : null,
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('borrowingHistory')}
        description={t('completeLoanRecord')}
        breadcrumb={[{ label: t('library'), to: '/library' }, { label: t('borrowingHistory') }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" icon={Printer} onClick={handlePrint}>
              {t('print')}
            </Button>
            <Button variant="gold" icon={Download} onClick={handleExport}>
              {t('exportReport')}
            </Button>
          </div>
        }
      />

      {viewOnly && <ViewOnlyBanner module="Library MIS" />}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label={t('totalLoans')} value={totalLoans} icon={BookOpen} />
        <StatCard label={t('activeLoans')} value={activeLoans} icon={BookMarked} tone="blue" />
        <StatCard label={t('returned')} value={returnedLoans} icon={CheckCircle2} />
        <StatCard label={t('overdue')} value={overdueLoans} icon={AlertTriangle} tone="red" />
      </div>

      <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] shadow-card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <SearchBar
            value={search}
            onChange={resetToFirstPage(setSearch)}
            placeholder={t('searchBorrowerBook')}
            className="flex-1 min-w-[220px]"
          />
          <FilterDropdown
            label={t('allStatus')}
            value={statusFilter}
            onChange={resetToFirstPage(setStatusFilter)}
            options={[
              { value: 'borrowed', label: t('borrowed') },
              { value: 'overdue', label: t('overdue') },
              { value: 'returned', label: t('returned') },
            ]}
          />
          <FilterDropdown
            label={t('allBooks')}
            value={bookFilter}
            onChange={resetToFirstPage(setBookFilter)}
            options={books.map((b) => ({ value: b.id, label: b.title }))}
          />
          <div className="flex items-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-border-gray)] bg-[var(--color-white)] px-3 py-2">
            <CalendarRange className="w-4 h-4 text-[var(--color-mid-gray)] shrink-0" aria-hidden="true" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => resetToFirstPage(setDateFrom)(e.target.value)}
              aria-label={t('fromDate')}
              className="text-sm text-[var(--color-dark-gray)] bg-transparent focus:outline-none"
            />
            <span className="text-[var(--color-mid-gray)] text-sm">–</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => resetToFirstPage(setDateTo)(e.target.value)}
              aria-label={t('toDate')}
              className="text-sm text-[var(--color-dark-gray)] bg-transparent focus:outline-none"
            />
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              {t('clearFilters')}
            </Button>
          )}
        </div>
      </div>

      <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border-gray)]">
          <h2 className="font-display text-sm font-semibold text-[var(--color-dark-gray)]">{t('loanRecords')}</h2>
          <p className="text-xs text-[var(--color-mid-gray)]">
            {t('showingItems', { from: filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1, to: Math.min(safePage * PAGE_SIZE, filtered.length), total: filtered.length })}
          </p>
        </div>
        <DataTable
          columns={columns}
          data={paged}
          emptyState={
            <EmptyState
              title={t('noLoanRecords')}
              message={t('adjustLoanFilters')}
              actionLabel={hasActiveFilters ? t('clearFilters') : undefined}
              onAction={hasActiveFilters ? clearFilters : undefined}
            />
          }
        />
        <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {/* View details modal */}
      <Modal open={!!viewLoan} onClose={() => setViewLoan(null)} title={t('loanDetails')} size="md">
        {viewLoan && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Avatar name={viewLoan.borrower} size="lg" />
              <div className="min-w-0">
                <p className="font-display font-semibold text-[var(--color-dark-gray)]">{viewLoan.borrower}</p>
                <p className="text-sm text-[var(--color-mid-gray)]">{viewLoan.borrowerType}</p>
              </div>
              <StatusBadge status={viewLoan.effectiveStatus} className="ml-auto" />
            </div>
            <div className="border-t border-[var(--color-border-gray)] pt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-[var(--color-mid-gray)]">{t('bookTitle')}</span>
                <span className="font-medium text-[var(--color-dark-gray)] text-right">{viewLoan.bookTitle}</span>
              </div>
              {bookById[viewLoan.bookId] && (
                <div className="flex justify-between gap-4">
                  <span className="text-[var(--color-mid-gray)]">{t('bookCode')}</span>
                  <span className="font-medium text-[var(--color-dark-gray)]">{bookById[viewLoan.bookId].bookCode}</span>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <span className="text-[var(--color-mid-gray)]">{t('borrowedOn')}</span>
                <span className="font-medium text-[var(--color-dark-gray)]">{formatDate(viewLoan.borrowDate, language)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[var(--color-mid-gray)]">{t('dueDate')}</span>
                <span className="font-medium text-[var(--color-dark-gray)]">{formatDate(viewLoan.dueDate, language)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[var(--color-mid-gray)]">{t('returnedOn')}</span>
                <span className="font-medium text-[var(--color-dark-gray)]">{formatDate(viewLoan.returnDate, language)}</span>
              </div>
              {viewLoan.effectiveStatus === 'overdue' && (
                <div className="flex justify-between gap-4">
                  <span className="text-[var(--color-mid-gray)]">{t('daysOverdue')}</span>
                  <span className="font-medium text-[var(--color-status-red)]">{t('daysCount', { count: daysOverdue(viewLoan.dueDate) })}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={!!confirmReturn}
        onClose={() => setConfirmReturn(null)}
        onConfirm={handleReturn}
        loading={processing}
        title={t('returnBook')}
        message={confirmReturn ? t('confirmReturnBook', { bookTitle: confirmReturn.bookTitle, borrower: confirmReturn.borrower }) : ''}
        confirmLabel={t('confirmReturn')}
      />
    </div>
  );
}
