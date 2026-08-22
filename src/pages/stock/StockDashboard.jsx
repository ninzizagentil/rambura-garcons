import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Boxes, PackageCheck, PackageMinus, TrendingDown, TrendingUp, UtensilsCrossed, Cpu, AlertTriangle } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import StatCard from '../../components/cards/StatCard';
import { InsightCard } from '../../components/cards/InsightChartCards';
import ActivityFeedCard from '../../components/cards/ActivityFeedCard';
import { useAuth } from '../../context/AuthContext';
import { getItems, getTransactions, getLowStockItems, getUsageByItem } from '../../services/stockService';
import { getActivity } from '../../services/activityService';

export default function StockDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const items = useMemo(() => getItems(), []);
  const transactions = useMemo(() => getTransactions(), []);
  const lowStock = useMemo(() => getLowStockItems(), []);
  const usage = useMemo(() => getUsageByItem(), []);
  const activity = useMemo(() => getActivity().filter((a) => a.module === 'Stock').slice(0, 5), []);

  const totalItems = items.length;
  const inStock = items.filter((i) => i.quantity > 0).length;
  const issuedThisPeriod = transactions.filter((t) => t.type === 'out').reduce((s, t) => s + t.quantity, 0);
  const foods = items.filter((i) => i.category === 'Foods');
  const electronics = items.filter((i) => i.category === 'Electronic Devices');

  const mostUsed = usage.filter((i) => i.used > 0)[0];
  const leastUsed = [...usage].sort((a, b) => a.used - b.used)[0];
  const lowestItem = [...lowStock].sort((a, b) => (a.quantity - a.minLevel) - (b.quantity - b.minLevel))[0];

  return (
    <div>
      <PageHeader title={`Welcome back, ${user?.fullName?.split(' ')[0]}`} description="Stock MIS overview." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Stock Items" value={totalItems} icon={Boxes} onClick={() => navigate('/stock/items')} />
        <StatCard label="Items in Stock" value={inStock} icon={PackageCheck} onClick={() => navigate('/stock/items')} />
        <StatCard label="Items Issued/Used" value={issuedThisPeriod} icon={PackageMinus} onClick={() => navigate('/stock/transactions')} />
        <StatCard label="Low Stock" value={lowStock.length} icon={TrendingDown} tone="amber" onClick={() => navigate('/stock/low-stock')} />
        <StatCard label="Foods" value={`${foods.length} items`} icon={UtensilsCrossed} onClick={() => navigate('/stock/items')} />
        <StatCard label="Electronic Devices" value={`${electronics.length} items`} icon={Cpu} onClick={() => navigate('/stock/items')} />
      </div>

      <h2 className="font-display text-lg font-semibold text-[var(--color-heading)] mb-4">Stock Insights</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <InsightCard
          icon={TrendingUp}
          question="What is being used the most?"
          answer={mostUsed ? `${mostUsed.name} (${mostUsed.used} ${mostUsed.unit} used)` : 'No usage recorded yet'}
          onClick={() => navigate('/stock/analytics')}
        />
        <InsightCard
          icon={TrendingDown}
          question="What is rarely used?"
          answer={leastUsed ? `${leastUsed.name} (${leastUsed.used} ${leastUsed.unit} used)` : 'No usage recorded yet'}
          onClick={() => navigate('/stock/analytics')}
        />
        <InsightCard
          icon={AlertTriangle}
          question="What needs restocking most urgently?"
          answer={lowestItem ? `${lowestItem.name} — ${lowestItem.quantity} of ${lowestItem.minLevel} ${lowestItem.unit} minimum` : 'All items above minimum level'}
          tone={lowestItem ? 'amber' : 'default'}
          onClick={() => navigate('/stock/low-stock')}
        />
        <InsightCard
          icon={Boxes}
          question="How is stock split by category?"
          answer={`${foods.length} Foods · ${electronics.length} Electronic Devices`}
          onClick={() => navigate('/stock/items')}
        />
      </div>

      <ActivityFeedCard title="Recent Stock Activity" activity={activity} viewAllTo="/stock/reports" />
    </div>
  );
}
