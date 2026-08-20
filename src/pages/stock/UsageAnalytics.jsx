import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Legend } from 'recharts';
import PageHeader from '../../components/layout/PageHeader';
import { ChartCard } from '../../components/cards/InsightChartCards';
import { FilterDropdown } from '../../components/common/SearchBar';
import { getUsageByItem } from '../../services/stockService';
import { STOCK_CATEGORIES } from '../../data/stock';

const USAGE_TREND = [
  { month: 'Apr', Foods: 180, 'Electronic Devices': 12 },
  { month: 'May', Foods: 210, 'Electronic Devices': 18 },
  { month: 'Jun', Foods: 165, 'Electronic Devices': 9 },
  { month: 'Jul', Foods: 240, 'Electronic Devices': 22 },
  { month: 'Aug', Foods: 195, 'Electronic Devices': 14 },
];

export default function UsageAnalytics() {
  const [range, setRange] = useState('');
  const [category, setCategory] = useState('');
  const usage = useMemo(() => getUsageByItem(), []);

  const filteredUsage = useMemo(() => (category ? usage.filter((i) => i.category === category) : usage), [usage, category]);

  const mostUsed = filteredUsage.filter((i) => i.used > 0).slice(0, 6);
  const leastUsed = [...filteredUsage].sort((a, b) => a.used - b.used).slice(0, 6);

  const trendData = category ? USAGE_TREND.map((row) => ({ month: row.month, [category]: row[category] })) : USAGE_TREND;

  return (
    <div>
      <PageHeader
        title="Usage Analytics"
        description="Most used, least used, and usage trends across stock categories."
        breadcrumb={[{ label: 'Stock', to: '/stock' }, { label: 'Usage Analytics' }]}
      />

      <div className="flex flex-wrap gap-3 mb-5">
        <FilterDropdown label="Date Range" value={range} onChange={setRange} options={[{ value: 'month', label: 'This Month' }, { value: 'term', label: 'This Term' }, { value: 'year', label: 'This Year' }]} />
        <FilterDropdown label="All Categories" value={category} onChange={setCategory} options={STOCK_CATEGORIES.map((c) => ({ value: c, label: c }))} />
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        <ChartCard title="Most Used Items" description="Ranked by total quantity issued (Stock Out)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={mostUsed} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-gray)" />
              <XAxis type="number" stroke="var(--color-mid-gray)" fontSize={12} />
              <YAxis type="category" dataKey="name" stroke="var(--color-mid-gray)" fontSize={12} width={140} />
              <Tooltip />
              <Bar dataKey="used" name="Used" fill="var(--color-medium-green)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Least Used Items" description="Lowest quantity issued (Stock Out)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={leastUsed} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-gray)" />
              <XAxis type="number" stroke="var(--color-mid-gray)" fontSize={12} />
              <YAxis type="category" dataKey="name" stroke="var(--color-mid-gray)" fontSize={12} width={140} />
              <Tooltip />
              <Bar dataKey="used" name="Used" fill="var(--color-gold)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Usage Trends" description="Foods vs. Electronic Devices usage per month">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-gray)" />
            <XAxis dataKey="month" stroke="var(--color-mid-gray)" fontSize={12} />
            <YAxis stroke="var(--color-mid-gray)" fontSize={12} />
            <Tooltip />
            <Legend />
            {(!category || category === 'Foods') && <Line type="monotone" dataKey="Foods" stroke="var(--color-medium-green)" strokeWidth={2} />}
            {(!category || category === 'Electronic Devices') && <Line type="monotone" dataKey="Electronic Devices" stroke="var(--color-status-blue)" strokeWidth={2} />}
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
