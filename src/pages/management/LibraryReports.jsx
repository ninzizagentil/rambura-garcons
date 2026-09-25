import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Printer, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import PageHeader from '../../components/layout/PageHeader';
import { ChartCard } from '../../components/cards/InsightChartCards';
import { StatusBadge } from '../../components/common/Badge';
import { FilterDropdown } from '../../components/common/SearchBar';
import Button from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import { useNotifications } from '../../context/NotificationContext';
import { getBooks, getLoans, daysOverdue, refreshLibrary, useLibraryVersion } from '../../services/bookService';
import { exportToCSV } from '../../utils/export';
import { printReport } from '../../utils/print';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export default function ManagementLibraryReports() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t, language } = useApp();
  const { hasPermission } = useAuth();
  const libraryVersion = useLibraryVersion();
  const { addNotification } = useNotifications();
  const [classYear, setClassYear] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const books = useMemo(() => { void libraryVersion; return getBooks(); }, [libraryVersion]);
  const loans = useMemo(() => { void libraryVersion; return getLoans(); }, [libraryVersion]);

  useEffect(() => { refreshLibrary().catch(() => {}); }, []);

  const filteredLoans = loans.filter((loan) => {
    const passesClass = !classYear || loan.studentClassYear === classYear;
    const loanDate = loan.borrowDate ? new Date(loan.borrowDate).toISOString().slice(0, 10) : '';
    const passesStart = !startDate || loanDate >= startDate;
    const passesEnd = !endDate || loanDate <= endDate;
    return passesClass && passesStart && passesEnd;
  });
  const activeLoans = filteredLoans.filter((l) => l.status !== 'returned');
  const overdue = activeLoans.filter((l) => daysOverdue(l.dueDate) > 0);
  const borrowCounts = filteredLoans.reduce((counts, loan) => { counts[loan.bookTitle] = (counts[loan.bookTitle] || 0) + 1; return counts; }, {});
  const mostBorrowed = Object.entries(borrowCounts).map(([title, borrowedCopies]) => ({ title, borrowedCopies })).sort((a, b) => b.borrowedCopies - a.borrowedCopies).slice(0, 6);

  const rosterRows = filteredLoans
    .filter((loan) => loan.borrowerType === 'Student')
    .map((loan) => ({
      borrower: loan.borrower,
      borrowerType: loan.borrowerType,
      studentClassYear: loan.studentClassYear || classYear || 'Unassigned',
      bookTitle: loan.bookTitle || 'Unknown book',
      borrowDate: loan.borrowDate ? new Date(loan.borrowDate).toLocaleDateString(language === 'fr' ? 'fr-FR' : language === 'rw' ? 'rw-RW' : 'en-GB') : '',
      dueDate: loan.dueDate ? new Date(loan.dueDate).toLocaleDateString(language === 'fr' ? 'fr-FR' : language === 'rw' ? 'rw-RW' : 'en-GB') : '',
      status: loan.status || 'borrowed',
    }));

  const handleExport = () => {
    const columns = [
      { key: 'borrower', header: 'Student' },
      { key: 'borrowerType', header: 'Borrower Type' },
      { key: 'studentClassYear', header: 'Class / Level' },
      { key: 'bookTitle', header: 'Book Title' },
      { key: 'borrowDate', header: 'Borrow Date' },
      { key: 'dueDate', header: 'Due Date' },
      { key: 'status', header: 'Status' },
    ];
    exportToCSV(`management-library-${classYear || 'all-classes'}-student-report`, columns, rosterRows);
    addNotification({
      type: 'library',
      message: classYear ? `Management library student report exported for ${classYear}.` : 'Management library student report exported for all classes.',
      to: '/management/library-reports',
    });
    showToast(classYear ? t('studentReportExportedForClass', { classYear }) : t('managementLibraryReportExported'), 'success');
  };

  const handlePrint = () => {
    const columns = [
      { key: 'borrower', header: 'Student' },
      { key: 'borrowerType', header: 'Borrower Type' },
      { key: 'studentClassYear', header: 'Class / Level' },
      { key: 'bookTitle', header: 'Book Title' },
      { key: 'borrowDate', header: 'Borrow Date' },
      { key: 'dueDate', header: 'Due Date' },
      { key: 'status', header: 'Status' },
    ];
    const title = classYear ? `${t('managementLibraryStudentReport')} - ${classYear}` : t('managementLibraryStudentReport');
    const ok = printReport(title, columns, rosterRows);
    addNotification({
      type: 'library',
      message: classYear ? `Management library student report printed for ${classYear}.` : 'Management library student report printed for all classes.',
      to: '/management/library-reports',
    });
    if (!ok) showToast(t('enablePopupsToPrint'), 'error');
  };

  return (
    <div>
      <PageHeader
        title={t('libraryReports')}
        description={t('managementLibraryReportsDescription')}
        breadcrumb={[{ label: t('schoolManagement'), to: '/management' }, { label: t('libraryReports') }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" icon={Printer} onClick={handlePrint}>{t('print')}</Button>
            <Button variant="secondary" icon={Download} onClick={handleExport}>{t('export')}</Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <label className="flex items-center gap-2 text-sm">
          <span className="sr-only">{t('startDate')}</span>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-[var(--radius-control)] border border-[var(--color-border-gray)] bg-[var(--color-soft-gray)] px-3 py-2.5 text-sm text-[var(--color-dark-gray)] focus:outline-none focus:ring-2 focus:ring-[var(--color-medium-green)]" />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="sr-only">{t('endDate')}</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-[var(--radius-control)] border border-[var(--color-border-gray)] bg-[var(--color-soft-gray)] px-3 py-2.5 text-sm text-[var(--color-dark-gray)] focus:outline-none focus:ring-2 focus:ring-[var(--color-medium-green)]" />
        </label>
        <FilterDropdown
          label={t('classLevel')}
          value={classYear}
          onChange={setClassYear}
          options={['S1', 'S2', 'S3', 'L3', 'L4', 'L5'].map((v) => ({ value: v, label: v }))}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-5">
          <p className="text-sm text-[var(--color-mid-gray)]">{t('totalBooks')}</p>
          <p className="font-display text-2xl font-semibold text-[var(--color-dark-gray)] mt-1">{books.length}</p>
        </div>
        <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-5">
          <p className="text-sm text-[var(--color-mid-gray)]">{t('borrowedActiveLoans')}</p>
          <p className="font-display text-2xl font-semibold text-[var(--color-dark-gray)] mt-1">{activeLoans.length}</p>
        </div>
        <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-5">
          <p className="text-sm text-[var(--color-mid-gray)]">{t('overdueLoansLabel')}</p>
          <p className="font-display text-2xl font-semibold text-[var(--color-status-red)] mt-1">{overdue.length}</p>
        </div>
      </div>

      <ChartCard
        title={t('mostBorrowedBooks')}
        description={t('topBorrowedTitles')}
        actions={hasPermission('library.view') ? <Button variant="ghost" size="sm" icon={ArrowRight} iconPosition="right" onClick={() => navigate('/library/history')}>{t('fullHistory')}</Button> : null}
      >
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={mostBorrowed}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-gray)" />
            <XAxis dataKey="title" stroke="var(--color-mid-gray)" fontSize={10} interval={0} angle={-15} textAnchor="end" height={60} />
            <YAxis stroke="var(--color-mid-gray)" fontSize={12} />
            <Tooltip />
            <Bar dataKey="borrowedCopies" name="Borrowed" fill="var(--color-medium-green)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-6 mt-5">
        <div className="flex items-center justify-between mb-3">
          <p className="font-display font-semibold text-[var(--color-dark-gray)]">{t('overdueSummary')}</p>
          {hasPermission('library.view') && <Button variant="ghost" size="sm" icon={ArrowRight} iconPosition="right" onClick={() => navigate('/library/overdue')}>{t('viewInLibraryMis')}</Button>}
        </div>
        {overdue.length === 0 ? (
          <p className="text-sm text-[var(--color-mid-gray)]">{t('noLoansOverdue')}</p>
        ) : (
          <ul className="divide-y divide-[var(--color-border-gray)]">
            {overdue.map((l) => (
              <li key={l.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-[var(--color-dark-gray)]">{l.bookTitle} — {l.borrower}</span>
                <StatusBadge status="overdue" label={t('daysOverdueCount', { count: daysOverdue(l.dueDate) })} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
