import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, AlertTriangle, BookOpen, Bell } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import { InsightCard } from '../../components/cards/InsightChartCards';
import { getBooks, getLoans, daysOverdue } from '../../services/bookService';
import { getLowStockItems, getUsageByItem } from '../../services/stockService';
import { useNotifications } from '../../context/NotificationContext';

export default function ManagementInsights() {
  const navigate = useNavigate();
  const books = useMemo(() => getBooks(), []);
  const loans = useMemo(() => getLoans(), []);
  const lowStock = useMemo(() => getLowStockItems(), []);
  const usage = useMemo(() => getUsageByItem(), []);
  const { notifications } = useNotifications();

  const overdue = loans.filter((l) => l.status !== 'returned' && daysOverdue(l.dueDate) > 0);
  const mostBorrowed = [...books].sort((a, b) => b.borrowedCopies - a.borrowedCopies)[0];
  const mostUsed = usage.filter((i) => i.used > 0)[0];
  const leastUsed = [...usage].sort((a, b) => a.used - b.used)[0];
  const openAlerts = notifications.filter((n) => !n.read);

  return (
    <div>
      <PageHeader
        title="Management Insights"
        description="Cross-department signals worth your attention."
        breadcrumb={[{ label: 'Management', to: '/management' }, { label: 'Management Insights' }]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          question="What is running low?"
          answer={lowStock.length ? `${lowStock.length} item(s) below minimum level` : 'All items above minimum level'}
          tone={lowStock.length ? 'amber' : 'default'}
          onClick={() => navigate('/stock/low-stock')}
        />
        <InsightCard
          icon={BookOpen}
          question="Which books are borrowed most?"
          answer={mostBorrowed ? `${mostBorrowed.title} (${mostBorrowed.borrowedCopies} borrowed)` : 'No loans recorded'}
          onClick={() => navigate('/library/reports')}
        />
        <InsightCard
          icon={AlertTriangle}
          question="Which books are overdue?"
          answer={overdue.length ? `${overdue.length} loan(s) overdue` : 'No loans overdue'}
          tone={overdue.length ? 'red' : 'default'}
          onClick={() => navigate('/library/overdue')}
        />
        <InsightCard
          icon={Bell}
          question="What needs management attention?"
          answer={openAlerts.length ? `${openAlerts.length} open alert(s)` : 'No open alerts'}
          tone={openAlerts.length ? 'amber' : 'default'}
          onClick={() => navigate('/notifications')}
        />
      </div>
    </div>
  );
}
