import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, AlertTriangle, BookOpen, Bell } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import { InsightCard } from '../../components/cards/InsightChartCards';
import { getBooks, getLoans, daysOverdue } from '../../services/bookService';
import { getLowStockItems, getUsageByItem } from '../../services/stockService';
import { useNotifications } from '../../context/NotificationContext';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export default function ManagementInsights() {
  const navigate = useNavigate();
  const { t } = useApp();
  const { hasPermission } = useAuth();
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
        title={t('managementInsights')}
        description={t('managementInsightsDescription')}
        breadcrumb={[{ label: t('schoolManagement'), to: '/management' }, { label: t('managementInsights') }]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {hasPermission('stock.reports') && <InsightCard
          icon={TrendingUp}
          question={t('mostUsedQuestion')}
          answer={mostUsed ? t('usedItemAnswer', { name: mostUsed.name, count: mostUsed.used, unit: mostUsed.unit }) : t('noUsageRecorded')}
          onClick={() => navigate('/stock/reports?tab=analytics')}
        />}
        {hasPermission('stock.reports') && <InsightCard
          icon={TrendingDown}
          question={t('leastUsedQuestion')}
          answer={leastUsed ? t('usedItemAnswer', { name: leastUsed.name, count: leastUsed.used, unit: leastUsed.unit }) : t('noUsageRecorded')}
          onClick={() => navigate('/stock/reports?tab=analytics')}
        />}
        {hasPermission('stock.reports') && <InsightCard
          icon={AlertTriangle}
          question={t('runningLowQuestion')}
          answer={lowStock.length ? t('itemsBelowMinimum', { count: lowStock.length }) : t('allItemsAboveMinimum')}
          tone={lowStock.length ? 'amber' : 'default'}
          onClick={() => navigate('/stock/alerts?tab=low-stock')}
        />}
        {hasPermission('library.reports') && <InsightCard
          icon={BookOpen}
          question={t('mostBorrowedBooksQuestion')}
          answer={mostBorrowed ? t('borrowedBookAnswer', { title: mostBorrowed.title, count: mostBorrowed.borrowedCopies }) : t('noLoansRecorded')}
          onClick={() => navigate('/library/reports')}
        />}
        {hasPermission('library.reports') && <InsightCard
          icon={AlertTriangle}
          question={t('overdueBooksQuestion')}
          answer={overdue.length ? t('overdueLoansAnswer', { count: overdue.length }) : t('noLoansOverdue')}
          tone={overdue.length ? 'red' : 'default'}
          onClick={() => navigate('/library/overdue')}
        />}
        {hasPermission('reports.view') && <InsightCard
          icon={Bell}
          question={t('managementAttentionQuestion')}
          answer={openAlerts.length ? t('openAlertsAnswer', { count: openAlerts.length }) : t('noOpenAlerts')}
          tone={openAlerts.length ? 'amber' : 'default'}
          onClick={() => navigate('/notifications')}
        />}
      </div>
    </div>
  );
}
