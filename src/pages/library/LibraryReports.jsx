import { useState, useMemo, useEffect } from 'react';
import { Download, Printer } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import PageHeader from '../../components/layout/PageHeader';
import { ChartCard } from '../../components/cards/InsightChartCards';
import { FilterDropdown } from '../../components/common/SearchBar';
import Button from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import { useNotifications } from '../../context/NotificationContext';
import { useApp } from '../../context/AppContext';
import { getBooks, getLoans, refreshLibrary } from '../../services/bookService';
import { exportToCSV } from '../../utils/export';
import { printReport } from '../../utils/print';

const PIE_COLORS = ['var(--color-medium-green)', 'var(--color-gold)', 'var(--color-status-blue)', 'var(--color-status-amber)'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Builds the last 5 calendar months (oldest -> newest, ending this month) and
// counts real loans/returns falling in each, from actual loan records.
function buildCirculation(loans) {
  const now = new Date();
  const months = [];
  for (let i = 4; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, month: MONTH_LABELS[d.getMonth()], loans: 0, returns: 0 });
  }
  const byKey = Object.fromEntries(months.map((m) => [m.key, m]));
  loans.forEach((l) => {
    if (l.borrowDate) {
      const bd = new Date(l.borrowDate);
      const key = `${bd.getFullYear()}-${bd.getMonth()}`;
      if (byKey[key]) byKey[key].loans += 1;
    }
    if (l.returnDate) {
      const rd = new Date(l.returnDate);
      const key = `${rd.getFullYear()}-${rd.getMonth()}`;
      if (byKey[key]) byKey[key].returns += 1;
    }
  });
  return months;
}

