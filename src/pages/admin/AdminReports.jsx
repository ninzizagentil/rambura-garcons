import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Printer } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import { ChartCard } from '../../components/cards/InsightChartCards';
import Button from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import { useApp } from '../../context/AppContext';
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
  const { t } = useApp();

  const handlePrint = () => {
    const rows = [
      ...LIBRARY_DATA.map((entry) => ({ module: 'Library', month: entry.month, activity: entry.loans })),
      ...STOCK_DATA.map((entry) => ({ module: 'Stock', month: entry.month, activity: entry.transactions })),
    ];
    const ok = printReport(
      t('crossModuleActivityReport'),
      [
        { key: 'module', header: t('module') },
        { key: 'month', header: t('month') },
        { key: 'activity', header: t('activityCount') },
      ],
      rows
    );
    if (!ok) showToast(t('enablePopupsToPrint'), 'error');
  };

  return (
    <div>
      <PageHeader
        title={t('reports')}
        description={t('crossModuleActivityOverview')}
        breadcrumb={[{ label: t('admin'), to: '/admin' }, { label: t('reports') }]}
        actions={<Button variant="secondary" icon={Printer} onClick={handlePrint}>{t('print')}</Button>}
      />
      <div className="grid lg:grid-cols-2 gap-5">
        <ChartCard title={t('libraryActivity')} description={t('monthlyLoansIssued')}>
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
        <ChartCard title={t('stockActivity')} description={t('monthlyStockTransactions')}>
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
