import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Boxes, PackageCheck, PackageMinus, PackagePlus, TrendingDown, TrendingUp,
  AlertTriangle, PackageX, Wallet, ShieldAlert, Archive, FileBarChart, Plus,
} from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import StatCard from '../../components/cards/StatCard';
import { InsightCard } from '../../components/cards/InsightChartCards';
import Button from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import {
  getItems, getTransactions, getLowStockItems, getOutOfStockItems, getExpiredItems,
  getExpiringSoonItems, getDamagedItems, getRemovedItems, getTotalStockValue, getUsageByItem,
} from '../../services/stockService';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { ROLES } from '../../data/roles';

function formatRWF(amount) {
  return `RWF ${Math.round(amount || 0).toLocaleString('en-US')}`;
}

const TX_BADGE = {
  in: { tone: 'green', label: 'Stock In' },
  out: { tone: 'amber', label: 'Stock Out' },
  adjustment: { tone: 'blue', label: 'Adjustment' },
  transfer: { tone: 'blue', label: 'Transfer' },
  damaged: { tone: 'orange', label: 'Damaged' },
  removed: { tone: 'red', label: 'Removed' },
};

const ATTENTION_TONE = {
  'out-of-stock': 'red',
  'low-stock': 'amber',
  expired: 'purple',
  'expiring-soon': 'amber',
  damaged: 'orange',
};

