import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Package, AlertTriangle, TrendingDown, TrendingUp, BookMarked } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import StatCard from '../../components/cards/StatCard';
import { InsightCard } from '../../components/cards/InsightChartCards';
import ActivityFeedCard from '../../components/cards/ActivityFeedCard';
import { useAuth } from '../../context/AuthContext';
import { getBooks, getLoans, daysOverdue } from '../../services/bookService';
import { getItems, getLowStockItems, getUsageByItem } from '../../services/stockService';
import { getActivity } from '../../services/activityService';

export default function ManagementDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const books = useMemo(() => getBooks(), []);
  const loans = useMemo(() => getLoans(), []);
  const items = useMemo(() => getItems(), []);
  const lowStock = useMemo(() => getLowStockItems(), []);
  const usage = useMemo(() => getUsageByItem(), []);
  const activity = useMemo(
    () => getActivity().filter((a) => ['Library', 'Stock', 'Management'].includes(a.module)).slice(0, 5),
    []
  );

  const activeLoans = loans.filter((l) => l.status !== 'returned');
  const overdue = activeLoans.filter((l) => daysOverdue(l.dueDate) > 0);
  const mostBorrowed = [...books].sort((a, b) => b.borrowedCopies - a.borrowedCopies)[0];
  const mostUsed = usage.filter((i) => i.used > 0)[0];
  const leastUsed = [...usage].sort((a, b) => a.used - b.used)[0];

  return (
    <div>
      <PageHeader title={`Welcome back, ${user?.fullName?.split(' ')[0]}`} description="Cross-department insights." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Borrowed Books" value={activeLoans.length} icon={BookMarked} onClick={() => navigate('/management/library-reports')} />
        <StatCard label="Overdue Books" value={overdue.length} icon={AlertTriangle} tone="red" onClick={() => navigate('/management/library-reports')} />
        <StatCard label="Stock Items" value={items.length} icon={Package} onClick={() => navigate('/management/stock-reports')} />
        <StatCard label="Low Stock" value={lowStock.length} icon={TrendingDown} tone="amber" onClick={() => navigate('/management/stock-reports')} />
      </div>

      <h2 className="font-display text-lg font-semibold text-[var(--color-heading)] mb-4">Management Insights</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InsightCard
          icon={TrendingUp}
          question="What is being used the most?"
          answer={mostUsed ? `${mostUsed.name}` : 'No usage recorded yet'}
          onClick={() => navigate('/management/insights')}
        />
        <InsightCard
          icon={TrendingDown}
          question="What is rarely used?"
          answer={leastUsed ? `${leastUsed.name}` : 'No usage recorded yet'}
          onClick={() => navigate('/management/insights')}
        />
        <InsightCard
          icon={AlertTriangle}
          question="What is running low?"
          answer={lowStock.length ? `${lowStock.length} items below minimum level` : 'All items above minimum level'}
          tone={lowStock.length ? 'amber' : 'default'}
          onClick={() => navigate('/management/stock-reports')}
        />
        <InsightCard
          icon={BookOpen}
          question="Which books are borrowed most?"
          answer={mostBorrowed ? mostBorrowed.title : 'No loans recorded'}
          onClick={() => navigate('/management/library-reports')}
        />
        <InsightCard
          icon={AlertTriangle}
          question="Which books are overdue?"
          answer={overdue.length ? `${overdue.length} loans overdue` : 'No loans overdue'}
          tone={overdue.length ? 'red' : 'default'}
          onClick={() => navigate('/management/library-reports')}
        />
        <InsightCard
          icon={AlertTriangle}
          question="What needs management attention?"
          answer="View open alerts"
          tone="amber"
          onClick={() => navigate('/notifications')}
        />
      </div>

      <div className="mt-8">
        <ActivityFeedCard
          title="Cross-Department Activity"
          activity={activity}
          viewAllTo="/management/insights"
          viewAllLabel="View insights"
        />
      </div>
    </div>
  );
}
