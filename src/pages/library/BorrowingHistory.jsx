import { useState, useMemo } from 'react';
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
import { getLoans, getBooks, returnBook, daysOverdue } from '../../services/bookService';
import { exportToCSV } from '../../utils/export';

const PAGE_SIZE = 5;

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function BorrowingHistory() {
  const { showToast } = useToast();
  const { viewOnly } = useModuleAccess(ROLES.LIBRARIAN);

  const [loans, setLoans] = useState(() => getLoans());
  const books = useMemo(() => getBooks(), []);
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

  const refresh = () => setLoans(getLoans());

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

  const handleReturn = () => {
    if (!confirmReturn) return;
    setProcessing(true);
    setTimeout(() => {
      returnBook(confirmReturn.id);
      setProcessing(false);
      showToast(`"${confirmReturn.bookTitle}" marked as returned.`, 'success');
      refresh();
      setConfirmReturn(null);
    }, 400);
  };

  const handleNotify = (loan) => showToast(`Overdue reminder sent to ${loan.borrower}.`, 'info');
  const handlePrint = (loan) => showToast(`Receipt for "${loan.bookTitle}" sent to printer.`, 'info');

  const handleExport = () => {
    exportToCSV(
      'borrowing-history',
      [
        { key: 'borrower', header: 'Borrower' },
        { key: 'borrowerType', header: 'Borrower Type' },
        { key: 'bookTitle', header: 'Book' },
        { key: 'borrowDate', header: 'Borrowed' },
        { key: 'dueDate', header: 'Due' },
        { key: 'returnDate', header: 'Returned', value: (l) => l.returnDate || '' },
        { key: 'effectiveStatus', header: 'Status' },
      ],
      filtered
    );
    showToast(`Borrowing history exported — ${filtered.length} record${filtered.length === 1 ? '' : 's'}.`, 'success');
  };

  const columns = [
    {
      key: 'borrower',
      header: 'Borrower',
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
      header: 'Book',
      render: (l) => (
        <div className="min-w-0">
          <p className="font-medium text-[var(--color-dark-gray)] truncate max-w-[220px]">{l.bookTitle}</p>
          {bookById[l.bookId] && <p className="text-xs text-[var(--color-mid-gray)]">{bookById[l.bookId].bookCode}</p>}
        </div>
      ),
    },
    { key: 'borrowDate', header: 'Borrowed', render: (l) => formatDate(l.borrowDate) },
    {
      key: 'dueDate',
      header: 'Due',
      render: (l) => (
        <div>
          <p className={l.effectiveStatus === 'overdue' ? 'text-[var(--color-status-red)] font-medium' : undefined}>
            {formatDate(l.dueDate)}
          </p>
          {l.effectiveStatus === 'overdue' && (
            <p className="text-xs text-[var(--color-status-red)]">{daysOverdue(l.dueDate)} days late</p>
          )}
        </div>
      ),
    },
    { key: 'returnDate', header: 'Returned', render: (l) => formatDate(l.returnDate) },
    { key: 'status', header: 'Status', render: (l) => <StatusBadge status={l.effectiveStatus} /> },
    {
      key: 'actions',
      header: '',
      render: (l) => (
        <RowActionMenu
          label={`Actions for ${l.borrower}'s loan`}
          items={[
            { label: 'View Details', icon: Eye, onClick: () => setViewLoan(l) },
            l.effectiveStatus !== 'returned' && !viewOnly
              ? { label: 'Mark as Returned', icon: RotateCcw, onClick: () => setConfirmReturn(l) }
              : null,
            l.effectiveStatus === 'overdue' && !viewOnly
              ? { label: 'Send Reminder', icon: Bell, onClick: () => handleNotify(l) }
              : null,
            l.effectiveStatus === 'returned'
              ? { label: 'Print Receipt', icon: Printer, onClick: () => handlePrint(l) }
              : null,
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Borrowing History"
        description="Complete record of all library loans and returns."
        breadcrumb={[{ label: 'Library', to: '/library' }, { label: 'Borrowing History' }]}
        actions={
          <Button variant="gold" icon={Download} onClick={handleExport}>
            Export Report
          </Button>
        }
      />

      {viewOnly && <ViewOnlyBanner module="Library MIS" />}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Loans" value={totalLoans} icon={BookOpen} />
        <StatCard label="Active Loans" value={activeLoans} icon={BookMarked} tone="blue" />
        <StatCard label="Returned" value={returnedLoans} icon={CheckCircle2} />
        <StatCard label="Overdue" value={overdueLoans} icon={AlertTriangle} tone="red" />
      </div>

      {/* Search + filters */}
      <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] shadow-card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <SearchBar
            value={search}
            onChange={resetToFirstPage(setSearch)}
            placeholder="Search by borrower or book…"
            className="flex-1 min-w-[220px]"
          />
          <FilterDropdown
            label="All Status"
            value={statusFilter}
            onChange={resetToFirstPage(setStatusFilter)}
            options={[
              { value: 'borrowed', label: 'Borrowed' },
              { value: 'overdue', label: 'Overdue' },
              { value: 'returned', label: 'Returned' },
            ]}
          />
          <FilterDropdown
            label="All Books"
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
              aria-label="From date"
              className="text-sm text-[var(--color-dark-gray)] bg-transparent focus:outline-none"
            />
            <span className="text-[var(--color-mid-gray)] text-sm">–</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => resetToFirstPage(setDateTo)(e.target.value)}
              aria-label="To date"
              className="text-sm text-[var(--color-dark-gray)] bg-transparent focus:outline-none"
            />
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border-gray)]">
          <h2 className="font-display text-sm font-semibold text-[var(--color-dark-gray)]">Loan Records</h2>
          <p className="text-xs text-[var(--color-mid-gray)]">
            Showing {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of{' '}
            {filtered.length}
          </p>
        </div>
        <DataTable
          columns={columns}
          data={paged}
          emptyState={
            <EmptyState
              title="No loan records found"
              message="Try a different search term, or adjust your filters."
              actionLabel={hasActiveFilters ? 'Clear filters' : undefined}
              onAction={hasActiveFilters ? clearFilters : undefined}
            />
          }
        />
        <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {/* View details modal */}
      <Modal open={!!viewLoan} onClose={() => setViewLoan(null)} title="Loan Details" size="md">
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
                <span className="text-[var(--color-mid-gray)]">Book</span>
                <span className="font-medium text-[var(--color-dark-gray)] text-right">{viewLoan.bookTitle}</span>
              </div>
              {bookById[viewLoan.bookId] && (
                <div className="flex justify-between gap-4">
                  <span className="text-[var(--color-mid-gray)]">Book Code</span>
                  <span className="font-medium text-[var(--color-dark-gray)]">{bookById[viewLoan.bookId].bookCode}</span>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <span className="text-[var(--color-mid-gray)]">Borrowed On</span>
                <span className="font-medium text-[var(--color-dark-gray)]">{formatDate(viewLoan.borrowDate)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[var(--color-mid-gray)]">Due Date</span>
                <span className="font-medium text-[var(--color-dark-gray)]">{formatDate(viewLoan.dueDate)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[var(--color-mid-gray)]">Returned On</span>
                <span className="font-medium text-[var(--color-dark-gray)]">{formatDate(viewLoan.returnDate)}</span>
              </div>
              {viewLoan.effectiveStatus === 'overdue' && (
                <div className="flex justify-between gap-4">
                  <span className="text-[var(--color-mid-gray)]">Days Overdue</span>
                  <span className="font-medium text-[var(--color-status-red)]">{daysOverdue(viewLoan.dueDate)} days</span>
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
        title="Return book"
        message={confirmReturn ? `Confirm that "${confirmReturn.bookTitle}" has been returned by ${confirmReturn.borrower}.` : ''}
        confirmLabel="Confirm Return"
      />
    </div>
  );
}
