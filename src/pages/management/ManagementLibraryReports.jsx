import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import PageHeader from '../../components/layout/PageHeader';
import { ChartCard } from '../../components/cards/InsightChartCards';
import { FilterDropdown } from '../../components/common/SearchBar';
import Button from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import { exportReport } from '../../services/reportService';
import { getBooks, getLoans, daysOverdue } from '../../services/bookService';

export default function ManagementLibraryReports() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [range, setRange] = useState('');
  const books = getBooks();
  const loans = getLoans();
  const overdue = loans.filter((l) => l.status !== 'returned' && daysOverdue(l.dueDate) > 0);
  const mostBorrowed = [...books].sort((a, b) => b.borrowedCopies - a.borrowedCopies).slice(0, 5);

  return (
    <div>
      <PageHeader
        title="Library Reports"
        description="Circulation and overdue summary, for management review."
        breadcrumb={[{ label: 'Management', to: '/management' }, { label: 'Library Reports' }]}
        actions={<Button variant="secondary" icon={Download} onClick={() => exportReport('Management Library Report').then(() => showToast('Report exported (demo).', 'success'))}>Export</Button>}
      />

      <div className="flex flex-wrap gap-3 mb-5">
        <FilterDropdown label="Date Range" value={range} onChange={setRange} options={[{ value: 'month', label: 'This Month' }, { value: 'term', label: 'This Term' }]} />
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        <ChartCard title="Most Borrowed Books" description="Top 5 by copies currently borrowed">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={mostBorrowed} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-gray)" />
              <XAxis type="number" stroke="var(--color-mid-gray)" fontSize={12} />
              <YAxis type="category" dataKey="title" stroke="var(--color-mid-gray)" fontSize={11} width={140} />
              <Tooltip />
              <Bar dataKey="borrowedCopies" fill="var(--color-medium-green)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Overdue Summary" description={`${overdue.length} loans currently overdue`}>
          {overdue.length === 0 ? (
            <p className="text-sm text-[var(--color-mid-gray)]">No overdue loans right now.</p>
          ) : (
            <ul className="divide-y divide-[var(--color-border-gray)]">
              {overdue.map((l) => (
                <li key={l.id} className="flex items-center justify-between py-2.5 text-sm cursor-pointer" onClick={() => navigate('/library/overdue')}>
                  <span className="text-[var(--color-dark-gray)]">{l.bookTitle} — {l.borrower}</span>
                  <span className="font-semibold text-[var(--color-status-red)]">{daysOverdue(l.dueDate)} days</span>
                </li>
              ))}
            </ul>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