export default function StockDashboard() {
  const navigate = useNavigate();
  const { viewOnly } = useModuleAccess(ROLES.STOCK_MANAGER);

  const items = useMemo(() => getItems(), []);
  const transactions = useMemo(() => getTransactions(), []);
  const lowStock = useMemo(() => getLowStockItems(), []);
  const outOfStock = useMemo(() => getOutOfStockItems(), []);
  const expired = useMemo(() => getExpiredItems(), []);
  const expiringSoon = useMemo(() => getExpiringSoonItems(), []);
  const damaged = useMemo(() => getDamagedItems(), []);
  const removed = useMemo(() => getRemovedItems(), []);
  const totalValue = useMemo(() => getTotalStockValue(), []);
  const usage = useMemo(() => getUsageByItem(), []);

  const totalItems = items.length;
  const inStock = items.filter((i) => i.quantity > 0).length;
  const stockInTotal = transactions.filter((t) => t.type === 'in').reduce((s, t) => s + t.quantity, 0);
  const stockOutTotal = transactions.filter((t) => t.type === 'out').reduce((s, t) => s + t.quantity, 0);
  const foods = items.filter((i) => i.category === 'Foods');
  const electronics = items.filter((i) => i.category === 'Electronic Devices');

  const mostUsed = usage.filter((i) => i.used > 0)[0];
  const lowestItem = [...lowStock].sort((a, b) => (a.quantity - a.minLevel) - (b.quantity - b.minLevel))[0];

  const recentTx = transactions.slice(0, 8);

  // Attention Required — union of the states that need action, most urgent first.
  const attention = [
    ...outOfStock.map((i) => ({ key: `oos-${i.id}`, name: i.name, sub: `0 ${i.unit}`, badge: 'out-of-stock', label: 'Out of Stock', action: 'Restock', to: `/stock/stock-in?item=${i.id}` })),
    ...lowStock.filter((i) => i.quantity > 0).map((i) => ({ key: `low-${i.id}`, name: i.name, sub: `${i.quantity} ${i.unit}`, badge: 'low-stock', label: 'Low Stock', action: 'Restock', to: `/stock/stock-in?item=${i.id}` })),
    ...expired.map((i) => ({ key: `exp-${i.id}`, name: i.name, sub: `Expired ${Math.abs(i.expiryDaysRemaining)} days ago`, badge: 'expired', label: 'Expired', action: 'Review', to: '/stock/expired' })),
    ...expiringSoon.map((i) => ({ key: `soon-${i.id}`, name: i.name, sub: `${i.expiryDaysRemaining} days left`, badge: 'expiring-soon', label: 'Expiring Soon', action: 'Review', to: '/stock/expired' })),
    ...damaged.map((d) => ({ key: `dmg-${d.id}`, name: d.itemName, sub: `${d.quantity} ${d.unit} — ${d.reason}`, badge: 'damaged', label: 'Damaged', action: 'Review', to: '/stock/damaged' })),
  ].slice(0, 8);

  return (
    <div>
      <PageHeader
        title="Stock Management"
        description="Overview of inventory, stock availability and stock activities."
        actions={
          !viewOnly && (
            <>
              <Button variant="secondary" icon={PackageMinus} onClick={() => navigate('/stock/stock-out')}>Stock Out</Button>
              <Button variant="secondary" icon={PackagePlus} onClick={() => navigate('/stock/stock-in')}>Stock In</Button>
              <Button icon={Plus} onClick={() => navigate('/stock/items')}>Add Item</Button>
            </>
          )
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Items" value={totalItems} icon={Boxes} onClick={() => navigate('/stock/items')} />
        <StatCard label="Items In Stock" value={inStock} icon={PackageCheck} onClick={() => navigate('/stock/items')} />
        <StatCard label="Low Stock" value={lowStock.length} icon={TrendingDown} tone="amber" onClick={() => navigate('/stock/low-stock')} />
        <StatCard label="Out of Stock" value={outOfStock.length} icon={PackageX} tone="red" onClick={() => navigate('/stock/out-of-stock')} />
        <StatCard label="Total Stock Value" value={formatRWF(totalValue)} icon={Wallet} tone="gold" onClick={() => navigate('/stock/reports')} />
        <StatCard label="Stock In (all time)" value={stockInTotal} icon={PackagePlus} tone="blue" onClick={() => navigate('/stock/transactions')} />
        <StatCard label="Stock Out (all time)" value={stockOutTotal} icon={PackageMinus} onClick={() => navigate('/stock/transactions')} />
        <StatCard label="Removed / Disposed" value={removed.length} icon={Archive} onClick={() => navigate('/stock/removed')} />
      </div>

      <div className="grid lg:grid-cols-5 gap-5 mb-8">
        <div className="lg:col-span-3 bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-[var(--color-dark-gray)]">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--color-status-red-bg)] text-[var(--color-status-red)]">
                <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
              </span>
              Attention Required
            </h2>
          </div>
          {attention.length === 0 ? (
            <p className="text-sm text-[var(--color-mid-gray)]">Nothing needs attention right now — inventory is healthy.</p>
          ) : (
            <ul className="divide-y divide-[var(--color-border-gray)]">
              {attention.map((a) => (
                <li key={a.key} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--color-dark-gray)] truncate">{a.name}</p>
                    <p className="text-xs text-[var(--color-mid-gray)]">{a.sub}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge tone={ATTENTION_TONE[a.badge]}>{a.label}</Badge>
                    {!viewOnly && (
                      <Button size="sm" variant="outline" onClick={() => navigate(a.to)}>{a.action}</Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 gap-4">
          <InsightCard
            icon={TrendingUp}
            question="What is being used the most?"
            answer={mostUsed ? `${mostUsed.name} (${mostUsed.used} ${mostUsed.unit} used)` : 'No usage recorded yet'}
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
      </div>

      <div className="bg-[var(--color-white)] rounded-[var(--radius-card)] border border-[var(--color-border-gray)] p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-[var(--color-dark-gray)]">
            <FileBarChart className="w-4 h-4 text-[var(--color-heading)]" aria-hidden="true" />
            Recent Stock Activity
          </h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/stock/transactions')}>View All Transactions</Button>
        </div>
        {recentTx.length === 0 ? (
          <p className="text-sm text-[var(--color-mid-gray)]">No stock movements recorded yet.</p>
        ) : (
          <div className="table-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border-gray)] text-xs uppercase text-[var(--color-mid-gray)]">
                  <th className="text-left py-2 pr-4">Item</th>
                  <th className="text-left py-2 pr-4">Type</th>
                  <th className="text-left py-2 pr-4">Quantity</th>
                  <th className="text-left py-2 pr-4">Prev → New</th>
                  <th className="text-left py-2 pr-4">User</th>
                  <th className="text-left py-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-gray)]">
                {recentTx.map((t) => {
                  const badge = TX_BADGE[t.type] || { tone: 'neutral', label: t.type };
                  return (
                    <tr key={t.id}>
                      <td className="py-2.5 pr-4 font-medium text-[var(--color-dark-gray)]">{t.itemName}</td>
                      <td className="py-2.5 pr-4"><Badge tone={badge.tone}>{badge.label}</Badge></td>
                      <td className="py-2.5 pr-4">{t.quantity}</td>
                      <td className="py-2.5 pr-4 text-[var(--color-mid-gray)]">
                        {t.previousQuantity != null ? `${t.previousQuantity} → ${t.newQuantity}` : '—'}
                      </td>
                      <td className="py-2.5 pr-4">{t.responsibleUser}</td>
                      <td className="py-2.5">{t.date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
