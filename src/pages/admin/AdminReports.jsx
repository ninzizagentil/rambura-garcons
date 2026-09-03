import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Printer } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import { ChartCard } from '../../components/cards/InsightChartCards';
import Button from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import { printReport } from '../../utils/print';

const LIBRARY_DATA = [
  { month: 'Apr', loans: 62 }, { month: 'May', loans: 74 }, { month: 'Jun', loans: 58 },
  { month: 'Jul', loans: 81 }, { month: 'Aug', loans: 69 },
];
const STOCK_DATA = [
  { month: 'Apr', transactions: 30 }, { month: 'May', transactions: 42 }, { month: 'Jun', transactions: 35 },
  { month: 'Jul', transactions: 48 }, { month: 'Aug', transactions: 39 },
];

export default function AdminReports() {
  const { showToast } = useToast();

  const handlePrint = () => {
    const rows = [
      ...LIBRARY_DATA.map((entry) => ({ module: 'Library', month: entry.month, activity: entry.loans })),
      ...STOCK_DATA.map((entry) => ({ module: 'Stock', month: entry.month, activity: entry.transactions })),
    ];
    const ok = printReport(
      'Cross-Module Activity Report',
      [
        { key: 'module', header: 'Module' },
        { key: 'month', header: 'Month' },
        { key: 'activity', header: 'Activity Count' },
      ],
      rows
    );
    if (!ok) showToast('Enable pop-ups to print this report.', 'error');
  };

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Cross-module activity overview."
        breadcrumb={[{ label: 'Admin', to: '/admin' }, { label: 'Reports' }]}
        actions={<Button variant="secondary" icon={Printer} onClick={handlePrint}>Print</Button>}
      />
      <div className="grid lg:grid-cols-2 gap-5">
        <ChartCard title="Library Activity" description="Monthly loans issued">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={LIBRARY_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-gray)" />
              <XAxis dataKey="month" stroke="var(--color-mid-gray)" fontSize={12} />
              <YAxis stroke="var(--color-mid-gray)" fontSize={12} />
              <Tooltip />
              <Bar dataKey="loans" fill="var(--color-medium-green)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Stock Activity" description="Monthly stock transactions">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={STOCK_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-gray)" />
              <XAxis dataKey="month" stroke="var(--color-mid-gray)" fontSize={12} />
              <YAxis stroke="var(--color-mid-gray)" fontSize={12} />
              <Tooltip />
              <Bar dataKey="transactions" fill="var(--color-gold)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
