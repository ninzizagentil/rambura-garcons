import { useNavigate } from 'react-router-dom';
import { Boxes, PackageCheck, PackageMinus, TrendingDown, UtensilsCrossed, Cpu } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import StatCard from '../../components/cards/StatCard';
import { useAuth } from '../../context/AuthContext';
import { getItems, getTransactions, getLowStockItems } from '../../services/stockService';

export default function StockDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const items = getItems();
  const transactions = getTransactions();
  const lowStock = getLowStockItems();

  const totalItems = items.length;
  const inStock = items.filter((i) => i.quantity > 0).length;
  const issuedThisPeriod = transactions.filter((t) => t.type === 'out').reduce((s, t) => s + t.quantity, 0);
  const foods = items.filter((i) => i.category === 'Foods');
  const electronics = items.filter((i) => i.category === 'Electronic Devices');

  return (
    <div>
      <PageHeader title={`Welcome back, ${user?.fullName?.split(' ')[0]}`} description="Stock MIS overview." />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Stock Items" value={totalItems} icon={Boxes} onClick={() => navigate('/stock/items')} />
        <StatCard label="Items in Stock" value={inStock} icon={PackageCheck} onClick={() => navigate('/stock/items')} />
        <StatCard label="Items Issued/Used" value={issuedThisPeriod} icon={PackageMinus} onClick={() => navigate('/stock/transactions')} />
        <StatCard label="Low Stock" value={lowStock.length} icon={TrendingDown} tone="amber" onClick={() => navigate('/stock/low-stock')} />
        <StatCard label="Foods" value={`${foods.length} items`} icon={UtensilsCrossed} onClick={() => navigate('/stock/items')} />
        <StatCard label="Electronic Devices" value={`${electronics.length} items`} icon={Cpu} onClick={() => navigate('/stock/items')} />
      </div>
    </div>
  );
}
