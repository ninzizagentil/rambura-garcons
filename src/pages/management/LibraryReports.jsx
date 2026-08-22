import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import PageHeader from '../../components/layout/PageHeader';
import { ChartCard } from '../../components/cards/InsightChartCards';
import { StatusBadge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import { getBooks, getLoans, daysOverdue } from '../../services/bookService';
import { exportToCSV } from '../../utils/export';

export default function ManagementLibraryReports() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const books = useMemo(() => getBooks(), []);
  const loans = useMemo(() => getLoans(), []);

  const activeLoans = loans.filter((l) => l.status !== 'returned');
  const overdue = activeLoans.filter((l) => daysOverdue(l.dueDate) > 0);
  const mostBorrowed = [...books].sort((a, b) => b.borrowedCopies - a.borrowedCopies).slice(0, 6);

  const handleExport = () => {
    exportToCSV(
      'management-library-reports',
      [
        { key: 'title', header: 'Title' },
        { key: 'category', header: 'Category' },
        { key: 'totalCopies', header: 'Total Copies' },
        { key: 'borrowedCopies', header: 'Borrowed' },
      ],
      books
    );
    showToast('Library report downloaded as CSV.', 'success');
  };

  return (
    <div>
      <PageHeader
        title="Library Reports"
        description="Circulation summary for school management."
        breadcrumb={[{ label: 'Management', to: '/management' }, { label: 'Library Reports' }]}
        actions={<Button variant="secondary" icon={Download} onClick={handleExport}>Export</Button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-5">
          <p className="text-sm text-[var(--color-mid-gray)]">Total Books</p>
          <p className="font-display text-2xl font-semibold text-[var(--color-dark-gray)] mt-1">{books.length}</p>
        </div>
        <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-5">
          <p className="text-sm text-[var(--color-mid-gray)]">Borrowed (Active Loans)</p>
          <p className="font-display text-2xl font-semibold text-[var(--color-dark-gray)] mt-1">{activeLoans.length}</p>
        </div>
        <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-5">
          <p className="text-sm text-[var(--color-mid-gray)]">Overdue Loans</p>
          <p className="font-display text-2xl font-semibold text-[var(--color-status-red)] mt-1">{overdue.length}</p>
        </div>
      </div>

      <ChartCard
        title="Most Borrowed Books"
        description="Top titles by copies currently borrowed"
        actions={<Button variant="ghost" size="sm" icon={ArrowRight} iconPosition="right" onClick={() => navigate('/library/history')}>Full History</Button>}
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
          <p className="font-display font-semibold text-[var(--color-dark-gray)]">Overdue Summary</p>
          <Button variant="ghost" size="sm" icon={ArrowRight} iconPosition="right" onClick={() => navigate('/library/overdue')}>View in Library MIS</Button>
        </div>
        {overdue.length === 0 ? (
          <p className="text-sm text-[var(--color-mid-gray)]">No loans are currently overdue.</p>
        ) : (
          <ul className="divide-y divide-[var(--color-border-gray)]">
            {overdue.map((l) => (
              <li key={l.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-[var(--color-dark-gray)]">{l.bookTitle} — {l.borrower}</span>
                <StatusBadge status="overdue" label={`${daysOverdue(l.dueDate)} days overdue`} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
