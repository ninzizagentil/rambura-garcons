import { useState, useMemo } from 'react';
import { Download, Eye } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import PageHeader from '../../components/layout/PageHeader';
import { ChartCard } from '../../components/cards/InsightChartCards';
import { FilterDropdown } from '../../components/common/SearchBar';
import { StatusBadge } from '../../components/common/Badge';
import IconButton from '../../components/common/IconButton';
import Button from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import { getItems, getTransactions, getLowStockItems, getUsageByItem } from '../../services/stockService';
import { STOCK_CATEGORIES } from '../../data/stock';
import { useNavigate } from 'react-router-dom';

const PIE_COLORS = ['var(--color-medium-green)', 'var(--color-status-blue)'];

export default function StockReports() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [range, setRange] = useState('');
  const [category, setCategory] = useState('');

  const items = useMemo(() => getItems(), []);
  const transactions = useMemo(() => getTransactions(), []);
  const lowStock = useMemo(() => getLowStockItems(), []);
  const usage = useMemo(() => getUsageByItem(), []);

  const filteredItems = category ? items.filter((i) => i.category === category) : items;
  const filteredTx = category ? transactions.filter((t) => t.category === category) : transactions;

  const received = filteredTx.filter((t) => t.type === 'in').reduce((s, t) => s + t.quantity, 0);
  const issued = filteredTx.filter((t) => t.type === 'out').reduce((s, t) => s + t.quantity, 0);

  const byCategory = items.reduce((acc, i) => {
    acc[i.category] = (acc[i.category] || 0) + i.quantity;
    return acc;
  }, {});
  const categoryBalanceData = Object.entries(byCategory).map(([name, value]) => ({ name, value }));

  const mostUsed = usage.filter((i) => (!category || i.category === category) && i.used > 0).slice(0, 5);
  const leastUsed = [...usage].filter((i) => !category || i.category === category).sort((a, b) => a.used - b.used).slice(0, 5);

  const handleExport = () => showToast('Stock report exported (demo).', 'success');

  return (
    <div>
      <PageHeader
        title="Stock Reports"
        description="Received, issued, balances, and category breakdowns."
        breadcrumb={[{ label: 'Stock', to: '/stock' }, { label: 'Reports' }]}
        actions={<Button variant="secondary" icon={Download} onClick={handleExport}>Export</Button>}
      />

      <div className="flex flex-wrap gap-3 mb-5">
        <FilterDropdown label="Date Range" value={range} onChange={setRange} options={[{ value: 'month', label: 'This Month' }, { value: 'term', label: 'This Term' }, { value: 'year', label: 'This Year' }]} />
        <FilterDropdown label="All Categories" value={category} onChange={setCategory} options={STOCK_CATEGORIES.map((c) => ({ value: c, label: c }))} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div className="bg-white rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-5">
          <p className="text-sm text-[var(--color-mid-gray)]">Received Stock</p>
          <p className="font-display text-2xl font-semibold text-[var(--color-status-green)] mt-1">+{received}</p>
        </div>
        <div className="bg-white rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-5">
          <p className="text-sm text-[var(--color-mid-gray)]">Issued / Used Stock</p>
          <p className="font-display text-2xl font-semibold text-[var(--color-status-amber)] mt-1">−{issued}</p>
        </div>
        <div className="bg-white rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-5">
          <p className="text-sm text-[var(--color-mid-gray)]">Items Tracked</p>
          <p className="font-display text-2xl font-semibold text-[var(--color-dark-gray)] mt-1">{filteredItems.length}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        <ChartCard title="Current Balances by Category" description="Foods vs. Electronic Devices">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={categoryBalanceData} dataKey="value" nameKey="name" outerRadius={85} label>
                {categoryBalanceData.map((entry, i) => <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Most Used Items" description="Top items by total quantity issued">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={mostUsed}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-gray)" />
              <XAxis dataKey="name" stroke="var(--color-mid-gray)" fontSize={11} interval={0} angle={-15} textAnchor="end" height={50} />
              <YAxis stroke="var(--color-mid-gray)" fontSize={12} />
              <Tooltip />
              <Bar dataKey="used" fill="var(--color-medium-green)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        <ChartCard title="Low Stock Items" description="Current items at or below minimum level">
          {lowStock.length === 0 ? (
            <p className="text-sm text-[var(--color-mid-gray)] py-4">No items currently below minimum level.</p>
          ) : (
            <ul className="divide-y divide-[var(--color-border-gray)]">
              {lowStock.map((i) => (
                <li key={i.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-[var(--color-dark-gray)]">{i.name}</span>
                  <div className="flex items-center gap-2">
                    <StatusBadge status="low-stock" />
                    <IconButton icon={Eye} label={`View ${i.name}`} onClick={() => navigate(`/stock/items/${i.id}`)} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ChartCard>

        <ChartCard title="Least Used Items" description="Bottom items by total quantity issued">
          <ul className="divide-y divide-[var(--color-border-gray)]">
            {leastUsed.map((i) => (
              <li key={i.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-[var(--color-dark-gray)]">{i.name}</span>
                <span className="font-semibold text-[var(--color-gold)]">{i.used} used</span>
              </li>
            ))}
          </ul>
        </ChartCard>
      </div>
    </div>
  );
}
