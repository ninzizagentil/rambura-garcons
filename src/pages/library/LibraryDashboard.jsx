import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle2, BookMarked, AlertTriangle, TrendingUp, PieChart } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import StatCard from '../../components/cards/StatCard';
import { InsightCard } from '../../components/cards/InsightChartCards';
import ActivityFeedCard from '../../components/cards/ActivityFeedCard';
import { useAuth } from '../../context/AuthContext';
import { getBooks, getLoans, refreshLibrary, daysOverdue } from '../../services/bookService';
import { getActivity } from '../../services/activityService';

export default function LibraryDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [libraryVersion, setLibraryVersion] = useState(0);
  const books = useMemo(() => getBooks(), [libraryVersion]);
  const loans = useMemo(() => getLoans(), [libraryVersion]);
  const activity = useMemo(() => getActivity().filter((a) => a.module === 'Library').slice(0, 5), []);

  useEffect(() => {
    const handleUpdate = () => setLibraryVersion((version) => version + 1);
    window.addEventListener('rg:library-updated', handleUpdate);
    refreshLibrary().catch(() => {});
    return () => window.removeEventListener('rg:library-updated', handleUpdate);
  }, []);

  const totalCopies = books.reduce((sum, b) => sum + b.totalCopies, 0);
  const availableCopies = books.reduce((sum, b) => sum + b.availableCopies, 0);
  const activeLoans = loans.filter((l) => l.status !== 'returned');
  const overdueLoans = activeLoans.filter((l) => daysOverdue(l.dueDate) > 0);
  const mostBorrowed = [...books].sort((a, b) => b.borrowedCopies - a.borrowedCopies)[0];
  const longestOverdue = [...overdueLoans].sort((a, b) => daysOverdue(b.dueDate) - daysOverdue(a.dueDate))[0];

  const byCategory = books.reduce((acc, b) => {
    acc[b.category] = (acc[b.category] || 0) + b.totalCopies;
    return acc;
  }, {});
  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];

  return (
    <div>
      <PageHeader title={`Welcome back, ${user?.fullName?.split(' ')[0]}`} description="Library MIS overview." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Books" value={books.length} icon={BookOpen} onClick={() => navigate('/library/books')} />
        <StatCard label="Total Copies" value={totalCopies} icon={BookOpen} onClick={() => navigate('/library/books')} />
        <StatCard label="Available" value={availableCopies} icon={CheckCircle2} onClick={() => navigate('/library/books')} />
        <StatCard label="Borrowed" value={activeLoans.length} icon={BookMarked} onClick={() => navigate('/library/borrowed')} />
        <StatCard label="Overdue" value={overdueLoans.length} icon={AlertTriangle} tone="red" onClick={() => navigate('/library/overdue')} />
        <StatCard
          label="Most Borrowed"
          value={mostBorrowed ? mostBorrowed.title : '—'}
          icon={TrendingUp}
          tone="gold"
          onClick={() => navigate('/library/history')}
        />
      </div>

      <h2 className="font-display text-lg font-semibold text-[var(--color-heading)] mb-4">Library Insights</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <InsightCard
          icon={AlertTriangle}
          question="Which loan is most overdue?"
          answer={longestOverdue ? `${longestOverdue.bookTitle} — ${daysOverdue(longestOverdue.dueDate)} days late` : 'No loans overdue'}
          tone={longestOverdue ? 'red' : 'default'}
          onClick={() => navigate('/library/overdue')}
        />
        <InsightCard
          icon={CheckCircle2}
          question="What share of copies is available?"
          answer={totalCopies ? `${Math.round((availableCopies / totalCopies) * 100)}% available (${availableCopies} of ${totalCopies})` : 'No copies recorded'}
          onClick={() => navigate('/library/books')}
        />
        <InsightCard
          icon={PieChart}
          question="Which category has the most copies?"
          answer={topCategory ? `${topCategory[0]} — ${topCategory[1]} copies` : 'No categories recorded'}
          onClick={() => navigate('/library/books')}
        />
        <InsightCard
          icon={TrendingUp}
          question="Which book is borrowed most?"
          answer={mostBorrowed ? `${mostBorrowed.title} (${mostBorrowed.borrowedCopies} out)` : 'No loans recorded'}
          onClick={() => navigate('/library/history')}
        />
      </div>

      <ActivityFeedCard title="Recent Library Activity" activity={activity} viewAllTo="/library/reports" />
    </div>
  );
}
