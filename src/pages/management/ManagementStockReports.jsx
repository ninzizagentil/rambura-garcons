import { useState } from 'react';
import { Download } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import { ChartCard } from '../../components/cards/InsightChartCards';
import { FilterDropdown } from '../../components/common/SearchBar';
import Button from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import { exportReport } from '../../services/reportService';
import { getLowStockItems, getUsageByItem, getTransactions } from '../../services/stockService';
import { STOCK_CATEGORIES } from '../../data/stock';

export default function ManagementStockReports() {
  const { showToast } = useToast();
  const [categoryFilter, setCategoryFilter] = useState('');
  const lowStock = getLowStockItems().filter((i) => !categoryFilter || i.category === categoryFilter);
  const usage = getUsageByItem().filter((i) => !categoryFilter || i.category === categoryFilter);
  const transactions = getTransactions();
  const mostUsed = usage.slice(0, 5);
  const issued = transactions.filter((t) => t.type === 'out').reduce((s, t) => s + t.quantity, 0);
  const received = transactions.filter((t) => t.type === 'in').reduce((s, t) => s + t.quantity, 0);

  return (
    <div>
      <PageHeader
        title="Stock Reports"
        description="Stock movement and low-stock overview, for management review."
        breadcrumb={[{ label: 'Management', to: '/management' }, { label: 'Stock Reports' }]}
        actions={<Button variant="secondary" icon={Download} onClick={() => exportReport('Management Stock Report').then(() => showToast('Report exported (demo).', 'success'))}>Export</Button>}
      />

      <div className="flex flex-wrap gap-3 mb-5">
        <FilterDropdown label="All Categories" value={categoryFilter} onChange={setCategoryFilter} options={STOCK_CATEGORIES.map((c) => ({ value: c, label: c }))} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-5">
        <ChartCard title="Received Stock" description="Total quantity Stocked In">
          <p className="font-display text-3xl font-semibold text-[var(--color-status-green)]">{received}</p>
        </ChartCard>
        <ChartCard title="Issued / Used Stock" description="Total quantity Stocked Out">
          <p className="font-display text-3xl font-semibold text-[var(--color-status-amber)]">{issued}</p>
        </ChartCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <ChartCard title="Most Used Items" description="Top 5 by quantity issued">
          <ul className="divide-y divide-[var(--color-border-gray)]">
            {mostUsed.map((i) => (
              <li key={i.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-[var(--color-dark-gray)]">{i.name}</span>
                <span className="font-semibold text-[var(--color-medium-green)]">{i.used} {i.unit}</span>
              </li>
            ))}
          </ul>
        </ChartCard>

        <ChartCard title="Low Stock Items" description="Need restocking soon">
          {lowStock.length === 0 ? (
            <p className="text-sm text-[var(--color-mid-gray)]">Every item is currently at or above its minimum level.</p>
          ) : (
            <ul className="divide-y divide-[var(--color-border-gray)]">
              {lowStock.map((i) => (
                <li key={i.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-[var(--color-dark-gray)]">{i.name}</span>
                  <span className="font-semibold text-[var(--color-status-amber)]">{i.quantity}/{i.minLevel} {i.unit}</span>
                </li>
              ))}
            </ul>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