export default function LibraryReports() {
  const { t } = useApp();
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const [range, setRange] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [classYear, setClassYear] = useState('');
  const [books, setBooks] = useState(() => getBooks());
  const [loans, setLoans] = useState(() => getLoans());

  useEffect(() => {
    const refresh = () => {
      setBooks(getBooks());
      setLoans(getLoans());
    };
    window.addEventListener('rg:library-updated', refresh);
    refreshLibrary().catch(() => {});
    return () => window.removeEventListener('rg:library-updated', refresh);
  }, []);

  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => {
      const passesClass = !classYear || loan.studentClassYear === classYear;
      const loanDate = loan.borrowDate ? new Date(loan.borrowDate).toISOString().slice(0, 10) : '';
      const passesStart = !startDate || loanDate >= startDate;
      const passesEnd = !endDate || loanDate <= endDate;
      return passesClass && passesStart && passesEnd;
    });
  }, [loans, classYear, startDate, endDate]);

  const rosterRows = useMemo(() => {
    return filteredLoans
      .filter((loan) => loan.borrowerType === 'Student')
      .map((loan) => {
        const book = typeof loan.bookId === 'object' ? loan.bookId : books.find((b) => b.id === loan.bookId || b._id === loan.bookId) || null;
        return {
          borrower: loan.borrower,
          borrowerType: loan.borrowerType,
          studentClassYear: loan.studentClassYear || classYear || 'Unassigned',
          bookTitle: loan.bookTitle || book?.title || 'Unknown book',
          borrowDate: loan.borrowDate ? new Date(loan.borrowDate).toLocaleDateString('en-GB') : '',
          dueDate: loan.dueDate ? new Date(loan.dueDate).toLocaleDateString('en-GB') : '',
          status: loan.status || 'borrowed',
        };
      });
  }, [books, classYear, filteredLoans]);

  const circulation = useMemo(() => buildCirculation(filteredLoans), [filteredLoans]);

  const handleRangeChange = (value) => {
    setRange(value);
    if (!value) {
      setStartDate('');
      setEndDate('');
      return;
    }
    const now = new Date();
    const start = new Date(now.getFullYear(), value === 'year' ? 0 : now.getMonth() - (value === 'term' ? 2 : 0), 1);
    setStartDate(start.toISOString().slice(0, 10));
    setEndDate(now.toISOString().slice(0, 10));
  };

  const byCategory = books.reduce((acc, b) => {
    acc[b.category] = (acc[b.category] || 0) + b.totalCopies;
    return acc;
  }, {});
  const categoryData = Object.entries(byCategory).map(([name, value]) => ({ name, value }));

  const borrowCounts = loans.reduce((counts, loan) => {
    const title = loan.bookTitle || books.find((book) => book.id === loan.bookId)?.title;
    if (title) counts[title] = (counts[title] || 0) + 1;
    return counts;
  }, {});
  const mostBorrowed = Object.entries(borrowCounts)
    .map(([title, borrowedCopies]) => ({ title, borrowedCopies }))
    .sort((a, b) => b.borrowedCopies - a.borrowedCopies)
    .slice(0, 5);

  const handleExport = () => {
    const classLabel = classYear || t('allClasses');
    const columns = [
      { key: 'borrower', header: t('student') },
      { key: 'borrowerType', header: t('borrowerType') },
      { key: 'studentClassYear', header: t('classLevel') },
      { key: 'bookTitle', header: t('bookTitle') },
      { key: 'borrowDate', header: t('borrowDate') },
      { key: 'dueDate', header: t('dueDate') },
      { key: 'status', header: t('status') },
    ];

    exportToCSV(`library-${classLabel}-student-report`, columns, rosterRows);
    addNotification({
      type: 'library',
      message: classYear ? t('libraryExportedForClass', { classYear }) : t('libraryExportedForAllClasses'),
      to: '/library/reports',
    });
    showToast(classYear ? t('studentReportExportedForClass', { classYear }) : t('libraryReportExported'), 'success');
  };

  const handlePrint = () => {
    const columns = [
      { key: 'borrower', header: t('student') },
      { key: 'borrowerType', header: t('borrowerType') },
      { key: 'studentClassYear', header: t('classLevel') },
      { key: 'bookTitle', header: t('bookTitle') },
      { key: 'borrowDate', header: t('borrowDate') },
      { key: 'dueDate', header: t('dueDate') },
      { key: 'status', header: t('status') },
    ];
    const title = classYear ? `${t('libraryStudentReport')} - ${classYear}` : t('libraryStudentReport');
    const ok = printReport(title, columns, rosterRows);
    addNotification({
      type: 'library',
      message: classYear ? t('libraryPrintedForClass', { classYear }) : t('libraryPrintedForAllClasses'),
      to: '/library/reports',
    });
    if (!ok) showToast(t('enablePopupsToPrint'), 'error');
  };

  return (
    <div>
      <PageHeader
        title={t('libraryReports')}
        description={t('libraryReportPageDescription')}
        breadcrumb={[{ label: t('library'), to: '/library' }, { label: t('reports') }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" icon={Printer} onClick={handlePrint}>{t('print')}</Button>
            <Button variant="secondary" icon={Download} onClick={handleExport}>{t('export')}</Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <FilterDropdown label={t('dateRange')} value={range} onChange={handleRangeChange} options={[
          { value: 'month', label: t('thisMonth') },
          { value: 'term', label: t('thisTerm') },
          { value: 'year', label: t('thisYear') },
        ]} />
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

      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        <ChartCard title={t('circulation')} description={t('circulationDescription')}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={circulation}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-gray)" />
              <XAxis dataKey="month" stroke="var(--color-mid-gray)" fontSize={12} />
              <YAxis stroke="var(--color-mid-gray)" fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey="loans" fill="var(--color-medium-green)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="returns" fill="var(--color-gold)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('availabilityByCategory')} description={t('availabilityByCategoryDescription')}>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={categoryData} dataKey="value" nameKey="name" outerRadius={90} label>
                {categoryData.map((entry, i) => <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title={t('mostBorrowedBooks')} description={t('mostBorrowedBooksDescription')}>
        <ul className="divide-y divide-[var(--color-border-gray)]">
          {mostBorrowed.map((b) => (
            <li key={b.id} className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-[var(--color-dark-gray)]">{b.title}</span>
              <span className="font-semibold text-[var(--color-medium-green)]">{b.borrowedCopies} {t('borrowed')}</span>
            </li>
          ))}
        </ul>
      </ChartCard>
    </div>
  );
}
