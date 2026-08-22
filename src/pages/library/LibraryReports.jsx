import { useState } from 'react';
import { Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import PageHeader from '../../components/layout/PageHeader';
import { ChartCard } from '../../components/cards/InsightChartCards';
import { FilterDropdown } from '../../components/common/SearchBar';
import Button from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import { getBooks } from '../../services/bookService';
import { exportToCSV } from '../../utils/export';

const CIRCULATION = [
  { month: 'Apr', loans: 62, returns: 58 }, { month: 'May', loans: 74, returns: 69 },
  { month: 'Jun', loans: 58, returns: 60 }, { month: 'Jul', loans: 81, returns: 75 },
  { month: 'Aug', loans: 69, returns: 64 },
];
const PIE_COLORS = ['var(--color-medium-green)', 'var(--color-gold)', 'var(--color-status-blue)', 'var(--color-status-amber)'];

export default function LibraryReports() {
  const { showToast } = useToast();
  const [range, setRange] = useState('');
  const books = getBooks();

  const byCategory = books.reduce((acc, b) => {
    acc[b.category] = (acc[b.category] || 0) + b.totalCopies;
    return acc;
  }, {});
  const categoryData = Object.entries(byCategory).map(([name, value]) => ({ name, value }));

  const mostBorrowed = [...books].sort((a, b) => b.borrowedCopies - a.borrowedCopies).slice(0, 5);

  const handleExport = () => {
    exportToCSV(
      'library-reports',
      [
        { key: 'title', header: 'Title' },
        { key: 'category', header: 'Category' },
        { key: 'totalCopies', header: 'Total Copies' },
        { key: 'availableCopies', header: 'Available' },
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
        description="Circulation, trends, and availability."
        breadcrumb={[{ label: 'Library', to: '/library' }, { label: 'Reports' }]}
        actions={<Button variant="secondary" icon={Download} onClick={handleExport}>Export</Button>}
      />

      <div className="flex flex-wrap gap-3 mb-5">
        <FilterDropdown label="Date Range" value={range} onChange={setRange} options={[{ value: 'month', label: 'This Month' }, { value: 'term', label: 'This Term' }, { value: 'year', label: 'This Year' }]} />
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        <ChartCard title="Circulation" description="Loans vs. returns per month">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={CIRCULATION}>
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

        <ChartCard title="Availability by Category" description="Total copies per category">
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

      <ChartCard title="Most Borrowed Books" description="Top 5 by copies currently borrowed">
        <ul className="divide-y divide-[var(--color-border-gray)]">
          {mostBorrowed.map((b) => (
            <li key={b.id} className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-[var(--color-dark-gray)]">{b.title}</span>
              <span className="font-semibold text-[var(--color-medium-green)]">{b.borrowedCopies} borrowed</span>
            </li>
          ))}
        </ul>
      </ChartCard>
    </div>
  );
}
