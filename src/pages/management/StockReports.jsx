import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Printer, ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import PageHeader from '../../components/layout/PageHeader';
import { ChartCard } from '../../components/cards/InsightChartCards';
import { StatusBadge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import { getItems, getLowStockItems, getUsageByItem, refreshStock, useStockVersion } from '../../services/stockService';
import { exportToCSV } from '../../utils/export';
import { printReport } from '../../utils/print';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

const PIE_COLORS = ['var(--color-medium-green)', 'var(--color-status-blue)'];

export default function ManagementStockReports() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useApp();
  const { hasPermission } = useAuth();
  const stockVersion = useStockVersion();
  const items = useMemo(() => { void stockVersion; return getItems(); }, [stockVersion]);
  const lowStock = useMemo(() => { void stockVersion; return getLowStockItems(); }, [stockVersion]);
  const usage = useMemo(() => { void stockVersion; return getUsageByItem(); }, [stockVersion]);
  useEffect(() => { refreshStock().catch(() => {}); }, []);

  const byCategory = items.reduce((acc, i) => {
    acc[i.category] = (acc[i.category] || 0) + i.quantity;
    return acc;
  }, {});
  const categoryData = Object.entries(byCategory).map(([name, value]) => ({ name, value }));
  const mostUsed = usage.filter((i) => i.used > 0).slice(0, 5);

  const handleExport = () => {
    exportToCSV(
      'management-stock-reports',
      [
        { key: 'name', header: t('item') }, { key: 'category', header: t('category') }, { key: 'quantity', header: t('quantity') }, { key: 'minLevel', header: t('minimumLevel') }, { key: 'status', header: t('status') },
      ],
      items
    );
    showToast(t('stockReportDownloaded'), 'success');
  };

  const handlePrint = () => {
    const ok = printReport(
      'Management Stock Report',
      [
        { key: 'name', header: t('item') }, { key: 'category', header: t('category') }, { key: 'quantity', header: t('quantity') }, { key: 'minLevel', header: t('minimumLevel') }, { key: 'status', header: t('status') },
      ],
      items
    );
    if (!ok) showToast(t('enablePopupsToPrint'), 'error');
  };

  return (
    <div>
      <PageHeader
        title={t('stockReports')}
        description={t('managementStockReportsDescription')}
        breadcrumb={[{ label: t('schoolManagement'), to: '/management' }, { label: t('stockReports') }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" icon={Printer} onClick={handlePrint}>{t('print')}</Button>
            <Button variant="secondary" icon={Download} onClick={handleExport}>{t('export')}</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-5">
          <p className="text-sm text-[var(--color-mid-gray)]">{t('totalStockItems')}</p>
          <p className="font-display text-2xl font-semibold text-[var(--color-dark-gray)] mt-1">{items.length}</p>
        </div>
        <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-5">
          <p className="text-sm text-[var(--color-mid-gray)]">{t('lowStockItems')}</p>
          <p className="font-display text-2xl font-semibold text-[var(--color-status-amber)] mt-1">{lowStock.length}</p>
        </div>
        <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-5">
          <p className="text-sm text-[var(--color-mid-gray)]">{t('mostUsedItem')}</p>
          <p className="font-display text-lg font-semibold text-[var(--color-dark-gray)] mt-1">{mostUsed[0]?.name || '—'}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        <ChartCard title={t('balancesByCategory')} description={t('stockCategoriesDescription')}>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={categoryData} dataKey="value" nameKey="name" outerRadius={85} label>
                {categoryData.map((entry, i) => <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title={t('lowStockItems')}
          description={t('itemsAtOrBelowMinimum')}
          actions={hasPermission('stock.view') ? <Button variant="ghost" size="sm" icon={ArrowRight} iconPosition="right" onClick={() => navigate('/stock/alerts?tab=low-stock')}>{t('viewInStockMis')}</Button> : null}
        >
          {lowStock.length === 0 ? (
            <p className="text-sm text-[var(--color-mid-gray)] py-4">{t('noItemsBelowMinimum')}</p>
          ) : (
            <ul className="divide-y divide-[var(--color-border-gray)]">
              {lowStock.map((i) => (
                <li key={i.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-[var(--color-dark-gray)]">{i.name}</span>
                  <StatusBadge status="low-stock" />
                </li>
              ))}
            </ul>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
