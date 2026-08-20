import { useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle2, BookMarked, AlertTriangle, TrendingUp } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import StatCard from '../../components/cards/StatCard';
import { useAuth } from '../../context/AuthContext';

export default function LibraryDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div>
      <PageHeader title={`Welcome back, ${user?.fullName?.split(' ')[0]}`} description="Library MIS overview." />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Books" value="1,240" icon={BookOpen} onClick={() => navigate('/library/books')} />
        <StatCard label="Total Copies" value="3,860" icon={BookOpen} onClick={() => navigate('/library/books')} />
        <StatCard label="Available" value="3,102" icon={CheckCircle2} onClick={() => navigate('/library/books')} />
        <StatCard label="Borrowed" value="758" icon={BookMarked} onClick={() => navigate('/library/borrowed')} />
        <StatCard label="Overdue" value="14" icon={AlertTriangle} tone="red" onClick={() => navigate('/library/overdue')} />
        <StatCard label="Most Borrowed" value="Applied Electricity" icon={TrendingUp} onClick={() => navigate('/library/history')} />
      </div>
    </div>
  );
}
