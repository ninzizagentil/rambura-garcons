import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Legend } from 'recharts';
import PageHeader from '../../components/layout/PageHeader';
import { ChartCard } from '../../components/cards/InsightChartCards';
import { FilterDropdown } from '../../components/common/SearchBar';
import { getUsageByItem, getTransactions, getStockValueByCategory } from '../../services/stockService';
import { STOCK_CATEGORIES } from '../../data/stock';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Groups every recorded transaction by calendar month, real data only — no placeholder numbers. */
function buildMonthlyTrend(transactions, category) {
  const rows = category ? transactions.filter((t) => t.category === category) : transactions;
  const byMonth = {};
  rows.forEach((t) => {
    const key = t.date?.slice(0, 7); // YYYY-MM
    if (!key) return;
    if (!byMonth[key]) byMonth[key] = { in: 0, out: 0, adjustment: 0, removed: 0 };
    if (t.type === 'in') byMonth[key].in += t.quantity;
    else if (t.type === 'out') byMonth[key].out += t.quantity;
    else if (t.type === 'adjustment') byMonth[key].adjustment += 1;
    else if (t.type === 'removed') byMonth[key].removed += t.quantity;
  });
  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, vals]) => ({ month: MONTH_LABELS[Number(key.slice(5, 7)) - 1], ...vals }));
}

export default function UsageAnalytics() {
  const [category, setCategory] = useState('');
  const usage = useMemo(() => getUsageByItem(), []);
  const transactions = useMemo(() => getTransactions(), []);
  const valueByCategory = useMemo(() => getStockValueByCategory(), []);

  const filteredUsage = useMemo(() => (category ? usage.filter((i) => i.category === category) : usage), [usage, category]);

  // "Fast moving" = stocked out at all (ranked by volume); "slow moving" = used the least,
  // including items never issued — both meaningful signals for a stock manager.
  const fastMoving = filteredUsage.filter((i) => i.used > 0).slice(0, 6);
  const slowMoving = [...filteredUsage].sort((a, b) => a.used - b.used).slice(0, 6);

  const trendData = useMemo(() => buildMonthlyTrend(transactions, category), [transactions, category]);

  return (
    <div>
      <PageHeader
        title="Usage Analytics"
        description="Fast-moving, slow-moving items, and real stock movement trends."
        breadcrumb={[{ label: 'Stock', to: '/stock' }, { label: 'Usage Analytics' }]}
      />

      <div className="flex flex-wrap gap-3 mb-5">
        <FilterDropdown label="All Categories" value={category} onChange={setCategory} options={STOCK_CATEGORIES.map((c) => ({ value: c, label: c }))} />
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        <ChartCard title="Fast Moving Items" description="Ranked by total quantity issued (Stock Out)">
          {fastMoving.length === 0 ? (
            <p className="text-sm text-[var(--color-mid-gray)] py-6 text-center">No Stock Out activity recorded yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={fastMoving} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-gray)" />
                <XAxis type="number" stroke="var(--color-mid-gray)" fontSize={12} />
                <YAxis type="category" dataKey="name" stroke="var(--color-mid-gray)" fontSize={12} width={140} />
                <Tooltip />
                <Bar dataKey="used" name="Used" fill="var(--color-medium-green)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Slow Moving Items" description="Lowest quantity issued (Stock Out), including never-issued items">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={slowMoving} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-gray)" />
              <XAxis type="number" stroke="var(--color-mid-gray)" fontSize={12} />
              <YAxis type="category" dataKey="name" stroke="var(--color-mid-gray)" fontSize={12} width={140} />
              <Tooltip />
              <Bar dataKey="used" name="Used" fill="var(--color-gold)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Stock Movement Trends" description="Stock In, Stock Out, Adjustments, and Removed Stock, by month" className="mb-5">
        {trendData.length === 0 ? (
          <p className="text-sm text-[var(--color-mid-gray)] py-6 text-center">No transaction history yet for this filter.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-gray)" />
              <XAxis dataKey="month" stroke="var(--color-mid-gray)" fontSize={12} />
              <YAxis stroke="var(--color-mid-gray)" fontSize={12} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="in" name="Stock In" stroke="var(--color-medium-green)" strokeWidth={2} />
              <Line type="monotone" dataKey="out" name="Stock Out" stroke="var(--color-status-amber)" strokeWidth={2} />
              <Line type="monotone" dataKey="adjustment" name="Adjustments" stroke="var(--color-status-blue)" strokeWidth={2} />
              <Line type="monotone" dataKey="removed" name="Removed" stroke="var(--color-status-red)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Stock Value by Category" description="Current inventory value, Foods vs. Electronic Devices">
        <div className="grid sm:grid-cols-2 gap-4">
          {valueByCategory.map((c) => (
            <div key={c.category} className="rounded-[var(--radius-control)] bg-[var(--color-off-white)] p-4">
              <p className="text-sm text-[var(--color-mid-gray)]">{c.category} — {c.count} item{c.count === 1 ? '' : 's'}</p>
              <p className="font-display text-xl font-semibold text-[var(--color-dark-gray)] mt-1">RWF {Math.round(c.value).toLocaleString('en-US')}</p>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}
