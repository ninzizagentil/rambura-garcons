import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import PageHeader from '../../components/layout/PageHeader';
import { ChartCard } from '../../components/cards/InsightChartCards';
import { StatusBadge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import { getItems, getLowStockItems, getUsageByItem } from '../../services/stockService';

const PIE_COLORS = ['var(--color-medium-green)', 'var(--color-status-blue)'];

export default function ManagementStockReports() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const items = useMemo(() => getItems(), []);
  const lowStock = useMemo(() => getLowStockItems(), []);
  const usage = useMemo(() => getUsageByItem(), []);

  const byCategory = items.reduce((acc, i) => {
    acc[i.category] = (acc[i.category] || 0) + i.quantity;
    return acc;
  }, {});
  const categoryData = Object.entries(byCategory).map(([name, value]) => ({ name, value }));
  const mostUsed = usage.filter((i) => i.used > 0).slice(0, 5);

  return (
    <div>
      <PageHeader
        title="Stock Reports"
        description="Stock overview for school management."
        breadcrumb={[{ label: 'Management', to: '/management' }, { label: 'Stock Reports' }]}
        actions={<Button variant="secondary" icon={Download} onClick={() => showToast('Report exported (demo).', 'success')}>Export</Button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div className="bg-white rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-5">
          <p className="text-sm text-[var(--color-mid-gray)]">Total Stock Items</p>
          <p className="font-display text-2xl font-semibold text-[var(--color-dark-gray)] mt-1">{items.length}</p>
        </div>
        <div className="bg-white rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-5">
          <p className="text-sm text-[var(--color-mid-gray)]">Low Stock Items</p>
          <p className="font-display text-2xl font-semibold text-[var(--color-status-amber)] mt-1">{lowStock.length}</p>
        </div>
        <div className="bg-white rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-5">
          <p className="text-sm text-[var(--color-mid-gray)]">Most Used Item</p>
          <p className="font-display text-lg font-semibold text-[var(--color-dark-gray)] mt-1">{mostUsed[0]?.name || '—'}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        <ChartCard title="Balances by Category" description="Foods vs. Electronic Devices">
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
          title="Low Stock Items"
          description="Items at or below minimum level"
          actions={<Button variant="ghost" size="sm" icon={ArrowRight} iconPosition="right" onClick={() => navigate('/stock/low-stock')}>View in Stock MIS</Button>}
        >
          {lowStock.length === 0 ? (
            <p className="text-sm text-[var(--color-mid-gray)] py-4">No items currently below minimum level.</p>
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
