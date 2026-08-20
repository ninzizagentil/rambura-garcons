import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, Package, Globe, AlertTriangle, Activity } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import StatCard from '../../components/cards/StatCard';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.fullName?.split(' ')[0]}`}
        description="System overview across the whole platform."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Users" value="24" icon={Users} onClick={() => navigate('/admin/users')} />
        <StatCard label="Active Users" value="21" icon={Users} tone="gold" onClick={() => navigate('/admin/users')} />
        <StatCard label="Library Activity" value="132 loans" icon={BookOpen} onClick={() => navigate('/admin/reports')} />
        <StatCard label="Stock Activity" value="48 txns" icon={Package} onClick={() => navigate('/admin/reports')} />
        <StatCard label="Website Activity" value="9 updates" icon={Globe} onClick={() => navigate('/admin/website')} />
        <StatCard label="System Alerts" value="3" icon={AlertTriangle} tone="amber" onClick={() => navigate('/notifications')} />
        <StatCard label="Recent Activity" value="18 events" icon={Activity} onClick={() => navigate('/admin/activity')} />
      </div>
    </div>
  );
}
